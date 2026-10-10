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

The browser checks require the dev server on port 5173 and Chromium at `/usr/bin/chromium` (or set `CHROMIUM_PATH`). Screenshots go to `test-results/`. The animation checks verify damage timing, dash cancellation, casting origins, queued abilities, and directional poses, and capture three enlarged pose sheets for visual review.

## Prototype Scope

- Angled 2D forest, solo with either sibling, or shared-screen local co-op.
- Scythe sweeps, magic bolts, dashes, two abilities per hero, temporary skeletons.
- Wolves, telegraphed ent projectiles after 90 seconds, and ogres after 215 seconds.
- Shared XP, independent perk selection, collectible run gold, results, and replay.
- Midpoint camera with modest zoom and a separation limit.
- Thirty-second rescue window, three-second uninterrupted proximity revival, 20% restored health.
- Three-second portal cast interrupted by damage; living co-op players confirm separately.
- Rebindable keyboard controls, touch controls for solo, optional synthesized combat audio.
- Generated character study sheet in the gallery, with articulated 2D gameplay characters: separate limbs, torso, head, cloth, hair, and weapons; distance-driven gait, front/rear artwork, and mirrored left-facing poses.
- Scythe windup, alternating sweeps, recovery, and blade trails; necromancer casting gestures that release magic from the palm. Ability effects occur at their animation events, and ability presses during attacks queue for recovery.
- Dash crouch and afterimages, cloth/hair follow-through, breathing, damage recoil, and a downed pose.

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

`public/assets/character-studies.png` is generated concept art based on the user's supplied character references. `public/assets/hero-atlas.png` supplies the original scythe and skull staff. The generated `reaper-rig.png` and `necro-rig.png` atlases provide the individual body parts used by the 2D rigs; connected alpha regions are decoded into Phaser textures at load time. `src/game/motion.js` defines the gait, joint solving, and action timelines; `HeroAnimator.js` maps them to the painted parts. The characters use front/rear art with mirrored lateral poses, rather than eight separately painted directions. Enemy and summoned-skeleton art remains provisional. These are 2D characters, not 3D models.

See `docs/direction.md` for the agreed design decisions and next milestones.
