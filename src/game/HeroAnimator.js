import { STRIDE, damp, samplePose } from './motion.js';

const COLORS = { reaper: 0xe9a4a4, necro: 0xd6bbff };
const PIVOTS = {
  reaper: {
    upperArmL: [0.3, 0.16, 0.65, 0.78], upperArmR: [0.7, 0.16, 0.35, 0.78],
    forearmL: [0.65, 0.2, 0.4, 0.85], forearmR: [0.3, 0.2, 0.62, 0.85],
    thighL: [0.5, 0.08, 0.52, 0.9], thighR: [0.55, 0.08, 0.37, 0.9],
    bootL: [0.67, 0.1, 0.36, 0.96], bootR: [0.3, 0.1, 0.64, 0.96],
  },
  necro: {
    upperArmL: [0.7, 0.14, 0.28, 0.89], upperArmR: [0.28, 0.14, 0.72, 0.89],
    forearmL: [0.67, 0.19, 0.35, 0.85], forearmR: [0.3, 0.19, 0.65, 0.85],
    thighL: [0.55, 0.08, 0.58, 0.93], thighR: [0.6, 0.08, 0.45, 0.93],
    bootL: [0.63, 0.08, 0.3, 0.96], bootR: [0.3, 0.08, 0.65, 0.96],
  },
};

export class HeroAnimator {
  constructor(scene, kind, parent) {
    this.scene = scene;
    this.kind = kind;
    this.root = scene.add.container(0, 0);
    parent.add(this.root);
    this.parts = {};
    this.phase = 0;
    this.breath = 0;
    this.locomotion = 0;
    this.dashBlend = 0;
    this.downBlend = 0;
    this.side = 1;
    this.direction = { x: 1, y: 0 };
    this.clothAngle = 0;
    this.tailAngle = 0;
    this.trailPoints = [];
    this.effects = scene.add.graphics();
    parent.add(this.effects);
    this.shadow = scene.add.ellipse(0, 1, 44, 16, 0x0a1812, 0.32);
    parent.addAt(this.shadow, 0);

    for (const name of ['cloth', 'tail', 'upperArmL', 'forearmL', 'thighL', 'bootL', 'thighR', 'bootR', 'pelvis', 'torso', 'head', 'weapon', 'upperArmR', 'forearmR']) {
      const texture = name === 'torso' ? 'torsoFront' : name === 'head' ? 'headFront' : name;
      this.parts[name] = scene.add.image(0, 0, name === 'weapon' ? kind === 'reaper' ? 'hero-scythe' : 'hero-staff' : `rig-${kind}-${texture}`);
      this.root.add(this.parts[name]);
    }
    // Remove the painted cut surfaces; the joint overlap remains under the
    // neighbouring segment, so elbows read as sleeves/skin instead of stumps.
    for (const name of ['forearmL', 'forearmR']) {
      const part = this.parts[name];
      part.setCrop(0, part.height * 0.14, part.width, part.height * 0.86);
    }
    if (kind === 'reaper') for (const name of ['upperArmL', 'upperArmR']) {
      const part = this.parts[name];
      part.setCrop(0, 0, part.width, part.height * 0.84);
    }
    this.parts.cloth.setOrigin(0.5, 0.05).setDisplaySize(kind === 'reaper' ? 63 : 58, kind === 'reaper' ? 65 : 49);
    this.parts.tail.setOrigin(0.5, 0.03).setDisplaySize(kind === 'reaper' ? 10 : 33, kind === 'reaper' ? 37 : 56);
    this.parts.pelvis.setDisplaySize(25, 17);
    this.parts.torso.setDisplaySize(28, 32);
    this.parts.head.setOrigin(0.5, 0.9).setDisplaySize(22, 25);
    const weapon = this.parts.weapon;
    weapon.setOrigin(kind === 'reaper' ? 0.8 : 0.5, 0.63);
    weapon.setScale((kind === 'reaper' ? 118 : 110) / weapon.height);
  }

  limb(name, start, end, width) {
    const sprite = this.parts[name];
    const length = Math.hypot(end.x - start.x, end.y - start.y);
    // Map painted joint centers, including slanted artwork, onto the IK bones.
    const [ax, ay, bx, by] = PIVOTS[this.kind][name];
    const dx = (bx - ax) * width;
    const scaledY = Math.sqrt(Math.max(1, length * length - dx * dx));
    sprite.setOrigin(ax, ay).setPosition(start.x, start.y);
    sprite.setDisplaySize(width, scaledY / (by - ay));
    sprite.setRotation(Math.atan2(end.y - start.y, end.x - start.x) - Math.atan2(scaledY, dx));
  }

  update(hero, dt) {
    const velocity = hero.node.body.velocity;
    const speed = Math.hypot(velocity.x, velocity.y);
    const traveling = speed > 4 && !hero.down && hero.dashing <= 0;
    this.breath += dt * 2.1;
    this.locomotion = damp(this.locomotion, traveling ? Math.min(1, speed / hero.speed) : 0, traveling ? 16 : 12, dt);
    this.dashBlend = damp(this.dashBlend, hero.dashing > 0 ? 1 : 0, 25, dt);
    this.downBlend = damp(this.downBlend, hero.down ? 1 : 0, 9, dt);
    if (traveling) {
      this.phase += speed * dt / STRIDE;
      this.direction = { x: velocity.x / speed, y: velocity.y / speed };
    }
    const facing = hero.action?.direction || hero.facing;
    if (Math.abs(facing.x) > 0.16) this.side = facing.x < 0 ? -1 : 1;
    const pose = samplePose({ kind: this.kind, phase: this.phase, locomotion: this.locomotion, direction: this.direction, facing, side: this.side, action: hero.action, breath: this.breath, dash: this.dashBlend, down: this.downBlend, recoil: hero.hitReaction || 0 });
    this.pose = pose;
    this.root.setScale(this.side, 1);
    this.parts.head.setTexture(`rig-${this.kind}-${pose.back ? 'headBack' : 'headFront'}`).setDisplaySize(22, 25);
    this.parts.head.setOrigin(this.kind === 'necro' ? pose.back ? 0.48 : 0.68 : pose.back ? 0.5 : 0.4, 0.92);
    this.parts.torso.setTexture(`rig-${this.kind}-${pose.back ? 'torsoBack' : 'torsoFront'}`).setDisplaySize(28, 32);
    this.parts.head.setPosition(pose.neck.x, pose.neck.y).setRotation(pose.headAngle);
    this.parts.torso.setPosition((pose.hip.x + pose.shoulder.x) / 2, (pose.hip.y + pose.shoulder.y) / 2 - 1).setRotation(pose.torsoAngle);
    this.parts.pelvis.setPosition(pose.hip.x, pose.hip.y - 2).setRotation(pose.torsoAngle * -0.25);
    this.clothAngle = damp(this.clothAngle, pose.clothAngle + Math.sin(this.breath * 1.5) * 0.025, 7, dt);
    this.tailAngle = damp(this.tailAngle, pose.tailAngle - this.direction.x * this.side * this.dashBlend * 0.5, 5, dt);
    this.parts.cloth.setPosition(pose.shoulder.x, this.kind === 'reaper' ? pose.shoulder.y - 3 : pose.hip.y - 7).setRotation(this.clothAngle);
    this.parts.tail.setPosition(this.kind === 'reaper' ? pose.hip.x + 3 : pose.neck.x - 4, this.kind === 'reaper' ? pose.hip.y - 4 : pose.neck.y - 18).setRotation(this.tailAngle);
    this.limb('thighL', pose.hips[0], pose.knees[0], this.kind === 'reaper' ? 14 : 10);
    this.limb('bootL', pose.knees[0], pose.feet[0], 13);
    this.limb('thighR', pose.hips[1], pose.knees[1], this.kind === 'reaper' ? 14 : 10);
    this.limb('bootR', pose.knees[1], pose.feet[1], 13);
    this.limb('upperArmL', pose.shoulders[0], pose.elbows[0], 10);
    this.limb('forearmL', pose.elbows[0], pose.hands[0], 9);
    this.limb('upperArmR', pose.shoulders[1], pose.elbows[1], 10);
    this.limb('forearmR', pose.elbows[1], pose.hands[1], 9);
    this.parts.weapon.setPosition(pose.weapon.position.x, pose.weapon.position.y).setRotation(pose.weapon.angle);
    this.shadow.setSize(pose.shadowWidth, 16).setAlpha(hero.down ? 0.18 : 0.32);

    // Occlusion follows facing: hair/cape cover the back, torso covers arm roots.
    const order = pose.back
      ? ['forearmL', 'upperArmL', 'forearmR', 'upperArmR', 'weapon', 'thighL', 'bootL', 'thighR', 'bootR', 'pelvis', 'torso', 'cloth', 'head', 'tail']
      : ['cloth', 'tail', 'thighL', 'bootL', 'thighR', 'bootR', 'upperArmL', 'upperArmR', 'pelvis', 'torso', 'head', 'weapon', 'forearmL', 'forearmR'];
    for (const name of order) this.root.bringToTop(this.parts[name]);
    this.drawEffects(hero, pose, dt);
  }

  drawEffects(hero, pose, dt) {
    this.effects.clear();
    this.trailPoints = this.trailPoints.filter(p => (p.life -= dt) > 0);
    if (this.kind === 'reaper' && pose.weapon.trail > 0.05) {
      const sprite = this.parts.weapon;
      const reach = sprite.displayHeight * 0.62;
      const point = { x: (pose.weapon.position.x + Math.sin(sprite.rotation) * reach) * this.side, y: pose.weapon.position.y - Math.cos(sprite.rotation) * reach, life: 0.1 };
      this.trailPoints.push(point);
    }
    for (let i = 1; i < this.trailPoints.length; i++) {
      const a = this.trailPoints[i - 1], b = this.trailPoints[i];
      this.effects.lineStyle(5, COLORS.reaper, a.life * 4);
      this.effects.lineBetween(a.x, a.y, b.x, b.y);
      this.effects.lineStyle(1.5, 0xffdfc9, a.life * 8);
      this.effects.lineBetween(a.x, a.y, b.x, b.y);
    }
    if (this.kind === 'necro') {
      const hand = this.handWorld(false, false);
      if (pose.charge > 0.01) {
        this.effects.fillStyle(0xbca0f4, 0.14 * pose.charge); this.effects.fillCircle(hand.x, hand.y, 12 * pose.charge);
        this.effects.fillStyle(0xe5d5ff, 0.85); this.effects.fillCircle(hand.x, hand.y, 3 * pose.charge);
        this.effects.lineStyle(1, 0xcfb2ef, 0.7); this.effects.strokeCircle(hand.x, hand.y, 7 * pose.charge);
      }
    }
  }

  handWorld(right = false, absolute = true) {
    const hand = this.pose?.hands[right ? 1 : 0] || { x: 0, y: -50 };
    return { x: hand.x * this.side + (absolute ? this.root.parentContainer.x : 0), y: hand.y + (absolute ? this.root.parentContainer.y : 0) };
  }

  ghost(x, y) {
    const ghost = this.scene.add.container(x, y).setScale(this.side, 1).setDepth(y - 2).setAlpha(0.18);
    for (const part of this.root.list) {
      const image = this.scene.add.image(part.x, part.y, part.texture.key).setOrigin(part.originX, part.originY).setDisplaySize(part.displayWidth, part.displayHeight).setRotation(part.rotation).setTint(COLORS[this.kind]);
      if (part.isCropped) image.setCrop(part._crop.x, part._crop.y, part._crop.width, part._crop.height);
      ghost.add(image);
    }
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 160, onComplete: () => ghost.destroy() });
  }
}
