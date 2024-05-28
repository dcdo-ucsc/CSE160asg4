class Camera {
    constructor(canvas) {
        this.fov = 60;
        this.eye = new Vector3([0, 0, 0]);
        this.at = new Vector3([0, 0, -1]);
        this.up = new Vector3([0, 1, 0]);

        this.viewMatrix = new Matrix4();
        this.projectionMatrix = new Matrix4();
        
        this.updateViewMatrix();
        this.updateProjectionMatrix(canvas);
    }

    updateViewMatrix() {
        this.viewMatrix.setLookAt(this.eye.elements[0], this.eye.elements[1], this.eye.elements[2],
                                  this.at.elements[0], this.at.elements[1], this.at.elements[2],
                                  this.up.elements[0], this.up.elements[1], this.up.elements[2]);
    }

    updateProjectionMatrix(canvas) {
        this.projectionMatrix.setPerspective(this.fov, canvas.width / canvas.height, 0.1, 1000);
    }

    moveForward(speed) {
        let f = new Vector3();
        f.elements[0] = this.at.elements[0] - this.eye.elements[0];
        f.elements[1] = this.at.elements[1] - this.eye.elements[1];
        f.elements[2] = this.at.elements[2] - this.eye.elements[2];
        f.normalize();
        f.elements[0] *= speed;
        f.elements[1] *= speed;
        f.elements[2] *= speed;
        this.eye.elements[0] += f.elements[0];
        this.eye.elements[1] += f.elements[1];
        this.eye.elements[2] += f.elements[2];
        this.at.elements[0] += f.elements[0];
        this.at.elements[1] += f.elements[1];
        this.at.elements[2] += f.elements[2];
        this.updateViewMatrix();
    }

    moveBackward(speed) {
        this.moveForward(-speed);
    }

    moveLeft(speed) {
        let f = new Vector3([
            this.at.elements[0] - this.eye.elements[0],
            this.at.elements[1] - this.eye.elements[1],
            this.at.elements[2] - this.eye.elements[2]
        ]);
        let s = new Vector3();
        s.elements[0] = this.up.elements[1] * f.elements[2] - this.up.elements[2] * f.elements[1];
        s.elements[1] = this.up.elements[2] * f.elements[0] - this.up.elements[0] * f.elements[2];
        s.elements[2] = this.up.elements[0] * f.elements[1] - this.up.elements[1] * f.elements[0];
        s.normalize();
        s.elements[0] *= speed;
        s.elements[1] *= speed;
        s.elements[2] *= speed;
        this.eye.elements[0] += s.elements[0];
        this.eye.elements[1] += s.elements[1];
        this.eye.elements[2] += s.elements[2];
        this.at.elements[0] += s.elements[0];
        this.at.elements[1] += s.elements[1];
        this.at.elements[2] += s.elements[2];
        this.updateViewMatrix();
    }

    moveRight(speed) {
        this.moveLeft(-speed);
    }

    panLeft(alpha) {
        let f = new Vector3([
            this.at.elements[0] - this.eye.elements[0],
            this.at.elements[1] - this.eye.elements[1],
            this.at.elements[2] - this.eye.elements[2]
        ]);
        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        let f_prime = rotationMatrix.multiplyVector3(f);
        this.at.elements[0] = this.eye.elements[0] + f_prime.elements[0];
        this.at.elements[1] = this.eye.elements[1] + f_prime.elements[1];
        this.at.elements[2] = this.eye.elements[2] + f_prime.elements[2];
        this.updateViewMatrix();
    }

    panRight(alpha) {
        this.panLeft(-alpha);
    }
}
