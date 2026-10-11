# Mournwood / Тихолесье

A first playable browser prototype based on the supplied roguelike design. The conversation and documentation are English; the game interface is Russian.

## Play Without Installing Anything

Download [Tiholesye.zip](releases/Tiholesye.zip?raw=1), extract it, and double-click `Tiholesye.html` to open it in Chrome or Edge. The game, sprites, concept art, and fonts are embedded; it works offline and needs no local server. Keep the `.html` extension when saving it.

To regenerate or check this downloadable edition:

```sh
npm run build:standalone
npm run test:standalone
```

## Run

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm ci
npm run dev -- --port 5173
```

Open `http://localhost:5173` on the same computer where the command is running. A cloud workspace's localhost address does not open that workspace from your personal computer. Use the standalone download above to play locally. Keep the address consistent for saved control bindings.

```sh
npm test
npm run build
npm run test:browser
npm run test:animation
```

The browser checks require the dev server on port 5173 and Chromium at `/usr/bin/chromium` (or set `CHROMIUM_PATH`). Screenshots go to `test-results/`. The animation checks verify damage timing, dash cancellation, casting origins, queued abilities, stable idle poses, uniform proportions, and stopping at obstacles. They also capture three enlarged pose sheets. `node scripts/capture-animation.mjs` captures a 24 fps motion study using the gameplay renderer; [watch the recorded preview](releases/Animation-preview.mp4?raw=1).

## Prototype Scope

- Angled 2D forest, solo with either sibling, or shared-screen local co-op.
- Scythe sweeps, magic bolts, dashes, two abilities per hero, temporary skeletons.
- Wolves, telegraphed ent projectiles after 90 seconds, and ogres after 215 seconds.
- Shared XP, independent perk selection, collectible run gold, results, and replay.
- Midpoint camera with modest zoom and a separation limit.
- Thirty-second rescue window, three-second uninterrupted proximity revival, 20% restored health.
- Three-second portal cast interrupted by damage; living co-op players confirm separately.
- Rebindable keyboard controls, touch controls for solo, optional synthesized combat audio.
- Generated character study sheet in the gallery and whole-body painted gameplay animation. Eight-frame walks follow actual travel, with front/rear artwork and mirrored left-facing poses. Each frame includes the body, hair, clothing, hands, and weapon together.
- Scythe anticipation, sweep, and recovery; two-handed necromancer casting releases magic from the staff head. Ability effects occur at their animation events, and ability presses during attacks queue for recovery.
- Stable standing poses, a painted dash with brief afterimages, and a kneeling downed pose. The renderer preserves the paintings' proportions without separately rotating or stretching limbs.

The complete design's three save slots, persistent gold, upgrades, alternative abilities, perk rarity pools, and later biomes are not implemented in this combat prototype. Collected gold is shown in results only; there is no permanent economy yet. Only control bindings persist.

## Default Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | W A S D | Arrow keys |
| Attack (hold) | F | K |
| Dash | Space | L |
| First ability | Q | O |
| Second ability | E | P |
| Pause | Escape | Escape |

The toolbar sliders open editable bindings. In co-op, the portal confirmation accepts each player's attack key or their individual confirmation button. Keyboard rollover depends on hardware.

## Art

`public/assets/character-studies.png` is generated concept art based on the supplied references. Gameplay uses the complete character paintings in `public/assets/animation/`. Connected alpha regions are decoded into individual textures so long weapons and clothing can extend beyond a grid cell without including a neighbouring character. `animationArt.js` records foot registration, body height, staff emitters, and source-frame aliases. The front casting clip holds its release pose and omits two overlapping source cells.

`motion.js` defines distance-based frame selection and action timelines; `HeroAnimator.js` displays one complete painting with uniform scale. Standing poses are deliberately still. The characters have front/rear views with mirrored lateral poses; dedicated side views, rear dash/down poses, and individual clips for every ability remain future art work. Abilities currently reuse their hero's attack/casting clip with their own timing and effects. Enemy and summoned-skeleton art remains provisional. These are 2D illustrated characters, not 3D models or motion-captured animation.

See `docs/direction.md` for the agreed design decisions and next milestones.
