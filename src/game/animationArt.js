// Whole-body paintings, including the hands and weapon. Registration uses the
// pelvis projection and planted soles, never the cape/weapon bounding box.
// Coordinates are source-sheet pixels. Scale is always uniform on both axes;
// height overrides compensate for different source sizes without deformation.
export const ANIMATION_ART = {
  'reaper-poses': { url: '/assets/animation/reaper-poses.png', columns: 2, rows: 2, height: 558, anchors: [[396,636], [1025,634], [433,1185], [1010,1190]] },
  'necro-poses': { url: '/assets/animation/necro-poses.png', columns: 2, rows: 2, height: 570, anchors: [[375,615], [1051,611], [439,1168], [1040,1159]] },
  'reaper-walk': { url: '/assets/animation/reaper-walk.png', columns: 4, rows: 2, height: 430, anchors: [[240,505], [632,505], [1022,504], [1414,505], [244,1009], [647,1005], [1027,1010], [1417,1009]] },
  'necro-walk': { url: '/assets/animation/necro-walk.png', columns: 4, rows: 2, height: 448, splitY: 510, anchors: [[267,506], [645,506], [1009,507], [1400,507], [287,1006], [652,1003], [1035,1005], [1410,1004]] },
  'reaper-walk-back': { url: '/assets/animation/reaper-walk-back.png', columns: 4, rows: 2, height: 424, anchors: [[253,497], [644,496], [1040,491], [1416,498], [251,988], [649,993], [1043,993], [1431,996]] },
  'necro-walk-back': { url: '/assets/animation/necro-walk-back.png', columns: 4, rows: 2, height: 454, anchors: [[264,507], [646,506], [1044,504], [1414,507], [267,993], [654,992], [1043,1002], [1408,1004]] },
  'reaper-attack': { url: '/assets/animation/reaper-attack.png', columns: 2, rows: 4, height: 332, anchors: [[248,418], [757,417], [278,790], [736,787], [237,1112], [738,1108], [297,1517], [766,1520]] },
  'reaper-attack-back': { url: '/assets/animation/reaper-attack-back.png', columns: 2, rows: 4, height: 308, anchors: [[260,385], [773,385], [251,754], [759,755], [256,1118], [782,1119], [268,1504], [781,1519]] },
  // The release is held; overlapping magic in source cells 4/5 is excluded.
  'necro-attack': { url: '/assets/animation/necro-attack.png', columns: 4, rows: 2, height: 460, aliases: { 4: 3, 5: 6 }, heights: [460,460,460,460,436,436,436,436], anchors: [[210,525], [578,525], [916,525], [1270,525], [228,1016], [617,1016], [980,1016], [1328,1016]], emitters: [[272,70], [649,70], [1000,114], [1396,100], [407,620], [746,615], [1103,615], [1408,626]] },
  'necro-attack-back': { url: '/assets/animation/necro-attack-back.png', columns: 4, rows: 2, height: 468, heights: [468,468,468,468,450,450,450,450], anchors: [[237,506], [614,506], [975,506], [1355,506], [231,998], [626,998], [1009,998], [1380,998]], emitters: [[286,72], [668,75], [1042,82], [1440,98], [315,595], [682,589], [1082,585], [1426,582]] },
};

export const HERO_HEIGHT = 108;
export const frameKey = (sheet, frame) => `painted-${sheet}-${frame}`;
