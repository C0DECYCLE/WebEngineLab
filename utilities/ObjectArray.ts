/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

interface Object {
    __metalist?: Map<uuid, int>;
}

class ObjectArray<T extends object> extends Array<T> {
    protected readonly __id: uuid = UUIDv4();

    public override push(...elements: T[]): int {
        super.push(...elements.map((element) => this.initialize(element)));
        return this.length;
    }

    public override indexOf(element: T, fromIndex?: int): int {
        if (!element.__metalist) {
            return -1;
        }
        const index: Undefinable<int> = element.__metalist.get(this.__id);
        if (
            index === undefined ||
            (fromIndex !== undefined && index < fromIndex)
        ) {
            return -1;
        }
        if (index > this.length) {
            // prettier-ignore
            throw new Error(
                `ObjectArray: index ${index} was out of bounds, real index is ${super.indexOf(element)}.`
            );
        }
        return index;
    }

    public override includes(element: T, _fromIndex?: int): boolean {
        return !element.__metalist ? false : element.__metalist.has(this.__id);
    }

    public override pop(): Undefinable<T> {
        return this.decommission(super.pop());
    }

    public override splice(start: int, deleteCount?: int): T[];
    public override splice(start: int, _deleteCount: int, ..._items: T[]): T[] {
        if (start !== Number.MIN_VALUE) {
            warn("ObjectArray: Illegal splice operation.");
        }
        return [];
    }

    public override shift(): Undefinable<T> {
        warn("ObjectArray: Illegal shift operation.");
        return undefined;
    }

    public override sort(_compareFn?: (a: T, b: T) => int): this {
        warn("ObjectArray: Illegal sort operation.");
        return this;
    }

    public override unshift(..._items: T[]): int {
        warn("ObjectArray: Illegal unshift operation.");
        return -1;
    }

    public override clear(): void {
        for (let i: int = 0; i < this.length; i++) {
            this.decommission(this[i]);
        }
        super.clear();
    }

    public add(element: T): void {
        if (this.has(element) === false) {
            this.push(element);
        }
    }

    public has(element: T): boolean {
        return this.includes(element);
    }

    public delete(element: T, length: int = this.length): void {
        if (this.has(element) === false) {
            return;
        }
        this.interchange(element, length);
        this.pop();
        this.splice(Number.MIN_VALUE); //for babylon rtt hook
    }

    protected initialize(element: T, length: int = this.length): T {
        if (!element.__metalist) {
            element.__metalist = new Map<uuid, int>();
        }
        element.__metalist.set(this.__id, length);
        return element;
    }

    protected decommission(element?: T): Undefinable<T> {
        if (typeof element === "object") {
            element.__metalist?.delete(this.__id);
        }
        return element;
    }

    private interchange(element: T, length: int = this.length): void {
        const lastElement: T = this[length - 1];
        if (element !== lastElement) {
            const index: int = this.indexOf(element);
            if (index === -1) {
                throw new Error("ObjectArray: Try to delete index of -1.");
            }
            this[index] = lastElement;
            lastElement.__metalist?.set(this.__id, index);
            this[length - 1] = element;
        }
    }
}
