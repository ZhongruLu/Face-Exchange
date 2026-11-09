import {createScenePerformance} from './scenePerformance.js';
import { createCorridorParticles } from './corridorParticles.js';
import {createVideoExhibit} from './videoExhibit.js';
import {createCatalogueCabinet} from './catalogueCabinet.js';
import {createWallResearch} from './wallResearch.js';
import { translate, onLanguageChange } from './language.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { materialLibrary } from './materialLibrary.js';
import { createEntrance, EYE_Y } from './processionalEntrance.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildSpatialCorridor } from './spatialArchitecture.js';
import { createSpatialRooms } from './spatialRooms.js';
import { updateCorridorUplights } from './doorUplights.js';
import { ENTRANCE_SCROLL_PER_PIXEL, ENTRANCE_SMOOTHING, smoothEntrancePosition } from './entranceMotion.js';
import { createGoldenGuide } from './goldenGuide.js';
import { createDoorApproach } from './doorApproach.js';
import { createWallGallery } from './wallGallery.js';

const LINE_COLOR = 0xcdb36d;
const ACTIVE_COLOR = 0xf0cf78;
const MUTED_COLOR = 0x756a50;
const BG_COLOR = 0x090806;
const GOLD_COLOR = 0xc79a3b;
const DEEP_GOLD_COLOR = 0x6e4816;
const VELVET_COLOR = 0x6e0712;
import { STATION_GAP, DOOR_VIEW_DISTANCE } from './corridorLayout.js';
const START_Z = 3.2;
const WALK_SPEED = 0.0018;
const MAX_VELOCITY = 0.21;
const NODE_HIGHLIGHT_DISTANCE = 13;
const NODE_INTERACTION_DISTANCE = 11;
const NODE_ACTIVE_DISTANCE = 9;
const ENTRANCE_OUTSIDE_Z = 34;
const ENTRANCE_READY_Z = 9.5;
const ENTRANCE_GATE_Z = 5.45;

// ── TEXTURE / MATERIAL HELPERS ──────────────────────
const textureLoader = new THREE.TextureLoader();

function makeLuxuryMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: options.metalness ?? 0.62,
    roughness: options.roughness ?? 0.3,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
  });
}

function makeAuctionTexture(kind = 'wall') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (kind === 'carpet') {
    gradient.addColorStop(0, '#3a0208');
    gradient.addColorStop(0.5, '#920f1e');
    gradient.addColorStop(1, '#260105');
  } else {
    gradient.addColorStop(0, '#130d07');
    gradient.addColorStop(0.48, '#3a2410');
    gradient.addColorStop(1, '#0a0806');
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = kind === 'carpet' ? 'rgba(238,190,75,.48)' : 'rgba(210,164,70,.28)';
  context.lineWidth = kind === 'carpet' ? 18 : 7;
  for (let inset = 42; inset < 190; inset += 48) context.strokeRect(inset, inset, canvas.width - inset * 2, canvas.height - inset * 2);
  context.globalAlpha = 0.22;
  context.fillStyle = '#f2d58a';
  for (let y = 30; y < 1024; y += 74) for (let x = 30; x < 1024; x += 74) context.fillRect(x, y, 3, 3);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function makeDoorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1200;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#f0bd55');
  gradient.addColorStop(0.22, '#8b4c0e');
  gradient.addColorStop(0.48, '#e3aa3c');
  gradient.addColorStop(0.76, '#6b3507');
  gradient.addColorStop(1, '#d6982d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(255,231,160,.82)';
  context.lineWidth = 18;
  context.strokeRect(38, 38, canvas.width - 76, canvas.height - 76);
  context.strokeStyle = 'rgba(77,34,2,.75)';
  context.lineWidth = 10;
  context.strokeRect(78, 86, canvas.width - 156, 420);
  context.strokeRect(78, 570, canvas.width - 156, 510);
  context.strokeStyle = 'rgba(255,220,124,.58)';
  context.lineWidth = 8;
  for (let ring = 0; ring < 4; ring += 1) {
    context.beginPath();
    context.ellipse(canvas.width / 2, 315, 185 - ring * 24, 150 - ring * 18, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.translate(canvas.width / 2, 815);
  for (let leaf = 0; leaf < 12; leaf += 1) {
    context.rotate(Math.PI / 6);
    context.beginPath();
    context.ellipse(0, -115, 28, 92, 0, 0, Math.PI * 2);
    context.stroke();
  }
  context.resetTransform();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeBannerTexture(headline, words) {
  const canvas = document.createElement('canvas');
  canvas.width = 420;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#38030a');
  gradient.addColorStop(0.52, '#790b17');
  gradient.addColorStop(1, '#270106');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#c9973c';
  context.lineWidth = 8;
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  context.textAlign = 'center';
  context.fillStyle = '#e7bd68';
  context.font = '600 52px Georgia';
  const titleLines = headline.split(' ');
  titleLines.forEach((line, index) => context.fillText(line, canvas.width / 2, 150 + index * 72));
  context.fillRect(150, 390, 120, 3);
  context.font = '28px Georgia';
  context.letterSpacing = '5px';
  words.forEach((word, index) => context.fillText(word, canvas.width / 2, 560 + index * 72));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeSconce(gold, x) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.7, 12), gold);
  stem.rotation.z = x < 0 ? -0.45 : 0.45;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.09, 0.16, 16), gold);
  cup.position.set(x < 0 ? -0.14 : 0.14, 0.32, 0);
  const bulbMaterial = new THREE.MeshStandardMaterial({ color: 0xffe1a0, emissive: 0xff9d24, emissiveIntensity: 3.2, roughness: 0.2 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), bulbMaterial);
  bulb.position.set(x < 0 ? -0.14 : 0.14, 0.5, 0);
  const light = new THREE.PointLight(0xffb347, 1.8, 7, 2);
  light.position.copy(bulb.position);
  group.add(stem, cup, bulb, light);
  group.position.set(x, 3.8, 0.58);
  return group;
}

function addGoldMoulding(group, width, height, z = 0) {
  const material = makeLuxuryMaterial(GOLD_COLOR, { metalness: 0.78, roughness: 0.22 });
  const vertical = new THREE.BoxGeometry(0.12, height, 0.12);
  const horizontal = new THREE.BoxGeometry(width, 0.12, 0.12);
  const left = new THREE.Mesh(vertical, material);
  const right = new THREE.Mesh(vertical, material);
  const top = new THREE.Mesh(horizontal, material);
  const bottom = new THREE.Mesh(horizontal, material);
  left.position.set(-width / 2, 0, z);
  right.position.set(width / 2, 0, z);
  top.position.set(0, height / 2, z);
  bottom.position.set(0, -height / 2, z);
  group.add(left, right, top, bottom);
}

function createTexturedMaterial(name) {
  const config = materialLibrary[name];
  if (!config) return null;
  const texture = textureLoader.load(config.texture, (loadedTexture) => {
    loadedTexture.colorSpace = THREE.SRGBColorSpace;
  });
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(config.repeat[0], config.repeat[1]);
  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(config.color),
    map: texture,
    transparent: true,
    opacity: config.opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return material;
}

function createPolishedFloorMaterial() {
  const basic = createTexturedMaterial('floor');
  if (!basic) return new THREE.MeshStandardMaterial({ color: 0x100d09, roughness: 0.22, metalness: 0.28 });
  return new THREE.MeshPhysicalMaterial({
    map: basic.map,
    color: 0xffffff,
    metalness: 0.34,
    roughness: 0.2,
    clearcoat: 0.78,
    clearcoatRoughness: 0.12,
    side: THREE.DoubleSide,
  });
}

// A broad, broken reflection reads more like polished stone than a sharp mirror.
function makeFloorReflectionTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const glow = ctx.createLinearGradient(0, 0, canvas.width, 0);
  glow.addColorStop(0, 'rgba(255,167,57,0)');
  glow.addColorStop(0.26, 'rgba(255,177,67,.2)');
  glow.addColorStop(0.5, 'rgba(255,210,121,.63)');
  glow.addColorStop(0.74, 'rgba(255,177,67,.2)');
  glow.addColorStop(1, 'rgba(255,167,57,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 128, 512);
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createLinearGradient(0, 0, 0, 512);
  fade.addColorStop(0, 'rgba(255,255,255,0)');
  fade.addColorStop(0.17, 'rgba(255,255,255,.8)');
  fade.addColorStop(0.48, 'rgba(255,255,255,1)');
  fade.addColorStop(0.8, 'rgba(255,255,255,.42)');
  fade.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 128, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch (error) {
    return false;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

function makeLineMaterial(color = LINE_COLOR, opacity = 0.45) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

function makeRectLines(width, height, color = LINE_COLOR, opacity = 0.58) {
  const x = width / 2;
  const y = height / 2;
  const points = [
    new THREE.Vector3(-x, -y, 0),
    new THREE.Vector3(x, -y, 0),
    new THREE.Vector3(x, -y, 0),
    new THREE.Vector3(x, y, 0),
    new THREE.Vector3(x, y, 0),
    new THREE.Vector3(-x, y, 0),
    new THREE.Vector3(-x, y, 0),
    new THREE.Vector3(-x, -y, 0),
  ];
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), makeLineMaterial(color, opacity));
}

function makeEllipseLines(width, height, segments = 72, color = LINE_COLOR, opacity = 0.58) {
  const points = [];
  for (let index = 0; index < segments; index += 1) {
    const a = (index / segments) * Math.PI * 2;
    const b = ((index + 1) / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * width * 0.5, Math.sin(a) * height * 0.5, 0));
    points.push(new THREE.Vector3(Math.cos(b) * width * 0.5, Math.sin(b) * height * 0.5, 0));
  }
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), makeLineMaterial(color, opacity));
}

function makeFaceFeatureLines(color = LINE_COLOR, opacity = 0.44) {
  const points = [
    new THREE.Vector3(0, 1.34, 0), new THREE.Vector3(0, -1.24, 0),
    new THREE.Vector3(-0.92, 0.48, 0), new THREE.Vector3(-0.34, 0.48, 0),
    new THREE.Vector3(0.34, 0.48, 0), new THREE.Vector3(0.92, 0.48, 0),
    new THREE.Vector3(-0.42, -0.66, 0), new THREE.Vector3(0.42, -0.66, 0),
    new THREE.Vector3(-1.18, 0.04, 0), new THREE.Vector3(1.18, 0.04, 0),
    new THREE.Vector3(-0.78, 1.02, 0), new THREE.Vector3(0.78, 1.02, 0),
    new THREE.Vector3(-0.78, -1.02, 0), new THREE.Vector3(0.78, -1.02, 0),
  ];
  return new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points), makeLineMaterial(color, opacity));
}

function makeTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 112;
  const draw = () => {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'rgba(12, 8, 5, .92)';
  context.fillRect(5, 5, 502, 102);
  context.strokeStyle = '#bd9250';
  context.lineWidth = 2;
  context.strokeRect(6, 6, 500, 100);
  context.fillStyle = '#e9c47d';
  context.font = '600 43px Georgia';
  context.textAlign = 'center';
  context.fillText(translate(text), canvas.width / 2, 69);

  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const unsubscribe=onLanguageChange(()=>{draw();texture.needsUpdate=true;});
  texture.addEventListener('dispose',unsubscribe);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.9, 0.64, 1);
  return sprite;
}

function makeMarketSign() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 220;
  const draw = () => {
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(156, 201, 164, 0.55)';
  context.lineWidth = 2;
  context.strokeRect(36, 34, canvas.width - 72, canvas.height - 68);
  context.fillStyle = '#9cc9a4';
  context.font = '600 44px monospace';
  context.textAlign = 'center';
  context.fillText(translate('FACE EXCHANGE'), canvas.width / 2, 96);
  context.fillStyle = '#aeb9b0';
  context.font = '24px monospace';
  context.fillText(translate('SACRED COMMODITY EXCHANGE'), canvas.width / 2, 142);

  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const unsubscribe=onLanguageChange(()=>{draw();texture.needsUpdate=true;});
  texture.addEventListener('dispose',unsubscribe);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.72, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.6, 1.58, 1);
  sprite.position.set(-4.82, 3.9, 3.1);
  sprite.rotation.y = Math.PI / 2.7;
  return sprite;
}

function makeEntranceSign() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 260;
  const draw = () => {
  const context = canvas.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, 'rgba(11,8,5,.98)');
  gradient.addColorStop(0.5, 'rgba(33,20,7,.98)');
  gradient.addColorStop(1, 'rgba(8,6,4,.98)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#b77e25';
  context.lineWidth = 12;
  context.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
  context.strokeStyle = 'rgba(255,221,136,.72)';
  context.lineWidth = 3;
  context.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
  context.fillStyle = '#edc66e';
  context.font = '600 76px Georgia';
  context.textAlign = 'center';
  context.fillText(translate('FACE EXCHANGE'), canvas.width / 2, 120);
  context.fillStyle = '#d7ad55';
  context.font = '28px Georgia';
  context.fillText(translate('I D E N T I T Y   A S S E T   M A R K E T'), canvas.width / 2, 182);

  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const unsubscribe=onLanguageChange(()=>{draw();texture.needsUpdate=true;});
  texture.addEventListener('dispose',unsubscribe);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.96, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.8, 1.78, 1);
  return sprite;
}

function makeEntranceBackdropTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');
  const gold = '#b98027';
  const deepGold = '#563109';
  const wall = ctx.createLinearGradient(0, 0, 0, canvas.height);
  wall.addColorStop(0, '#0b0806');
  wall.addColorStop(0.48, '#211308');
  wall.addColorStop(1, '#090705');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const glow = ctx.createRadialGradient(800, 340, 10, 800, 340, 650);
  glow.addColorStop(0, 'rgba(236,175,65,.22)');
  glow.addColorStop(0.48, 'rgba(116,61,10,.12)');
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = deepGold;
  ctx.lineWidth = 18;
  for (const x of [130, 280, 1320, 1470]) {
    ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, 790); ctx.stroke();
    ctx.fillStyle = gold; ctx.fillRect(x - 30, 92, 60, 22); ctx.fillRect(x - 46, 770, 92, 26);
  }
  ctx.strokeStyle = 'rgba(228,174,74,.38)';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(800, 350, 292, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(800, 350, 255, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.55)';
  ctx.fillRect(510, 340, 580, 440);
  ctx.strokeStyle = 'rgba(225,174,74,.35)';
  ctx.strokeRect(510, 340, 580, 440);
  for (const x of [60, 1540]) {
    const g = ctx.createRadialGradient(x, 470, 4, x, 470, 165);
    g.addColorStop(0, 'rgba(245,191,79,.42)'); g.addColorStop(1, 'rgba(245,191,79,0)');
    ctx.fillStyle = g; ctx.fillRect(x - 165, 305, 330, 330);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createEntranceBackdrop() {
  const group = new THREE.Group();
  group.name = 'backgroundPlane';
  const material = new THREE.MeshBasicMaterial({ map: makeEntranceBackdropTexture(), transparent: true, opacity: 0.94 });
  const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), material);
  backgroundPlane.position.set(0, 4.15, -1.5);
  backgroundPlane.name = 'backgroundPlane';
  group.add(backgroundPlane);

  // A supplied reference is an enhancement, not a dependency: use it as the
  // furthest architectural layer and retain all physical foreground geometry.
  // The HEAD check avoids a noisy missing-texture request in development.
  fetch(materialLibrary.entranceReference.texture, { method: 'HEAD' })
    .then((response) => {
      if (!response.ok) return;
      textureLoader.load(materialLibrary.entranceReference.texture, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        material.map = texture;
        material.color.set(materialLibrary.entranceReference.color);
        material.opacity = materialLibrary.entranceReference.opacity;
        material.needsUpdate = true;
      });
    })
    .catch(() => {});

  const sideMaterial = new THREE.MeshBasicMaterial({ color: 0x170d06, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
  const leftArchitecturePlane = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 7.4), sideMaterial);
  leftArchitecturePlane.position.set(-5.8, 3.65, -0.62);
  leftArchitecturePlane.rotation.y = Math.PI / 13;
  leftArchitecturePlane.name = 'leftArchitecturePlane';
  const rightArchitecturePlane = leftArchitecturePlane.clone();
  rightArchitecturePlane.position.x = 5.8;
  rightArchitecturePlane.rotation.y = -Math.PI / 13;
  rightArchitecturePlane.name = 'rightArchitecturePlane';
  group.add(leftArchitecturePlane, rightArchitecturePlane);
  group.userData = { backgroundPlane, leftArchitecturePlane, rightArchitecturePlane };
  return group;
}

function createEntranceGate() {
  const group = new THREE.Group();
  group.position.set(0, 0, ENTRANCE_GATE_Z);
  group.userData = { isEntranceGate: true };
  const backdrop = createEntranceBackdrop();
  group.add(backdrop);

  const depth = new THREE.Group();
  for (let index = 0; index < 4; index += 1) {
    const frame = makeRectLines(6.8 - index * 0.35, 6.2 - index * 0.24, LINE_COLOR, 0.18 - index * 0.025);
    frame.position.set(0, 3.05, -index * 0.46);
    depth.add(frame);
  }
  group.add(depth);

  const faceOutline = makeEllipseLines(6.1, 6.9, 96, ACTIVE_COLOR, 0.2);
  faceOutline.position.set(0, 3.05, 0.04);
  group.add(faceOutline);

  // ── ENTRANCE GATE PANELS ──
  // Replace entrance gate panel texture → edit materialLibrary.js > entrancePanel
  // Put new texture at → public/assets/textures/doors/
  const panelMaterial = makeLuxuryMaterial(0xffffff, { metalness: 0.72, roughness: 0.24, emissive: 0x2b1603, emissiveIntensity: 0.12, side: THREE.DoubleSide });
  panelMaterial.map = makeDoorTexture();
  const panelGeometry = new THREE.PlaneGeometry(2.82, 4.95);

  const leftDoorMesh = new THREE.Mesh(panelGeometry, panelMaterial.clone());
  leftDoorMesh.position.set(-1.41, 2.56, 0.06);
  leftDoorMesh.name = 'leftDoorMesh';
  const rightDoorMesh = new THREE.Mesh(panelGeometry, panelMaterial.clone());
  rightDoorMesh.position.set(1.41, 2.56, 0.06);
  rightDoorMesh.name = 'rightDoorMesh';
  const leftDoorPivot = new THREE.Group();
  const rightDoorPivot = new THREE.Group();
  leftDoorPivot.add(leftDoorMesh);
  rightDoorPivot.add(rightDoorMesh);
  const leftPanel = leftDoorMesh;
  const rightPanel = rightDoorMesh;

  [leftPanel, rightPanel].forEach((panel, index) => {
    const reliefGold = makeLuxuryMaterial(0xe0a635, { metalness: 0.84, roughness: 0.18, emissive: 0x271200, emissiveIntensity: 0.12 });
    const topRosette = new THREE.Mesh(new THREE.TorusKnotGeometry(0.28, 0.07, 72, 10, 2, 3), reliefGold);
    topRosette.scale.set(1, 1.22, 0.36);
    topRosette.position.set(index === 0 ? 0.28 : -0.28, 1.25, 0.11);
    const lowerRosette = new THREE.Mesh(new THREE.TorusKnotGeometry(0.24, 0.06, 64, 9, 2, 3), reliefGold);
    lowerRosette.scale.set(1, 1.2, 0.34);
    lowerRosette.position.set(index === 0 ? 0.24 : -0.24, -1.05, 0.11);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.54, 12), reliefGold);
    handle.position.set(index === 0 ? 1.03 : -1.03, -0.2, 0.16);
    const handleTop = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), reliefGold);
    const handleBottom = handleTop.clone();
    handleTop.position.set(handle.position.x, 0.07, 0.16);
    handleBottom.position.set(handle.position.x, -0.47, 0.16);
    panel.add(topRosette, lowerRosette, handle, handleTop, handleBottom);
    const panelLineTop = makeRectLines(2.18, 1.7, 0xf0cf78, 0.62);
    panelLineTop.position.set(0, 1.03, 0.13);
    const panelLineBottom = makeRectLines(2.18, 2.2, 0xf0cf78, 0.56);
    panelLineBottom.position.set(0, -1.05, 0.13);
    panel.add(panelLineTop, panelLineBottom);
  });

  const architectural = new THREE.Group();
  const gold = makeLuxuryMaterial(GOLD_COLOR, { metalness: 0.82, roughness: 0.2, emissive: 0x2d1803, emissiveIntensity: 0.18 });
  const darkGold = makeLuxuryMaterial(DEEP_GOLD_COLOR, { metalness: 0.65, roughness: 0.34 });
  const columnGeometry = new THREE.CylinderGeometry(0.28, 0.36, 5.75, 28);
  [-3.18, 3.18].forEach((x) => {
    const column = new THREE.Mesh(columnGeometry, gold);
    column.position.set(x, 2.92, -0.02);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.34, 20), darkGold);
    base.position.set(x, 0.17, -0.02);
    const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.38, 0.38, 20), gold);
    capital.position.set(x, 5.7, -0.02);
    const upperBand = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 10, 28), gold);
    upperBand.rotation.x = Math.PI / 2;
    upperBand.position.set(x, 5.48, -0.02);
    const lowerBand = upperBand.clone();
    lowerBand.position.y = 0.48;
    architectural.add(column, base, capital, upperBand, lowerBand);
  });
  [-4.05, 4.05].forEach((x) => {
    const outerColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 7.25, 32), darkGold);
    outerColumn.position.set(x, 3.62, -0.32);
    const outerHighlight = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.34, 6.5, 28), gold);
    outerHighlight.position.set(x, 3.55, -0.02);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.82, 0.72), darkGold);
    plinth.position.set(x, 0.41, -0.18);
    const capital = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.42, 0.78), gold);
    capital.position.set(x, 7.05, -0.12);
    architectural.add(outerColumn, outerHighlight, plinth, capital);
  });
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.35, 0.48, 0.42), gold);
  lintel.position.set(0, 5.95, -0.03);
  const lintelTop = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.22, 0.62), darkGold);
  lintelTop.position.set(0, 7.18, -0.18);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 18), gold);
  crown.scale.set(0.75, 1.08, 0.42);
  crown.position.set(0, 7.63, -0.02);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3.18, 0.15, 12, 80), gold);
  arch.scale.y = 1.08;
  arch.position.set(0, 3.12, -0.01);
  const archInner = new THREE.Mesh(new THREE.TorusGeometry(2.88, 0.1, 12, 80), darkGold);
  archInner.scale.y = 1.06;
  archInner.position.set(0, 3.12, 0.02);
  architectural.add(lintel, lintelTop, crown, arch, archInner);
  for (let index = 0; index < 7; index += 1) {
    const angle = Math.PI * 0.12 + index * Math.PI * 0.126;
    const ornament = new THREE.Mesh(new THREE.TorusKnotGeometry(0.13, 0.045, 48, 8, 2, 3), gold);
    ornament.position.set(Math.cos(angle) * 3.52, 3.08 + Math.sin(angle) * 3.72, 0.06);
    ornament.scale.set(1, 1, 0.4);
    architectural.add(ornament);
  }

  const bannerMaterialLeft = new THREE.MeshStandardMaterial({ map: makeBannerTexture('YOUR FACE HAS VALUE', ['LICENCE', 'AUCTION', 'REDEFINE']), roughness: 0.78, side: THREE.DoubleSide });
  const bannerMaterialRight = new THREE.MeshStandardMaterial({ map: makeBannerTexture('MORE THAN A PERSON', ['IDENTITY', 'DATA', 'POTENTIAL']), roughness: 0.78, side: THREE.DoubleSide });
  const leftBanner = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 4.7), bannerMaterialLeft);
  leftBanner.position.set(-5.02, 3.54, -0.12);
  const rightBanner = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 4.7), bannerMaterialRight);
  rightBanner.position.set(5.02, 3.54, -0.12);
  architectural.add(leftBanner, rightBanner, makeSconce(gold, -2.55), makeSconce(gold, 2.55));

  const carpetTexture = makeAuctionTexture('carpet');
  carpetTexture.repeat.set(1, 5);
  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 12),
    new THREE.MeshStandardMaterial({ map: carpetTexture, color: 0xffffff, roughness: 0.7, metalness: 0.05 }),
  );
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, 0.025, 5.6);

  const marbleTexture = makeAuctionTexture('wall');
  marbleTexture.repeat.set(6, 8);
  const marbleFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.MeshStandardMaterial({ map: marbleTexture, color: 0x51402b, metalness: 0.34, roughness: 0.2 }),
  );
  marbleFloor.rotation.x = -Math.PI / 2;
  marbleFloor.position.set(0, -0.015, 4.6);

  const ropes = new THREE.Group();
  ropes.name = 'foregroundRopes';
  const ropeMaterial = makeLuxuryMaterial(VELVET_COLOR, { metalness: 0.05, roughness: 0.75 });
  [-2.2, 2.2].forEach((x) => {
    for (let z = 1.2; z <= 8.8; z += 2.55) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 1.25, 14), gold);
      post.position.set(x, 0.64, z);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), gold);
      finial.position.set(x, 1.28, z);
      ropes.add(post, finial);
      if (z < 8) {
        const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.55, 10), ropeMaterial);
        rope.rotation.x = Math.PI / 2;
        rope.position.set(x, 1.12, z + 1.275);
        ropes.add(rope);
      }
    }
  });

  const divider = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.08, 0.11), new THREE.Vector3(0, 5.02, 0.11)]),
    makeLineMaterial(ACTIVE_COLOR, 0.34),
  );
  const leftLines = makeRectLines(2.82, 4.95, LINE_COLOR, 0.44);
  leftLines.position.set(-1.41, 2.56, 0.12);
  const rightLines = makeRectLines(2.82, 4.95, LINE_COLOR, 0.44);
  rightLines.position.set(1.41, 2.56, 0.12);
  leftDoorPivot.add(leftLines);
  rightDoorPivot.add(rightLines);
  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(3.36, 0.045, 10, 96),
    makeLuxuryMaterial(0xf2bd55, { metalness: 0.72, roughness: 0.22, emissive: 0xb97819, emissiveIntensity: 0.65, transparent: true, opacity: 0.25 }),
  );
  haloRing.scale.y = 1.12;
  haloRing.position.set(0, 3.05, -0.28);
  haloRing.name = 'haloRing';
  const scanLine = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.65, 2.56, 0.14), new THREE.Vector3(2.65, 2.56, 0.14)]),
    makeLineMaterial(ACTIVE_COLOR, 0.26),
  );

  const sign = makeEntranceSign();
  sign.position.set(0, 6.62, 0.46);
  sign.scale.set(6.4, 1.42, 1);
  sign.renderOrder = 4;

  const plaque = makeRectLines(2.4, 0.5, LINE_COLOR, 0.24);
  plaque.position.set(0, 0.48, 0.12);

  const hit = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 6.4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.set(0, 3.12, 0.22);
  hit.userData = { isEntranceHit: true };

  group.add(marbleFloor, carpet, ropes, architectural, leftDoorPivot, rightDoorPivot, haloRing, divider, scanLine, sign, plaque, hit);
  group.userData.leftPanel = leftPanel;
  group.userData.rightPanel = rightPanel;
  group.userData.leftDoorPivot = leftDoorPivot;
  group.userData.rightDoorPivot = rightDoorPivot;
  group.userData.haloRing = haloRing;
  group.userData.backdrop = backdrop;
  group.userData.sign = sign;
  group.userData.hit = hit;
  return group;
}

// Reference-led 2.5D entrance: the supplied artwork carries the architecture,
// lettering and lighting. Only the two door leaves are physical meshes.
function createReferenceEntranceGate() {
  const group = new THREE.Group();
  group.name = 'referenceEntranceGate';
  group.position.set(0, 0, ENTRANCE_GATE_Z);
  group.userData = { isEntranceGate: true };

  const backdropMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  textureLoader.load('/assets/entrance/layers/entrance_architecture_base.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    backdropMaterial.map = texture;
    backdropMaterial.needsUpdate = true;
  });
  const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(16, 9), backdropMaterial);
  backgroundPlane.position.set(0, 4.15, -0.34);
  backgroundPlane.name = 'entranceArchitectureBase';
  const backdrop = new THREE.Group();
  backdrop.add(backgroundPlane);

  const makeDoor = (path, side) => {
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.22, transparent: true, side: THREE.DoubleSide });
    textureLoader.load(path, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      // The extracted door files include a transparent safety margin. Stretch
      // only the useful portion so the shut leaves meet at the original seam.
      texture.repeat.x = 1.35;
      texture.offset.x = -0.175;
      material.map = texture;
      material.needsUpdate = true;
    });
    const pivot = new THREE.Group();
    pivot.position.set(side * 1.9, 0.9, 0.08);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(2.9, 4.65, 0.075), material);
    leaf.position.set(side * -1.45, 2.325, 0);
    leaf.name = side < 0 ? 'leftDoorLeaf' : 'rightDoorLeaf';
    pivot.add(leaf);
    return { pivot, leaf };
  };

  const left = makeDoor('/assets/entrance/layers/left_door.png', -1);
  const right = makeDoor('/assets/entrance/layers/right_door.png', 1);

  const haloMaterial = new THREE.MeshBasicMaterial({ color: 0xffc35c, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false });
  const haloRing = new THREE.Mesh(new THREE.TorusGeometry(1.54, 0.014, 8, 64), haloMaterial);
  haloRing.scale.y = 1.42;
  haloRing.position.set(0, 3.15, -0.24);
  haloRing.name = 'innerDoorwayHalo';

  const hit = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 5.6), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  hit.position.set(0, 3.25, 0.18);
  hit.userData = { isEntranceHit: true };

  group.add(backdrop, haloRing, left.pivot, right.pivot, hit);
  group.userData = { ...group.userData, backdrop, leftDoorPivot: left.pivot, rightDoorPivot: right.pivot, haloRing, hit };
  return group;
}

function setMaterialOpacity(object, opacity) {
  object.traverse((child) => {
    if (child.userData?.isDoorHit || child.userData?.isEntranceHit || child.userData?.isDoorway || child.userData?.isDoorArchitecture) return;
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = child.userData?.isDoorPanel ? Math.min(1, opacity * 5) : opacity;
    });
  });
}

function setMaterialColor(object, color) {
  object.traverse((child) => {
    if (child.userData?.isDoorHit || child.userData?.isEntranceHit || child.userData?.isDoorway || child.userData?.isDoorArchitecture) return;
    if (child.userData?.isDoorPanel) return;
    if (!child.material?.color) return;
    child.material.color.setHex(color);
  });
}

function createDoor(station, index, totalStations) {
  const group = new THREE.Group();
  const side = index === 0 ? -1 : index === totalStations - 1 ? 0 : index % 2 === 0 ? 1 : -1;
  const z = -index * STATION_GAP;
  const x = side === 0 ? 0 : side * 4.9;
  group.position.set(x, 2.375, z);
  // Side doors share the wall plane; the last door faces the corridor's end.
  group.rotation.y = side === 0 ? 0 : side > 0 ? -Math.PI / 2 : Math.PI / 2;
  group.userData = { stationIndex: index, view: station.view, label: station.label, isDoorGroup: true };

  const stone = makeLuxuryMaterial(0x160f0a, { metalness: 0.2, roughness: 0.36 });
  const trim = makeLuxuryMaterial(0xc09243, { metalness: 0.72, roughness: 0.25, emissive: 0x37200a, emissiveIntensity: 0.18 });
  const surround = new THREE.Group();
  for (const edge of [-1, 1]) {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.92, 0.14), stone);
    jamb.position.set(edge * 1.72, 0.03, -0.005);
    const seam = new THREE.Mesh(new THREE.BoxGeometry(0.025, 4.92, 0.15), trim);
    seam.position.set(edge * 1.86, 0.03, 0.025);
    surround.add(jamb, seam);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.22, 0.14), stone);
  lintel.position.set(0, 2.48, -0.005);
  const lintelTrim = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.035, 0.15), trim);
  lintelTrim.position.set(0, 2.59, 0.025);
  const threshold = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.055, 0.18), trim);
  threshold.position.set(0, -2.345, 0.045);
  surround.add(lintel, lintelTrim, threshold);
  surround.traverse((child) => {
    if (child.isMesh) child.userData.isDoorArchitecture = true;
  });
  group.add(surround);

  const doorway = new THREE.Mesh(
    new THREE.PlaneGeometry(3.22, 4.78),
    new THREE.MeshBasicMaterial({ color: 0x050302, side: THREE.DoubleSide }),
  );
  doorway.position.z = -0.045;
  doorway.userData.isDoorway = true;
  group.add(doorway);

  const halfGeometry = new THREE.PlaneGeometry(1.6, 4.75);
  const doorPath = materialLibrary.stationDoors[index] || materialLibrary.stationDoors[0];
  const makeLeaf = (half) => {
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true });
    textureLoader.load(doorPath, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.repeat.set(0.5, 1);
      texture.offset.x = half === 'left' ? 0 : 0.5;
      texture.anisotropy = 8;
      material.map = texture;
      material.needsUpdate = true;
    });
    const panel = new THREE.Mesh(halfGeometry, material);
    panel.userData = { isDoorPanel: true };
    return panel;
  };

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-1.6, 0, 0.04);
  const leftPanel = makeLeaf('left');
  leftPanel.position.x = 0.8;
  leftPivot.add(leftPanel);

  const rightPivot = new THREE.Group();
  rightPivot.position.set(1.6, 0, 0.04);
  const rightPanel = makeLeaf('right');
  rightPanel.position.x = -0.8;
  rightPivot.add(rightPanel);
  group.add(leftPivot, rightPivot);

  const label = makeTextSprite(station.label);
  label.position.set(0, 2.7, 0.1);
  group.add(label);

  const hit = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5, 5.8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.z = 0.18;
  hit.userData = { stationIndex: index, view: station.view, isDoorHit: true };
  group.add(hit);

  group.userData.leftPivot = leftPivot;
  group.userData.rightPivot = rightPivot;
  group.userData.hit = hit;
  group.userData.nodeZ = z;
  group.userData.side = side;
  return group;
}

function makeEntranceGuide() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 720;
  const draw=()=>{
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#130e09';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#b79354';
  ctx.lineWidth = 5;
  ctx.strokeRect(24, 24, 976, 672);
  ctx.strokeStyle = '#80613a';
  ctx.lineWidth = 2;
  ctx.strokeRect(39, 39, 946, 642);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c7a866';
  ctx.font = '22px Georgia';
  ctx.fillText(translate('FACE EXCHANGE  ·  A PRIVATE INVITATION'), 512, 105);
  ctx.fillStyle = '#f1dfb9';
  ctx.font = '58px Georgia';
  ctx.fillText(translate('The art of being valued'), 512, 194);
  ctx.fillStyle = '#cbb68d';
  ctx.font = '25px Georgia';
  ctx.fillText(translate('I   OFFER YOUR LIKENESS'), 512, 285);
  ctx.fillText(translate('II   DISCOVER ITS MARKET LIFE'), 512, 365);
  ctx.fillText(translate('III   MOVE AT YOUR OWN PACE'), 512, 445);
  ctx.fillStyle = '#a9997d';
  ctx.font = '21px Georgia';
  ctx.fillText(translate('Scroll / W / S to walk · select a nearby room to enter'), 512, 548);
  ctx.fillText(translate('An artistic simulation. No real sale or facial recognition.'), 512, 600);
  };
  draw();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const unsubscribe=onLanguageChange(()=>{draw();texture.needsUpdate=true;});
  texture.addEventListener('dispose',unsubscribe);
  const guide = new THREE.Mesh(
    new THREE.PlaneGeometry(4.3, 3),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false }),
  );
  // An inset plaque on the first wall, not a screen-space modal.
  guide.position.set(4.87, 3.05, -10.5);
  guide.rotation.y = -Math.PI / 2;
  guide.name = 'wallMountedEntranceGuide';
  return guide;
}

function buildCorridor(scene, stations) {
  const world = new THREE.Group();
  scene.add(world);

  const floorLines = [];
  const length = (stations.length - 1) * STATION_GAP + 18;
  for (let x = -5; x <= 5; x += 1) {
    floorLines.push(new THREE.Vector3(x, 0, 6), new THREE.Vector3(x, 0, -length));
  }
  for (let z = 6; z >= -length; z -= 2) {
    floorLines.push(new THREE.Vector3(-5, 0, z), new THREE.Vector3(5, 0, z));
  }
  const floor = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(floorLines), makeLineMaterial(LINE_COLOR, 0.025));
  world.add(floor);

  const wallLines = [];
  for (let z = 6; z >= -length; z -= 4) {
    wallLines.push(new THREE.Vector3(-5, 0, z), new THREE.Vector3(-5, 5.8, z));
    wallLines.push(new THREE.Vector3(5, 0, z), new THREE.Vector3(5, 5.8, z));
    wallLines.push(new THREE.Vector3(-5, 5.8, z), new THREE.Vector3(5, 5.8, z));
  }
  wallLines.push(new THREE.Vector3(-5, 0, 6), new THREE.Vector3(-5, 0, -length));
  wallLines.push(new THREE.Vector3(5, 0, 6), new THREE.Vector3(5, 0, -length));
  wallLines.push(new THREE.Vector3(-5, 5.8, 6), new THREE.Vector3(-5, 5.8, -length));
  wallLines.push(new THREE.Vector3(5, 5.8, 6), new THREE.Vector3(5, 5.8, -length));
  const walls = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wallLines), makeLineMaterial(LINE_COLOR, 0.025));
  world.add(walls);

  // ── TEXTURED PLANES ─────────────────────────────────
  // These sit behind the grid lines. Edit textures in materialLibrary.js
  const floorDepth = length + 4;
  const floorCenterZ = (6 + (-length)) / 2;

  // ── TEXTURED FLOOR ──
  // Replace floor texture → edit materialLibrary.js > floor
  // Put new texture at → public/assets/textures/floor/
  {
    const mat = createPolishedFloorMaterial();
    if (mat) {
      const geo = new THREE.PlaneGeometry(10.2, floorDepth);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, -0.02, floorCenterZ);
      world.add(mesh);
    }
  }

  // ── TEXTURED WALLS ──
  // Replace wall texture → edit materialLibrary.js > wall
  // Put new texture at → public/assets/textures/wall/
  {
    const mat = createTexturedMaterial('wall');
    if (mat) {
      const geo = new THREE.PlaneGeometry(floorDepth, 5.8);
      const left = new THREE.Mesh(geo, mat.clone());
      left.position.set(-5, 2.9, floorCenterZ);
      left.rotation.y = Math.PI / 2;
      world.add(left);
      const right = new THREE.Mesh(geo, mat.clone());
      right.position.set(5, 2.9, floorCenterZ);
      right.rotation.y = -Math.PI / 2;
      world.add(right);
    }
  }

  // ── TEXTURED CEILING ──
  // Replace ceiling texture → edit materialLibrary.js > ceiling
  // Put new texture at → public/assets/textures/ceiling/
  {
    const mat = createTexturedMaterial('ceiling');
    if (mat) {
      const geo = new THREE.PlaneGeometry(10.2, floorDepth);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set(0, 5.8, floorCenterZ);
      world.add(mesh);
    }
  }

  // The red carpet makes the journey feel prestigious before it becomes unsettling.
  const corridorCarpetMaterial = createTexturedMaterial('carpet');
  const corridorCarpet = new THREE.Mesh(
    new THREE.PlaneGeometry(2.7, floorDepth),
    corridorCarpetMaterial || new THREE.MeshStandardMaterial({ color: 0x760b18, roughness: 0.78 }),
  );
  corridorCarpet.rotation.x = -Math.PI / 2;
  corridorCarpet.position.set(0, 0.012, floorCenterZ);
  world.add(corridorCarpet);

  // Framed face lots turn the walls into a luxury archive of tradable identities.
  const frameGold = makeLuxuryMaterial(GOLD_COLOR, { metalness: 0.76, roughness: 0.25, emissive: 0x241301, emissiveIntensity: 0.12 });
  const portraitMaterial = createTexturedMaterial('identityFrame');
  for (let index = 0; index < stations.length * 2; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const z = 0.5 - Math.floor(index / 2) * 7.4;
    if (stations.some((_, stationIndex) => Math.abs(z + stationIndex * STATION_GAP) < 3.2)) continue;
    const portrait = new THREE.Group();
    const backing = new THREE.Mesh(
      new THREE.PlaneGeometry(2.05, 3.05),
      portraitMaterial?.clone() || new THREE.MeshBasicMaterial({ color: 0x160e07 }),
    );
    backing.position.z = 0.035;
    portrait.add(backing);
    portrait.position.set(side * 4.88, 3.05, z);
    portrait.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    world.add(portrait);
  }

  const reflectionTexture = makeFloorReflectionTexture();
  const reflectionMaterial = new THREE.MeshBasicMaterial({
    map: reflectionTexture,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const reflectionGeometry = new THREE.PlaneGeometry(1.55, 5.8);

  // Repeating gold ribs and warm pools of light give the market a ceremonial rhythm.
  for (let z = 4; z >= -length; z -= 6.5) {
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 5.8, 0.1), frameGold);
    const right = left.clone();
    left.position.set(-4.92, 2.9, z);
    right.position.set(4.92, 2.9, z);
    const top = new THREE.Mesh(new THREE.BoxGeometry(9.9, 0.1, 0.1), frameGold);
    top.position.set(0, 5.7, z);
    world.add(left, right, top);
    const warmLight = new THREE.PointLight(0xffb447, 0.75, 11, 2);
    warmLight.position.set(0, 4.8, z - 1.2);
    world.add(warmLight);
    for (const side of [-1, 1]) {
      const reflection = new THREE.Mesh(reflectionGeometry, reflectionMaterial);
      reflection.rotation.x = -Math.PI / 2;
      reflection.position.set(side * 4.05, 0.018, z - 0.45);
      reflection.renderOrder = 1;
      world.add(reflection);
      if (z > -18) {
        const sideLight = new THREE.PointLight(0xffbf68, 1.15, 6.2, 2);
        sideLight.position.set(side * 4.35, 1.75, z);
        world.add(sideLight);
      }
    }
  }

  const guideLines = [];
  stations.forEach((_, index) => {
    const z = -index * STATION_GAP;
    guideLines.push(new THREE.Vector3(-4.6, 0.04, z), new THREE.Vector3(4.6, 0.04, z));
    guideLines.push(new THREE.Vector3(-4.2, 5.4, z), new THREE.Vector3(4.2, 5.4, z));
  });
  const guides = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(guideLines), makeLineMaterial(ACTIVE_COLOR, 0.025));
  world.add(guides);
  world.add(makeMarketSign());
  world.add(makeEntranceGuide());

  // The final, forward-facing station needs a real wall behind its opening.
  const endWallMaterial = createTexturedMaterial('wall');
  if (endWallMaterial) {
    endWallMaterial.map = endWallMaterial.map.clone();
    endWallMaterial.map.repeat.set(2, 1);
    endWallMaterial.map.needsUpdate = true;
    const endWall = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 5.8), endWallMaterial);
    endWall.position.set(0, 2.9, -(stations.length - 1) * STATION_GAP - 0.16);
    world.add(endWall);
  }

  const doors = stations.map((station, index) => {
    const door = createDoor(station, index, stations.length);
    world.add(door);
    return door;
  });

  return { world, doors };
}

export function initThreeCorridor({ mount, stations, initialStation = 0, reducedMotion = false, onStationChange, onEnterDoor, onEntranceChange, onReturnRoom, onRoomAction, onFaceCaptureComplete }) {
  if (!mount || !canUseWebGL()) {
    return { isFallback: true };
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);
  // A subtle amber distance veil softens the far gallery without obscuring nearby details.
  scene.fog = new THREE.FogExp2(0x684329, 0.0095);

  const ambient = new THREE.HemisphereLight(0xffd79b, 0x392414, 0.55);
  scene.add(ambient);
  const entranceLight = new THREE.PointLight(0xffbd58, 3.4, 22, 1.6);
  entranceLight.position.set(0, 5.8, 9.2);
  scene.add(entranceLight);
  const uneasyLight = new THREE.PointLight(0xffdec4, 4, 30, 2);
  uneasyLight.position.set(0, 1.1, -6);
  scene.add(uneasyLight);
  const keyLight = new THREE.SpotLight(0xffe6d0, 55, 32, 0.85, 0.9, 2);
  keyLight.position.set(0, 7.2, -3);
  keyLight.target.position.set(0, 0, -6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight, keyLight.target);

  const camera = new THREE.PerspectiveCamera(51, 1, 0.1, 180);
  camera.position.set(0, EYE_Y, ENTRANCE_OUTSIDE_Z);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scenePerformance=createScenePerformance(renderer,scene);
  mount.append(renderer.domElement);
  const archiveOrbit=new OrbitControls(camera,renderer.domElement);
  archiveOrbit.enabled=false;archiveOrbit.enableDamping=!reducedMotion;archiveOrbit.dampingFactor=.09;
  archiveOrbit.enablePan=false;archiveOrbit.minDistance=16;archiveOrbit.maxDistance=48;
  archiveOrbit.rotateSpeed=.55;archiveOrbit.zoomSpeed=.7;
  archiveOrbit.minPolarAngle=.25;archiveOrbit.maxPolarAngle=Math.PI-.25;
  let archivePointer=null;

  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, 0.04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = 0.55;
  environment.dispose();
  pmrem.dispose();

  const { world: corridorWorld, doors } = buildSpatialCorridor(scene, stations);
  const doorApproach = createDoorApproach(corridorWorld, doors);
  const corridorParticles = createCorridorParticles({ world: corridorWorld, mount, length: (stations.length + 1) * STATION_GAP, reducedMotion });
  const videoExhibit=createVideoExhibit({world:corridorWorld,mount});
  const catalogueCabinet=createCatalogueCabinet({world:corridorWorld,mount,reducedMotion});
  const wallResearch = createWallResearch({world:corridorWorld,mount,gap:STATION_GAP});
  const wallGallery = createWallGallery({ world: corridorWorld, mount, count: stations.length, gap: STATION_GAP });

  const spatialRooms = createSpatialRooms({ scene, camera, renderer, mount, doors, stations, onCaptureComplete: detail=>{
    if(roomIndex!==2 || roomTransition?.kind==='exit' || !enabled)return;
    onFaceCaptureComplete?.(detail);
    if(!roomTransition)focusRoomConsole();
  } });
  // Official Three.js DevTools observation API, only in the local dev build.
  if (import.meta.env.DEV && window.__THREE_DEVTOOLS__) {
    window.__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: scene }));
    window.__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent('observe', { detail: renderer }));
  }
  const entranceGate = createEntrance();
  const goldenGuide = createGoldenGuide({ scene, camera, mount, reducedMotion });
  scene.add(entranceGate);
  // Physical gallery geometry is already behind the closed gate.
  corridorWorld.visible = true;
  corridorWorld.userData.reflection.visible = false;
  const hits = doors.filter(door=>door.userData.interactive).map(door => door.userData.hit);
  const entranceHits = [entranceGate.userData.hit];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(20, 20);
  const gaze = new THREE.Vector2();
  const openingCamera = new THREE.Vector3();
  const targetCamera = new THREE.Vector3(0, 2.25, START_Z);
  const lookTarget = new THREE.Vector3(0, EYE_Y, ENTRANCE_GATE_Z - 8);
  const targetLook = new THREE.Vector3(0, 2.15, START_Z - 8);
  const clock = new THREE.Clock();

  let activeStation = clamp(initialStation, 0, stations.length - 1);
  let nearbyStation = activeStation;
  let hoveredStation = -1;
  let enabled = true;
  let entranceState = 'outside';
  let entering = false;
  let openingEntrance = false;
  let disposed = false;
  let enterStart = 0;
  let entranceStart = 0;
  let enterView = '';
  let corridorZ = START_Z;
  let entranceZ = ENTRANCE_OUTSIDE_Z;
  let entranceScrollTarget = ENTRANCE_OUTSIDE_Z;
  let velocity = 0;
  let entranceVelocity = 0;
  let lookOffset = 0;
  let corridorReveal = reducedMotion ? 1 : 0;
  let roomIndex = -1;
  const roomPosition = new THREE.Vector3(0, 2.25, -2.5);
  let roomYaw = 0;
  let roomTransition = null;
  let roomVelocity = 0;
  let pendingStation = -1;
  let consoleFocused = false;
  let catalogueFocused=false;
  const catalogueReturnCamera=new THREE.Vector3(),catalogueReturnLook=new THREE.Vector3();
  const loopThreshold = corridorWorld.userData.loopThreshold;
  const loopShift = ENTRANCE_OUTSIDE_Z - loopThreshold;
  let loopCount = 0;
  let endingScrollTarget = corridorZ, endingVelocity = 0, endingMotion = false;
  const endingStart = doors[7].userData.nodeZ + 12;
  function endingSpeedFactor() {
    const t=clamp((endingStart-corridorZ)/18,0,1);
    return 1+.12*t*t*(3-2*t);
  }
  function syncEndingMotion() {
    if(corridorZ > endingStart){
      if(endingMotion){velocity=endingVelocity;endingVelocity=0;}
      endingMotion=false;return false;
    }
    if(!endingMotion){
      endingMotion=true;
      endingScrollTarget=corridorZ;
      endingVelocity=velocity;velocity=0;
    }
    return true;
  }

  entranceGate.userData.uniforms.strength.value = reducedMotion ? 0 : 1;

  function resize() {
    const rect = mount.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    scenePerformance.resize(width,height);
    renderer.setSize(width, height, false);
    spatialRooms.resize(width, height);
    goldenGuide.resize(width, height);
    camera.aspect = width / height;
    camera.fov = 54;
    camera.updateProjectionMatrix();
  }

  function applyDoorStates() {
    doors.forEach((door, index) => {
      if ((entering && index === activeStation) || (roomIndex === index)) return;
      // The central final door also serves as the walk-through loop portal.
      if (index === doors.length - 1 && entranceState === 'inside' && roomIndex < 0) {
        const approach = THREE.MathUtils.smoothstep(door.userData.nodeZ + 11 - corridorZ, 0, 10);
        door.userData.leftPivot.rotation.y = THREE.MathUtils.lerp(door.userData.leftPivot.rotation.y, approach * 1.48, 0.12);
        door.userData.rightPivot.rotation.y = -door.userData.leftPivot.rotation.y;
        return;
      }
      // Architectural materials keep their physical shading at every distance.
      // Never scale a doorway around its centre: the threshold must stay on the floor.
      door.scale.setScalar(1);
      door.visible = corridorReveal > 0.02;
      door.userData.leftPivot.rotation.y += (0 - door.userData.leftPivot.rotation.y) * 0.16;
      door.userData.rightPivot.rotation.y += (0 - door.userData.rightPivot.rotation.y) * 0.16;
      door.userData.leftPivot.position.x += (-1.6 - door.userData.leftPivot.position.x) * 0.16;
      door.userData.rightPivot.position.x += (1.6 - door.userData.rightPivot.position.x) * 0.16;
    });
  }

  function setActiveStation(index, notify = true) {
    if(catalogueCabinet.isFocused||catalogueFocused)return;
    activeStation = clamp(index, 0, stations.length - 1);
    nearbyStation = activeStation;
    corridorZ = -activeStation * STATION_GAP + (activeStation === 0 ? START_Z : DOOR_VIEW_DISTANCE);
    velocity = 0;endingMotion=false;
    if (notify) onStationChange?.(activeStation);
  }

  function updateNearbyStation() {
    let closestIndex = 0;
    let closestDistance = Infinity;
    doors.forEach((door, index) => {
      const distance = Math.abs(corridorZ - door.userData.nodeZ);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    nearbyStation = closestIndex;
    if (closestIndex !== activeStation && closestDistance <= NODE_INTERACTION_DISTANCE) {
      activeStation = closestIndex;
      onStationChange?.(activeStation);
    }
  }

  const exhibitHint=document.createElement('span');exhibitHint.className='corridor-exhibit-hint';exhibitHint.hidden=true;exhibitHint.setAttribute('data-i18n-ignore','');mount.append(exhibitHint);
  let hintX=0,hintY=0;
  function hint(key=''){exhibitHint.hidden=!key;if(key){const label=translate(key);if(exhibitHint.textContent!==label)exhibitHint.textContent=label;exhibitHint.style.left=`${Math.max(12,Math.min(hintX+18,window.innerWidth-240))}px`;exhibitHint.style.top=`${Math.max(12,Math.min(hintY+22,window.innerHeight-70))}px`;}}
  function updatePointer(event) {
    hintX=event.clientX;hintY=event.clientY;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  const interactiveCursor = 'var(--exchange-pointer, pointer)';

  function updateHover() {
    hint();
    if (!enabled || entering || roomTransition) return;
    if (wallGallery.isOpen || wallResearch.isOpen || catalogueCabinet.isOpen || videoExhibit.isOpen) return;
    if (roomIndex >= 0) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(spatialRooms.activeHits(), false)[0];
      spatialRooms.hoverFace(hit);
      renderer.domElement.style.cursor = hit ? interactiveCursor : '';
      return;
    }
    if (entranceState !== 'inside') {
      if (entranceState !== 'ready') {
        hoveredStation = -1;
        renderer.domElement.style.cursor = '';
        return;
      }
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(entranceHits, false)[0];
      renderer.domElement.style.cursor = hit ? interactiveCursor : '';
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const catalogueHit=catalogueCabinet.pick(raycaster);
    catalogueCabinet.hover(catalogueHit);
    if(catalogueHit){hint('View the catalogue');wallResearch.hover(false);wallGallery.hover(null);renderer.domElement.style.cursor=interactiveCursor;return;}
    if(catalogueCabinet.isFocused||catalogueFocused){wallResearch.hover(false);wallGallery.hover(null);renderer.domElement.style.cursor='';return;}
    const videoHit=videoExhibit.pick(raycaster);videoExhibit.hover(videoHit);
    if(videoHit){hint('Watch the video');wallResearch.hover(false);wallGallery.hover(null);renderer.domElement.style.cursor=interactiveCursor;return;}
    const researchHit = wallResearch.pick(raycaster);
    wallResearch.hover(researchHit);
    if(researchHit)wallGallery.hover(null);
    if(researchHit) { hint('Read the notice board');renderer.domElement.style.cursor=interactiveCursor; return; }
    const artwork = wallGallery.pick(raycaster);
    wallGallery.hover(artwork);
    if (artwork) { hint('View an AI role portrait');renderer.domElement.style.cursor = interactiveCursor; return; }
    const hit = raycaster.intersectObjects(hits, false)[0];
    const station = hit ? hit.object.userData.stationIndex : -1;
    const isNear = station >= 0 && station === nearbyStation && Math.abs(corridorZ - doors[station].userData.nodeZ) <= NODE_INTERACTION_DISTANCE;
    hoveredStation = isNear ? station : -1;
    renderer.domElement.style.cursor = hoveredStation >= 0 ? interactiveCursor : '';
  }

  function enterActiveDoor() {
    if(catalogueCabinet.isFocused||catalogueFocused)return;
    if (entranceState !== 'inside') {
      enterEntrance();
      return;
    }
    if (!enabled || entering || roomIndex >= 0 || roomTransition) return;
    const door = doors[nearbyStation];
    if (!door.userData.interactive) return;
    if (Math.abs(corridorZ - door.userData.nodeZ) > NODE_INTERACTION_DISTANCE) return;
    entering = true;
    enterStart = performance.now();
    activeStation = nearbyStation;
    enterView = stations[nearbyStation].view;
    doorApproach.reset();

    spatialRooms.preview(nearbyStation);
    corridorWorld.userData.reflection.visible = false;
    openingCamera.copy(camera.position);
  }

  function moveStation(direction) {
    if (!enabled || entering || roomIndex >= 0 || roomTransition || entranceState !== 'inside') return;
    setActiveStation(activeStation + direction);
  }

  function moveAlong(direction) {
    if(catalogueCabinet.isFocused||catalogueFocused)return;
    if (!enabled || entering || roomTransition) return;
    if (roomIndex >= 0) {
      roomVelocity = clamp(roomVelocity - direction * 0.09, -0.18, 0.18);
      return;
    }
    if (entranceState !== 'inside') {
      if (openingEntrance) return;
      entranceVelocity = clamp(entranceVelocity - direction * 0.08, -0.22, 0.12);
      if (entranceState === 'outside') setEntranceState('approaching');
      return;
    }
    if(syncEndingMotion()){const boost=endingSpeedFactor();endingVelocity=clamp(endingVelocity-direction*.045*boost,-MAX_VELOCITY*boost,MAX_VELOCITY*boost);return;}
    velocity = clamp(velocity - direction * 0.045, -MAX_VELOCITY, MAX_VELOCITY);
  }

  function setEntranceState(nextState) {
    if (entranceState === nextState) return;
    entranceState = nextState;
    onEntranceChange?.(entranceState);
  }

  function enterEntrance(force = false) {
    if (!enabled || openingEntrance || entranceState === 'inside') return;
    if (entranceState !== 'ready') {
      if (!force) return;
      entranceVelocity = 0;
      entranceZ = ENTRANCE_READY_Z;
      entranceScrollTarget = ENTRANCE_READY_Z;
      setEntranceState('ready');
    }
    openingEntrance = true;
    entranceVelocity = 0;
    openingCamera.copy(camera.position);
    entranceStart = performance.now();
    setEntranceState('opening');
  }

  function cancelEntrance() {
    if (entranceState !== 'approaching' && entranceState !== 'ready') return;
    entranceVelocity = 0;
    entranceZ = ENTRANCE_OUTSIDE_Z;
    entranceScrollTarget = ENTRANCE_OUTSIDE_Z;
    setEntranceState('outside');
  }

  function placeNextEntrance() {
    entranceGate.position.z = ENTRANCE_GATE_Z - loopShift;
    entranceGate.visible = true;
    entranceGate.userData.leftDoorPivot.rotation.y = 0;
    entranceGate.userData.rightDoorPivot.rotation.y = 0;
  }

  function wrapIntoEntrance() {
    // Translate all camera state together; smoothing must never interpolate
    // between the old world coordinate and the equivalent new coordinate.
    entranceZ = corridorZ + loopShift;
    entranceScrollTarget = endingMotion ? endingScrollTarget + loopShift : entranceZ;
    entranceVelocity = endingMotion ? endingVelocity : velocity;
    endingMotion=false;
    camera.position.z += loopShift;
    targetCamera.z += loopShift;
    lookTarget.z += loopShift;
    targetLook.z += loopShift;
    entranceGate.position.z = ENTRANCE_GATE_Z;
    corridorWorld.visible = false;
    activeStation = nearbyStation = 0;
    loopCount += 1;
    mount.dataset.loopCount = String(loopCount);
    velocity = 0;
    onStationChange?.(0);
    setEntranceState('approaching');
  }

  function onPointerMove(event) {
    if (wallGallery.isOpen || wallResearch.isOpen || catalogueCabinet.isOpen || videoExhibit.isOpen) return;
    if (event.target.closest('.spatial-console, .live-face-controls')) return;
    updatePointer(event);
    if(roomIndex===6){if(archivePointer&&Math.hypot(event.clientX-archivePointer.x,event.clientY-archivePointer.y)>6)archivePointer.dragged=true;return;}
    if (!catalogueCabinet.isFocused && !catalogueFocused && event.pointerType !== 'touch' && !reducedMotion) gaze.set(pointer.x, pointer.y);
  }

  function onArchivePointerUp(event){
    const start=archivePointer;archivePointer=null;
    if(roomIndex!==6||roomTransition||!start||start.id!==event.pointerId||start.dragged||Math.hypot(event.clientX-start.x,event.clientY-start.y)>6)return;
    if(event.target.closest('button, input, select, label, details, [data-face-inspector]'))return;
    updatePointer(event);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(spatialRooms.activeHits(),false)[0];
    if(hit?.object.userData.roomAction==='inspect-face')spatialRooms.inspectFace(hit.object.userData);
  }
  function onArchivePointerCancel(){archivePointer=null;}
  function onPointerLeave() {
    hint();
    spatialRooms.hoverFace(null);
    videoExhibit.hover(false);
    catalogueCabinet.hover(false);
    wallResearch.hover(false);wallGallery.hover(null);
    hoveredStation = -1;
    pointer.set(20, 20);
    gaze.set(0, 0);
  }

  function onPointerDown(event) {
    if (wallGallery.isOpen || wallResearch.isOpen || catalogueCabinet.isOpen || videoExhibit.isOpen) return;
    if (event.target.closest('button, input, select, label, details, .spatial-console, .live-face-controls')) return;
    if (!enabled || entering || roomTransition) return;
    updatePointer(event);
    if(roomIndex===6){archivePointer={x:event.clientX,y:event.clientY,id:event.pointerId,dragged:!event.isPrimary||event.button!==0};return;}
    raycaster.setFromCamera(pointer, camera);
    if (roomIndex >= 0) {
      const hit = raycaster.intersectObjects(spatialRooms.activeHits(), false)[0];
      if (hit?.object.userData.roomAction === 'inspect-face') spatialRooms.inspectFace(hit.object.userData);
      if (hit?.object.userData.roomAction === 'exhibit') interactWithRoom();
      if (hit?.object.userData.roomAction === 'console') focusRoomConsole();
      if (hit?.object.userData.roomAction === 'exit') exitRoom();
      return;
    }
    if (entranceState !== 'inside') {
      const hit = raycaster.intersectObjects(entranceHits, false)[0];
      if (hit) enterEntrance();
      return;
    }
    const catalogueHit=catalogueCabinet.pick(raycaster);
    if(catalogueHit){velocity=0;endingVelocity=0;catalogueCabinet.interact(catalogueHit.action);return;}
    if(catalogueCabinet.isFocused||catalogueFocused)return;
    if(videoExhibit.pick(raycaster)){velocity=0;endingVelocity=0;videoExhibit.open();return;}
    if(wallResearch.pick(raycaster)) { velocity=0; endingVelocity=0; wallResearch.open(); return; }
    const artwork = wallGallery.pick(raycaster);
    if (artwork) { velocity = 0; endingVelocity = 0; wallGallery.open(artwork); return; }
    const hit = raycaster.intersectObjects(hits, false)[0];
    if (!hit) return;
    const station = hit.object.userData.stationIndex;
    const node = doors[station];
    const isNear = Math.abs(corridorZ - node.userData.nodeZ) <= NODE_INTERACTION_DISTANCE;
    if (station === nearbyStation && isNear) {
      enterActiveDoor();
      return;
    }
  }

  function onWheel(event) {
    if(catalogueCabinet.isFocused||catalogueFocused){event.preventDefault();return;}
    if (wallGallery.isOpen || wallResearch.isOpen || catalogueCabinet.isOpen || videoExhibit.isOpen) return;
    if (event.target.closest('.spatial-console, .live-face-controls')) return;
    if (!enabled || entering || roomTransition) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 0.1) return;
    if (roomIndex === 4 && spatialRooms.prepare(4).group.userData.auctionResult?.sold) {exitRoom();return;}
    if (roomIndex >= 0) {
      roomVelocity = clamp(roomVelocity - delta * 0.002, -0.14, 0.14);
      return;
    }
    if (entranceState !== 'inside') {
      if (openingEntrance) return;
      const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? mount.clientHeight : 1);
      if (entranceState === 'ready' && pixels > 0) {
        enterEntrance();
        return;
      }
      entranceScrollTarget = clamp(entranceScrollTarget - pixels * ENTRANCE_SCROLL_PER_PIXEL, ENTRANCE_READY_Z, ENTRANCE_OUTSIDE_Z);
      if (entranceState === 'outside') setEntranceState('approaching');
      return;
    }
    if(syncEndingMotion()){
      const pixels=delta*(event.deltaMode===1?16:event.deltaMode===2?mount.clientHeight:1);
      const boost=endingSpeedFactor();
      endingVelocity=clamp(endingVelocity-clamp(pixels,-120,120)*WALK_SPEED*boost,-MAX_VELOCITY*boost,MAX_VELOCITY*boost);
      return;
    }
    // Normalize wheel units and limit a single burst from a fast trackpad swipe.
    const pixels = delta * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? mount.clientHeight : 1);
    velocity = clamp(velocity - clamp(pixels, -120, 120) * WALK_SPEED, -MAX_VELOCITY, MAX_VELOCITY);
  }

  function animateEntranceOpening() {
    const progress = reducedMotion ? 1 : clamp((performance.now() - entranceStart) / 2450, 0, 1);
    const swing = easeInOut(clamp(progress / 0.32, 0, 1));
    const walk = easeInOut(clamp((progress - 0.2) / 0.8, 0, 1));
    entranceGate.userData.leftDoorPivot.rotation.y = swing * 1.48;
    entranceGate.userData.rightDoorPivot.rotation.y = -swing * 1.48;
    corridorReveal = clamp(progress / 0.35, 0, 1);
    // Show the real gallery through the opening for the entire walk-through.
    corridorWorld.visible = true;
    entranceGate.userData.doorwayView.visible = camera.position.z > ENTRANCE_GATE_Z - 0.8;
    // Keep the corridor atmosphere dark; node states handle door brightness separately.
    targetCamera.set(openingCamera.x*(1-walk), THREE.MathUtils.lerp(EYE_Y, 2.25, walk), openingCamera.z + (START_Z - openingCamera.z)*walk);
    targetLook.set(0, THREE.MathUtils.lerp(EYE_Y, 2.35, walk), START_Z-8);
    if (progress >= 1) {
      openingEntrance = false;
      placeNextEntrance();
      corridorReveal = 1;
      corridorWorld.visible = true;
      corridorWorld.userData.reflection.visible = true;
      entranceGate.userData.doorwayView.visible = false;
      corridorZ = START_Z;
      setEntranceState('inside');
      resize();
      onStationChange?.(activeStation);
    }
  }

  function updateEntranceLayers() {
    if (!entranceGate.visible) return;
    const progress = clamp((ENTRANCE_OUTSIDE_Z - entranceZ) / (ENTRANCE_OUTSIDE_Z - ENTRANCE_READY_Z), 0, 1);
    entranceGate.userData.uniforms.time.value = reducedMotion ? 0 : performance.now()*0.001;
    entranceGate.userData.uniforms.pointer.value = gaze.x;
    entranceGate.userData.glow.intensity = 4 + progress*4;
    entranceGate.userData.update(performance.now()*0.001, reducedMotion);
  }

  function animateEntering() {
    const progress = reducedMotion ? 1 : clamp((performance.now() - enterStart) / 1850, 0, 1);
    const swing = easeInOut(clamp(progress / 0.4, 0, 1));
    const walk = easeInOut(clamp((progress - 0.24) / 0.76, 0, 1));
    const door = doors[activeStation];
    door.userData.leftPivot.rotation.y = swing * 1.36;
    door.userData.rightPivot.rotation.y = -swing * 1.36;
    const outside = spatialRooms.worldPoint(activeStation, 0, 2.25, 2.45);
    const inside = spatialRooms.worldPoint(activeStation, 0, activeStation === 4 ? 6.5 : activeStation === 6 ? 6.5 : 2.25, -2.5);
    if (walk < 0.42) targetCamera.copy(openingCamera).lerp(outside, walk / 0.42);
    else targetCamera.copy(outside).lerp(inside, (walk - 0.42) / 0.58);
    targetLook.copy(spatialRooms.worldPoint(activeStation, 0, 3.1, -9));
    if (progress >= 1) {
      entering = false;
      roomIndex = activeStation;
      roomPosition.set(0, activeStation === 4 ? 6.5 : activeStation === 6 ? 6.5 : 2.25, -2.5);
      roomYaw = 0;
      consoleFocused = false;
      roomVelocity = 0;
      corridorWorld.visible = false;
      spatialRooms.activate(roomIndex);
      keyLight.position.copy(spatialRooms.worldPoint(roomIndex, 0, 7.2, -5));
      keyLight.target.position.copy(spatialRooms.worldPoint(roomIndex, 0, 0, -7));
      camera.position.copy(inside);
      if(roomIndex===6){
        archiveOrbit.target.copy(spatialRooms.worldPoint(6,0,7,-24));
        // Start at the close viewing distance so the archive fills the first frame.
        camera.position.copy(spatialRooms.worldPoint(6,0,7,-8));
        targetCamera.copy(camera.position);targetLook.copy(archiveOrbit.target);lookTarget.copy(targetLook);
        archiveOrbit.enabled=true;archiveOrbit.update();gaze.set(0,0);
      }
      onEnterDoor?.(enterView);
      if(roomIndex===1||roomIndex===2){spatialRooms.setConsoleVisible(true);focusRoomConsole();}
    }
  }

  function interactWithRoom() {
    if (roomIndex < 0 || roomTransition || [4,7].includes(roomIndex)) return;
    onRoomAction?.(spatialRooms.toggleExhibit());
  }

  function focusRoomConsole() {
    if (roomIndex < 0 || roomTransition || [4,6,7].includes(roomIndex)) return;
    roomVelocity = 0;
    gaze.set(0, 0);
    roomTransition = { kind: 'console', start: performance.now(), from: camera.position.clone(), look: lookTarget.clone(), index: roomIndex };
  }

  function exitRoom(nextStation = -1) {
    if (roomIndex < 0 || roomTransition) return false;
    archiveOrbit.enabled=false;archivePointer=null;
    roomVelocity = 0;
    pendingStation = nextStation;
    corridorWorld.visible = true;
    corridorWorld.userData.reflection.visible = false;
    roomTransition = { kind: 'exit', start: performance.now(), from: camera.position.clone(), look: lookTarget.clone(), index: roomIndex, fromLocal: roomPosition.clone() };
    spatialRooms.preview(roomIndex);
    return true;
  }

  function animateRoomTransition() {
    const transition = roomTransition;
    const duration = transition.kind === 'console' ? 1150 : transition.kind === 'travel' ? 1400 : 1450;
    const progress = reducedMotion ? 1 : clamp((performance.now() - transition.start) / duration, 0, 1);
    const eased = easeInOut(progress);
    if (transition.kind === 'console') {
      const destination = spatialRooms.worldPoint(roomIndex, 0, 2.85, -8.8);
      const waypoint = spatialRooms.worldPoint(roomIndex, 2.6, 2.6, -6.3);
      if (eased < 0.5) targetCamera.copy(transition.from).lerp(waypoint, eased * 2);
      else targetCamera.copy(waypoint).lerp(destination, (eased - 0.5) * 2);
      targetLook.copy(transition.look).lerp(spatialRooms.worldPoint(roomIndex, 0, 3.85, -13.88), eased);
      if (progress === 1) {
        roomPosition.set(0, 2.85, -8.8);
        roomYaw = 0;
        consoleFocused = true;
        roomTransition = null;
      }
    } else if (transition.kind === 'exit') {
      const atDoor = spatialRooms.worldPoint(transition.index, 0, 2.25, 1.9);
      const destination = new THREE.Vector3(0, 2.25, doors[transition.index].userData.nodeZ + (transition.index === 0 ? START_Z : DOOR_VIEW_DISTANCE));
      const bypass = transition.fromLocal.z < -5 ? spatialRooms.worldPoint(transition.index, 2.7, 2.25, transition.fromLocal.z) : transition.from;
      if (eased < 0.3) targetCamera.copy(transition.from).lerp(bypass, eased / 0.3);
      else if (eased < 0.7) targetCamera.copy(bypass).lerp(atDoor, (eased - 0.3) / 0.4);
      else targetCamera.copy(atDoor).lerp(destination, (eased - 0.7) / 0.3);
      targetLook.copy(transition.look).lerp(new THREE.Vector3(0, 2.3, destination.z - 8), eased);
      if (progress === 1) {
        roomIndex = -1;
        corridorZ = destination.z;
        endingMotion=false;velocity=0;
        camera.position.copy(destination);
        spatialRooms.hide();
        keyLight.position.set(0, 7.2, destination.z - 4);
        keyLight.target.position.set(0, 0, destination.z - 7);
        corridorWorld.userData.reflection.visible = true;
        roomTransition = null;
        onReturnRoom?.(transition.index);
        if (pendingStation >= 0) {
          const index = pendingStation;
          pendingStation = -1;
          roomTransition = { kind: 'travel', start: performance.now(), from: destination.clone(), index };
        }
      }
    } else if (transition.kind === 'travel') {
      const z = doors[transition.index].userData.nodeZ + (transition.index === 0 ? START_Z : DOOR_VIEW_DISTANCE);
      targetCamera.copy(transition.from).lerp(new THREE.Vector3(0, 2.25, z), eased);
      targetLook.set(0, 2.3, targetCamera.z - 8);
      if (progress === 1) {
        corridorZ = z;
        activeStation = transition.index;
        nearbyStation = transition.index;
        onStationChange?.(activeStation);
        roomTransition = null;
        camera.position.copy(targetCamera);
        enterActiveDoor();
      }
    }
  }

  function moveInRoom(strafe, forward) {
    if (roomIndex < 0 || roomTransition || [4,6,7].includes(roomIndex)) return;
    if (Math.abs(strafe) + Math.abs(forward) > 0.0001) consoleFocused = false;
    const yaw = roomYaw + gaze.x * 0.32;
    const x = clamp(roomPosition.x + strafe * Math.cos(yaw) + forward * Math.sin(yaw), -4.2, 4.2);
    const z = clamp(roomPosition.z + strafe * Math.sin(yaw) - forward * Math.cos(yaw), -11.2, -0.9);
    if (Math.hypot(x, z + 6.4) > 1.75) roomPosition.set(x, roomPosition.y, z);
  }

  function render() {
    if (disposed) return;
    requestAnimationFrame(render);
    const frameDelta=clock.getDelta();
    if(document.hidden)return;
    scenePerformance.update(frameDelta);
    const delta = Math.min(frameDelta, 0.05);
    const roomFov=roomIndex===4?62:51;
    if(Math.abs(camera.fov-roomFov)>.01){camera.fov=THREE.MathUtils.lerp(camera.fov,roomFov,1-Math.exp(-5*delta));camera.updateProjectionMatrix();}
    updateHover();
    if (wallGallery.isOpen || wallResearch.isOpen || catalogueCabinet.isOpen || videoExhibit.isOpen) {
      velocity = 0;
      endingVelocity = 0;
    } else if(catalogueCabinet.isFocused){
      velocity=0;endingVelocity=0;
      if(!catalogueFocused){catalogueReturnCamera.copy(camera.position);catalogueReturnLook.copy(lookTarget);catalogueFocused=true;}
      if(catalogueCabinet.focusReady){targetCamera.copy(catalogueCabinet.cameraPosition(camera));targetLook.copy(catalogueCabinet.cameraLook());}
    } else if(catalogueFocused){
      velocity=0;endingVelocity=0;
      targetCamera.copy(catalogueReturnCamera);targetLook.copy(catalogueReturnLook);
      if(camera.position.distanceTo(catalogueReturnCamera)<.025&&lookTarget.distanceTo(catalogueReturnLook)<.025){catalogueFocused=false;gaze.set(0,0);}
    } else if (entranceState !== 'inside') {
      if (openingEntrance) {
        animateEntranceOpening();
      } else {
        entranceScrollTarget = clamp(entranceScrollTarget + entranceVelocity * delta * 60 * 0.75, ENTRANCE_READY_Z, ENTRANCE_OUTSIDE_Z);
        entranceZ = smoothEntrancePosition(entranceZ, entranceScrollTarget, delta);
        entranceVelocity *= Math.pow(0.9,delta*60);
        targetCamera.set(gaze.x*0.24,EYE_Y,entranceZ);
        targetLook.set(gaze.x*0.65,2.35+gaze.y*0.35,entranceZ-8);
        if (entranceZ <= ENTRANCE_READY_Z + 0.08) {
          setEntranceState('ready');
          if (loopCount > 0 && entranceScrollTarget <= ENTRANCE_READY_Z + 0.08) enterEntrance();
        }
        else if (entranceState === 'ready') setEntranceState('approaching');
      }
      updateEntranceLayers();
    } else if (roomTransition) {
      animateRoomTransition();
    } else if(roomIndex===6&&enabled){
      archiveOrbit.enabled=document.querySelector('[data-face-inspector]').hidden;
      if(archiveOrbit.enabled)archiveOrbit.update();targetCamera.copy(camera.position);targetLook.copy(archiveOrbit.target);lookTarget.copy(targetLook);
    } else if (roomIndex >= 0 && enabled) {
      moveInRoom(0, -roomVelocity * delta * 60 * 0.75);
      roomVelocity *= Math.pow(0.86, delta * 60);
      targetCamera.copy(spatialRooms.worldPoint(roomIndex, roomPosition.x, roomPosition.y, roomPosition.z));
      const yaw = roomYaw + gaze.x * 0.32;
      targetLook.copy(spatialRooms.worldPoint(roomIndex, roomPosition.x + Math.sin(yaw) * 7, (consoleFocused ? 3.85 : (roomIndex === 4 ? 4.7 : roomIndex === 6 ? 7 : roomPosition.y + 0.5)) + gaze.y * (roomIndex === 4 ? 0.7 : 1.6), roomPosition.z - Math.cos(yaw) * 7));
      spatialRooms.setConsoleVisible(roomIndex===1 || roomIndex===2 || roomPosition.z < -7.2);
    } else if (!entering && enabled) {
      if(syncEndingMotion()){
        corridorZ+=endingVelocity*delta*60*.75;
        endingVelocity*=Math.pow(.86,delta*60);
        // Carry only the current inertia into the equivalent entrance coordinates.
        endingScrollTarget=corridorZ+endingVelocity*60*.75/ENTRANCE_SMOOTHING;
      }else{
        corridorZ = Math.min(corridorZ + velocity * delta * 60 * 0.75, START_Z);
        velocity *= Math.pow(0.86, delta*60);
      }
      updateNearbyStation();
      targetCamera.set(0, 2.25, corridorZ);
      const approach = doorApproach.update(corridorZ, delta, reducedMotion);
      const side = approach.side;
      targetCamera.x = -side * approach.amount * 0.6;
      const focus = approach.amount * 0.75 * (19 / 26);
      targetLook.set(
        THREE.MathUtils.lerp(lookOffset + gaze.x * 1.5, side * 4.9 + gaze.x * 0.4, focus),
        THREE.MathUtils.lerp(2.35 + gaze.y * 0.35, 3.05 + gaze.y * 0.2, focus),
        THREE.MathUtils.lerp(corridorZ - 8, approach.doorZ - 0.8, focus));
      if (corridorZ <= loopThreshold) wrapIntoEntrance();
    }
    if (entering || roomIndex >= 0 || roomTransition || entranceState !== 'inside') {
      doorApproach.reset();
  
    }
    if (entering) animateEntering();
    if (!wallGallery.isOpen && !wallResearch.isOpen && !catalogueCabinet.isOpen && !videoExhibit.isOpen) {
      camera.position.lerp(targetCamera, 1-Math.exp(-(catalogueCabinet.isFocused||catalogueFocused ? 2.8 : entering ? 8 : 5)*delta));
      lookTarget.lerp(targetLook, 1-Math.exp(-(catalogueCabinet.isFocused||catalogueFocused ? 2.8 : entering ? 7.5 : 3)*delta));
    }
    camera.lookAt(lookTarget);
    goldenGuide.render((entranceState === 'inside' || openingEntrance) && roomIndex < 0 && !entering && !roomTransition);
    videoExhibit.update(entranceState === 'inside' && roomIndex < 0 && !entering && !roomTransition && !catalogueCabinet.isFocused,delta,{corridorZ,roomIndex,inside:entranceState==='inside'});
    catalogueCabinet.update(entranceState === 'inside' && roomIndex < 0 && !entering && !roomTransition,delta);
    wallResearch.update(entranceState === 'inside' && roomIndex < 0 && !entering && !roomTransition);
    wallGallery.update(camera, entranceState === 'inside' && roomIndex < 0 && !entering && !roomTransition);
    corridorParticles.update(delta,camera,renderer,corridorWorld.visible && entranceState === 'inside' && roomIndex < 0 && !entering && !roomTransition);
    applyDoorStates();
    spatialRooms.update(delta, performance.now() * 0.001, reducedMotion);
    if(corridorWorld.visible)for(const door of doors)door.userData.nameplate?.userData.updateNameplate(performance.now()*.001,reducedMotion);
    updateCorridorUplights(corridorWorld, camera);
    // Keep the shared hall for the seamless loop, but skip it until the final approach.
    entranceGate.visible = entranceState !== 'inside' || (roomIndex < 0 && corridorZ <= loopThreshold + STATION_GAP * 2.5);
    entranceGate.userData.reflection.visible = entranceState !== 'inside';
    renderer.render(scene, camera);
    wallResearch.renderFocus(renderer,scene,camera);
    spatialRooms.render();
  }

  mount.addEventListener('pointermove', onPointerMove);
  mount.addEventListener('pointerleave', onPointerLeave);
  mount.addEventListener('pointerdown', onPointerDown);
  mount.addEventListener('pointerup',onArchivePointerUp);
  mount.addEventListener('pointercancel',onArchivePointerCancel);
  mount.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('resize', resize);

  resize();
  setActiveStation(activeStation, false);
  onEntranceChange?.(entranceState);
  render();

  return {
    isFallback: false,
    isSpatial: true,
    roomDesigns: spatialRooms.designs,
    setActiveStation,
    moveStation,
    moveAlong,
    openExhibit(kind){if(!enabled||entering||roomTransition||roomIndex>=0||entranceState!=='inside')return;velocity=endingVelocity=0;hint();if(kind==='research')wallResearch.open();if(kind==='video')videoExhibit.open();if(kind==='catalogue')catalogueCabinet.interact('lid');if(kind==='portrait')wallGallery.openNearest(camera);},
    enterEntrance,
    cancelEntrance,
    getEntranceState() {
      return entranceState;
    },
    getRoomIndex() { return roomIndex; },
    focusRoomConsole,
    interactWithRoom,
    exitRoom,
    travelToRoom(index) { return exitRoom(index); },
    moveInRoom,
    setPortrait: spatialRooms.setPortrait,
    setAuctionBase: spatialRooms.setAuctionBase,
    look(direction) {
      if(catalogueCabinet.isFocused||catalogueFocused)return;
      if(roomIndex===6){const offset=camera.position.clone().sub(archiveOrbit.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),direction*.12);camera.position.copy(archiveOrbit.target).add(offset);return;}
      if (roomIndex >= 0) {
        roomYaw = clamp(roomYaw + direction * 0.25, -Math.PI, Math.PI);
        return;
      }
      lookOffset = clamp(lookOffset + direction * 0.8, -1.6, 1.6);
      window.setTimeout(() => {
        lookOffset = 0;
      }, 420);
    },
    enterActiveDoor,
    setEnabled(nextEnabled) {
      enabled = nextEnabled;
      mount.classList.toggle('is-disabled', !nextEnabled);
    },
    returnToStation(index) {
      renderer.domElement.style.opacity = '1';
      entering = false;
      enabled = true;
      roomIndex = -1;
      roomTransition = null;
      spatialRooms.hide();
      corridorWorld.visible = true;
      corridorWorld.userData.reflection.visible = true;
      if (entranceState !== 'inside') {
        setEntranceState('inside');
        placeNextEntrance();
        corridorWorld.visible = true;
        corridorReveal = 1;
      }
      setActiveStation(index, false);
      targetCamera.set(0, 2.25, corridorZ);
      targetLook.set(0, 2.35, corridorZ - 8);
      camera.position.copy(targetCamera);
      lookTarget.copy(targetLook);
    },
    dispose() {
      disposed = true;
      exhibitHint.remove();
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerleave', onPointerLeave);
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('pointerup',onArchivePointerUp);
      mount.removeEventListener('pointercancel',onArchivePointerCancel);
      archiveOrbit.dispose();
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      entranceGate.userData.dispose();
      corridorParticles.dispose();
      videoExhibit.dispose();
      catalogueCabinet.dispose();
      wallResearch.dispose();
      wallGallery.dispose();
      corridorWorld.userData.doorHandles?.dispose();
      corridorWorld.userData.ornateDoors?.dispose();
      for(const door of doors)door.userData.nameplate?.userData.disposeNameplate();
      scenePerformance.dispose();
      renderer.dispose();
      spatialRooms.dispose();
      goldenGuide.dispose();
      corridorWorld.userData.reflection.dispose();
      environmentTarget.dispose();
      mount.replaceChildren();
    },
  };
}
