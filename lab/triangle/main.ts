/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

window.addEventListener("compile", async (_event: Event): Promise<void> => {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = document.body.clientWidth * devicePixelRatio;
    canvas.height = document.body.clientHeight * devicePixelRatio;
    canvas.style.position = "absolute";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.body.appendChild(canvas);

    //////////// SETUP ////////////

    const adapter: Nullable<GPUAdapter> = await navigator.gpu?.requestAdapter();
    const device: Undefinable<GPUDevice> = await adapter?.requestDevice();
    const context: Nullable<GPUCanvasContext> = canvas.getContext("webgpu");
    if (!device || !context) {
        throw new Error("WebEngineLab: Browser doesn't support WebGPU.");
    }
    const presentationFormat: GPUTextureFormat =
        navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: presentationFormat,
    } as GPUCanvasConfiguration);

    //////////// SHADER ////////////

    const module: GPUShaderModule = device.createShaderModule({
        label: "our hardcoded red triangle shaders",
        code: `
            struct Uniforms {
                matrix: mat4x4f,
            };

            struct OurVertexShaderOutput {
                @builtin(position) position: vec4f,
                @location(0) color: vec4f,
            };
            
            @group(0) @binding(0) var<uniform> uni: Uniforms;

            @vertex fn vs(
                @builtin(vertex_index) vertexIndex : u32
            ) -> OurVertexShaderOutput {
                var pos = array<vec3f, 6>(
                    vec3f( 0.0,  1.0,  0.0),  // top center
                    vec3f(-0.5,  0.0,  0.0),  // bottom left
                    vec3f( 0.5,  0.0,  0.0),  // bottom right
                    vec3f( 0.0,  0.0, -2.0),
                    vec3f(-2.0,  0.0,  2.0),
                    vec3f( 2.0,  0.0,  2.0),
                );
                var color = array<vec3f, 3>(
                    vec3f(1.0, 0.0, 0.0), // red
                    vec3f(0.0, 1.0, 0.0), // green
                    vec3f(0.0, 0.0, 1.0), // blue
                );
                var vsOutput: OurVertexShaderOutput;
                vsOutput.position = uni.matrix * vec4f(pos[vertexIndex], 1.0);
                vsOutput.color = vec4f(color[vertexIndex % 3], 1.0);
                return vsOutput;
            }
        
            @fragment fn fs(fsInput: OurVertexShaderOutput) -> @location(0) vec4f {
                return fsInput.color;
            }
        `,
    } as GPUShaderModuleDescriptor);

    //////////// PIPELINE ////////////

    const pipeline: GPURenderPipeline = device.createRenderPipeline({
        label: "our hardcoded red triangle pipeline",
        layout: "auto",
        vertex: {
            module,
            entryPoint: "vs",
        } as GPUVertexState,
        fragment: {
            module,
            entryPoint: "fs",
            targets: [{ format: presentationFormat }],
        } as GPUFragmentState,
        /*
        primitive: {
            cullMode: "back",
        } as GPUPrimitiveState,
        */
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: "less",
            format: "depth24plus",
        } as GPUDepthStencilState,
    } as GPURenderPipelineDescriptor);

    //////////// RENDERPASS ////////////

    const colorAttachment: GPURenderPassColorAttachment = {
        view: context!.getCurrentTexture().createView(),
        clearValue: [0.3, 0.3, 0.3, 1.0],
        loadOp: "clear",
        storeOp: "store",
    } as GPURenderPassColorAttachment;

    const depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: "depth24plus",
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });

    const depthStencilAttachment: GPURenderPassDepthStencilAttachment = {
        view: depthTexture.createView(),
        depthClearValue: 1.0,
        depthLoadOp: "clear",
        depthStoreOp: "store",
    } as GPURenderPassDepthStencilAttachment;

    const renderPassDescriptor: GPURenderPassDescriptor = {
        label: "our basic canvas renderPass",
        colorAttachments: [colorAttachment],
        depthStencilAttachment: depthStencilAttachment,
    } as GPURenderPassDescriptor;

    //////////// UNIFORM ////////////

    const uniformBufferSize: int = 16 * 4; //4x4 32-bit floats
    const uniformBuffer: GPUBuffer = device.createBuffer({
        label: "uniforms",
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    } as GPUBufferDescriptor);

    const uniformValues: Float32Array = new Float32Array(uniformBufferSize / 4);
    const kMatrixOffset: int = 0;
    const matrixValue: Float32Array = uniformValues.subarray(
        kMatrixOffset,
        kMatrixOffset + 16
    );

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: "bind group for object",
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    } as GPUBindGroupDescriptor);

    //////////// MATRIX ////////////

    const world: Mat4 = new Mat4();
    const view: Mat4 = new Mat4();
    const cameraPos: Vec3 = new Vec3();
    const cameraDir: Vec3 = new Vec3();
    const up: Vec3 = new Vec3(0.0, 1.0, 0.0);
    const projection: Mat4 = Mat4.Perspective(
        60 * toRadian,
        document.body.clientWidth / document.body.clientHeight,
        1,
        100
    );
    const viewProjectionMatrix: Mat4 = new Mat4();

    function render(now: float): void {
        //////////// UPDATE ////////////

        //world.rotateX(1 * toRadian);
        //world.rotateY(1 * toRadian);
        //world.rotateZ(1 * toRadian);
        cameraPos
            .set(Math.cos(now * 0.001), 0.5, Math.sin(now * 0.001))
            .scale(10.0);
        cameraDir.copy(cameraPos).normalize().scale(-1);
        view.view(cameraPos, cameraDir, up);
        viewProjectionMatrix
            .multiply(view, projection)
            .multiply(world, viewProjectionMatrix)
            .store(matrixValue);
        device?.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        //////////// DRAW ////////////

        colorAttachment.view = context!.getCurrentTexture().createView();
        depthStencilAttachment.view = depthTexture.createView();

        const encoder: GPUCommandEncoder = device!.createCommandEncoder({
            label: "our encoder",
        } as GPUObjectDescriptorBase);

        const pass: GPURenderPassEncoder =
            encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(6);
        pass.end();

        const commandBuffer: GPUCommandBuffer = encoder.finish();
        device?.queue.submit([commandBuffer]);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});
