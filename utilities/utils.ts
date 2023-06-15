/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

const PHI: float = (1.0 + 5.0 ** 0.5) / 2.0;

const toAngle: float = 180 / Math.PI;
const toRadian: float = Math.PI / 180;

function UUIDv4(): uuid {
    return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c: any) =>
        (
            c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
    );
}

Number.prototype.between = function (a: int | float, b: int | float): boolean {
    return this.valueOf() > Math.min(a, b) && this.valueOf() < Math.max(a, b);
};

Number.prototype.dotit = function (): string {
    return Math.round(this.valueOf())
        .toString()
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1'");
};

Number.prototype.clamp = function (min: int | float, max: int | float): float {
    return Math.min(Math.max(this.valueOf(), min), max);
};

String.prototype.firstLetterUppercase = function (): string {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.replaceAt = function (
    index: int,
    replacement: string
): string {
    return (
        this.substring(0, index) +
        replacement +
        this.substring(index + replacement.length)
    );
};

String.prototype.hexToRGB = function (): Vec3 {
    const result: Nullable<RegExpExecArray> =
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(this.toString());
    if (result === null) {
        throw new Error("String: Cannot convert hex to rgb.");
    }
    return new Vec3(
        parseInt(result[1], 16) / 256,
        parseInt(result[2], 16) / 256,
        parseInt(result[3], 16) / 256
    );
};

String.prototype.toHexadecimal = function (): number {
    return Number(`0x${this.split("#")[1]}`);
};

Array.prototype.count = function (target: any): int {
    return this.filter((x: any) => x === target).length;
};

Array.prototype.clear = function (): void {
    this.length = 0;
};
