// Diorama follow camera: long lens, high three-quarter angle, damped follow with a lead in the
// direction of travel, gentle orbit and zoom, and a focus mode that frames whatever the player uses.
import * as THREE from 'three';

const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export class FollowCamera {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(28, aspect, 0.5, 600);
    this.yaw = THREE.MathUtils.degToRad(-32); // looking roughly north-west, like the reference
    this.yawTarget = this.yaw;
    this.pitch = THREE.MathUtils.degToRad(36);
    this.dist = 15;
    this.distTarget = 15;
    this.target = new THREE.Vector3();
    this.lead = new THREE.Vector3();
    this.focus = null; // {point: Vector3, dist, yaw?}
    this.intro = null; // fly-in from an overview
  }

  setAspect(a) {
    // A long lens suits wide screens; tall phone screens need a wider vertical view to show the same world.
    this.camera.aspect = a;
    this.camera.fov = a < 0.75 ? 44 : a < 1.1 ? 36 : 28;
    this.camera.updateProjectionMatrix();
  }

  addOrbit(dy) { this.yawTarget += dy; }
  addZoom(steps) { this.distTarget = THREE.MathUtils.clamp(this.distTarget + steps * 1.6, 8, 34); }

  /** Basis vectors for camera-relative movement on the ground plane. */
  basis() {
    const f = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); // into the screen
    const r = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    return { forward: f, right: r };
  }

  startIntro(from, to) { this.intro = { t: 0, dur: 3.2, from: from.clone(), to: to.clone() }; }

  update(dt, playerPos, velocity) {
    this.yaw = damp(this.yaw, this.yawTarget, 6, dt);
    let goal = playerPos;
    let dGoal = this.distTarget;
    if (this.focus) {
      goal = this.focus.point;
      dGoal = this.focus.dist ?? 16;
      if (this.focus.yaw !== undefined) this.yaw = damp(this.yaw, this.focus.yaw, 2.5, dt);
    } else {
      const lead = velocity.clone().setY(0).multiplyScalar(0.45);
      if (lead.length() > 2.2) lead.setLength(2.2);
      this.lead.lerp(lead, 1 - Math.exp(-2.5 * dt));
    }
    const tgt = goal.clone().add(this.focus ? new THREE.Vector3() : this.lead);
    tgt.y = goal.y + 0.6;
    this.target.x = damp(this.target.x, tgt.x, 5, dt);
    this.target.z = damp(this.target.z, tgt.z, 5, dt);
    this.target.y = damp(this.target.y, tgt.y, 4, dt);
    this.dist = damp(this.dist, dGoal, 3, dt);

    if (this.intro) {
      const it = this.intro;
      it.t += dt;
      const k = Math.min(1, it.t / it.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      this.dist = THREE.MathUtils.lerp(110, this.distTarget, e);
      this.target.lerpVectors(it.from, it.to, e);
      if (k >= 1) this.intro = null;
    }

    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const off = new THREE.Vector3(Math.sin(this.yaw) * cp, sp, Math.cos(this.yaw) * cp).multiplyScalar(this.dist);
    this.camera.position.copy(this.target).add(off);
    this.camera.lookAt(this.target);
  }
}
