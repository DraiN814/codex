import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
await mkdir('test-results', { recursive: true });

try {
  await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/?test=1`);
  await page.waitForFunction(() => window.__mournwood?.scene?.heroes.length, {}, { timeout: 20000 });
  await page.locator('[data-mode="coop"]').click();
  await page.locator('#start-button').click();
  // Freeze automatic stepping; drive production combat code at exact event
  // boundaries so windup, interruption, and hit counts are deterministic.
  const checks = await page.evaluate(() => {
    const s = window.__mournwood.scene;
    s.setPaused(true); s.spawnLeft = 9999;
    const [reaper, necro] = s.heroes;
    const checks = [];
    const check = (value, name) => { if (!value) throw new Error(name); checks.push(name); };
    reaper.node.setPosition(1500, 1250); reaper.facing = { x: 1, y: 0 };
    const target = s.spawnEnemy('wolf', { x: 1555, y: 1250 }); target.hp = 10000;
    s.attack(reaper);
    s.updateHero(reaper, reaper.action.impact - 0.001);
    check(target.hp === 10000, 'Scythe windup deals no early damage');
    s.updateHero(reaper, 0.002);
    check(target.hp === 10000 - reaper.damage, 'Scythe impact deals one hit at its animation event');
    s.updateHero(reaper, 1);
    check(target.hp === 10000 - reaper.damage && !reaper.action, 'Recovery does not repeat the hit');
    s.attack(reaper); s.dash(reaper); s.updateHero(reaper, 0.1); s.updateHero(reaper, 1);
    check(target.hp === 10000 - reaper.damage && !reaper.action, 'Dashing cancels a pending swing');
    s.destroyEnemy(target); s.enemies = [];

    necro.facing = { x: 1, y: 0 };
    s.attack(necro); s.updateHero(necro, necro.action.impact - 0.001);
    check(s.bolts.getLength() === 0, 'Casting windup does not spawn an early projectile');
    s.updateHero(necro, 0.002);
    const bolt = s.bolts.getChildren()[0], hand = necro.animator.handWorld();
    check(s.bolts.getLength() === 1 && Math.hypot(bolt.getData('art').x - hand.x, bolt.getData('art').y - hand.y) < 0.01, 'Magic is released from the animated palm');
    s.skill(necro, 'skill1');
    check(necro.queuedSkill === 'skill1', 'An ability pressed during an attack is buffered');
    s.updateHero(necro, 1);
    check(necro.action?.name === 'summon' && s.skeletons.length === 0, 'Buffered ability starts after attack recovery');
    s.updateHero(necro, necro.action.impact - 0.001);
    check(s.skeletons.length === 0, 'Summoning waits for its gesture');
    s.updateHero(necro, 0.002);
    check(s.skeletons.length === 2, 'Summon gesture creates the two skeletons');
    s.updateHero(necro, 1);
    check(s.skeletons.length === 2, 'Summon recovery cannot duplicate skeletons');

    for (const h of s.heroes) {
      check(Object.keys(h.animator.parts).length === 14, `${h.kind} has all fourteen rig parts`);
      h.action = null; h.hitStop = 0; h.node.setVelocity(h.speed, 0);
      h.animator.phase = 0.1; h.animator.locomotion = 1; s.animateHero(h, 0);
      const before = h.animator.parts.bootL.rotation;
      s.animateHero(h, 0.15);
      check(Math.abs(before - h.animator.parts.bootL.rotation) > 0.1, `${h.kind} articulates its legs while traveling`);
      h.node.setVelocity(0); s.animateHero(h, 1);
      const stopped = h.animator.phase; s.animateHero(h, 0.2);
      check(stopped === h.animator.phase && h.animator.locomotion < 0.001, `${h.kind} settles out of the walk cycle at rest`);
      h.facing = { x: 0, y: -1 }; s.animateHero(h, 0);
      check(h.animator.parts.head.texture.key.endsWith('headBack'), `${h.kind} uses rear artwork when facing away`);
      h.facing = { x: -1, y: 0 }; s.animateHero(h, 0);
      check(h.animator.root.scaleX === -1, `${h.kind} mirrors left-facing poses`);
    }
    return checks;
  });
  for (const check of checks) console.log(`PASS ${check}`);

  // Pose sheets use the same renderer and art as gameplay, at a larger scale
  // so seams, grips, silhouettes, and timing can be inspected in the output.
  await page.evaluate(() => {
    document.querySelectorAll('body *').forEach(el => {
      if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden';
    });
    const s = window.__mournwood.scene;
    s.children.list.forEach(child => child.setVisible(false));
    s.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor('#26362e');
    window.reviewHeroes = [];
    window.reviewLabels = [];
  });
  for (const sheet of ['attacks', 'movement', 'abilities']) {
    await page.evaluate(async sheet => {
      const { makeAction } = await import('/src/game/motion.js');
      const s = window.__mournwood.scene;
      for (const h of window.reviewHeroes) { h.colliders.forEach(c => c.destroy()); h.node.destroy(); h.visual.destroy(); }
      for (const label of window.reviewLabels) label.destroy();
      window.reviewHeroes = []; window.reviewLabels = [];
      const label = (x, y, text, size = 18) => window.reviewLabels.push(s.add.text(x, y, text, { fontFamily: 'sans-serif', fontSize: size, color: '#eee6d4' }).setDepth(10000));
      label(60, 35, `Animation review — ${sheet}`, 25);
      for (const [row, kind] of ['reaper', 'necro'].entries()) {
        label(40, 115 + row * 350, kind === 'reaper' ? 'REAPER' : 'NECROMANCER', 15);
        for (let i = 0; i < 6; i++) {
          const h = s.makeHero(kind, 0, 150 + i * 220, 380 + row * 350);
          h.visual.setScale(1.5); h.ring.setVisible(false);
          let caption;
          if (sheet === 'movement') {
            h.facing = i < 2 ? { x: 1, y: 0 } : i < 4 ? { x: 0, y: -1 } : { x: -1, y: 0 };
            h.node.setVelocity(h.facing.x * h.speed, h.facing.y * h.speed);
            h.animator.phase = i % 2 ? 0.66 : 0.16; h.animator.locomotion = 1;
            caption = `${i < 2 ? 'Right' : i < 4 ? 'Rear' : 'Left'} / ${i % 2 ? 'passing' : 'contact'}`;
          } else {
            const name = sheet === 'attacks' ? 'attack' : kind === 'reaper' ? i < 3 ? 'spin' : 'execution' : i < 3 ? 'summon' : 'bind';
            const progress = sheet === 'attacks' ? [0, 0.2, 0.34, 0.44, 0.65, 0.95][i] : [0.2, 0.45, 0.7][i % 3];
            h.action = makeAction(kind, name, h.facing, h.attackCooldown);
            h.action.elapsed = h.action.duration * progress;
            caption = `${name} / ${Math.round(progress * 100)}%`;
          }
          s.animateHero(h, 0);
          window.reviewHeroes.push(h);
          label(80 + i * 220, 425 + row * 350, caption, 15);
        }
      }
    }, sheet);
    await page.screenshot({ path: `test-results/animation-${sheet}.png` });
  }
  assert.deepEqual(errors, [], 'No animation runtime or resource errors');
  console.log(`${checks.length} animation integration checks passed; three pose sheets captured.`);
} finally {
  await browser.close();
}
