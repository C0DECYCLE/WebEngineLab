/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

type ObjPoly = [float, float, float];

class ObjParser {
    public static Parse(raw: string): Float32Array {
        const vertecies: float[] = [];
        const polys: ObjPoly[] = [[0.0, 0.0, 0.0]];
        const regExp: RegExp = /(\w*)(?: )*(.*)/;
        const lines: string[] = raw.split("\n");
        for (let i: int = 0; i < lines.length; ++i) {
            ObjParser.Line(regExp, lines[i].trim(), polys, vertecies);
        }
        return new Float32Array(vertecies);
    }

    private static Line(
        regExp: RegExp,
        line: string,
        polys: ObjPoly[],
        vertecies: float[]
    ): void {
        const m: Nullable<RegExpExecArray> = regExp.exec(line);
        if (line === "" || line.startsWith("#") || !m) {
            return;
        }
        const [, keyword, _unparsedArgs] = m;
        const parts: string[] = line.split(/\s+/).slice(1);
        switch (keyword) {
            case "v":
                return ObjParser.KeywordV(parts, polys);
            case "f":
                return ObjParser.KeywordF(parts, polys, vertecies);
            default:
                return;
        }
    }

    private static KeywordV(parts: string[], polys: ObjPoly[]): void {
        if (parts.length < 3) {
            throw new Error(`ObjParser: Obj file missing vertex part.`);
        }
        polys.push([
            parseFloat(parts[0]),
            parseFloat(parts[1]),
            parseFloat(parts[2]),
        ]);
    }

    private static KeywordF(
        parts: string[],
        polys: ObjPoly[],
        vertecies: float[]
    ): void {
        const a: int = parseInt(parts[0]);
        const b: int = parseInt(parts[1]);
        const c: int = parseInt(parts[2]);
        vertecies.push(...polys[a].slice(0, 3));
        vertecies.push(0.0);
        vertecies.push(...polys[b].slice(0, 3));
        vertecies.push(0.0);
        vertecies.push(...polys[c].slice(0, 3));
        vertecies.push(0.0);
    }
}
