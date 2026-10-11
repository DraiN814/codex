import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const fps = 24;
const output = 'test-results/motion';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
try {
  await page.goto(`${process.env.TEST_URL || 'http://localhost:5173'}/?test=1`);
  await page.waitForFunction(() => window.__mournwood?.scene?.heroes.length);
  await page.locator('[data-mode="coop"]').click();
  await page.locator('#start-button').click();
  await page.evaluate(async () => {
    const s = window.__mournwood.scene;
    s.setPaused(true);
    s.children.list.forEach(child => child.setVisible(false));
    document.querySelectorAll('body *').forEach(el => { if (el.tagName !== 'CANVAS' && !el.querySelector('canvas')) el.style.visibility = 'hidden'; });
    s.cameras.main.setZoom(1).setScroll(0, 0).setBackgroundColor('#23342d');
    window.motion = { heroes: [s.makeHero('reaper', 0, 350, 575), s.makeHero('necro', 1, 980, 575)], makeAction: (await import('/src/game/motion.js')).makeAction };
    for (const h of window.motion.heroes) { h.visual.setScale(2.6); h.ring.setVisible(false); }
    s.add.text(55, 36, 'ТИХОЛЕСЬЕ', { fontFamily: 'serif', fontSize: 34, color: '#ece6d5' });
    window.motion.title = s.add.text(55, 90, '', { fontFamily: 'sans-serif', fontSize: 19, color: '#b3baa9' });
    s.add.text(290, 627, 'ЖНЕЦ', { fontFamily: 'serif', fontSize: 23, color: '#e7c0b7' });
    s.add.text(885, 627, 'НЕКРОМАНТ', { fontFamily: 'serif', fontSize: 23, color: '#d0bfe7' });
    window.motion.ground = s.add.graphics().setDepth(-1);
  });
  const phases = [
    ['Спокойная стойка', 'idle', 1],
    ['Движение — вид спереди', 'walk', 2],
    ['Движение — вид сзади', 'walk-back', 2],
    ['Удар косой и заклинание', 'attack', 2],
    ['Атака — вид сзади', 'attack-back', 2],
    ['Рывок', 'dash', 0.5],
    ['Поверженный герой', 'down', 1],
  ];
  let index = 0;
  for (const [label, phase, seconds] of phases) {
    console.log(`Capturing ${phase}`);
    for (let i = 0; i < seconds * fps; i++) {
      await page.evaluate(({ label, phase, i, fps }) => {
        const s = window.__mournwood.scene, { heroes, title, makeAction, ground } = window.motion;
        title.setText(label);
        ground.clear().lineStyle(1, 0x90a08c, 0.15).lineBetween(80, 577, 1210, 577);
        const walking = phase.startsWith('walk');
        for (let x = 80; x < 1240; x += 45) {
          const offset = walking ? (i / fps * 175 * 2.6) % 45 : 0;
          ground.lineBetween(x - offset, 577, x - offset - 4, 585);
        }
        for (const h of heroes) {
          h.down = phase === 'down'; h.dashing = phase === 'dash' ? 0.1 : 0;
          h.dashDirection = { x: 1, y: 0 };
          h.facing = { x: 1, y: phase.endsWith('back') ? -1 : 0 };
          h.action = null;
          h.node.setVelocity(walking ? h.speed : 0, 0);
          if (i === 0) h.animator.distance = 0;
          h.animator.lastPosition = { x: h.node.x - (walking ? h.speed / fps : 0), y: h.node.y };
          if (phase.startsWith('attack')) {
            h.action = makeAction(h.kind, 'attack', h.facing, h.attackCooldown);
            h.action.elapsed = (i / fps) % (h.attackCooldown + 0.3);
            if (h.action.elapsed >= h.action.duration) h.action = null;
          }
          s.animateHero(h, 1 / fps);
        }
      }, { label, phase, i, fps });
      await page.screenshot({ path: `${output}/${String(index++).padStart(4, '0')}.png` });
    }
  }
  console.log(`Captured ${index} frames at ${fps} fps in ${output}`);
} finally { await browser.close(); }
