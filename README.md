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
```

The browser checks require the dev server on port 5173 and Chromium at `/usr/bin/chromium` (or set `CHROMIUM_PATH`). Screenshots go to `test-results/`.

## Prototype Scope

- Angled 2D forest, solo with either sibling, or shared-screen local co-op.
- Scythe sweeps, magic bolts, dashes, two abilities per hero, temporary skeletons.
- Wolves, telegraphed ent projectiles after 90 seconds, and ogres after 215 seconds.
- Shared XP, independent perk selection, collectible run gold, results, and replay.
- Midpoint camera with modest zoom and a separation limit.
- Thirty-second rescue window, three-second uninterrupted proximity revival, 20% restored health.
- Three-second portal cast interrupted by damage; living co-op players confirm separately.
- Rebindable keyboard controls, touch controls for solo, optional synthesized combat audio.
- Generated character study sheet in the gallery and a transparent gameplay atlas with separate character and weapon sprites. Walk cycles currently use a simple bob and tilt; full directional animation is a later art pass.

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

`public/assets/character-studies.png` is generated concept art based on the user's supplied character references. The large illustrations define menu art; the lower studies define simplified front and rear gameplay views. `public/assets/hero-atlas.png` contains transparent character and weapon sprites; its four connected alpha regions are decoded into separate Phaser textures at load time. `src/game/assets.js` contains the atlas decoder and provisional SVG forest/enemy assets. This is a 2D game; these images are not rigged 3D models.

See `docs/direction.md` for the agreed design decisions and next milestones.
