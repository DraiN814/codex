import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
});
const errors = [], network = [];
async function newOfflinePage() {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, offline: true });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  return page;
}
let page = await newOfflinePage();

try {
  const download = resolve('releases/Tiholesye.html');
  let openedFromDisk = process.env.STANDALONE_INLINE !== '1';
  if (openedFromDisk) try {
    await page.goto(pathToFileURL(download).href);
  } catch (error) {
    if (!error.message.includes('ERR_BLOCKED_BY_ADMINISTRATOR')) throw error;
    // Managed Chromium can prohibit file:// navigation. Validate the exact
    // download bytes in an offline document without changing browser policy.
    openedFromDisk = false;
    console.log('NOTE Managed browser prohibits file:// navigation; validating the packaged HTML in an offline document.');
    await page.close();
    page = await newOfflinePage();
  }
  if (!openedFromDisk) await page.setContent(await readFile(download, 'utf8'), { waitUntil: 'load' });
  await page.waitForFunction(() => !document.querySelector('#start-button').disabled, {}, { timeout: 20000 });
  assert.equal(await page.locator('canvas').count(), 1);
  console.log(openedFromDisk ? 'PASS Downloaded HTML opens from disk while the browser is offline' : 'PASS Exact downloaded HTML renders in an offline browser document');

  await page.locator('#art-button').click();
  assert.ok(await page.locator('.art-sheet').evaluate(img => img.complete && img.naturalWidth > 1000));
  await page.locator('[data-close]').click();
  console.log('PASS Concept artwork is embedded and available offline');

  await page.locator('[data-hero="necro"]').click();
  await page.locator('#start-button').click();
  await page.waitForFunction(() => document.querySelector('#run-time').textContent !== '00:00', {}, { timeout: 15000 });
  assert.ok(await page.locator('#hud').isVisible());
  await page.keyboard.press('q');
  await page.waitForFunction(() => /\d/.test(document.querySelector('[data-action="skill1"] .cooldown-label').textContent));
  await page.keyboard.down('d');
  await page.waitForTimeout(400);
  await page.keyboard.up('d');
  await mkdir('test-results', { recursive: true });
  await page.screenshot({ path: 'test-results/standalone-offline.png' });
  console.log('PASS Offline gameplay runs and the summon ability activates');

  await page.locator('#portal-button').click();
  await page.locator('#home-button').waitFor({ timeout: 20000 });
  await page.locator('#home-button').click();
  assert.ok(await page.locator('#expedition').isVisible());
  console.log('PASS Offline portal cast returns to the menu');

  await page.locator('[data-mode="coop"]').click();
  await page.locator('#start-button').click();
  assert.equal(await page.locator('.player-panel').count(), 2);
  await page.locator('#portal-button').click();
  await page.locator('[data-confirm-portal="0"]').click();
  assert.ok(await page.locator('[data-confirm-portal="1"]').isVisible());
  await page.locator('[data-confirm-portal="1"]').click();
  await page.locator('#home-button').waitFor({ timeout: 20000 });
  console.log('PASS Co-op and separate portal confirmations work offline');

  assert.deepEqual(network, [], 'The downloaded game must not contact any server');
  assert.deepEqual(errors, [], 'The downloaded game must have no runtime errors');
  console.log('PASS Zero network requests and zero runtime errors');
} finally {
  await browser.close();
}
