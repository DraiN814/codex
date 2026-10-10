const TAU = Math.PI * 2;
export const STRIDE = 78;
export const PART_NAMES = [
  'headFront', 'headBack', 'torsoFront', 'torsoBack',
  'pelvis', 'upperArmL', 'upperArmR', 'forearmL',
  'forearmR', 'thighL', 'thighR', 'bootL',
  'bootR', 'cloth', 'tail', 'weapon',
];

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
export const damp = (a, b, rate, dt) => mix(a, b, 1 - Math.exp(-rate * dt));
export const point = (x, y) => ({ x, y });
export const add = (a, b) => point(a.x + b.x, a.y + b.y);
export const rotate = (v, angle) => point(v.x * Math.cos(angle) - v.y * Math.sin(angle), v.x * Math.sin(angle) + v.y * Math.cos(angle));
const blendPoint = (a, b, t) => point(mix(a.x, b.x, t), mix(a.y, b.y, t));

// Two-bone IK shares the same elbow/knee coordinate between both segments.
// Clamping the endpoint prevents stretching and disconnected hands or feet.
export function solveLimb(start, target, upper, lower, bend = -1) {
  const dx = target.x - start.x, dy = target.y - start.y;
  const raw = Math.hypot(dx, dy);
  const length = clamp(raw, Math.abs(upper - lower) + 0.01, upper + lower - 0.01);
  const angle = raw > 0.001 ? Math.atan2(dy, dx) : Math.PI / 2;
  const offset = Math.acos(clamp((upper * upper + length * length - lower * lower) / (2 * upper * length), -1, 1));
  return {
    joint: point(start.x + Math.cos(angle + offset * bend) * upper, start.y + Math.sin(angle + offset * bend) * upper),
    end: point(start.x + Math.cos(angle) * length, start.y + Math.sin(angle) * length),
  };
}

// During stance the local foot moves back by exactly the distance the root
// moves forward. The other half of the gait lifts and returns the foot.
export function footCycle(phase) {
  const p = ((phase % 1) + 1) % 1;
  const stance = 0.55, span = STRIDE * stance;
  if (p < stance) return { forward: span / 2 - p * STRIDE, lift: 0, planted: true };
  const swing = (p - stance) / (1 - stance);
  return { forward: mix(-span / 2, span / 2, smooth(swing)), lift: Math.sin(swing * Math.PI) * 10, planted: false };
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

function track(t, keys) {
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i];
      return mix(a[1], b[1], smooth((t - a[0]) / (b[0] - a[0])));
    }
  }
  return keys.at(-1)[1];
}

export function samplePose(state) {
  const { kind, phase, locomotion, direction, facing, action, breath, dash, down, recoil } = state;
  const side = state.side;
  const move = point(direction.x * side, direction.y);
  const aim = point(facing.x * side, facing.y);
  const t = action ? clamp(action.elapsed / action.duration, 0, 1) : 0;
  const attackWeight = action ? Math.min(smooth(t / 0.12), 1 - smooth((t - 0.78) / 0.22)) : 0;
  const steps = [footCycle(phase), footCycle(phase + 0.5)];
  const compression = (1 - Math.cos(phase * TAU * 2)) * locomotion;
  const hip = point(-move.x * 1.5 * locomotion, -50 + compression + 3 * locomotion + Math.abs(move.y) * 6 * locomotion + down * 27);
  const tilt = move.x * 0.065 * locomotion - recoil * 0.12;
  let torsoAngle = tilt + Math.sin(breath) * 0.007;
  let shoulder = add(hip, rotate(point(0, -25), torsoAngle));
  let weaponAngle = -0.16 + Math.sin(breath * 0.8) * 0.018;
  let grip = point(22, -50 + compression);
  let support = point(-14 + Math.sin(phase * TAU) * 8 * locomotion, shoulder.y + 32 + Math.cos(phase * TAU) * 3 * locomotion);
  const neutralSupport = { ...support };
  let charge = 0, trail = 0, lunge = 0;

  if (action && kind === 'reaper') {
    const reverse = action.variant % 2 ? -1 : 1;
    const sweep = action.name === 'spin'
      ? track(t, [[0, -0.16], [0.22, -1.7], [0.7, 4.7], [1, Math.PI * 2 - 0.16]])
      : action.name === 'execution'
        ? track(t, [[0, -0.16], [0.3, -0.7], [0.45, 1.55], [0.65, 1.85], [1, -0.16]])
        : reverse < 0
          ? track(t, [[0, -0.16], [0.17, 1.95], [0.25, 2.12], [0.46, 0.25], [0.62, 0.1], [1, -0.16]])
          : track(t, [[0, -0.16], [0.23, -1.18], [0.44, 1.58], [0.64, 1.75], [1, -0.16]]);
    const forward = track(t, [[0, 0], [0.23, -3], [0.4, 7], [0.62, 5], [1, 0]]);
    torsoAngle += track(t, [[0, 0], [0.23, -0.18], [0.43, 0.18], [0.65, 0.1], [1, 0]]) * reverse;
    lunge = forward;
    hip.x += aim.x * forward; hip.y += aim.y * forward * 0.4;
    shoulder = add(hip, rotate(point(0, -25), torsoAngle));
    const directionAngle = Math.atan2(aim.y * 0.65, Math.max(0.08, aim.x));
    weaponAngle = sweep + directionAngle * attackWeight;
    grip = blendPoint(grip, point(shoulder.x + 19 + Math.sin(sweep) * 6, shoulder.y + 21 + Math.sin(sweep) * 5), attackWeight);
    support = blendPoint(neutralSupport, add(grip, rotate(point(0, 12), weaponAngle)), attackWeight);
    trail = t > 0.23 && t < (action.name === 'spin' ? 0.74 : 0.55) ? Math.sin(clamp((t - 0.23) / 0.32, 0, 1) * Math.PI) : 0;
  } else if (action) {
    const reach = track(t, [[0, 0], [0.25, -0.25], [0.38, 1], [0.57, 0.95], [1, 0]]);
    const ritual = action.name !== 'attack';
    torsoAngle += reach * 0.06;
    shoulder = add(hip, rotate(point(0, -25), torsoAngle));
    weaponAngle = track(t, [[0, -0.16], [0.25, -0.42], [0.45, 0.12], [0.7, 0.06], [1, -0.16]]);
    grip = blendPoint(grip, point(shoulder.x + 23, shoulder.y + 24 - (ritual ? Math.sin(t * Math.PI) * 9 : 0)), attackWeight);
    support = blendPoint(support, point(shoulder.x + aim.x * 26, shoulder.y + (ritual ? -18 : 1) + aim.y * 16), Math.abs(reach));
    charge = t < 0.4 ? smooth(t / 0.4) : Math.max(0, 1 - (t - 0.4) / 0.2);
  }

  if (dash > 0) {
    hip.y += 9 * dash; hip.x -= 5 * dash;
    torsoAngle += 0.33 * dash;
    shoulder = add(hip, rotate(point(0, -25), torsoAngle));
    grip = blendPoint(grip, point(shoulder.x + 18, shoulder.y + 14), dash);
    support = blendPoint(support, point(shoulder.x - 8, shoulder.y + 9), dash);
    weaponAngle = mix(weaponAngle, -0.6, dash);
  }
  if (down > 0) {
    torsoAngle += 0.45 * down;
    shoulder = add(hip, rotate(point(0, -24), torsoAngle));
    grip = blendPoint(grip, point(25, -10), down);
    support = blendPoint(support, point(-14, -5), down);
    weaponAngle = mix(weaponAngle, 1.1, down);
  }

  const neck = add(shoulder, rotate(point(0, 0), torsoAngle));
  const shoulders = [add(shoulder, rotate(point(-10, 2), torsoAngle)), add(shoulder, rotate(point(10, 2), torsoAngle))];
  const hips = [add(hip, point(-7, 0)), add(hip, point(7, 0))];
  const feet = steps.map((step, i) => {
    const stance = point(i ? 9 : -9, 0);
    const stride = point(stance.x + move.x * step.forward, move.y * step.forward - step.lift);
    let foot = blendPoint(stance, stride, locomotion);
    foot = blendPoint(foot, point((i ? 6 : -8) - move.x * 18, -move.y * 12 - (i ? 7 : 13)), dash);
    foot = blendPoint(foot, point(i ? 16 : -13, i ? -1 : -4), down);
    if (kind === 'reaper' && action) foot.x += (i ? 1 : -0.5) * lunge * 0.6;
    return foot;
  });
  // Keep the knee bend on the same side when starting/stopping. Switching the
  // IK solution at a speed threshold makes a knee visibly pop inside out.
  const legs = feet.map((foot, i) => solveLimb(hips[i], foot, 24, 27, -1));
  const leftArm = solveLimb(shoulders[0], support, 16, 18, 1);
  const rightArm = solveLimb(shoulders[1], grip, 16, 18, 1);
  // The weapon is attached to the solved hand, never to an unrelated offset.
  grip = rightArm.end;
  if (action && kind === 'reaper') {
    support = blendPoint(neutralSupport, add(grip, rotate(point(0, 12), weaponAngle)), attackWeight);
    const solved = solveLimb(shoulders[0], support, 16, 18, 1);
    leftArm.joint = solved.joint; leftArm.end = solved.end;
  }
  return {
    hip, shoulder, neck, shoulders, hips, feet: legs.map(l => l.end), knees: legs.map(l => l.joint),
    elbows: [leftArm.joint, rightArm.joint], hands: [leftArm.end, rightArm.end],
    torsoAngle, headAngle: -torsoAngle * 0.35 + recoil * 0.12,
    weapon: { position: grip, angle: weaponAngle, trail },
    clothAngle: -torsoAngle * 0.4 - move.x * locomotion * 0.12,
    tailAngle: -torsoAngle * 0.3 + Math.sin(phase * TAU - 0.8) * 0.07 * locomotion,
    charge, shadowWidth: 44 - dash * 7, back: facing.y < -0.35,
  };
}
