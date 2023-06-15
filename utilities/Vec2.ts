/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

class Vec2 {
    private _x: float;
    private _y: float;

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

    public constructor(x: float = 0.0, y: float = 0.0) {
        this.set(x, y);
    }

    public set(x: float, y: float): Vec2 {
        this.x = x;
        this.y = y;
        return this;
    }

    public add(x: Vec2 | float, y?: float): Vec2 {
        if (x instanceof Vec2) {
            y = x.y;
            x = x.x;
        } else if (y === undefined) {
            y = x;
        }
        if (x === 0 && y === 0) {
            return this;
        }
        this.x += x;
        this.y += y;
        return this;
    }

    public sub(x: Vec2 | float, y?: float): Vec2 {
        if (x instanceof Vec2) {
            y = x.y;
            x = x.x;
        } else if (y === undefined) {
            y = x;
        }
        if (x === 0 && y === 0) {
            return this;
        }
        this.x -= x;
        this.y -= y;
        return this;
    }

    public scale(x: Vec2 | float, y?: float): Vec2 {
        if (x instanceof Vec2) {
            y = x.y;
            x = x.x;
        } else if (y === undefined) {
            y = x;
        }
        this.x *= x;
        this.y *= y;
        return this;
    }

    public divide(x: Vec2 | float, y?: float): Vec2 {
        if (x instanceof Vec2) {
            y = x.y;
            x = x.x;
        } else if (y === undefined) {
            y = x;
        }
        this.x /= x;
        this.y /= y;
        return this;
    }

    public lengthQuadratic(): float {
        return this.x * this.x + this.y * this.y;
    }

    public length(): float {
        return Math.sqrt(this.lengthQuadratic());
    }

    public normalize(): Vec2 {
        this.divide(this.length());
        return this;
    }

    public dot(x: Vec2 | float, y?: float): float {
        if (x instanceof Vec2) {
            y = x.y;
            x = x.x;
        } else if (y === undefined) {
            y = x;
        }
        return this.x * x + this.y * y;
    }

    public copy(v: Vec2): Vec2 {
        this.set(v.x, v.y);
        return this;
    }

    public store(target: Float32Array | Float64Array, offset: int = 0): Vec2 {
        target[offset + 0] = this.x;
        target[offset + 1] = this.y;
        return this;
    }

    public clone(): Vec2 {
        return new Vec2(this.x, this.y);
    }

    public toJSON(): Object {
        return {
            x: this.x,
            y: this.y,
        };
    }

    public static Cache: Vec2 = new Vec2();

    public static Dot(a: Vec2, b: Vec2): float {
        return a.dot(b);
    }
}
