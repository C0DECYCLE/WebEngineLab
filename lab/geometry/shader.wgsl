struct Uniforms {
    matrix: mat4x4f,
};

struct Vertex {
    position: vec4f,
};

struct VertexShaderOut {
    @builtin(position) position: vec4f,
    @location(0) worldPosition: vec3f,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage, read> vertecies: array<Vertex>;

@vertex fn vs(@builtin(vertex_index) vertexIndex: u32) -> VertexShaderOut {
    let vertexPosition: vec3f = vertecies[vertexIndex].position.xyz;
    var out: VertexShaderOut;
    out.position = uniforms.matrix * vec4f(vertexPosition, 1.0);
    out.worldPosition = vertexPosition;
    return out;
}

@fragment fn fs(in: VertexShaderOut) -> @location(0) vec4f {
    let normal: vec3f = normalize(cross(dpdx(in.worldPosition), dpdy(in.worldPosition)));
    return vec4f(normal * 0.5 + 0.5, 1.0);
}