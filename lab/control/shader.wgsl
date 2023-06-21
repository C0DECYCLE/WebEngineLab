struct Uniforms {
    matrix: mat4x4f,
};

struct Vertex {
    position: vec4f,
};

struct VertexShaderOut {
    @builtin(position) position: vec4f,
    @interpolate(flat) @location(0) worldPosition: vec3f,
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
    let s: f32 = 100.0;
    let ox: f32 = in.worldPosition.x * s;
    let oy: f32 = in.worldPosition.y * s;
    let oz: f32 = in.worldPosition.z * s;
    let x: f32 = noise3(vec3f(oy, oz, ox));
    let y: f32 = noise3(vec3f(oz, ox, oy));
    let z: f32 = noise3(vec3f(ox, oy, oz));
    return vec4f(x, y, z, 1.0);
}

fn mod289(x: vec4f) -> vec4f {
    return x - floor(x * (1. / 289.)) * 289.;
}

fn perm4(x: vec4f) -> vec4f {
    return mod289(((x * 34.) + 1.) * x);
}

fn noise3(p: vec3f) -> f32 {
    let a: vec3f = floor(p);
    var d: vec3f = p - a;
    d = d * d * (3. - 2. * d);
    let b: vec4f = a.xxyy + vec4f(0., 1., 0., 1.);
    let k1: vec4f = perm4(b.xyxy);
    let k2: vec4f = perm4(k1.xyxy + b.zzww);
    let c: vec4f = k2 + a.zzzz;
    let k3: vec4f = perm4(c);
    let k4: vec4f = perm4(c + 1.);
    let o1: vec4f = fract(k3 * (1. / 41.));
    let o2: vec4f = fract(k4 * (1. / 41.));
    let o3: vec4f = o2 * d.z + o1 * (1. - d.z);
    let o4: vec2f = o3.yw * d.x + o3.xz * (1. - d.x);
    return o4.y * d.y + o4.x * (1. - d.y);
}
