import { translate, onLanguageChange } from './language.js';
import * as THREE from 'three';
import { createFaceWaterfall, createFinalReflection } from './faceWaterfall.js';
import { createAuctionArena } from './auctionArena.js';
import { STATION_GAP } from './corridorLayout.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createBlackMarbleFloor } from './blackMarbleFloor.js';
import { palaceWall, palaceCeiling, palaceTimber } from './palaceSurfaces.js';
import { addDoorUplights, addWallTextureFixtures } from './doorUplights.js';
import { loadMedusaDoorHandles } from './medusaDoorHandles.js';
import { loadOrnateCorridorDoors } from './ornateCorridorDoors.js';
import { createDoorNameplate } from './doorNameplate.js';

export const ROOM_DESIGNS = [
  { name: 'Introduction', subtitle: 'A space to begin the exchange.', color: 0xc6a45e, stone: 0xeee9dd, kind: 'invitation', action: 'UNFOLD THE INVITATION' },
  { name: 'Inspection Room', subtitle: 'Use the wall workstation to offer your likeness.', color: 0x83bfc1, stone: 0xe5ece9, kind: 'portrait', action: 'ILLUMINATE THE RELIQUARY' },
  { name: 'Portrait Processing Room', subtitle: 'See how your likeness can acquire a new use.', color: 0xa0a2df, stone: 0xe9e6ef, kind: 'frames', action: 'TRY EXPRESSION DEMO' },
  { name: 'Valuation Room', subtitle: 'Examine the machinery of fictional value.', color: 0x9dc2aa, stone: 0xe6ece3, kind: 'index', action: 'PULSE THE INDEX' },
  { name: 'Auction Hall', subtitle: 'Your likeness is the lot. Watch the anonymous bidders from the balcony.', color: 0xd4ad74, stone: 0xeee7dc, kind: 'seal', action: 'REVEAL THE SEAL' },
  { name: 'Sale', subtitle: 'Visit the record of your sale.', color: 0x89b9d5, stone: 0xe3e9ee, kind: 'archive', action: 'VIEW THE RECORD' },
  { name: 'Honour', subtitle: 'Uploaded faces, transformed and repeated. Every version retains its source and sale price.', color: 0xd69aa2, stone: 0xefdfdf, kind: 'cascade', action: 'VIEW THE CASCADE' },
  { name: 'The Reflection', subtitle: 'Consider what remains yours.', color: 0xc5c8ca, stone: 0xf1eee6, kind: 'mirror', action: 'SHIFT THE MIRROR' },
  { name: '', subtitle: '', color: 0x9eaddd, stone: 0xe7e7ef, kind: 'network', action: '' },
];

const GOLD = 0xd7b777;
let stoneTexture;
function marbleTexture() {
  if (stoneTexture) return stoneTexture;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#67523a';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    for (let y = 0; y <= 512; y += 4) {
      const x = i * 49 - 180 + y * 0.37 + Math.sin(y * 0.023 + i) * 29 + Math.sin(y * 0.076 + i * 2) * 6;
      if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = i % 3 === 0 ? '#b0b5b025' : '#c4c5bc45';
    ctx.lineWidth = i % 3 === 0 ? 2.5 : 0.8;
    ctx.stroke();
  }
  stoneTexture = new THREE.CanvasTexture(canvas);
  stoneTexture.colorSpace = THREE.SRGBColorSpace;
  stoneTexture.wrapS = stoneTexture.wrapT = THREE.RepeatWrapping;
  stoneTexture.repeat.set(3, 6);
  return stoneTexture;
}
const shared = {
  gold: new THREE.MeshPhysicalMaterial({ color: GOLD, metalness: 0.94, roughness: 0.23, clearcoat: 0.5 }),
  white: new THREE.MeshPhysicalMaterial({ color: 0x61452a, metalness: 0.58, roughness: 0.29, clearcoat: 0.5 }),
  dark: new THREE.MeshPhysicalMaterial({ color: 0x142b33, metalness: 0.62, roughness: 0.24, clearcoat: 0.7 }),
  plaque: new THREE.MeshStandardMaterial({ color: 0x211811, metalness: 0.22, roughness: 0.64 }),
  light: new THREE.MeshBasicMaterial({ color: 0xfff0cd, toneMapped: false }),
};

function box(parent, material, size, position) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function ring(parent, radius, tube, position, material = shared.gold) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 8, 64), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function label(text, width = 3.1, height = 0.42) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const draw = () => {
    ctx.clearRect(0,0,1024,150);
    ctx.textAlign='center';ctx.fillStyle='#f4eedf';
    ctx.font='500 78px "Bodoni Moda", "Songti SC", "Noto Serif CJK SC", serif';
    ctx.shadowColor='rgba(22,14,11,0.85)';ctx.shadowBlur=7;ctx.shadowOffsetY=2;
    ctx.fillText(translate(text),512,100,970);
    texture.needsUpdate=true;
  };
  draw();
  const unsubscribe = onLanguageChange(draw);
  texture.addEventListener('dispose', unsubscribe);
  document.fonts?.load('500 78px "Bodoni Moda"').then(draw);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false, transparent: true, alphaTest: .01, depthWrite: false }));
  return mesh;
}

export function makeReflection(width, depth, resolution = 768) {
  const reflector = new Reflector(new THREE.PlaneGeometry(width, depth), {
    textureWidth: resolution,
    textureHeight: resolution,
    color: 0x39240c,
    clipBias: 0.003,
    multisample: 0,
  });
  reflector.rotation.x = -Math.PI / 2;
  reflector.material.transparent = true;
  reflector.material.depthWrite = false;
  reflector.material.fragmentShader = reflector.material.fragmentShader.replace(
    'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );',
    'gl_FragColor = vec4( blendOverlay( base.rgb, color ), 0.12 );',
  );
  reflector.renderOrder = 1;
  return reflector;
}

function arch(parent, z, width = 9.7, spring = 5.35, height = 7.5, material = palaceTimber()) {
  const points = [];
  for (let i = 0; i <= 32; i++) {
    const t = Math.PI * i / 32;
    points.push(new THREE.Vector3(-Math.cos(t) * width / 2, spring + Math.sin(t) * (height - spring), z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  parent.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.055, 6, false), material));
}

function column(parent, x, z, height = 6.7) {
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, height, 16), shared.white);
  shaft.position.set(x, height / 2 + 0.18, z);
  parent.add(shaft);
  box(parent, shared.gold, [0.65, 0.16, 0.65], [x, 0.1, z]);
  box(parent, shared.gold, [0.55, 0.15, 0.55], [x, height + 0.24, z]);
  box(parent, shared.light, [0.025, height - 0.3, 0.025], [x, height / 2 + 0.1, z + 0.22]);
}

function makeDoor(station, index, total) {
  const side = index === 0 ? -1 : index === total - 1 ? 0 : index % 2 === 0 ? 1 : -1;
  const group = new THREE.Group();
  group.position.set(side * 4.9, 2.375, -index * STATION_GAP);
  group.rotation.y = side === 0 ? 0 : side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const jambs = new THREE.Group();
  for (const sign of [-1, 1]) {
    box(jambs, shared.white, [0.29, 5.05, 0.32], [sign * 1.75, 0.15, 0]);
    box(jambs, shared.gold, [0.065, 5.07, 0.37], [sign * 1.58, 0.15, 0.04]);
  }
  box(jambs, shared.white, [3.8, 0.3, 0.32], [0, 2.65, 0]);
  box(jambs, shared.gold, [3.8, 0.045, 0.36], [0, 2.49, 0.04]);
  box(jambs, shared.gold, [3.7, 0.03, 0.37], [0, -2.36, 0]);
  jambs.traverse(child => { child.userData.isDoorArchitecture = true; });
  group.add(jambs);
  const leaf = sign => {
    const pivot = new THREE.Group();
    pivot.position.set(sign * 1.6, 0, 0.02);
    const panel = new THREE.Group();
    panel.position.x = -sign * 0.8;
    box(panel, shared.dark, [1.59, 4.75, 0.12], [0, 0, 0]);
    for (const edge of [-1, 1]) {
      box(panel, shared.gold, [0.065, 4.75, 0.14], [edge * 0.765, 0, 0.02]);
      box(panel, shared.gold, [1.56, 0.065, 0.14], [0, edge * 2.34, 0.02]);
      box(panel, shared.gold, [0.02, 4.15, 0.15], [edge * 0.56, 0, 0.03]);
    }
    pivot.userData.doorShell = panel.children.slice();
    const handleFallback = new THREE.Group();
    panel.add(handleFallback);
    ring(handleFallback, 0.45, 0.017, [0, 0.22, 0.085]);
    box(handleFallback, shared.gold, [0.025, 1.38, 0.025], [0, 0.22, 0.09]);
    box(handleFallback, shared.gold, [0.4, 0.025, 0.025], [0, 0.22, 0.09]);
    box(handleFallback, shared.gold, [0.04, 0.43, 0.13], [-sign * 0.63, -0.3, 0.13]);
    pivot.userData.handlePanel = panel;
    pivot.userData.handleFallback = handleFallback;
    panel.traverse(child => { child.userData.isDoorPanel = true; });
    pivot.add(panel);
    group.add(pivot);
    return pivot;
  };
  const leftPivot = leaf(-1), rightPivot = leaf(1);
  let nameplate;
  if (station.interactive !== false && station.view !== 'reflectRoom') {
    const name = createDoorNameplate(station.label,index);
    name.position.set(0, 3.25, 0.18);
    name.userData.isDoorArchitecture = true;
    group.add(name);
    nameplate = name;
  }
  const hit = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 5.45), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.z = 0.2;
  hit.userData = { stationIndex: index, view: station.view, isDoorHit: true };
  group.add(hit);
  group.userData = { leftPivot, rightPivot, hit, side, interactive: station.interactive !== false, nodeZ: -index * STATION_GAP, stationIndex: index, view: station.view };
  group.userData.jambs = jambs;
  group.userData.nameplate = nameplate;
  group.userData.uplights = addDoorUplights(group, { floorY: -group.position.y });
  return group;
}

export function buildSpatialCorridor(scene, stations) {
  const world = new THREE.Group();
  world.name = 'ChampagneGallery';
  scene.add(world);
  const end = -stations.length * STATION_GAP;
  const start = 4.9, depth = start - end, center = (start + end) / 2;
  const floorMaterial = createBlackMarbleFloor();
  box(world, floorMaterial, [10.4, 0.14, depth], [0, -0.075, center]);
  const reflection = makeReflection(10.2, depth,512);
  reflection.position.set(0, 0.006, center);
  world.add(reflection);
  const doors = stations.map((station, i) => makeDoor(station, i, stations.length));
  world.userData.uplightEntries = doors.map(door => ({ z: door.userData.nodeZ, lights: door.userData.uplights }));
  const wall = palaceWall();
  // Build wall segments around actual openings. The door is connected to its
  // room and nothing remains across the opening when its leaves rotate.
  for (const side of [-1, 1]) {
    const openings = doors.filter(door => door.userData.side === side).map(door => door.userData.nodeZ).sort((a, b) => b - a);
    let cursor = start;
    for (const z of openings) {
      const edge = z + 1.86;
      if (cursor > edge) box(world, wall, [0.28, 7.6, cursor - edge], [side * 5.08, 3.8, (cursor + edge) / 2]);
      box(world, wall, [0.28, 2.55, 3.72], [side * 5.08, 6.325, z]);
      cursor = z - 1.86;
    }
    if (cursor > end) box(world, wall, [0.28, 7.6, cursor - end], [side * 5.08, 3.8, (cursor + end) / 2]);
    box(world, shared.gold, [0.03, 0.045, depth], [side * 4.89, 5.28, center]);
    box(world, shared.light, [0.055, 0.055, depth], [side * 4.8, 6.72, center]);
  }
  // Open end: the processional entrance continues beyond this threshold.
  const gateZ = -(stations.length - 1) * STATION_GAP;
  box(world, wall, [3.2, 7.6, 0.24], [-3.5, 3.8, gateZ - 0.16]);
  box(world, wall, [3.2, 7.6, 0.24], [3.5, 3.8, gateZ - 0.16]);
  box(world, wall, [3.8, 2.55, 0.24], [0, 6.325, gateZ - 0.16]);
  const ceiling = palaceCeiling();
  box(world, ceiling, [10.2, 0.18, depth], [0, 7.8, center]);
  for (let z = 4; z > end; z -= 6.5) {
    arch(world, z);
    box(world, palaceTimber(), [1.05, 0.09, 1.7], [0, 7.66, z - 2.5]);
    box(world, shared.light, [0.55, 0.016, 0.9], [0, 7.604, z - 2.5]);
  }
  doors.forEach(door => world.add(door));
  world.userData.doorHandles = loadMedusaDoorHandles(doors);
  world.userData.ornateDoors = loadOrnateCorridorDoors(doors);
  world.userData.reflection = reflection;
  world.userData.loopThreshold = end;
  addWallTextureFixtures(world);
  return { world, doors };
}

export function buildChamber(index) {
  const design = ROOM_DESIGNS[index];
  if (index === 4) return createAuctionArena(design);
  if (index === 6) return createFaceWaterfall(design);
  if (index === 7) return createFinalReflection(design);
  const group = new THREE.Group();
  group.name = `Room${index + 1}_${design.kind}`;
  const openCaptureSpace = false;
  const stone = openCaptureSpace ? null : palaceWall(8);
  const floor = createBlackMarbleFloor();
  box(group, floor, [11.4, 0.14, 14.5], [0, -0.08, -7.2]);
  if (!openCaptureSpace) {
  box(group, stone, [0.3, 8, 14.5], [-5.6, 4, -7.2]);
  box(group, stone, [0.3, 8, 14.5], [5.6, 4, -7.2]);
  box(group, stone, [11.4, 8, 0.3], [0, 4, -14.4]);
  for (const side of [-1, 1]) {
    box(group, stone, [3.8, 8, 0.27], [side * 3.65, 4, -0.15]);
    box(group, shared.gold, [0.04, 6.9, 0.04], [side * 5.4, 3.5, -13.8]);
    box(group, shared.gold, [0.04, 6.9, 0.04], [side * 5.4, 3.5, -0.7]);
    for (const z of [-3.4, -8.3, -13.2]) column(group, side * 5.05, z, 6.65);
    box(group, shared.light, [0.06, 0.06, 13.3], [side * 5.25, 7.1, -7.1]);
  }
  box(group, stone, [3.5, 3.15, 0.27], [0, 6.45, -0.15]);
  box(group, palaceCeiling(), [11.4, 0.14, 14.5], [0, 8, -7.2]);
  for (const z of [-1.1, -5.5, -10, -13.8]) arch(group, z, 10.6, 6.3, 7.8);
  const ceilingLight = new THREE.Mesh(new THREE.CircleGeometry(2.7, 64), shared.light);
  ceilingLight.rotation.x = Math.PI / 2;
  ceilingLight.position.set(0, 7.89, -6.6);
  group.add(ceilingLight);
  const chandelier = new THREE.Group();
  for (const [r, y] of [[1.85, 6.9], [1.3, 6.55], [0.75, 6.2]]) {
    const halo = ring(chandelier, r, 0.035, [0, y, -6.6]);
    halo.rotation.x = Math.PI / 2;
    const glow = ring(chandelier, r - 0.06, 0.015, [0, y - 0.02, -6.6], shared.light);
    glow.rotation.x = Math.PI / 2;
  }
  group.add(chandelier);
  }
  const mainLight = new THREE.PointLight(0xffe4ca, 22, 21, 2);
  mainLight.position.set(0, 6.6, -6.6);
  const accentLight = new THREE.PointLight(0xffdfbd, 4, 12, 2);
  accentLight.position.set(0, 3.9, -9.2);
  group.add(mainLight, accentLight);
  const entryLights = new THREE.Group();
  entryLights.position.z = -0.3;
  entryLights.rotation.y = Math.PI;
  group.add(entryLights);
  if (!openCaptureSpace) addDoorUplights(entryLights, { span: 2.16, power: 20 });
  const reflection = makeReflection(11, 14,384);
  reflection.position.set(0, 0.008, -7.2);
  group.add(reflection);

  // The existing live form is mounted here as a physical wall console.
  box(group, shared.plaque, [6.5, 4.7, 0.2], [0, 3.85, -14.08]);
  const workstationSign = label('WALK CLOSER TO USE THE WORKSTATION', 4.8, 0.45);
  workstationSign.position.set(0, 3.85, -13.95);
  group.add(workstationSign);
  for (const side of [-1, 1]) {
    box(group, shared.gold, [0.045, 4.7, 0.25], [side * 3.27, 3.85, -13.95]);
    box(group, shared.gold, [6.6, 0.045, 0.25], [0, 3.85 + side * 2.35, -13.95]);
  }
  const heading = label(design.name.toUpperCase(), 5.3, 0.5);
  heading.position.set(0, 6.5, -14);
  group.add(heading);
  const exitSign = label('RETURN TO THE GALLERY', 2.8, 0.4);
  exitSign.rotation.y = Math.PI;
  exitSign.position.set(0, 5.35, -0.32);
  group.add(exitSign);

  const exhibit = new THREE.Group();
  exhibit.position.set(0, 2.65, -6.4);
  group.add(exhibit);
  const animated = [];
  if (design.kind === 'frames') {
    exhibit.name = 'LiveFaceExhibit';
    exhibit.position.y = 2.95;
  }
  let hit = null;
  const consoleHit = new THREE.Mesh(new THREE.PlaneGeometry(6.7, 4.7), new THREE.MeshBasicMaterial({ visible: false }));
  consoleHit.position.set(0, 3.85, -13.85);
  consoleHit.userData.roomAction = 'console';
  group.add(consoleHit);
  const exitHit = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 5.4), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  exitHit.position.set(0, 2.6, -0.3);
  exitHit.userData.roomAction = 'exit';
  group.add(exitHit);
  addWallTextureFixtures(group);
  group.userData = { reflection, exhibit, animated, accentLight, hits: [...(hit ? [hit] : []), consoleHit, exitHit], activeExhibit: false, design };
  return group;
}
