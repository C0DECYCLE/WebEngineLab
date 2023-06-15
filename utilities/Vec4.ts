/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

class Vec4 {
    private _x: float;
    private _y: float;
    private _z: float;
    private _w: float;

    public isDirty: boolean = false;

    public get x(): float {
        return this._x;
    }

    public set x(value: float) {
        this._x = value;
        this.isDirty = true;
    }

    public get y(): float {
        return this._y;
    }

    public set y(value: float) {
        this._y = value;
        this.isDirty = true;
    }

    public get z(): float {
        return this._z;
    }

    public set z(value: float) {
        this._z = value;
        this.isDirty = true;
    }

    public get w(): float {
        return this._w;
    }

    public set w(value: float) {
        this._w = value;
        this.isDirty = true;
    }

    public constructor(
        x: float = 0.0,
        y: float = 0.0,
        z: float = 0.0,
        w: float = 0.0
    ) {
        this.set(x, y, z, w);
    }

    public set(x: float, y: float, z: float, w: float): Vec4 {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
        return this;
    }

    public applyMat(mat: Mat4): Vec4 {
        this.x =
            mat.values[0] * this.x +
            mat.values[4] * this.y +
            mat.values[8] * this.z +
            mat.values[12] * this.w;
        this.y =
            mat.values[1] * this.x +
            mat.values[5] * this.y +
            mat.values[9] * this.z +
            mat.values[13] * this.w;
        this.z =
            mat.values[2] * this.x +
            mat.values[6] * this.y +
            mat.values[10] * this.z +
            mat.values[14] * this.w;
        this.w =
            mat.values[3] * this.x +
            mat.values[7] * this.y +
            mat.values[11] * this.z +
            mat.values[15] * this.w;
        return this;
    }

    public copy(v: Vec4): Vec4 {
        this.set(v.x, v.y, v.z, v.w);
        return this;
    }

    public store(target: Float32Array | Float64Array, offset: int = 0): Vec4 {
        target[offset + 0] = this.x;
        target[offset + 1] = this.y;
        target[offset + 2] = this.z;
        target[offset + 3] = this.w;
        return this;
    }

    public clone(): Vec4 {
        return new Vec4(this.x, this.y, this.z, this.w);
    }

    public toJSON(): Object {
        return {
            x: this.x,
            y: this.y,
            z: this.z,
            w: this.w,
        };
    }

    public static Cache: Vec4 = new Vec4();
}
