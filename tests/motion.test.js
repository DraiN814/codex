import test from 'node:test';
import assert from 'node:assert/strict';
import { STRIDE, footCycle, solveLimb, makeAction, advanceAction, samplePose } from '../src/game/motion.js';

const close = (a, b) => assert.ok(Math.abs(a - b) < 0.00001, `${a} ≈ ${b}`);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const base = { kind: 'reaper', phase: 0, locomotion: 0, direction: { x: 1, y: 0 }, facing: { x: 1, y: 0 }, side: 1, action: null, breath: 0, dash: 0, down: 0, recoil: 0 };

test('a planted foot cancels root travel during the stance phase', () => {
  const speed = 150, dt = 0.08, phase = 0.1;
  const before = footCycle(phase), after = footCycle(phase + speed * dt / STRIDE);
  assert.ok(before.planted && after.planted);
  close(after.forward + speed * dt, before.forward);
  close(after.lift, 0);
});

test('the gait joins continuously at lift-off, landing, and cycle wrapping', () => {
  for (const phase of [0, 0.55, 1, 8]) {
    const a = footCycle(phase - 1e-7), b = footCycle(phase + 1e-7);
    assert.ok(Math.abs(a.forward - b.forward) < 0.001);
    assert.ok(Math.abs(a.lift - b.lift) < 0.001);
  }
});

test('IK keeps both bone lengths and clamps unreachable targets without NaNs', () => {
  for (const target of [{ x: 0, y: 0 }, { x: 8, y: 20 }, { x: -90, y: 10 }, { x: 0, y: 400 }]) {
    for (const bend of [-1, 1]) {
      const root = { x: 0, y: 0 }, limb = solveLimb(root, target, 16, 18, bend);
      close(distance(root, limb.joint), 16);
      close(distance(limb.joint, limb.end), 18);
      assert.ok(distance(root, limb.end) <= 34);
    }
  }
});

test('every attack/ability has a windup and emits impact exactly once, even across a long frame', () => {
  for (const [kind, names] of [['reaper', ['attack', 'spin', 'execution']], ['necro', ['attack', 'summon', 'bind']]]) {
    for (const name of names) {
      const action = makeAction(kind, name, { x: 1, y: 0 }, 0.55);
      assert.ok(action.impact > 0 && action.impact < action.duration);
      assert.equal(advanceAction(action, action.impact - 0.001).impact, false);
      const crossed = advanceAction(action, 2);
      assert.equal(crossed.impact, true);
      assert.equal(crossed.complete, true);
      assert.equal(advanceAction(action, 2).impact, false);
    }
  }
});

test('weapon follows the right hand throughout locomotion, dash, and every action', () => {
  for (const kind of ['reaper', 'necro']) {
    for (const name of [null, 'attack', ...(kind === 'reaper' ? ['spin', 'execution'] : ['summon', 'bind'])]) {
      for (const direction of [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: -1 }, { x: 0.707, y: 0.707 }]) {
        for (let i = 0; i <= 60; i++) {
          const action = name ? makeAction(kind, name, direction, 0.55) : null;
          if (action) action.elapsed = action.duration * i / 60;
          const pose = samplePose({ ...base, kind, action, direction, facing: direction, side: direction.x < 0 ? -1 : 1, phase: i / 60, locomotion: 1, dash: name ? 0 : i / 60 });
          close(distance(pose.hands[1], pose.weapon.position), 0);
          for (const p of [...pose.feet, ...pose.knees, ...pose.hands, ...pose.elbows]) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
        }
      }
    }
  }
});

test('knees do not snap between IK branches as movement blends in', () => {
  for (const phase of [0, 0.2, 0.5, 0.8]) {
    let previous = samplePose({ ...base, phase });
    for (let i = 1; i <= 100; i++) {
      const next = samplePose({ ...base, phase, locomotion: i / 100 });
      assert.ok(distance(previous.knees[0], next.knees[0]) < 2);
      assert.ok(distance(previous.knees[1], next.knees[1]) < 2);
      previous = next;
    }
  }
});

test('both combo swings point the blade forward when their damage event fires', () => {
  for (const variant of [0, 1]) {
    const action = makeAction('reaper', 'attack', base.facing, 0.52, variant);
    action.elapsed = action.impact;
    const pose = samplePose({ ...base, action });
    assert.ok(Math.sin(pose.weapon.angle) > 0.85, 'The damaging sweep must reach in front of the hero');
  }
});
