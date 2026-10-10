import Phaser from 'phaser';
import { createGround, createHeroFrames, preloadArt } from './assets.js';
import { HEROES, WORLD, normalized, keepPartyVisible, portalStep, availableEnemyTypes, xpNeeded, perkOffer } from './rules.js';
import { HeroAnimator } from './HeroAnimator.js';
import { makeAction, advanceAction } from './motion.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = Phaser.Math.Clamp;

export class ForestScene extends Phaser.Scene {
  constructor(bridge) {
    super('Forest');
    this.bridge = bridge;
    this.inputState = { keys: new Set(), touch: { x: 0, y: 0 }, touchAttack: false };
    this.bindings = [];
    this.heroes = [];
    this.enemies = [];
    this.skeletons = [];
    this.pickups = [];
    this.running = false;
    this.suspended = false;
    this.portal = { active: false, elapsed: 0 };
  }

  preload() { preloadArt(this); }

  create() {
    createGround(this);
    createHeroFrames(this);
    this.physics.world.setBounds(55, 65, WORLD.width - 110, WORLD.height - 130);
    this.cameras.main.setBackgroundColor('#304c3e');
    this.add.tileSprite(0, 0, WORLD.width, WORLD.height, 'ground').setOrigin(0).setDepth(-100);
    this.obstacles = this.physics.add.staticGroup();
    this.enemyBodies = this.physics.add.group();
    this.bolts = this.physics.add.group();
    this.buildForest();
    this.physics.add.collider(this.enemyBodies, this.enemyBodies);
    this.physics.add.collider(this.enemyBodies, this.obstacles);
    this.physics.add.overlap(this.bolts, this.enemyBodies, (bolt, body) => {
      const enemy = body.getData('enemy');
      if (!enemy || enemy.dead || !bolt.active || bolt.getData('hostile')) return;
      this.hitEnemy(enemy, bolt.getData('damage'), bolt.getData('owner'));
      this.spark(bolt.x, bolt.y, 0xd4b7ff, 7);
      bolt.destroy();
    });
    this.portalRing = this.add.graphics().setDepth(3);
    this.previewParty('solo', 'reaper');
    this.bridge.ready(this);
    this.game.events.on('blur', () => {
      this.inputState.keys.clear();
      this.inputState.touchAttack = false;
      this.inputState.touch = { x: 0, y: 0 };
      if (this.running && !this.suspended) this.bridge.pause();
    });
  }

  buildForest() {
    const random = new Phaser.Math.RandomDataGenerator(['mournwood-forest-01']);
    const paths = this.add.graphics().setDepth(-90);
    paths.lineStyle(92, 0x66735a, 0.19);
    paths.beginPath(); paths.moveTo(0, 1600); paths.lineTo(760, 1310); paths.lineTo(1510, 1210); paths.lineTo(2150, 1040); paths.lineTo(3200, 1320); paths.strokePath();
    paths.lineStyle(38, 0x9c9d76, 0.08);
    paths.beginPath(); paths.moveTo(1200, 2400); paths.lineTo(1530, 1370); paths.lineTo(1600, 1080); paths.lineTo(1940, 0); paths.strokePath();
    const clearing = this.add.graphics().setDepth(-80);
    clearing.fillStyle(0x70816a, 0.19); clearing.fillEllipse(1600, 1220, 480, 260);
    clearing.lineStyle(2, 0xb4b291, 0.24); clearing.strokeEllipse(1600, 1220, 350, 174);
    clearing.lineStyle(1, 0xb4b291, 0.18); clearing.strokeEllipse(1600, 1220, 380, 192);
    for (let i = 0; i < 16; i++) {
      const angle = i * Math.PI / 8;
      const x = 1600 + Math.cos(angle) * 183, y = 1220 + Math.sin(angle) * 92;
      clearing.lineBetween(x - 3, y - 4, x + 3, y + 4);
      if (i % 2) clearing.lineBetween(x - 4, y + 3, x + 5, y - 3);
    }
    this.trees = [];
    for (let i = 0; i < 175; i++) {
      const x = random.between(45, WORLD.width - 45), y = random.between(140, WORLD.height - 10);
      if (Math.hypot((x - 1600), (y - 1200) * 1.3) < 310) continue;
      const type = random.frac() > 0.35 ? 'tree' : 'birch';
      const scale = random.realInRange(0.65, 1.12);
      this.add.ellipse(x + 14, y - 3, 125 * scale, 37 * scale, 0x0d241b, 0.24).setDepth(-2);
      const tree = this.add.image(x, y, type).setOrigin(0.5, 1).setScale(scale).setDepth(y);
      this.trees.push(tree);
      const trunk = this.obstacles.create(x, y - 8, 'dot').setVisible(false).setScale(1.8);
      trunk.refreshBody(); trunk.body.setCircle(10);
    }
    for (let i = 0; i < 650; i++) {
      const x = random.between(30, WORLD.width - 30), y = random.between(30, WORLD.height - 30);
      const type = random.pick(['fern', 'fern', 'rock', 'mushrooms', 'stump']);
      if (Math.hypot(x - 1600, (y - 1220) * 1.5) < 180) continue;
      this.add.image(x, y, type).setOrigin(0.5, 0.92).setScale(random.realInRange(0.35, 0.85)).setDepth(y - 6).setAlpha(type === 'fern' ? 0.7 : 1);
    }
    const ruins = [{ x: 1390, y: 1185 }, { x: 1780, y: 1270 }, { x: 1600, y: 1060 }];
    for (const r of ruins) {
      const g = this.add.graphics().setPosition(r.x, r.y).setDepth(r.y);
      g.fillStyle(0x25392f); g.fillEllipse(3, 0, 63, 21);
      g.fillStyle(0x647269); g.fillPoints([{ x: -19, y: -2 }, { x: -20, y: -58 }, { x: -9, y: -75 }, { x: 12, y: -70 }, { x: 22, y: -50 }, { x: 19, y: -2 }], true);
      g.fillStyle(0x829080); g.fillPoints([{ x: -19, y: -58 }, { x: -9, y: -75 }, { x: 3, y: -70 }, { x: 0, y: -6 }, { x: -19, y: -2 }], true);
      g.lineStyle(1.5, 0xc3bd94, 0.65); g.strokeTriangle(-6, -49, 7, -42, -6, -33); g.lineBetween(0, -48, 0, -22);
      g.fillStyle(0x718052); g.fillEllipse(-7, -3, 30, 8);
    }
    this.leaves = Array.from({ length: 22 }, () => {
      const leaf = this.add.ellipse(random.between(1150, 2050), random.between(800, 1500), 4, 2, 0xaab88b, 0.3).setDepth(10000);
      this.tweens.add({ targets: leaf, x: leaf.x - 190, y: leaf.y + 130, angle: 250, alpha: 0, duration: random.between(7000, 14000), repeat: -1, delay: random.between(0, 5000) });
      return leaf;
    });
  }

  makeHero(kind, index, x, y) {
    const base = HEROES[kind];
    const node = this.physics.add.image(x, y, 'dot').setVisible(false).setCircle(8).setCollideWorldBounds(true);
    const obstacleCollider = this.physics.add.collider(node, this.obstacles);
    const ring = this.add.ellipse(0, 0, 47, 22).setStrokeStyle(1.5, base.color, 0.6);
    const visual = this.add.container(x, y, [ring]);
    const animator = new HeroAnimator(this, kind, visual);
    const h = { ...base, kind, index, node, visual, animator, ring, maxHp: base.hp, hp: base.hp, facing: { x: 1, y: 0 }, moving: false, attackLeft: 0, dashLeft: 0, dashing: 0, skill1Left: 0, skill2Left: 0, invulnerable: 0, action: null, combo: 0, hitReaction: 0, hitStop: 0, ghostLeft: 0, perks: {}, down: false, downTime: 0, revive: 0, colliders: [] };
    h.colliders.push(obstacleCollider, this.physics.add.overlap(node, this.bolts, (_, bolt) => {
      if (bolt.active && bolt.getData('hostile') && !h.down) {
        this.hurtHero(h, 12); bolt.destroy();
      }
    }));
    return h;
  }

  clearParty() {
    for (const h of this.heroes) { h.colliders.forEach(c => c.destroy()); h.node.destroy(); h.visual.destroy(); }
    this.heroes = [];
  }

  previewParty(mode, kind) {
    if (!this.textures.exists('dot') || this.running) return;
    this.clearParty();
    this.heroes.push(this.makeHero(kind, 0, mode === 'coop' ? 1570 : 1600, 1220));
    if (mode === 'coop') this.heroes.push(this.makeHero(kind === 'reaper' ? 'necro' : 'reaper', 1, 1640, 1237));
    const camera = this.cameras.main;
    camera.setZoom(this.scale.width < 700 ? 1.1 : 1.55);
    const cx = 1600 - (this.scale.width > 700 ? this.scale.width * 0.13 / camera.zoom : 0);
    const cy = 1200 + (this.scale.width < 700 ? 215 : 0);
    camera.centerOn(cx, cy);
  }

  startRun(mode, kind, bindings) {
    this.suspended = false;
    this.physics.resume();
    this.tweens.resumeAll();
    this.running = false;
    this.enemies.forEach(e => this.destroyEnemy(e)); this.enemies = [];
    this.skeletons.forEach(s => s.art.destroy()); this.skeletons = [];
    this.pickups.forEach(p => p.art.destroy()); this.pickups = [];
    this.bolts.clear(true, true);
    this.previewParty(mode, kind);
    this.bindings = bindings;
    this.mode = mode;
    this.elapsed = 0; this.gold = 0; this.xp = 0; this.level = 1; this.kills = 0;
    this.spawnLeft = 2.2; this.uiLeft = 0; this.lastOgre = 0;
    this.portal = { active: false, elapsed: 0 };
    this.portalRing.clear();
    this.running = true;
    this.inputState.keys.clear();
    this.cameras.main.setZoom(this.scale.width < 700 ? 1.05 : 1.15);
    this.bridge.started(this.heroes);
    this.emitState();
  }

  setPaused(value) {
    this.suspended = value;
    this.inputState.keys.clear();
    this.inputState.touchAttack = false;
    this.inputState.touch = { x: 0, y: 0 };
    if (value) { this.physics.pause(); this.tweens.pauseAll(); }
    else { this.physics.resume(); this.tweens.resumeAll(); }
  }

  goHome() {
    this.setPaused(false);
    this.running = false;
    this.enemies.forEach(e => this.destroyEnemy(e)); this.enemies = [];
    this.bolts.clear(true, true);
    this.skeletons.forEach(s => s.art.destroy()); this.skeletons = [];
    this.pickups.forEach(p => p.art.destroy()); this.pickups = [];
    this.portalRing.clear();
    this.previewParty(this.mode || 'solo', this.heroes[0]?.kind || 'reaper');
  }

  action(index, action) {
    if (!this.running || this.suspended) return;
    const h = this.heroes[index];
    if (!h || h.down) return;
    if (action === 'attack') this.attack(h);
    if (action === 'dash') this.dash(h);
    if (action === 'skill1' || action === 'skill2') this.skill(h, action);
  }

  aim(h) {
    if (h.moving) return h.facing;
    const enemies = this.enemies.filter(e => !e.dead && distance(e.node, h.node) < h.range).sort((a, b) => distance(a.node, h.node) - distance(b.node, h.node));
    if (enemies.length) h.facing = normalized(enemies[0].node.x - h.node.x, enemies[0].node.y - h.node.y);
    return h.facing;
  }

  attack(h) {
    if (h.attackLeft > 0 || h.action || h.dashing > 0) return;
    h.attackLeft = h.attackCooldown;
    h.action = makeAction(h.kind, 'attack', this.aim(h), h.attackCooldown, h.combo++);
  }

  releaseAttack(h, action) {
    const dir = action.direction, angle = Math.atan2(dir.y, dir.x);
    if (h.kind === 'reaper') {
      this.arc(h.node.x, h.node.y - 18, angle, h.range, 0xe3adb0, false);
      let connected = false;
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = distance(h.node, e.node), n = normalized(e.node.x - h.node.x, e.node.y - h.node.y);
        if (d < h.range + e.radius && n.x * dir.x + n.y * dir.y > 0.1) { this.hitEnemy(e, h.damage, h); connected = true; }
      }
      if (connected) h.hitStop = 0.035;
      this.bridge.sound('scythe');
    } else {
      this.fireBolt(h.node.x + dir.x * 24, h.node.y + dir.y * 24, dir, h.damage, h);
      const hand = h.animator.handWorld();
      this.spark(hand.x, hand.y, 0xe0caff, 7);
      this.bridge.sound('bolt');
    }
  }

  fireBolt(x, y, dir, damage, owner, hostile = false) {
    const bolt = this.bolts.create(x, y, 'dot').setVisible(false).setScale(hostile ? 0.45 : 0.55);
    const art = this.add.container(x, y - 24).setDepth(6000);
    const glow = this.add.image(0, 0, 'dot').setTint(hostile ? 0xd3af75 : 0xb998e4).setScale(1.1).setAlpha(0.19);
    const core = this.add.image(0, 0, 'dot').setTint(hostile ? 0xe4c993 : 0xefe1ff).setScale(0.4);
    art.add([glow, core]);
    const hand = owner?.animator.handWorld();
    if (hand) art.setPosition(hand.x, hand.y);
    bolt.setData({ damage, owner, hostile, art, startX: hand ? hand.x - x : 0, startY: hand ? hand.y - y : -24, age: 0, life: hostile ? 2.4 : owner.range / 370 });
    bolt.once('destroy', () => art.destroy());
    bolt.setVelocity(dir.x * (hostile ? 190 : 370), dir.y * (hostile ? 190 : 370));
    bolt.body.setCircle(7);
  }

  dash(h) {
    if (h.dashLeft > 0) return;
    h.dashLeft = h.dashCooldown; h.dashing = 0.2; h.invulnerable = 0.32;
    h.action = null; h.queuedSkill = null; h.ghostLeft = 0;
    h.dashDirection = { ...h.facing }; h.dashHits = new Set();
    this.spark(h.node.x, h.node.y - 15, h.color, 9);
    this.bridge.sound('dash');
  }

  skill(h, slot) {
    if (h[`${slot}Left`] > 0 || h.dashing > 0) return;
    if (h.action) { h.queuedSkill = slot; return; }
    const isFirst = slot === 'skill1';
    const data = {};
    if (h.kind === 'reaper' && !isFirst) {
      data.target = this.enemies.filter(e => !e.dead && distance(e.node, h.node) < 145).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (!data.target) { this.bridge.toast('Нет цели в пределах досягаемости'); return; }
    }
    if (h.kind === 'necro' && isFirst && this.skeletons.filter(s => s.owner === h).length >= 2) { this.bridge.toast('Оба скелета уже призваны'); return; }
    h[`${slot}Left`] = isFirst ? (h.kind === 'necro' ? 13 : 8) : 11;
    const name = h.kind === 'reaper' ? isFirst ? 'spin' : 'execution' : isFirst ? 'summon' : 'bind';
    const direction = data.target ? normalized(data.target.node.x - h.node.x, data.target.node.y - h.node.y) : this.aim(h);
    h.action = makeAction(h.kind, name, direction, h.attackCooldown, 0, data);
  }

  releaseSkill(h, action) {
    const isFirst = action.name === 'spin' || action.name === 'summon';
    if (h.kind === 'reaper') {
      if (isFirst) {
        this.arc(h.node.x, h.node.y - 10, 0, 120, 0xe7a4ab, true);
        this.enemies.filter(e => !e.dead && distance(e.node, h.node) < 135).forEach(e => this.hitEnemy(e, h.damage * 1.7, h));
      } else {
        const target = action.data.target;
        if (!target || target.dead || !target.node.active || distance(target.node, h.node) > 175) return;
        this.arc(target.node.x, target.node.y, -Math.PI / 2, 47, 0xffd0b4, true);
        this.hitEnemy(target, h.damage * (target.hp / target.maxHp < 0.5 ? 3.2 : 1.3), h);
      }
    } else if (isFirst) {
      const owned = this.skeletons.filter(s => s.owner === h);
      if (owned.length >= 2) { h.skill1Left = 0; this.bridge.toast('Оба скелета уже призваны'); return; }
      for (let i = owned.length; i < 2; i++) {
        const x = h.node.x + (i ? 32 : -32), y = h.node.y + 10;
        const art = this.add.image(x, y, 'skeleton').setScale(0.7).setOrigin(0.5, 0.85);
        this.skeletons.push({ art, x, y, hp: 40, owner: h, life: 14, cooldown: 0, walk: 0 });
        this.spark(x, y, h.color, 10);
      }
    } else {
      const x = h.node.x + action.direction.x * 110, y = h.node.y + action.direction.y * 110;
      const area = this.add.ellipse(x, y, 240, 150, 0xae87d7, 0.12).setStrokeStyle(2, 0xb697db, 0.6).setDepth(1);
      for (const e of this.enemies) if (!e.dead && distance(e.node, { x, y }) < 135) { e.rooted = 4; this.hitEnemy(e, h.damage * 0.4, h); }
      for (let i = 0; i < 12; i++) {
        const angle = i / 12 * Math.PI * 2;
        const hand = this.add.graphics().setDepth(y + 15);
        hand.lineStyle(2, 0xcbb4df, 0.6);
        const hx = x + Math.cos(angle) * 90, hy = y + Math.sin(angle) * 48;
        hand.lineBetween(hx, hy, hx, hy - 14); hand.lineBetween(hx, hy - 8, hx - 6, hy - 13); hand.lineBetween(hx, hy - 8, hx + 6, hy - 13);
        this.tweens.add({ targets: hand, alpha: 0, duration: 3500, onComplete: () => hand.destroy() });
      }
      this.tweens.add({ targets: area, alpha: 0, duration: 4000, onComplete: () => area.destroy() });
    }
    this.bridge.sound('skill');
  }

  arc(x, y, angle, radius, color, full) {
    const g = this.add.graphics().setDepth(5500);
    g.lineStyle(14, color, 0.11); g.beginPath(); g.arc(x, y, radius, full ? 0 : angle - 1.15, full ? Math.PI * 2 : angle + 1.15); g.strokePath();
    g.lineStyle(3, color, 0.9); g.beginPath(); g.arc(x, y, radius - 5, full ? 0 : angle - 1.15, full ? Math.PI * 2 : angle + 1.15); g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 240, onComplete: () => g.destroy() });
  }

  spark(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const p = this.add.rectangle(x, y, 2 + Math.random() * 2, 3, color).setDepth(7000);
      this.tweens.add({ targets: p, x: x + (Math.random() - 0.5) * 55, y: y - Math.random() * 35, alpha: 0, duration: 200 + Math.random() * 300, onComplete: () => p.destroy() });
    }
  }

  spawnEnemy(type, position) {
    if (this.enemies.filter(e => !e.dead).length >= 36) return;
    const camera = this.cameras.main;
    let x, y;
    if (position) { x = position.x; y = position.y; }
    else {
      const bounds = camera.worldView;
      const sides = [];
      if (bounds.left > 130) sides.push({ x: bounds.left - 95, y: Phaser.Math.Between(bounds.top, bounds.bottom) });
      if (bounds.right < WORLD.width - 130) sides.push({ x: bounds.right + 95, y: Phaser.Math.Between(bounds.top, bounds.bottom) });
      if (bounds.top > 150) sides.push({ x: Phaser.Math.Between(bounds.left, bounds.right), y: bounds.top - 115 });
      if (bounds.bottom < WORLD.height - 130) sides.push({ x: Phaser.Math.Between(bounds.left, bounds.right), y: bounds.bottom + 95 });
      if (!sides.length) return;
      ({ x, y } = Phaser.Utils.Array.GetRandom(sides));
      x = clamp(x, 80, WORLD.width - 80); y = clamp(y, 80, WORLD.height - 80);
    }
    const stats = { wolf: { hp: 44, speed: 75, radius: 18, damage: 13, scale: 0.63, xp: 4, gold: 3 }, ent: { hp: 94, speed: 33, radius: 23, damage: 15, scale: 0.7, xp: 8, gold: 6 }, ogre: { hp: 420, speed: 35, radius: 33, damage: 32, scale: 0.95, xp: 22, gold: 20 } }[type];
    const node = this.enemyBodies.create(x, y, 'dot').setVisible(false).setCircle(8).setCollideWorldBounds(true);
    node.body.setSize(stats.radius * 1.5, stats.radius);
    const shadow = this.add.ellipse(0, 0, stats.radius * 2.6, stats.radius, 0x0a1c15, 0.35);
    const art = this.add.image(0, type === 'wolf' ? -10 : -38, type).setScale(stats.scale);
    const hp = this.add.graphics();
    const visual = this.add.container(x, y, [shadow, art, hp]).setDepth(y);
    const e = { ...stats, type, node, visual, art, hpBar: hp, maxHp: stats.hp * (1 + Math.floor(this.elapsed / 180) * 0.12), state: 'chase', timer: 0, cooldown: type === 'wolf' ? 1.2 : 2, rooted: 0, dead: false, hurt: 0, warning: null, phase: Math.random() * Math.PI * 2 };
    e.hp = e.maxHp; node.setData('enemy', e); this.enemies.push(e);
    return e;
  }

  hitEnemy(e, damage, hero) {
    if (e.dead) return;
    e.hp -= damage; e.hurt = 0.13;
    this.spark(e.node.x, e.node.y - 13, hero?.color || 0xc7bce1, 3);
    if (e.hp <= 0) {
      e.dead = true; this.kills++;
      e.node.setVelocity(0); e.node.body.enable = false;
      e.warning?.destroy(); e.warning = null;
      this.tweens.add({ targets: e.visual, alpha: 0, scaleX: 0.85, scaleY: 0.85, duration: 240, onComplete: () => this.destroyEnemy(e) });
      const art = this.add.star(e.node.x, e.node.y - 6, 4, 3, 7, 0xd6c38a).setDepth(e.node.y + 2);
      this.pickups.push({ art, x: e.node.x, y: e.node.y, gold: e.gold, xp: e.xp });
    }
  }

  destroyEnemy(e) { e.warning?.destroy(); if (e.node.active) e.node.destroy(); if (e.visual.active) e.visual.destroy(); }

  hurtHero(h, amount) {
    if (h.down || h.invulnerable > 0 || !this.running) return;
    h.hp = Math.max(0, h.hp - amount); h.invulnerable = 0.65;
    h.hitReaction = 1;
    this.spark(h.node.x, h.node.y - 20, 0xee9a8e, 7);
    if (this.portal.active) {
      this.portal = portalStep(this.portal, 0, true);
      this.bridge.toast('Портал прерван: получен урон');
    }
    this.heroes.forEach(ally => { if (ally.down) ally.revive = 0; });
    this.bridge.sound('hurt');
    if (h.hp <= 0) {
      h.down = true; h.downTime = 30; h.node.setVelocity(0);
      h.action = null; h.queuedSkill = null;
      h.visual.setAlpha(0.45);
      this.bridge.toast(this.heroes.length > 1 ? `${h.name}: 30 секунд до потери души` : 'Лес забрал ещё одну душу');
      if (this.heroes.every(hero => hero.down)) this.finish(false);
    }
  }

  beginPortal() {
    if (!this.running || this.suspended) return;
    if (this.portal.active) { this.portal = { active: false, elapsed: 0 }; return; }
    this.portal = { active: true, elapsed: 0 };
    this.bridge.sound('skill');
  }

  finish(escaped) {
    if (!this.running) return;
    this.running = false; this.setPaused(true); this.portalRing.clear();
    this.bridge.finished({ escaped, duration: this.elapsed, gold: this.gold, level: this.level, kills: this.kills });
  }

  offerPerks() {
    const choices = this.heroes.filter(h => !h.down).map(h => ({ hero: h, options: perkOffer(h) })).filter(c => c.options.length);
    if (!choices.length) return;
    this.setPaused(true);
    this.bridge.perks(choices, () => this.setPaused(false));
  }

  choosePerk(hero, perk) { perk.apply(hero); hero.perks[perk.id] = (hero.perks[perk.id] || 0) + 1; this.emitState(); }

  update(_time, delta) {
    if (!this.heroes.length) return;
    const dt = Math.min(delta / 1000, 0.05);
    if (this.suspended) return;
    if (!this.running) {
      for (const h of this.heroes) this.animateHero(h, dt);
      return;
    }
    this.elapsed += dt;
    for (const h of this.heroes) this.updateHero(h, dt);
    this.updateCamera(dt);
    for (const e of this.enemies) if (!e.dead) this.updateEnemy(e, dt);
    this.enemies = this.enemies.filter(e => e.node.active);
    this.updateSkeletons(dt);
    this.updatePickups(dt);
    this.bolts.getChildren().slice().forEach(b => {
      const life = b.getData('life') - dt; b.setData('life', life);
      const age = b.getData('age') + dt; b.setData('age', age);
      const blend = Math.min(1, age / 0.2);
      b.getData('art').setPosition(b.x + b.getData('startX') * (1 - blend), b.y + b.getData('startY') * (1 - blend) - 22 * blend);
      if (life <= 0) b.destroy();
    });
    this.spawnLeft -= dt;
    if (this.spawnLeft <= 0) {
      const types = availableEnemyTypes(this.elapsed);
      const ogreEligible = types.includes('ogre') && !this.enemies.some(e => e.type === 'ogre' && !e.dead) && this.elapsed - this.lastOgre > 100;
      const type = ogreEligible ? 'ogre' : types.includes('ent') && Math.random() < 0.3 ? 'ent' : 'wolf';
      this.spawnEnemy(type);
      if (type === 'ogre') { this.lastOgre = this.elapsed; this.spawnLeft = 10; this.bridge.toast('Среди деревьев слышны тяжёлые шаги'); }
      else this.spawnLeft = Math.max(0.7, 4 - this.elapsed / 85) / (this.mode === 'coop' ? 1.35 : 1);
    }
    this.portal = portalStep(this.portal, dt, false);
    this.drawPortal();
    if (this.portal.complete) { this.finish(true); return; }
    for (const tree of this.trees) {
      const overlapping = this.heroes.some(h => !h.down && Math.abs(h.node.x - tree.x) < tree.displayWidth * 0.34 && h.node.y < tree.y + 10 && h.node.y > tree.y - tree.displayHeight * 0.8);
      tree.setAlpha(overlapping ? 0.38 : 1);
    }
    if (this.xp >= xpNeeded(this.level)) {
      this.xp -= xpNeeded(this.level); this.level++; this.offerPerks();
    }
    this.uiLeft -= dt;
    if (this.uiLeft <= 0) { this.emitState(); this.uiLeft = 0.06; }
  }

  updateHero(h, dt) {
    for (const key of ['attackLeft', 'dashLeft', 'skill1Left', 'skill2Left', 'invulnerable', 'dashing', 'hitStop', 'ghostLeft']) h[key] = Math.max(0, h[key] - dt);
    h.hitReaction = Math.max(0, h.hitReaction - dt * 6);
    if (h.down) {
      h.downTime = Math.max(0, h.downTime - dt);
      const ally = this.heroes.find(p => !p.down && p.invulnerable <= 0 && distance(p.node, h.node) < 70 && p.node.body.speed < 10);
      h.revive = h.downTime > 0 && ally ? h.revive + dt : 0;
      if (h.revive >= 3) {
        h.down = false; h.hp = h.maxHp * 0.2; h.invulnerable = 1; h.revive = 0; h.visual.setAlpha(1);
        this.bridge.toast(`${h.name} возвращается в бой`);
      }
      this.animateHero(h, dt);
      return;
    }
    const keys = this.inputState.keys, binding = this.bindings[h.index];
    let x = Number(keys.has(binding.right)) - Number(keys.has(binding.left));
    let y = Number(keys.has(binding.down)) - Number(keys.has(binding.up));
    if (h.index === 0 && (this.inputState.touch.x || this.inputState.touch.y)) { x = this.inputState.touch.x; y = this.inputState.touch.y; }
    const dir = normalized(x, y); h.moving = Boolean(x || y);
    if (h.moving) h.facing = dir;
    if (h.dashing > 0) {
      const burst = 620 * (0.5 + 0.65 * Math.sin((1 - h.dashing / 0.2) * Math.PI));
      h.node.setVelocity(h.dashDirection.x * burst, h.dashDirection.y * burst);
      if (h.ghostLeft <= 0) { h.animator.ghost(h.node.x, h.node.y); h.ghostLeft = 0.065; }
      if (h.kind === 'reaper') for (const e of this.enemies) {
        if (!e.dead && distance(e.node, h.node) < 48 && !h.dashHits.has(e)) { h.dashHits.add(e); this.hitEnemy(e, h.damage * 0.3, h); }
      }
    } else {
      const recovery = h.action ? 0.82 : 1;
      h.node.setVelocity(dir.x * h.speed * recovery, dir.y * h.speed * recovery);
    }
    if (h.action && h.hitStop <= 0) {
      const action = h.action;
      const step = advanceAction(action, dt);
      if (step.impact) {
        this.animateHero(h, 0);
        if (action.name === 'attack') this.releaseAttack(h, action);
        else this.releaseSkill(h, action);
      }
      if (step.complete) h.action = null;
    }
    if (!h.action && h.queuedSkill) {
      const slot = h.queuedSkill; h.queuedSkill = null;
      this.skill(h, slot);
    }
    if (keys.has(binding.attack) || (h.index === 0 && this.inputState.touchAttack)) this.attack(h);
    this.animateHero(h, dt);
  }

  animateHero(h, dt) {
    h.visual.setPosition(h.node.x, h.node.y).setDepth(h.node.y + 1);
    h.animator.update(h, h.hitStop > 0 ? 0 : dt);
    h.visual.setAlpha(h.down ? 0.45 : h.invulnerable > 0 && h.dashing <= 0 ? (Math.floor(h.invulnerable * 18) % 2 ? 0.65 : 1) : 1);
  }

  updateCamera(dt) {
    const camera = this.cameras.main;
    const active = this.heroes.filter(h => !h.down);
    if (!active.length) return;
    if (active.length === 2) {
      const a = active[0].node, b = active[1].node;
      const desired = clamp(Math.min((camera.width - 160) / (Math.abs(a.x - b.x) + 200), (camera.height - 250) / (Math.abs(a.y - b.y) + 150)), 0.8, 1.15);
      camera.setZoom(Phaser.Math.Linear(camera.zoom, desired, Math.min(dt * 5, 1)));
      const positions = keepPartyVisible(a, b, camera.width / camera.zoom, (camera.height - 160) / camera.zoom, 80);
      positions.forEach((p, i) => active[i].node.setPosition(p.x, p.y));
    }
    const x = active.reduce((v, h) => v + h.node.x, 0) / active.length;
    const y = active.reduce((v, h) => v + h.node.y, 0) / active.length;
    const targetX = clamp(x - camera.width / camera.zoom / 2, 0, WORLD.width - camera.width / camera.zoom);
    const targetY = clamp(y - camera.height / camera.zoom / 2 - 30, 0, WORLD.height - camera.height / camera.zoom);
    camera.setScroll(Phaser.Math.Linear(camera.scrollX, targetX, Math.min(dt * 7, 1)), Phaser.Math.Linear(camera.scrollY, targetY, Math.min(dt * 7, 1)));
  }

  updateEnemy(e, dt) {
    e.cooldown -= dt; e.hurt = Math.max(0, e.hurt - dt); e.rooted = Math.max(0, e.rooted - dt);
    const targets = [...this.heroes.filter(h => !h.down).map(h => ({ x: h.node.x, y: h.node.y, hero: h })), ...this.skeletons.filter(s => s.hp > 0).map(s => ({ x: s.x, y: s.y, skeleton: s }))];
    const target = targets.sort((a, b) => distance(a, e.node) - distance(b, e.node))[0];
    if (!target) { e.node.setVelocity(0); return; }
    const d = distance(target, e.node), dir = normalized(target.x - e.node.x, target.y - e.node.y);
    e.visual.setPosition(e.node.x, e.node.y).setDepth(e.node.y);
    e.art.setFlipX(dir.x < 0); e.art.setTint(e.hurt > 0 ? 0xffc9b5 : e.rooted > 0 ? 0xc2a1e3 : 0xffffff);
    e.phase += dt * 9;
    e.art.setY((e.type === 'wolf' ? -10 : -38) + (e.state === 'chase' ? Math.sin(e.phase) * 1.5 : 0));
    e.hpBar.clear();
    if (e.hp < e.maxHp) {
      const y = e.type === 'wolf' ? -37 : -85;
      e.hpBar.fillStyle(0x14251b, 0.8); e.hpBar.fillRect(-18, y, 36, 3);
      e.hpBar.fillStyle(0xb5a28a); e.hpBar.fillRect(-18, y, 36 * Math.max(0, e.hp / e.maxHp), 3);
    }
    if (e.rooted > 0) { e.node.setVelocity(0); return; }
    if (e.state === 'windup') {
      e.node.setVelocity(0); e.timer -= dt;
      if (e.timer <= 0) {
        e.warning?.destroy(); e.warning = null;
        if (e.type === 'wolf') { e.state = 'leap'; e.timer = 0.35; }
        else if (e.type === 'ent') {
          const angle = Math.atan2(e.aim.y, e.aim.x);
          for (const offset of [-0.25, 0, 0.25]) this.fireBolt(e.node.x, e.node.y, { x: Math.cos(angle + offset), y: Math.sin(angle + offset) }, 12, null, true);
          e.state = 'recover'; e.timer = 1.5;
        } else {
          this.arc(e.node.x, e.node.y, Math.atan2(e.aim.y, e.aim.x), 112, 0xe7b178, false);
          for (const t of targets) {
            const n = normalized(t.x - e.node.x, t.y - e.node.y);
            if (distance(e.node, t) < 123 && n.x * e.aim.x + n.y * e.aim.y > 0.2) this.hurtTarget(t, e.damage);
          }
          e.state = 'recover'; e.timer = 2;
        }
      }
    } else if (e.state === 'leap') {
      e.node.setVelocity(e.aim.x * 350, e.aim.y * 350); e.timer -= dt;
      for (const t of targets) if (distance(e.node, t) < 32) this.hurtTarget(t, e.damage);
      if (e.timer <= 0) { e.state = 'recover'; e.timer = 1.1; e.node.setVelocity(0); }
    } else if (e.state === 'recover') {
      e.node.setVelocity(0); e.timer -= dt;
      if (e.timer <= 0) { e.state = 'chase'; e.cooldown = 0.8; }
    } else {
      e.node.setVelocity(dir.x * e.speed, dir.y * e.speed);
      const range = e.type === 'ent' ? 300 : e.type === 'ogre' ? 125 : 140;
      if (d < range && e.cooldown <= 0) {
        e.state = 'windup'; e.timer = e.type === 'ogre' ? 1.2 : e.type === 'ent' ? 1 : 0.65; e.aim = dir;
        e.warning = this.add.graphics().setDepth(2);
        const angle = Math.atan2(dir.y, dir.x);
        if (e.type === 'wolf') {
          e.warning.lineStyle(17, 0xe1ae70, 0.18); e.warning.lineBetween(e.node.x, e.node.y, e.node.x + dir.x * 155, e.node.y + dir.y * 155);
          e.warning.lineStyle(1, 0xf0c485, 0.7); e.warning.lineBetween(e.node.x, e.node.y, e.node.x + dir.x * 155, e.node.y + dir.y * 155);
        } else {
          e.warning.fillStyle(0xe7b47b, 0.17); e.warning.slice(e.node.x, e.node.y, range, angle - (e.type === 'ent' ? 0.3 : 1.1), angle + (e.type === 'ent' ? 0.3 : 1.1), false); e.warning.fillPath();
        }
      }
    }
  }

  hurtTarget(target, damage) {
    if (target.hero) this.hurtHero(target.hero, damage);
    if (target.skeleton) target.skeleton.hp -= damage * 0.08;
  }

  updateSkeletons(dt) {
    for (const s of this.skeletons) {
      s.life -= dt; s.cooldown -= dt; s.walk += dt * 13;
      const target = this.enemies.filter(e => !e.dead).sort((a, b) => distance(a.node, s) - distance(b.node, s))[0];
      const goal = target && distance(target.node, s) < 400 ? target.node : s.owner.node;
      const dir = normalized(goal.x - s.x, goal.y - s.y), d = distance(goal, s);
      if (d > 36) { s.x += dir.x * 140 * dt; s.y += dir.y * 140 * dt; }
      if (target && d < 55 && s.cooldown <= 0) { this.hitEnemy(target, s.owner.damage * 0.45, s.owner); s.cooldown = 0.85; }
      s.art.setPosition(s.x, s.y + Math.sin(s.walk)).setDepth(s.y).setFlipX(dir.x < 0);
      if (s.life <= 0 || s.hp <= 0 || s.owner.down) { this.spark(s.x, s.y, 0xc0b4d6, 4); s.art.destroy(); }
    }
    this.skeletons = this.skeletons.filter(s => s.art.active);
  }

  updatePickups(dt) {
    for (const p of this.pickups) {
      const hero = this.heroes.filter(h => !h.down).sort((a, b) => distance(a.node, p) - distance(b.node, p))[0];
      if (!hero) continue;
      const d = distance(hero.node, p);
      if (d < 150) {
        const n = normalized(hero.node.x - p.x, hero.node.y - p.y);
        p.x += n.x * 310 * dt; p.y += n.y * 310 * dt; p.art.setPosition(p.x, p.y);
      }
      p.art.rotation += dt;
      if (d < 20) { this.gold += p.gold; this.xp += p.xp; p.art.destroy(); this.bridge.sound('gold'); }
    }
    this.pickups = this.pickups.filter(p => p.art.active);
  }

  drawPortal() {
    this.portalRing.clear();
    if (!this.portal.active) return;
    const heroes = this.heroes.filter(h => !h.down);
    for (const h of heroes) {
      this.portalRing.lineStyle(2, 0xc8b1e4, 0.6);
      this.portalRing.strokeEllipse(h.node.x, h.node.y, 90, 47);
      this.portalRing.lineStyle(3, 0xe6d2fc, 0.8);
      this.portalRing.beginPath(); this.portalRing.arc(h.node.x, h.node.y - 20, 44, -Math.PI / 2, -Math.PI / 2 + this.portal.elapsed / 3 * Math.PI * 2); this.portalRing.strokePath();
    }
  }

  emitState() {
    this.bridge.state({ heroes: this.heroes, time: this.elapsed, gold: this.gold, level: this.level, xp: this.xp, xpMax: xpNeeded(this.level), enemies: this.enemies.filter(e => !e.dead).length, portal: this.portal });
  }
}
