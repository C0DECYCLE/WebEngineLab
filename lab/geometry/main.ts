/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

function createCanvas(): HTMLCanvasElement {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = document.body.clientWidth * devicePixelRatio;
    canvas.height = document.body.clientHeight * devicePixelRatio;
    canvas.style.position = "absolute";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.body.appendChild(canvas);
    return canvas;
}

window.addEventListener("compile", async (_event: Event): Promise<void> => {
    //////////// SETUP ////////////

    const canvas: HTMLCanvasElement = createCanvas();
    const adapter: Nullable<GPUAdapter> = await navigator.gpu?.requestAdapter();
    const device: Undefinable<GPUDevice> = await adapter?.requestDevice({
        requiredFeatures: [
            /*"timestamp-query"*/
        ],
    } as GPUDeviceDescriptor);
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
        label: "normal shader",
        code: await fetch("shader.wgsl").then(
            async (response: Response) => await response.text()
        ),
    } as GPUShaderModuleDescriptor);

    //////////// PIPELINE ////////////

    const pipeline: GPURenderPipeline = device.createRenderPipeline({
        label: "geometry pipeline",
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
        primitive: {
            cullMode: "back",
        } as GPUPrimitiveState,
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
        label: "depth texture",
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
        label: "canvas render pass",
        colorAttachments: [colorAttachment],
        depthStencilAttachment: depthStencilAttachment,
    } as GPURenderPassDescriptor;

    //////////// UNIFORM ////////////

    //4x4 32-bit floats
    const uniformValues: Float32Array = new Float32Array(16);

    const uniformBuffer: GPUBuffer = device.createBuffer({
        label: "uniforms uniform buffer",
        size: uniformValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    } as GPUBufferDescriptor);

    //////////// VERTECIES ////////////

    const raw: string = await fetch("/models/dragon.obj").then(
        async (response: Response) => await response.text()
    );
    const vertexData: Float32Array = ObjParser.Parse(raw);
    const vertexCount: int = vertexData.length / 4.0;

    const verteciesBuffer: GPUBuffer = device.createBuffer({
        label: "vertices storage buffer",
        size: vertexData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    } as GPUBufferDescriptor);
    device.queue.writeBuffer(verteciesBuffer, 0, vertexData);

    //////////// BINDGROUP ////////////

    const bindGroup: GPUBindGroup = device.createBindGroup({
        label: "bind group for geometry",
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer } as GPUBindingResource,
            } as GPUBindGroupEntry,
            {
                binding: 1,
                resource: { buffer: verteciesBuffer } as GPUBindingResource,
            } as GPUBindGroupEntry,
        ],
    } as GPUBindGroupDescriptor);

    //////////// MATRIX ////////////

    const world: Mat4 = new Mat4();
    const view: Mat4 = new Mat4();
    const projection: Mat4 = Mat4.Perspective(
        60 * toRadian,
        canvas.width / canvas.height,
        1.0,
        100.0
    );
    const worldViewProjection: Mat4 = new Mat4();

    const cameraPos: Vec3 = new Vec3();
    const cameraDir: Vec3 = new Vec3();
    const up: Vec3 = new Vec3(0.0, 1.0, 0.0);

    //////////// STATS ////////////

    const speed: float = 0.0005;
    const stats: Stats = new Stats();
    stats.set("frame delta", 0);
    stats.show();

    //////////// TIMINGQUERY ////////////
    /*
    const capacity: int = 3; //Max number of timestamps we can store
    const querySet: GPUQuerySet = device.createQuerySet({
        type: "timestamp",
        count: capacity,
    } as GPUQuerySetDescriptor);
    const queryBuffer: GPUBuffer = device.createBuffer({
        size: 8 * capacity,
        usage:
            GPUBufferUsage.QUERY_RESOLVE |
            GPUBufferUsage.STORAGE |
            GPUBufferUsage.COPY_SRC |
            GPUBufferUsage.COPY_DST,
    } as GPUBufferDescriptor);

    async function readBuffer(
        device: GPUDevice,
        buffer: GPUBuffer
    ): Promise<ArrayBuffer> {
        const size: int = buffer.size;
        const gpuReadBuffer: GPUBuffer = device.createBuffer({
            size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        } as GPUBufferDescriptor);
        const copyEncoder: GPUCommandEncoder = device.createCommandEncoder();
        copyEncoder.copyBufferToBuffer(buffer, 0, gpuReadBuffer, 0, size);
        const copyCommands: GPUCommandBuffer = copyEncoder.finish();
        device.queue.submit([copyCommands]);
        await gpuReadBuffer.mapAsync(GPUMapMode.READ);
        return gpuReadBuffer.getMappedRange();
    }
    */
    async function render(now: float): Promise<void> {
        stats.time("cpu delta");

        //////////// UPDATE ////////////

        cameraPos
            .set(Math.cos(now * speed), 0.35, Math.sin(now * speed))
            .scale(4.5);
        cameraDir.copy(cameraPos).normalize().scale(-1.0);
        cameraPos.add(0.0, 1.25, 0.0);

        view.view(cameraPos, cameraDir, up);
        worldViewProjection
            .multiply(view, projection)
            .multiply(world, worldViewProjection)
            .store(uniformValues);
        device?.queue.writeBuffer(uniformBuffer, 0, uniformValues);

        //////////// DRAW ////////////

        colorAttachment.view = context!.getCurrentTexture().createView();
        depthStencilAttachment.view = depthTexture.createView();

        const encoder: GPUCommandEncoder = device!.createCommandEncoder({
            label: "frame command encoder",
        } as GPUObjectDescriptorBase);

        //encoder.writeTimestamp(querySet, 0);

        const pass: GPURenderPassEncoder =
            encoder.beginRenderPass(renderPassDescriptor);
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(vertexCount);
        pass.end();

        //encoder.writeTimestamp(querySet, 1);
        //encoder.resolveQuerySet(querySet, 0, capacity, queryBuffer, 0);

        const commandBuffer: GPUCommandBuffer = encoder.finish();
        device?.queue.submit([commandBuffer]);

        //////////// FRAME ////////////

        stats.set("frame delta", now - stats.get("frame delta")!);
        stats.time("cpu delta", "cpu delta");
        /*
        const arrayBuffer = await readBuffer(device!, queryBuffer);
        const timingsNanoseconds = new BigInt64Array(arrayBuffer);
        const gpuDelta: float =
            Number(timingsNanoseconds[1] - timingsNanoseconds[0]) / 1_000_000;
        */
        // prettier-ignore
        stats.update(`
            <b>frame rate: ${(1_000 / stats.get("frame delta")!).toFixed(1)} fps</b><br>
            frame delta: ${stats.get("frame delta")!.toFixed(2)} ms<br>
            <br>
            <b>cpu rate: ${(1_000 / stats.get("cpu delta")!).toFixed(1)} fps</b><br>
            cpu delta: ${stats.get("cpu delta")!.toFixed(2)} ms<br>`/*+`
            <br>
            <b>gpu rate: ${(1_000 / gpuDelta).toFixed(1)} fps</b><br>
            gpu delta: ${gpuDelta.toFixed(2)} ms<br>
        `*/);
        stats.set("frame delta", now);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
});
