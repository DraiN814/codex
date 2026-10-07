const svg = (width, height, content) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;

const reaper = svg(80, 100, `
  <path d="M26 22 13 37 5 72 24 66 17 91 36 79 63 91 55 70 75 73 62 32 50 21Z" fill="#212529" stroke="#10181b" stroke-width="2"/>
  <path d="m16 39-7 32 16-10-5 27 16-18-6-34ZM54 36l15 33-18-8 8 24-17-14Z" fill="#823b4b"/>
  <path d="m23 34 18-6 18 8-6 24-27 1Z" fill="#35373b" stroke="#171e23" stroke-width="2"/>
  <path d="m25 53 28-2-2 7-24 4Z" fill="#af5763"/><path d="m31 58 9-2-4 30-8 8Z" fill="#963b4a"/>
  <path d="m27 61 11-1-1 20-12 4-2-12ZM41 61l12-3 4 19-11 6-6-9Z" fill="#303339" stroke="#141d21" stroke-width="2"/>
  <path d="m25 77 12-1-3 17-14 2 2-8ZM45 79l10-4 5 17-14 1Z" fill="#171f22" stroke="#67716c"/>
  <path d="m20 37-6 15 8 6 7-16M57 37l7 12-7 10-8-8" fill="#3b3c3f" stroke="#141d21" stroke-width="3"/>
  <path d="m14 52 7 1 1 9-7 1ZM55 52l9-1 1 10-7 2Z" fill="#252b2d" stroke="#646b64"/>
  <path d="m30 10 19-2 6 10-5 13-10 6-10-8Z" fill="#ddc5b5" stroke="#403d39"/>
  <path d="m26 22-4-9 8 1-3-10 10 5 5-8 6 6 10-3-3 9 7 6-9 3-6-8-5 11-4-7-9 13Z" fill="#171e23" stroke="#58605e"/>
  <path d="m43 22 5-1m-4 7 5-2" stroke="#514944" stroke-width="1.5"/>
  <path d="m25 29 14 9-5 11-16-16M53 28l-11 11 9 8 11-16" fill="#282e31" stroke="#798078"/>
  <path d="m27 34 13 6 13-7M36 44l4 8 4-8M29 67l5 3M47 84l8-1M24 86l10-2" fill="none" stroke="#b7a785" stroke-width="1.4"/>
  <circle cx="40" cy="40" r="3" fill="#333a3a" stroke="#ccb88d"/>
`);

const necro = svg(80, 110, `
  <path d="M32 13Q14 17 17 37L8 61l11-9L4 82l22-11-8 23 22-10 7-47Z" fill="#b3aac7" stroke="#77778f" stroke-width="1.5"/>
  <path d="M33 14Q19 23 24 37L14 60l17-13-12 23 20-11L31 82l15-10 1-45Z" fill="#e5e0e7"/>
  <path d="m32 36-9 15-10 45 19-16 10 17 11-15 19 18-11-42-13-20Z" fill="#282a32" stroke="#121e20" stroke-width="2"/>
  <path d="m24 53-5 38 13-18-1 17 9-13-2-25ZM51 53l14 39-15-16-5 15 1-36Z" fill="#9380b3"/>
  <path d="m31 65 10 2-8 24-9 1ZM44 68l9-2 4 24-10 3Z" fill="#d6c1bd"/>
  <path d="m26 81 10-1-4 23-14 3 4-13ZM46 83l10-2 7 20-15 2Z" fill="#24282f" stroke="#747180"/>
  <path d="m29 32 23-1 2 13-8 12-15-1-6-13Z" fill="#292a33" stroke="#bbb0b0" stroke-width="1.3"/>
  <path d="m31 47 17 0 6 17-10 11-16-11Z" fill="#24282e" stroke="#8d8592"/>
  <path d="m23 33-8 18 6 5 11-18M54 33l7 9 6 13-7 6-9-16" fill="#e1ceca" stroke="#363239" stroke-width="1.5"/>
  <path d="m14 48-5 24 13-9 3-12M61 49l-3 19 10 7 5-20" fill="#292b33" stroke="#8b799e"/>
  <path d="m32 11 19-1 6 12-7 13-11-2-10-10Z" fill="#efdbce" stroke="#8f7e87"/>
  <path d="m28 21-5-8 7-6 3-5 16 3 11 8-3 9-8-9-1 10-7-8-10 12Z" fill="#f5eff0" stroke="#b6b0bd" stroke-width="1.2"/>
  <path d="m49 22 5 0m-9 7 5-1M37 39l7 6-9 10 9 7-7 8M27 90l6-2m17 5 7-2" fill="none" stroke="#b5a393" stroke-width="1.3"/>
  <circle cx="39" cy="56" r="3" fill="#6e5e7a" stroke="#d0bfa6"/>
`);

export const ART = {
  reaper, necro,
  scythe: svg(100, 130, `<path d="m60 26-15 98" stroke="#141c20" stroke-width="6"/><path d="m62 26-15 97" stroke="#a9b2a4" stroke-width="1.4"/><path d="M64 29Q43-1 3 34 22 2 57 4L72 14 83 2 77 21 89 31 67 35Z" fill="#252f31" stroke="#c0c4af" stroke-width="1.8"/><path d="m17 19 38-8-7 10 18-3-4 13" fill="none" stroke="#787f77"/><path d="m62 21 10 0 4 7-5 8-7-1-5-6Z" fill="#d2c5ae"/><circle cx="63" cy="28" r="2" fill="#293130"/><circle cx="70" cy="28" r="2" fill="#293130"/><path d="m77 34-3 16 4 7 4-8-5-15" fill="#766272" stroke="#c0b5a4"/><path d="m56 68 6 2m-9 11 6 2m-9 10 6 2" stroke="#b1918d" stroke-width="2"/>`),
  staff: svg(55, 130, `<path d="m29 34-5 91" stroke="#222b2c" stroke-width="6"/><path d="m29 34-5 91" stroke="#aba9b3" stroke-width="1.3"/><path d="M25 42Q-2 37 8 11l7 9 5-16 6 10L38 2l2 18 11-9q5 32-22 33Z" fill="#293137" stroke="#b7a3c6" stroke-width="1.5"/><path d="M24 25Q15 13 27 7 23 20 36 18q11 12-5 20Z" fill="#c7a3fc"/><path d="m20 24 15-2 7 9-8 11-12-3-5-9Z" fill="#ddd0bd" stroke="#61616b"/><circle cx="24" cy="31" r="3" fill="#34313f"/><circle cx="34" cy="30" r="3" fill="#34313f"/><path d="m29 36 2-3 2 3" fill="#4b3b4a"/><path d="m12 39-3 15 5 7 3-8ZM43 39l2 16-5 7-3-8Z" fill="#a391ba"/>`),
  wolf: svg(105, 70, `<path d="m19 41-15-9 12-5 14 8 17-15 22 1 19 8 9 17-11 8-12-6-13 7-33-7-9 9-11-2Z" fill="#526360" stroke="#202f2d" stroke-width="2"/><path d="m30 27 12-10 14 5 10-9 6 16 11 0 3 18-14-7-10 6-19-9Z" fill="#72847b"/><path d="m82 29 4-17 9 13 8 6-6 12-16 2-7-8Z" fill="#9da696" stroke="#293b34" stroke-width="2"/><path d="m88 18 3 11-7-1ZM96 33l9 2-7 5Z" fill="#202e2b"/><path d="m35 44-6 17-10 2 3-17m41 1 4 14 13 0-5-18" fill="#52615a" stroke="#283a31" stroke-width="2"/><path d="m86 32 5 0" stroke="#e4ba76" stroke-width="3"/><path d="m23 34 9-3 12 6 11-7" fill="none" stroke="#a9b2a1" stroke-width="1.5"/>`),
  tree: svg(230, 300, `<path d="m111 195-12 72-31 18 47-7 32 13-17-31-4-77Z" fill="#3d463b" stroke="#27372e" stroke-width="3"/><path d="m116 238 6-71-35-31m36 70 32-51" fill="none" stroke="#68705a" stroke-width="5"/><path d="m115 0-36 49 17-4-45 53 20-2-56 62 26-3-39 48 51-3-13 15 55-11 32 17 39-19 63 5-32-40 23 0-57-62 22 5-46-58 17 4Z" fill="#233e34" stroke="#152c25" stroke-width="3"/><path d="m112 9-27 41 25-10-40 53 24-5-44 49 43-12-31 39 40-15 7 32 19-23 41 20-27-39 46 15-54-58 21 3-34-45 16 4Z" fill="#345347"/><path d="m107 46 12-16 8 24-13-6-23 31 29-15 21 25-22-9-47 42 40-17 7 25 14-18 34 25-32-42-11 1Z" fill="#4a6854"/><path d="m21 186 53-16-12 20 36-10 22 22 24-19 39 5-12-16 24 13" fill="none" stroke="#49614a" stroke-width="3"/>`),
  birch: svg(160, 260, `<path d="m77 80-3 138-22 23 27-8 25 14-10-30-3-139Z" fill="#9bafa0" stroke="#354a3d" stroke-width="2"/><path d="m84 122-31-34m31 71 36-57M77 184h14m-13 19h16m-11-76h8m-14-29h14" stroke="#405c4b" stroke-width="4"/><path d="m37 39 31-30 37 3 38 42-12 42 22 27-39 29-23-11-31 15-19-15-33-4L0 94l19-24Z" fill="#3d5f46" stroke="#243f33" stroke-width="3"/><path d="m34 40 32-17 34 3 24 27-7 16 17 34-30 20-24-13-26 12-30-12-8-22 23-12Z" fill="#597450"/><path d="m49 42 23-9 18 6-20 8Zm45 21 16 10-7 10-18-8ZM26 90l18-8 12 13-18 5Zm34 8 17-13 19 8-11 13Z" fill="#738963"/>`),
  stump: svg(86, 65, `<path d="m21 21-6 25-13 12 29-7 13 9 19-9 18 3-15-15-4-21Z" fill="#4c5140" stroke="#243a2e" stroke-width="2"/><ellipse cx="41" cy="22" rx="24" ry="12" fill="#84836a" stroke="#303f30" stroke-width="2"/><ellipse cx="41" cy="22" rx="15" ry="7" fill="none" stroke="#b1a98a"/><path d="m27 31-5 14m34-14 5 13" stroke="#8b8b6e" stroke-width="2"/><path d="m12 49 8-4 8 3 5-3" stroke="#678557" stroke-width="5"/>`),
  rock: svg(86, 65, `<path d="m3 48 12-25 26-14 26 12 17 27-23 11-38-1Z" fill="#687b70" stroke="#314b40" stroke-width="2"/><path d="m15 23 28-12 17 18-16 15-26-5Z" fill="#93a397"/><path d="m45 45 16-17 22 21-25 9Z" fill="#4c645b"/><path d="m6 49 25-1 9 6-18 4Z" fill="#6c875d"/>`),
  fern: svg(75, 65, `<g fill="none" stroke="#6c8b62" stroke-width="2"><path d="M37 62Q26 37 4 30m33 32q12-33 31-43M37 62Q34 18 21 4M37 62Q45 15 52 3"/></g><g fill="#638357" stroke="#354f38" stroke-width=".5"><path d="m12 35-8-15 16 14-3-15 14 22-8-8 9 0-3 11 7 8-4-5-19-7 11 0Z"/><path d="m44 45 14-2-9-6 17-9-11 1 16-15-3 15-8 1 3 8-15 12Z"/><path d="m32 37-17-9 13 2-16-16 14 8-7-21 14 17-4 3 8 12Z"/><path d="m39 43 17-15-11 2 14-17-10 3 4-16-12 15 5 4-9 8Z"/></g>`),
  mushrooms: svg(60, 45, `<path d="M17 26v13m22-25v20m7-10v13" stroke="#d2cab2" stroke-width="4"/><path d="M3 27q3-25 27 0Z" fill="#ba8779" stroke="#644d45"/><path d="M25 16q4-23 27 0Z" fill="#c5a294" stroke="#6b5d4e"/><path d="M35 27q10-13 20 0Z" fill="#8f7064"/><path d="m14 19 4 1m15-7 4-2" stroke="#e1d0b2" stroke-width="2"/>`),
  ent: svg(100, 130, `<path d="m27 118 7-38-14-26-16-9 5-24 9 15 17 8 6-14 3-26 12 17 5 18 22-14 6-20 6 31-23 23 5 28 17 39-21-5-14-28-8 27Z" fill="#5d6750" stroke="#273f31" stroke-width="3"/><path d="m43 43 22 1 6 25-14 11-22-13Z" fill="#778067"/><path d="m42 53 8 2m10-2 9-2" stroke="#dcca82" stroke-width="4"/><path d="m46 66 15-1" stroke="#2c4030" stroke-width="3"/><path d="m33 77 12 14m12-13 4 15M15 34l17 13" stroke="#a2a177" stroke-width="2"/><path d="m22 41 10-8 9 7m25-13 15-7 4 12" stroke="#748c50" stroke-width="7"/>`),
  ogre: svg(125, 150, `<path d="m31 74-13 30 9 27 18 7 14-24 16 16 28 2 8-27-17-34Z" fill="#424941" stroke="#24372c" stroke-width="3"/><path d="m24 120 24 2-3 23-31 0ZM79 118l25 1 9 23-30 1Z" fill="#38453b"/><path d="m38 29-23 21-14 34 17 14 17-26 16 16 30-1 13-20 10 29 19-10-11-39-31-22Z" fill="#90977a" stroke="#314a36" stroke-width="3"/><path d="m40 15 31-8 17 20-9 20-36 1-15-20Z" fill="#b0b298" stroke="#43583e" stroke-width="3"/><path d="m36 26 14 4m10 0 13-7" stroke="#d4a566" stroke-width="4"/><path d="m43 40 4-12 5 13m15-2 6-12 2 12" fill="#e1d6b5"/><path d="m32 61 51 1-4 33-35-2Z" fill="#6e6652" stroke="#2d4131" stroke-width="3"/><path d="m44 65 24 24m6-22-25 21" stroke="#aaa27d" stroke-width="3"/><path d="m106 78-5 62" stroke="#484f39" stroke-width="10"/><path d="m88 94 27 0 7 22-40 0Z" fill="#727967" stroke="#30482f" stroke-width="3"/>`),
  skeleton: svg(50, 65, `<path d="m20 30-8 10 8 8m14-17 11 12-8 8M22 44l-8 18m18-18 8 18M26 27v23m-8-15 18 0m-17 7 16 0" fill="none" stroke="#c9ccae" stroke-width="4"/><path d="m14 9 20-3 7 13-9 13-15-2-8-12Z" fill="#d7d8bd" stroke="#5d7660" stroke-width="2"/><circle cx="17" cy="18" r="4" fill="#4a5561"/><circle cx="30" cy="17" r="4" fill="#4a5561"/><path d="m21 26 9 0" stroke="#4a5561" stroke-width="2"/>`),
};

export function preloadArt(scene) {
  scene.load.image('hero-atlas', '/assets/hero-atlas.png');
  for (const [key, value] of Object.entries(ART)) {
    scene.load.svg(key, `data:image/svg+xml;base64,${btoa(value)}`);
  }
}

export function createHeroFrames(scene) {
  const image = scene.textures.get('hero-atlas').getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = image.width; canvas.height = image.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const { width, height } = canvas;
  const source = ctx.getImageData(0, 0, width, height);
  const labels = new Int32Array(width * height);
  const queue = new Int32Array(width * height);
  const components = [];
  let label = 0;

  // Generated atlas silhouettes overlap cell boundaries. Decode connected alpha
  // regions so a weapon frame cannot include a neighboring character's boots.
  for (let root = 0; root < labels.length; root++) {
    if (labels[root] || source.data[root * 4 + 3] < 8) continue;
    label++;
    let head = 0, tail = 1, minX = width, minY = height, maxX = 0, maxY = 0;
    queue[0] = root; labels[root] = label;
    while (head < tail) {
      const index = queue[head++], x = index % width, y = Math.floor(index / width);
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      const visit = next => {
        if (!labels[next] && source.data[next * 4 + 3] >= 8) { labels[next] = label; queue[tail++] = next; }
      };
      if (x > 0) visit(index - 1);
      if (x < width - 1) visit(index + 1);
      if (y > 0) visit(index - width);
      if (y < height - 1) visit(index + width);
    }
    if (tail > 1000) components.push({ label, count: tail, minX, minY, maxX, maxY });
  }
  const pixels = new Uint32Array(source.data.buffer);
  for (const part of components.sort((a, b) => b.count - a.count).slice(0, 4)) {
    const top = (part.minY + part.maxY) / 2 < height / 2;
    const left = (part.minX + part.maxX) / 2 < width / 2;
    const name = top ? left ? 'reaper' : 'necro' : left ? 'scythe' : 'staff';
    const texture = scene.textures.createCanvas(`hero-${name}`, part.maxX - part.minX + 1, part.maxY - part.minY + 1);
    const output = texture.context.createImageData(texture.width, texture.height);
    const target = new Uint32Array(output.data.buffer);
    for (let y = part.minY; y <= part.maxY; y++) for (let x = part.minX; x <= part.maxX; x++) {
      const index = y * width + x;
      if (labels[index] === part.label) target[(y - part.minY) * texture.width + x - part.minX] = pixels[index];
    }
    texture.context.putImageData(output, 0, 0); texture.refresh();
  }
}

export function createGround(scene) {
  const canvas = scene.textures.createCanvas('ground', 512, 512);
  const ctx = canvas.context;
  let seed = 719;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  ctx.fillStyle = '#314b3e'; ctx.fillRect(0, 0, 512, 512);
  const colors = ['#3d5541', '#2d483c', '#405643', '#4c6147', '#283f34', '#58664c'];
  for (let i = 0; i < 3200; i++) {
    const x = random() * 512, y = random() * 512;
    ctx.fillStyle = colors[Math.floor(random() * colors.length)];
    ctx.globalAlpha = 0.15 + random() * 0.35;
    ctx.beginPath(); ctx.ellipse(x, y, random() * 9 + 1, random() * 3 + 1, random(), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 190; i++) {
    const x = random() * 512, y = random() * 512;
    ctx.strokeStyle = i % 3 === 0 ? '#6e7d53' : '#536c47'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x - 4, y - 5); ctx.moveTo(x, y); ctx.lineTo(x + 1, y - 7); ctx.stroke();
  }
  canvas.refresh();
  const g = scene.make.graphics({ x: 0, y: 0, add: false });
  g.fillStyle(0xeeeeee); g.fillCircle(8, 8, 8); g.generateTexture('dot', 16, 16); g.destroy();
}
