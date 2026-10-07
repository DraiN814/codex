import test from 'node:test';
import assert from 'node:assert/strict';
import { portalStep, keepPartyVisible, normalized, availableEnemyTypes, perkOffer, PERKS } from '../src/game/rules.js';

test('portal completes at three seconds, and damage cancels accumulated progress', () => {
  const initial = { active: true, elapsed: 0 };
  let portal = portalStep(initial, 2.9, false);
  assert.equal(portal.complete, false);
  assert.equal(portal.active, true);
  const interrupted = portalStep(portal, 0.1, true);
  assert.deepEqual(interrupted, { active: false, elapsed: 0, complete: false });
  assert.equal(portalStep(interrupted, 10, false).complete, false);
  portal = portalStep(portal, 0.11, false);
  assert.equal(portal.complete, true);
  assert.equal(portal.elapsed, 3);
});

test('co-op tether preserves midpoint and fits both axes, including portrait screens', () => {
  for (const [width, height] of [[1200, 800], [390, 700], [800, 390]]) {
    const positions = keepPartyVisible({ x: 0, y: 0 }, { x: 1700, y: 1700 }, width, height);
    assert.equal((positions[0].x + positions[1].x) / 2, 850);
    assert.equal((positions[0].y + positions[1].y) / 2, 850);
    assert.ok(Math.abs(positions[1].x - positions[0].x) <= Math.max(130, width - 220) + 0.001);
    assert.ok(Math.abs(positions[1].y - positions[0].y) <= Math.max(130, height - 220) + 0.001);
  }
});

test('diagonal movement has the same speed as cardinal movement', () => {
  const movement = normalized(1, 1);
  assert.ok(Math.abs(Math.hypot(movement.x, movement.y) - 1) < 0.000001);
  assert.deepEqual(normalized(0, 0), { x: 0, y: 0 });
});

test('enemy progression respects the introductory forest pacing', () => {
  assert.deepEqual(availableEnemyTypes(89), ['wolf']);
  assert.deepEqual(availableEnemyTypes(90), ['wolf', 'ent']);
  assert.deepEqual(availableEnemyTypes(215), ['wolf', 'ent', 'ogre']);
});

test('perk offers have no duplicates, exclude capped perks, and handle exhaustion', () => {
  const hero = { perks: { damage: 5, speed: 3 } };
  const offer = perkOffer(hero);
  assert.equal(offer.length, 3);
  assert.equal(new Set(offer.map(p => p.id)).size, 3);
  assert.ok(offer.every(p => p.id !== 'damage' && p.id !== 'speed'));
  assert.deepEqual(perkOffer({ perks: Object.fromEntries(PERKS.map(p => [p.id, p.max])) }), []);
});
