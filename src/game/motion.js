// One complete left/right gait, measured in world pixels travelled.
export const STRIDE = 108;
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function walkFrame(distance) {
  return Math.floor((((distance / STRIDE) % 1) + 1) % 1 * 8 + 1e-9) % 8;
}

// Hysteresis keeps near-vertical motion from flipping left/right every frame.
export function facingView(facing, previous = { side: 1, back: false }) {
  return {
    side: Math.abs(facing.x) > 0.2 ? Math.sign(facing.x) : previous.side,
    back: facing.y < -0.4 ? true : facing.y > -0.15 ? false : previous.back,
  };
}

export function makeAction(kind, name, direction, attackCooldown, variant = 0, data = {}) {
  const timings = {
    attack: { duration: attackCooldown, hit: kind === 'reaper' ? variant % 2 ? 0.36 : 0.42 : 0.38 },
    spin: { duration: 0.76, hit: 0.5 },
    execution: { duration: 0.65, hit: 0.45 },
    summon: { duration: 0.85, hit: 0.49 },
    bind: { duration: 0.72, hit: 0.44 },
  };
  const timing = timings[name];
  return { name, duration: timing.duration, impact: timing.duration * timing.hit, elapsed: 0, fired: false, direction: { ...direction }, variant, data };
}

export function advanceAction(action, dt) {
  if (!action) return { impact: false, complete: false };
  action.elapsed = Math.min(action.duration, action.elapsed + Math.max(0, dt));
  const impact = !action.fired && action.elapsed >= action.impact;
  if (impact) action.fired = true;
  return { impact, complete: action.elapsed >= action.duration };
}

// The release painting is frame 4. Stretch anticipation and recovery separately
// so attack-speed perks and different abilities still release on the right pose.
export function actionFrame(action) {
  if (action.elapsed < action.impact) {
    return Math.min(3, Math.floor(clamp(action.elapsed / action.impact, 0, 1) * 4));
  }
  const recovery = (action.elapsed - action.impact) / (action.duration - action.impact);
  return Math.min(7, 4 + Math.floor(clamp(recovery, 0, 1) * 4));
}
