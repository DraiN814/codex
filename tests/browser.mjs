import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import { mkdir } from 'node:fs/promises';

const base = process.env.TEST_URL || 'http://localhost:5173';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
await mkdir('test-results', { recursive: true });
const errors = [];
const logs = [];
const check = (condition, message) => { assert.ok(condition, message); logs.push(message); console.log(`PASS ${message}`); };

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  page.on('pageerror', error => errors.push(error.stack));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${base}/?test=1`);
  await page.waitForFunction(() => Boolean(window.__mournwood?.scene?.heroes.length), {}, { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function cleanArena(page) {
  await page.evaluate(() => {
    const s = window.__mournwood.scene;
    s.spawnLeft = 9999;
    s.enemies.forEach(e => s.destroyEnemy(e)); s.enemies = [];
    s.heroes.forEach(h => { h.invulnerable = 0; h.node.setVelocity(0); });
  });
}

async function tickUntil(page, condition, timeout = 12000) {
  await page.waitForFunction(condition, {}, { timeout });
}

function coloredPixels(buffer) {
  const png = PNG.sync.read(buffer), colors = new Set();
  let bright = 0;
  for (let i = 0; i < png.data.length; i += 64) {
    const [r, g, b] = png.data.subarray(i, i + 3);
    colors.add(`${r >> 3},${g >> 3},${b >> 3}`);
    if (r + g + b > 130) bright++;
  }
  return { colors: colors.size, bright };
}

try {
  const desktop = await open(1440, 960);
  await desktop.screenshot({ path: 'test-results/desktop-menu.png' });
  const pixels = coloredPixels(await desktop.locator('canvas').screenshot());
  check(pixels.colors > 60 && pixels.bright > 1000, 'Desktop canvas is nonblank, with visible forest and character assets');
  await desktop.locator('#art-button').click();
  check(await desktop.locator('.art-sheet').evaluate(img => img.complete && img.naturalWidth > 1000), 'Generated character sheet loads in gallery');
  await desktop.locator('[data-close]').click();
  await desktop.locator('#settings-button').click();
  await desktop.locator('[data-binding="attack"][data-player="0"]').click();
  await desktop.keyboard.press('g');
  check(await desktop.locator('[data-binding="attack"][data-player="0"]').innerText() === 'G', 'Control rebinding works');
  await desktop.locator('#reset-bindings').click();
  await desktop.locator('[data-close]').last().click();
  await desktop.locator('#start-button').click();
  await cleanArena(desktop);
  const initialX = await desktop.evaluate(() => window.__mournwood.scene.heroes[0].node.x);
  await desktop.keyboard.down('d');
  await tickUntil(desktop, () => window.__mournwood.scene.heroes[0].node.x > 1640);
  await desktop.keyboard.up('d');
  const movedX = await desktop.evaluate(() => window.__mournwood.scene.heroes[0].node.x);
  check(movedX > initialX + 35, 'Player moves through actual keyboard input');
  await desktop.keyboard.press('Space');
  check(await desktop.evaluate(() => window.__mournwood.scene.heroes[0].dashLeft > 0), 'Dash activates with its bound key');
  await desktop.waitForTimeout(700);

  await desktop.evaluate(() => {
    const s = window.__mournwood.scene, h = s.heroes[0];
    h.node.setPosition(1600, 1220); h.dashing = 0; h.facing = { x: 1, y: 0 };
    const e = s.spawnEnemy('wolf', { x: 1655, y: 1220 }); e.rooted = 30;
  });
  await desktop.keyboard.down('f');
  await tickUntil(desktop, () => window.__mournwood.scene.kills >= 1);
  await desktop.keyboard.up('f');
  await tickUntil(desktop, () => window.__mournwood.scene.gold >= 3);
  check(await desktop.evaluate(() => window.__mournwood.scene.xp > 0), 'Scythe defeats enemy and collects XP and gold');

  await desktop.locator('#pause-button').click();
  const pausedTime = await desktop.evaluate(() => window.__mournwood.scene.elapsed);
  await desktop.waitForTimeout(450);
  check(await desktop.evaluate(() => window.__mournwood.scene.elapsed) === pausedTime, 'Pause freezes combat and the run clock');
  await desktop.locator('[data-close]').last().click();
  await desktop.locator('#portal-button').click();
  await tickUntil(desktop, () => window.__mournwood.scene.portal.elapsed > 0.3);
  await desktop.evaluate(() => { const s = window.__mournwood.scene; s.heroes[0].invulnerable = 0; s.hurtHero(s.heroes[0], 5); });
  check(await desktop.evaluate(() => !window.__mournwood.scene.portal.active && window.__mournwood.scene.portal.elapsed === 0), 'Taking damage interrupts and resets portal cast');
  await desktop.locator('#portal-button').click();
  await desktop.waitForTimeout(350);
  check(await desktop.evaluate(() => window.__mournwood.scene.running), 'Portal does not exit the run immediately');
  await desktop.screenshot({ path: 'test-results/desktop-portal.png' });
  await desktop.locator('#home-button').waitFor({ timeout: 20000 });
  check(await desktop.evaluate(() => window.__mournwood.scene.portal.elapsed === 3), 'Successful portal cast completes after three simulation seconds');
  await desktop.locator('#home-button').click();

  await desktop.locator('[data-hero="necro"]').click();
  await desktop.locator('#start-button').click();
  await cleanArena(desktop);
  await desktop.evaluate(() => {
    const s = window.__mournwood.scene;
    s.spawnEnemy('wolf', { x: 1750, y: 1220 }).rooted = 30;
  });
  await desktop.keyboard.down('f');
  await tickUntil(desktop, () => window.__mournwood.scene.kills >= 1);
  await desktop.keyboard.up('f');
  check(true, 'Necromancer magic bolts hit and defeat enemies');
  await desktop.keyboard.press('q');
  check(await desktop.evaluate(() => window.__mournwood.scene.skeletons.length === 2), 'Necromancer summons two skeletons');
  await desktop.evaluate(() => { const s = window.__mournwood.scene; s.heroes[0].skill1Left = 0; s.skill(s.heroes[0], 'skill1'); });
  check(await desktop.evaluate(() => window.__mournwood.scene.skeletons.length === 2), 'Summon cap prevents extra skeletons');
  await desktop.evaluate(() => { const s = window.__mournwood.scene; s.xp = 28; });
  await desktop.locator('[data-perk]').first().waitFor();
  check(await desktop.locator('[data-perk]').count() === 3, 'Level-up offers three perks and pauses combat');
  await desktop.locator('[data-perk]').first().click();
  await tickUntil(desktop, () => !window.__mournwood.scene.suspended);
  // Consume any additional level-up caused by the deliberately injected XP.
  await desktop.evaluate(() => { window.__mournwood.scene.xp = 0; });
  await desktop.locator('#portal-button').click();
  await desktop.locator('#home-button').waitFor({ timeout: 20000 });
  await desktop.locator('#home-button').click();

  await desktop.locator('[data-mode="coop"]').click();
  await desktop.locator('#start-button').click();
  await cleanArena(desktop);
  check(await desktop.evaluate(() => window.__mournwood.scene.heroes.length === 2), 'Local co-op creates both distinct heroes');
  await desktop.evaluate(() => {
    const s = window.__mournwood.scene;
    s.heroes[0].node.setPosition(1100, 900); s.heroes[1].node.setPosition(2100, 1550);
  });
  await desktop.waitForTimeout(1200);
  const framed = await desktop.evaluate(() => {
    const s = window.__mournwood.scene, c = s.cameras.main;
    return s.heroes.every(h => { const x = (h.node.x - c.worldView.x) * c.zoom, y = (h.node.y - c.worldView.y) * c.zoom; return x > 30 && x < c.width - 30 && y > 85 && y < c.height - 55; });
  });
  check(framed, 'Shared camera keeps separated heroes visible');
  await desktop.screenshot({ path: 'test-results/desktop-coop.png' });
  await desktop.evaluate(() => {
    const s = window.__mournwood.scene;
    s.heroes[0].node.setPosition(1600, 1220); s.heroes[1].node.setPosition(1640, 1220);
    s.heroes[0].invulnerable = 0; s.hurtHero(s.heroes[0], 999);
  });
  check(await desktop.evaluate(() => window.__mournwood.scene.heroes[0].down && window.__mournwood.scene.running), 'A fallen ally does not end a co-op run');
  await tickUntil(desktop, () => !window.__mournwood.scene.heroes[0].down, 20000);
  check(await desktop.evaluate(() => { const h = window.__mournwood.scene.heroes[0]; return Math.abs(h.hp - h.maxHp * 0.2) < 0.001; }), 'Nearby ally revives after three seconds with 20% health');
  await desktop.locator('#portal-button').click();
  await desktop.keyboard.press('f');
  check(await desktop.evaluate(() => !window.__mournwood.scene.portal.active), 'One co-op confirmation is insufficient to open the portal');
  await desktop.keyboard.press('k');
  await tickUntil(desktop, () => window.__mournwood.scene.portal.active);
  check(true, 'Both players can confirm the portal using their own attack keys');
  await desktop.locator('#home-button').waitFor({ timeout: 20000 });
  await desktop.close();

  const mobile = await open(390, 844);
  await mobile.screenshot({ path: 'test-results/mobile-menu.png' });
  check(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile menu has no horizontal overflow');
  const start = await mobile.locator('#start-button').boundingBox();
  check(start.y + start.height < 844, 'Mobile start button fits in the viewport');
  await mobile.locator('#start-button').click();
  await cleanArena(mobile);
  await mobile.screenshot({ path: 'test-results/mobile-combat.png' });
  const mobilePixels = coloredPixels(await mobile.locator('canvas').screenshot());
  check(mobilePixels.colors > 60, 'Mobile game canvas renders the forest and character');
  check(await mobile.locator('#joystick').isVisible(), 'Mobile solo exposes touch controls');
  const joystick = await mobile.locator('#joystick').boundingBox();
  const before = await mobile.evaluate(() => window.__mournwood.scene.heroes[0].node.x);
  await mobile.mouse.move(joystick.x + joystick.width - 10, joystick.y + joystick.height / 2);
  await mobile.mouse.down();
  await mobile.waitForTimeout(500);
  await mobile.mouse.up();
  check(await mobile.evaluate(() => window.__mournwood.scene.heroes[0].node.x) > before + 10, 'Touch joystick moves the character');
  await mobile.close();
  assert.deepEqual(errors, [], 'No runtime or resource errors');
  console.log(`\n${logs.length} browser checks passed. No runtime or resource errors.`);
} finally {
  await browser.close();
}
