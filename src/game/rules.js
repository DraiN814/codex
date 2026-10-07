export const PORTAL_SECONDS = 3;
export const WORLD = { width: 3200, height: 2400 };
export const HEROES = {
  reaper: { name: 'Жнец', hp: 125, speed: 175, damage: 26, attackCooldown: 0.52, range: 91, color: 0xd16b79, dashCooldown: 3.2 },
  necro: { name: 'Некромантка', hp: 95, speed: 169, damage: 22, attackCooldown: 0.65, range: 370, color: 0xc7a7f4, dashCooldown: 3.5 },
};

export const DEFAULT_BINDINGS = [
  { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyF', dash: 'Space', skill1: 'KeyQ', skill2: 'KeyE' },
  { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', attack: 'KeyK', dash: 'KeyL', skill1: 'KeyO', skill2: 'KeyP' },
];

export function normalized(x, y) {
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : { x: 0, y: 0 };
}

export function portalStep(portal, dt, interrupted) {
  if (!portal.active) return { ...portal, complete: false };
  if (interrupted) return { active: false, elapsed: 0, complete: false };
  const elapsed = Math.min(PORTAL_SECONDS, portal.elapsed + dt);
  return { active: elapsed < PORTAL_SECONDS, elapsed, complete: elapsed >= PORTAL_SECONDS };
}

export function keepPartyVisible(a, b, width, height, padding = 110) {
  const maxX = Math.max(130, width - padding * 2);
  const maxY = Math.max(130, height - padding * 2);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const scale = Math.max(Math.abs(dx) / maxX, Math.abs(dy) / maxY, 1);
  const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return [
    { x: center.x - dx / scale / 2, y: center.y - dy / scale / 2 },
    { x: center.x + dx / scale / 2, y: center.y + dy / scale / 2 },
  ];
}

export function xpNeeded(level) {
  return 28 + (level - 1) * 11;
}

export function availableEnemyTypes(seconds) {
  return seconds >= 215 ? ['wolf', 'ent', 'ogre'] : seconds >= 90 ? ['wolf', 'ent'] : ['wolf'];
}

export const PERKS = [
  { id: 'damage', name: 'Разящая сила', text: '+8% к урону', icon: 'swords', max: 5, apply: h => { h.damage *= 1.08; } },
  { id: 'speed', name: 'Лёгкий шаг', text: '+6% к скорости', icon: 'footprints', max: 3, apply: h => { h.speed *= 1.06; } },
  { id: 'health', name: 'Жизненная сила', text: '+15% к запасу здоровья', icon: 'heart', max: 4, apply: h => { const bonus = h.maxHp * 0.15; h.maxHp += bonus; h.hp = Math.min(h.maxHp, h.hp + bonus); } },
  { id: 'haste', name: 'Быстрые руки', text: '+7% к скорости атаки', icon: 'zap', max: 5, apply: h => { h.attackCooldown /= 1.07; } },
  { id: 'range', name: 'Длинная тень', text: '+10% к дальности атаки', icon: 'move-up-right', max: 3, apply: h => { h.range *= 1.1; } },
  { id: 'dash', name: 'Второе дыхание', text: 'Рывок восстанавливается на 10% быстрее', icon: 'wind', max: 5, apply: h => { h.dashCooldown *= 0.9; } },
];

export function perkOffer(hero, random = Math.random) {
  return PERKS.filter(p => (hero.perks[p.id] || 0) < p.max)
    .map(p => ({ perk: p, order: random() })).sort((a, b) => a.order - b.order).slice(0, 3).map(p => p.perk);
}

export function formatTime(seconds) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
}
