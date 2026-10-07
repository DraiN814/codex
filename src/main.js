import Phaser from 'phaser';
import { createIcons, MoonStar, Images, VolumeX, Volume2, SlidersHorizontal, Pause, UserRound, UsersRound, Check, Trees, Skull, ArrowRight, Clock3, Coins, DoorOpen, Swords, Wind, X, Play, RotateCcw, Bone, Hand, Zap, Heart, Footprints, MoveUpRight, Orbit, Sparkles, Crosshair } from 'lucide';
import { ForestScene } from './game/ForestScene.js';
import { DEFAULT_BINDINGS, formatTime } from './game/rules.js';
import './styles.css';

const iconSet = { MoonStar, Images, VolumeX, Volume2, SlidersHorizontal, Pause, UserRound, UsersRound, Check, Trees, Skull, ArrowRight, Clock3, Coins, DoorOpen, Swords, Wind, X, Play, RotateCcw, Bone, Hand, Zap, Heart, Footprints, MoveUpRight, Orbit, Sparkles, Crosshair };
const icons = () => createIcons({ icons: iconSet, attrs: { 'stroke-width': 1.5 } });
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const icon = name => `<i data-lucide="${name}"></i>`;
const dialog = $('#overlay');
let scene;
let mode = 'solo';
let hero = 'reaper';
let dialogKind = null;
let onClose = null;
let listening = null;
let portalConfirmed = [];
let muted = true;
let audio;
let toastTimer;
let bindings = structuredClone(DEFAULT_BINDINGS);
try {
  const saved = JSON.parse(localStorage.getItem('mournwood.bindings'));
  const codes = saved?.flatMap(b => Object.values(b));
  if (saved?.length === 2 && saved.every(b => Object.keys(DEFAULT_BINDINGS[0]).every(key => typeof b[key] === 'string' && /^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Numpad[0-9])$/.test(b[key]))) && new Set(codes).size === 16) bindings = saved;
} catch { /* Storage may be unavailable in a private browser. */ }

function toast(text) {
  $('#toast').textContent = text; $('#toast').classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2900);
}

function sound(type) {
  if (muted) return;
  audio ||= new AudioContext();
  if (audio.state === 'suspended') audio.resume();
  const frequencies = { scythe: 100, bolt: 380, dash: 160, skill: 225, hurt: 65, gold: 680 };
  const oscillator = audio.createOscillator(), gain = audio.createGain();
  oscillator.type = type === 'gold' || type === 'bolt' ? 'sine' : 'triangle';
  const now = audio.currentTime;
  oscillator.frequency.setValueAtTime(frequencies[type] || 200, now);
  oscillator.frequency.exponentialRampToValueAtTime((frequencies[type] || 200) * (type === 'gold' ? 1.5 : 0.45), now + 0.12);
  gain.gain.setValueAtTime(0.035, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + 0.16);
}

function openDialog(kind, content, closeAction = null, wide = false) {
  dialogKind = kind; onClose = closeAction;
  dialog.classList.toggle('art-dialog', wide);
  $('#dialog-content').innerHTML = content;
  if (!dialog.open) dialog.showModal();
  icons();
  $$('[data-close]').forEach(button => button.addEventListener('click', closeDialog));
}

function closeDialog() {
  const callback = onClose;
  onClose = null; listening = null; dialogKind = null; dialog.close();
  callback?.();
}

const dialogTitle = title => `<div class="dialog-top"><h2>${title}</h2><button class="icon-button" data-close aria-label="Закрыть">${icon('x')}</button></div>`;

function showPause() {
  if (!scene?.running || dialog.open) return;
  scene.setPaused(true);
  openDialog('pause', `<div class="dialog-inner">${dialogTitle('Лес подождёт')}<div class="dialog-actions"><button class="primary-button" data-close>Продолжить${icon('play')}</button><button class="secondary-button" id="pause-settings">Управление</button></div></div>`, () => scene.setPaused(false));
  $('#pause-settings').onclick = showSettings;
}

function keyLabel(code) {
  const labels = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Space: 'Пробел', ShiftLeft: 'Левый Shift', ShiftRight: 'Правый Shift', ControlLeft: 'Левый Ctrl', ControlRight: 'Правый Ctrl', AltLeft: 'Левый Alt', AltRight: 'Правый Alt' };
  return labels[code] || code.replace('Key', '').replace('Digit', '').replace('Numpad', 'Num ');
}

function showSettings() {
  const wasRunning = scene?.running;
  if (wasRunning) scene.setPaused(true);
  const actions = { up: 'Вперёд', down: 'Назад', left: 'Влево', right: 'Вправо', attack: 'Атака', dash: 'Рывок', skill1: 'Первое умение', skill2: 'Второе умение' };
  openDialog('settings', `<div class="dialog-inner">${dialogTitle('Управление')}<div class="binding-grid"><span class="binding-heading">ДЕЙСТВИЕ</span><span class="binding-heading">ИГРОК 1</span><span class="binding-heading">ИГРОК 2</span>${Object.entries(actions).map(([action, name]) => `<span class="binding-label">${name}</span>${bindings.map((b, i) => `<button class="binding-button" data-player="${i}" data-binding="${action}">${keyLabel(b[action])}</button>`).join('')}`).join('')}</div><div class="binding-message" role="status"></div><div class="dialog-actions"><button id="reset-bindings" class="secondary-button">Сбросить</button><button class="primary-button" data-close>Готово${icon('check')}</button></div></div>`, () => { if (wasRunning) scene.setPaused(false); });
  $$('.binding-button').forEach(button => button.onclick = () => {
    $$('.binding-button').forEach(b => b.classList.remove('listening'));
    listening = { player: Number(button.dataset.player), action: button.dataset.binding, button };
    button.classList.add('listening'); $('.binding-message').textContent = 'Нажмите клавишу';
  });
  $('#reset-bindings').onclick = () => { bindings = structuredClone(DEFAULT_BINDINGS); saveBindings(); showSettings(); };
}

function saveBindings() {
  try { localStorage.setItem('mournwood.bindings', JSON.stringify(bindings)); } catch { toast('Браузер не сохранил настройки'); }
  if (scene) scene.bindings = bindings;
}

function requestPortal() {
  if (!scene?.running || scene.suspended) return;
  if (scene.portal.active || scene.heroes.filter(h => !h.down).length === 1) { scene.beginPortal(); return; }
  scene.setPaused(true); portalConfirmed = [false, false];
  openDialog('portal', `<div class="dialog-inner">${dialogTitle('Вернуться в убежище?')}<p class="dialog-subtitle">Каждый герой должен подтвердить завершение экспедиции.</p><div class="dialog-actions">${scene.heroes.map(h => `<button class="secondary-button" data-confirm-portal="${h.index}">${h.name}</button>`).join('')}</div></div>`, () => scene.setPaused(false));
  $$('[data-confirm-portal]').forEach(b => b.onclick = () => confirmPortal(Number(b.dataset.confirmPortal)));
}

function confirmPortal(index) {
  portalConfirmed[index] = true;
  const button = $(`[data-confirm-portal="${index}"]`);
  if (button) { button.textContent = `${scene.heroes[index].name}: готово`; button.disabled = true; }
  if (portalConfirmed.every(Boolean)) { closeDialog(); scene.beginPortal(); }
}

function showArt() {
  const wasRunning = scene?.running;
  if (wasRunning) scene.setPaused(true);
  openDialog('art', `<div class="dialog-inner">${dialogTitle('Две стороны одной истории')}<img class="art-sheet" src="/assets/character-studies.png" alt="Концепты брата-жнеца и сестры-некромантки: подробные иллюстрации и упрощённый вид в игре" /></div>`, () => { if (wasRunning) scene.setPaused(false); }, true);
}

function buildHud(heroes) {
  $('#player-panels').innerHTML = heroes.map(h => `<div class="player-panel ${h.kind}" data-player-panel="${h.index}"><div class="player-name">${h.name}<span data-level>УРОВЕНЬ 1</span></div><div class="health-track"><i></i></div><div class="xp-track"><i></i></div><div class="player-hp"></div></div>`).join('');
  $('#ability-bars').innerHTML = heroes.map(h => {
    const skills = h.kind === 'reaper' ? [['attack', 'swords', 'Взмах косы'], ['dash', 'wind', 'Рывок'], ['skill1', 'orbit', 'Вихрь лезвий'], ['skill2', 'crosshair', 'Казнь']] : [['attack', 'sparkles', 'Сгусток души'], ['dash', 'wind', 'Теневой шаг'], ['skill1', 'bone', 'Призыв скелетов'], ['skill2', 'hand', 'Могильные руки']];
    return `<div class="ability-bar"><span>${h.index + 1}</span>${skills.map(([action, symbol, name]) => `<button class="ability-button" data-player="${h.index}" data-action="${action}" aria-label="${h.name}: ${name}" data-tooltip="${name}">${icon(symbol)}<span class="cooldown"></span><span class="cooldown-label"></span></button>`).join('')}</div>`;
  }).join('');
  $$('[data-action]').forEach(button => button.onclick = () => scene.action(Number(button.dataset.player), button.dataset.action));
  icons();
}

function renderState(state) {
  $('#run-time').textContent = formatTime(state.time);
  $('#gold').textContent = state.gold;
  $('#enemy-count').textContent = `${state.enemies} в лесу`;
  for (const h of state.heroes) {
    const panel = $(`[data-player-panel="${h.index}"]`);
    if (!panel) continue;
    panel.querySelector('.health-track i').style.width = `${h.hp / h.maxHp * 100}%`;
    panel.querySelector('.xp-track i').style.width = `${Math.min(100, state.xp / state.xpMax * 100)}%`;
    panel.querySelector('[data-level]').textContent = `УРОВЕНЬ ${state.level}`;
    panel.querySelector('.player-hp').textContent = h.down ? h.downTime <= 0 ? 'Душа потеряна' : h.revive > 0 ? `Возрождение: ${(3 - h.revive).toFixed(1)} с` : `Возрождение доступно: ${Math.ceil(h.downTime)} с` : `${Math.ceil(h.hp)} / ${Math.ceil(h.maxHp)}`;
    $$(`[data-action][data-player="${h.index}"]`).forEach(button => {
      const action = button.dataset.action;
      const left = h[`${action}Left`] || 0;
      const total = action === 'attack' ? h.attackCooldown : action === 'dash' ? h.dashCooldown : action === 'skill1' ? h.kind === 'necro' ? 13 : 8 : 11;
      button.querySelector('.cooldown').style.height = `${left / total * 100}%`;
      button.querySelector('.cooldown-label').textContent = left > 0.9 ? Math.ceil(left) : '';
      button.disabled = h.down;
    });
  }
  $('#cast-indicator').classList.toggle('hidden', !state.portal.active);
  $('#cast-progress').style.width = `${state.portal.elapsed / 3 * 100}%`;
  $('#portal-time').textContent = state.portal.active ? `${(3 - state.portal.elapsed).toFixed(1)} с` : '3 с';
}

function showResults(result) {
  $('#cast-indicator').classList.add('hidden');
  $('#pause-button').classList.add('hidden');
  $('#touch-controls').classList.add('hidden');
  openDialog('results', `<div class="dialog-inner"><div class="eyebrow"><span></span>ЗАБЕГ ЗАВЕРШЁН</div><div class="dialog-top"><h2>${result.escaped ? 'До следующей ночи' : 'Лес помнит вас'}</h2></div><div class="result-stats"><div class="result-stat"><span>ВРЕМЯ</span><strong>${formatTime(result.duration)}</strong></div><div class="result-stat"><span>ЗОЛОТО</span><strong>${result.gold}</strong></div><div class="result-stat"><span>УРОВЕНЬ</span><strong>${result.level}</strong></div></div><div class="dialog-actions"><button id="replay-button" class="primary-button">Ещё один забег${icon('rotate-ccw')}</button><button id="home-button" class="secondary-button">В убежище</button></div></div>`);
  $('#replay-button').onclick = () => { closeDialog(); scene.startRun(mode, hero, bindings); };
  $('#home-button').onclick = () => {
    closeDialog(); scene.goHome();
    $('#app').classList.remove('playing'); $('#expedition').classList.remove('hidden'); $('#hud').classList.add('hidden');
    $('#phase-label').textContent = 'УБЕЖИЩЕ';
  };
}

function showPerks(choices, done) {
  const [choice, ...rest] = choices;
  openDialog('perks', `<div class="dialog-inner"><div class="eyebrow"><span></span>НОВЫЙ УРОВЕНЬ</div><div class="dialog-top"><h2>${choice.hero.name}: дар леса</h2></div><div class="perk-list">${choice.options.map(p => `<button class="perk" data-perk="${p.id}">${icon(p.icon)}<strong>${p.name}</strong><span>${p.text}</span></button>`).join('')}</div></div>`);
  $$('[data-perk]').forEach(button => button.onclick = () => {
    scene.choosePerk(choice.hero, choice.options.find(p => p.id === button.dataset.perk));
    if (rest.length) showPerks(rest, done);
    else { closeDialog(); done(); }
  });
}

const bridge = {
  ready(value) { scene = value; $('#start-button').disabled = false; },
  toast, sound, pause: showPause, state: renderState, finished: showResults, perks: showPerks,
  started(heroes) {
    $('#app').classList.add('playing'); $('#expedition').classList.add('hidden'); $('#hud').classList.remove('hidden');
    $('#pause-button').classList.remove('hidden'); $('#touch-controls').classList.remove('hidden');
    $('#phase-label').textContent = 'ЭКСПЕДИЦИЯ'; buildHud(heroes);
  },
};

$('#start-button').disabled = true;
const forest = new ForestScene(bridge);
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'world', backgroundColor: '#314b3e', antialias: true, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, physics: { default: 'arcade', arcade: { debug: false } }, scene: [forest], input: { keyboard: false }, audio: { noAudio: true }, render: { roundPixels: false }, fps: { target: 60, forceSetTimeOut: false } });

$$('[data-mode]').forEach(button => button.onclick = () => {
  mode = button.dataset.mode;
  $$('[data-mode]').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
  $('#party-label').textContent = mode === 'coop' ? 'ГЕРОЙ ПЕРВОГО ИГРОКА' : 'ВЫБЕРИТЕ ГЕРОЯ';
  scene?.previewParty(mode, hero);
});
$$('[data-hero]').forEach(button => button.onclick = () => {
  hero = button.dataset.hero;
  $$('[data-hero]').forEach(b => { const selected = b === button; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
  scene?.previewParty(mode, hero);
});
$('#start-button').onclick = () => scene?.startRun(mode, hero, bindings);
$('#pause-button').onclick = showPause;
$('#settings-button').onclick = showSettings;
$('#art-button').onclick = showArt;
$('#portal-button').onclick = requestPortal;
$('#sound-button').onclick = () => {
  muted = !muted;
  $('#sound-button').innerHTML = icon(muted ? 'volume-x' : 'volume-2');
  $('#sound-button').setAttribute('aria-label', muted ? 'Включить звук' : 'Выключить звук');
  $('#sound-button').dataset.tooltip = muted ? 'Включить звук' : 'Выключить звук';
  icons(); sound('gold');
};

document.addEventListener('keydown', event => {
  if (listening) {
    event.preventDefault(); event.stopPropagation();
    if (event.code === 'Escape') { listening.button.classList.remove('listening'); listening = null; $('.binding-message').textContent = ''; return; }
    if (!/^(Key[A-Z]|Digit[0-9]|Arrow(Up|Down|Left|Right)|Space|Shift(Left|Right)|Control(Left|Right)|Alt(Left|Right)|Numpad[0-9])$/.test(event.code)) { $('.binding-message').textContent = 'Эта клавиша недоступна'; return; }
    const { player, action, button } = listening;
    const taken = bindings.some((b, index) => Object.entries(b).some(([a, code]) => code === event.code && !(index === player && a === action)));
    if (taken) { $('.binding-message').textContent = 'Клавиша уже занята'; return; }
    bindings[player][action] = event.code; button.textContent = keyLabel(event.code); button.classList.remove('listening');
    listening = null; $('.binding-message').textContent = 'Сохранено'; saveBindings(); return;
  }
  if (dialogKind === 'portal') {
    bindings.forEach((b, index) => { if (event.code === b.attack) { event.preventDefault(); confirmPortal(index); } }); return;
  }
  if (dialog.open) return;
  if (event.code === 'Escape') { event.preventDefault(); showPause(); return; }
  if (!scene?.running) return;
  if (bindings.some(b => Object.values(b).includes(event.code))) event.preventDefault();
  scene.inputState.keys.add(event.code);
  if (!event.repeat) bindings.forEach((b, index) => {
    for (const action of ['dash', 'skill1', 'skill2']) if (event.code === b[action]) scene.action(index, action);
  });
});
document.addEventListener('keyup', event => scene?.inputState.keys.delete(event.code));
dialog.addEventListener('cancel', event => {
  event.preventDefault();
  if (!['perks', 'results'].includes(dialogKind)) closeDialog();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) showPause(); });

const joystick = $('#joystick');
function moveJoystick(event) {
  const rect = joystick.getBoundingClientRect();
  let x = (event.clientX - rect.left - rect.width / 2) / 32, y = (event.clientY - rect.top - rect.height / 2) / 32;
  const length = Math.max(1, Math.hypot(x, y)); x /= length; y /= length;
  joystick.firstElementChild.style.transform = `translate(${x * 25}px, ${y * 25}px)`;
  if (scene) scene.inputState.touch = { x, y };
}
joystick.onpointerdown = event => { joystick.setPointerCapture(event.pointerId); moveJoystick(event); };
joystick.onpointermove = event => { if (joystick.hasPointerCapture(event.pointerId)) moveJoystick(event); };
joystick.onpointerup = joystick.onpointercancel = () => { joystick.firstElementChild.style.transform = ''; if (scene) scene.inputState.touch = { x: 0, y: 0 }; };
$('#touch-attack').onpointerdown = event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); if (scene) scene.inputState.touchAttack = true; };
$('#touch-attack').onpointerup = $('#touch-attack').onpointercancel = () => { if (scene) scene.inputState.touchAttack = false; };
$('#touch-dash').onpointerdown = event => { event.preventDefault(); scene?.action(0, 'dash'); };

if (import.meta.env.DEV && new URLSearchParams(location.search).has('test')) {
  window.__mournwood = { game, get scene() { return scene; }, requestPortal, get bindings() { return bindings; } };
}
icons();
