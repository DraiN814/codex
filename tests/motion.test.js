import test from 'node:test';
import assert from 'node:assert/strict';
import { STRIDE, walkFrame, facingView, makeAction, advanceAction, actionFrame } from '../src/game/motion.js';

test('walk frames depend on distance, loop cleanly, and are independent of update frequency', () => {
  assert.deepEqual(Array.from({ length: 8 }, (_, i) => walkFrame(i * STRIDE / 8)), [0,1,2,3,4,5,6,7]);
  assert.equal(walkFrame(STRIDE), 0);
  const travel = hz => {
    let distance = 0;
    for (let i = 0; i < hz * 2; i++) distance += 169 / hz;
    return walkFrame(distance);
  };
  assert.equal(travel(30), travel(60));
  assert.equal(travel(60), travel(144));
});

test('near-vertical direction retains its side and rear/front changes have hysteresis', () => {
  let view = facingView({ x: -1, y: 0 });
  for (const x of [-0.1, 0.1, -0.05, 0.05]) {
    view = facingView({ x, y: -1 }, view);
    assert.deepEqual(view, { side: -1, back: true });
  }
  view = facingView({ x: 0.8, y: -0.3 }, view);
  assert.deepEqual(view, { side: 1, back: true });
  view = facingView({ x: 1, y: 0 }, view);
  assert.equal(view.back, false);
});

test('all actions show release at impact for every attack speed, and emit damage exactly once', () => {
  for (const [kind, names] of [['reaper', ['attack', 'spin', 'execution']], ['necro', ['attack', 'summon', 'bind']]]) {
    for (const name of names) for (const cooldown of [0.25, 0.52, 0.9]) for (const variant of [0,1]) {
      const action = makeAction(kind, name, { x: 1, y: 0 }, cooldown, variant);
      assert.equal(actionFrame(action), 0);
      assert.equal(advanceAction(action, action.impact - 0.001).impact, false);
      assert.equal(actionFrame(action), 3);
      assert.equal(advanceAction(action, 0.001).impact, true);
      assert.equal(actionFrame(action), 4);
      const end = advanceAction(action, 2);
      assert.deepEqual(end, { impact: false, complete: true });
      assert.equal(actionFrame(action), 7);
      assert.equal(advanceAction(action, 2).impact, false);
    }
  }
});

test('a long frame cannot drop or duplicate a damage event', () => {
  const action = makeAction('reaper', 'attack', { x: -1, y: 0 }, 0.52);
  assert.deepEqual(advanceAction(action, 4), { impact: true, complete: true });
  assert.deepEqual(advanceAction(action, 4), { impact: false, complete: true });
});
