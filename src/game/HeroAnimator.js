import { actionFrame, facingView, walkFrame } from './motion.js';
import { ANIMATION_ART, HERO_HEIGHT, frameKey } from './animationArt.js';

const COLORS = { reaper: 0xe9a4a4, necro: 0xd6bbff };

export class HeroAnimator {
  constructor(scene, kind, parent) {
    this.scene = scene;
    this.kind = kind;
    this.root = scene.add.container(0, 0);
    this.sprite = scene.add.image(0, 0, frameKey(`${kind}-poses`, 0));
    this.root.add(this.sprite);
    this.shadow = scene.add.ellipse(0, 1, 38, 13, 0x0a1812, 0.3);
    parent.addAt(this.shadow, 0);
    parent.add(this.root);
    this.distance = 0;
    this.traveling = false;
    this.view = { side: 1, back: false };
    this.lastPosition = { x: parent.x, y: parent.y };
    this.show(`${kind}-poses`, 0);
  }

  show(sheet, frame) {
    const art = ANIMATION_ART[sheet];
    frame = art.aliases?.[frame] ?? frame;
    const texture = this.scene.textures.get(frameKey(sheet, frame));
    const { sourceX, sourceY } = texture.customData;
    const [x, y] = art.anchors[frame];
    this.sheet = sheet;
    this.frame = frame;
    this.sprite.setTexture(texture.key)
      .setOrigin((x - sourceX) / texture.source[0].width, (y - sourceY) / texture.source[0].height)
      .setScale(HERO_HEIGHT / (art.heights?.[frame] || art.height));
  }

  update(hero, dt) {
    // Actual displacement, not requested velocity: pushing into a tree must not
    // keep the feet walking. Ignore teleports and all dash travel in the gait.
    if (dt > 0) {
      const travelled = Math.hypot(hero.node.x - this.lastPosition.x, hero.node.y - this.lastPosition.y);
      const speed = Math.hypot(hero.node.body.velocity.x, hero.node.body.velocity.y);
      this.traveling = travelled > 0.01 && speed > 4 && travelled < hero.speed * Math.max(dt, 1 / 30) * 3 && !hero.down && hero.dashing <= 0;
      if (this.traveling && !hero.action) this.distance += travelled;
      this.lastPosition = { x: hero.node.x, y: hero.node.y };
    }
    this.view = facingView(hero.action?.direction || (hero.dashing > 0 ? hero.dashDirection : hero.facing), this.view);
    this.root.setScale(this.view.side, 1);
    const back = this.view.back ? '-back' : '';
    if (hero.down) this.show(`${this.kind}-poses`, 3);
    else if (hero.dashing > 0) this.show(`${this.kind}-poses`, 2);
    else if (hero.action) this.show(`${this.kind}-attack${back}`, actionFrame(hero.action));
    else if (this.traveling) this.show(`${this.kind}-walk${back}`, walkFrame(this.distance));
    else this.show(`${this.kind}-poses`, this.view.back ? 1 : 0);
    // Keep the painting intact: no per-limb transforms, squash, tilt or idle bob.
    this.shadow.setAlpha(hero.down ? 0.18 : 0.3);
  }

  emissionWorld() {
    const art = ANIMATION_ART[this.sheet];
    const [anchorX, anchorY] = art.anchors[this.frame];
    const [x, y] = art.emitters?.[this.frame] || [anchorX + 70, anchorY - art.height * 0.75];
    const scale = HERO_HEIGHT / (art.heights?.[this.frame] || art.height);
    return this.root.getWorldTransformMatrix().transformPoint((x - anchorX) * scale, (y - anchorY) * scale);
  }

  ghost(x, y) {
    const ghost = this.scene.add.image(x, y, this.sprite.texture.key)
      .setOrigin(this.sprite.originX, this.sprite.originY)
      .setScale(this.sprite.scaleX * this.view.side, this.sprite.scaleY)
      .setTint(COLORS[this.kind]).setDepth(y - 2).setAlpha(0.15);
    this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 130, onComplete: () => ghost.destroy() });
  }
}
