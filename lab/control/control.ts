/*
    Palto Studio
    Developed by Noah Bussinger
    2023
*/

class Control {
    private readonly camera: { position: Vec3; direction: Vec3 };
    private readonly pressing: MapS<boolean> = new MapS<boolean>();

    private direction: Vec3 = new Vec3();
    private up: Vec3 = new Vec3(0.0, 1.0, 0.0);
    private left: Vec3 = new Vec3();
    private transform: Mat4 = new Mat4();

    private velocity: float = 0.1;

    public constructor(camera: { position: Vec3; direction: Vec3 }) {
        this.camera = camera;
        this.register();
    }

    public update(): void {
        this.keyboardPosition();
    }

    private register(): void {
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            event.preventDefault();
            this.pressing.set(event.key.toLowerCase(), true);
        });
        document.addEventListener("keyup", (event: KeyboardEvent) => {
            event.preventDefault();
            this.pressing.set(event.key.toLowerCase(), false);
        });
        document.addEventListener("wheel", (event: WheelEvent) => {
            this.velocity -= event.deltaY * 0.0001;
            this.velocity = this.velocity.clamp(0.01, 1.0);
        });
        document.addEventListener("mousemove", (event: MouseEvent) => {
            this.transform.reset();
            this.transform.rotateY(-event.movementX * 0.1 * toRadian);
            this.camera.direction.applyMat(this.transform);
            this.left.copy(this.camera.direction).cross(this.up);
            this.transform.reset();
            this.transform.rotateAxis(
                this.left.normalize(),
                event.movementY * 0.1 * toRadian
            );
            this.camera.direction.applyMat(this.transform);
        });
    }

    private keyboardPosition(): void {
        this.direction.set(0.0, 0.0, 0.0);
        this.left.copy(this.camera.direction).cross(this.up);
        if (this.pressing.get("w") === true) {
            this.direction.sub(this.camera.direction);
        } else if (this.pressing.get("s") === true) {
            this.direction.add(this.camera.direction);
        }
        if (this.pressing.get("a") === true) {
            this.direction.add(this.left);
        } else if (this.pressing.get("d") === true) {
            this.direction.sub(this.left);
        }
        if (!this.direction.x && !this.direction.y && !this.direction.z) {
            return;
        }
        this.camera.position.add(
            this.direction.normalize().scale(this.velocity)
        );
    }
}
