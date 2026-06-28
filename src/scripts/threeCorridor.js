import * as THREE from 'three';

const LINE_COLOR = 0xaeb9b0;
const ACTIVE_COLOR = 0x9cc9a4;
const MUTED_COLOR = 0x5f6a62;
const BG_COLOR = 0x111412;
const STATION_GAP = 13;
const START_Z = 3.2;
const WALK_SPEED = 0.018;
const MAX_VELOCITY = 0.16;
const NEAR_DISTANCE = 4.6;
const ENTRANCE_OUTSIDE_Z = 14.5;
const ENTRANCE_READY_Z = 8.1;
const ENTRANCE_GATE_Z = 5.45;

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
  canvas.height = 160;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#9cc9a4';
  context.font = '600 46px monospace';
  context.textAlign = 'center';
  context.fillText(text, canvas.width / 2, 72);
  context.fillStyle = '#aeb9b0';
  context.font = '22px monospace';
  context.fillText('FACE ASSET NODE', canvas.width / 2, 116);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.88, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.8, 1.5, 1);
  return sprite;
}

function makeMarketSign() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(156, 201, 164, 0.55)';
  context.lineWidth = 2;
  context.strokeRect(36, 34, canvas.width - 72, canvas.height - 68);
  context.fillStyle = '#9cc9a4';
  context.font = '600 44px monospace';
  context.textAlign = 'center';
  context.fillText('FACE EXCHANGE', canvas.width / 2, 96);
  context.fillStyle = '#aeb9b0';
  context.font = '24px monospace';
  context.fillText('Identity Asset Market', canvas.width / 2, 142);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.72, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(4.6, 1.58, 1);
  sprite.position.set(-4.82, 3.9, 3.1);
  sprite.rotation.y = Math.PI / 2.7;
  return sprite;
}

function makeEntranceSign() {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 220;
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = 'rgba(156, 201, 164, 0.36)';
  context.lineWidth = 2;
  context.strokeRect(70, 36, canvas.width - 140, canvas.height - 72);
  context.fillStyle = '#9cc9a4';
  context.font = '600 48px monospace';
  context.textAlign = 'center';
  context.fillText('FACE EXCHANGE', canvas.width / 2, 98);
  context.fillStyle = '#aeb9b0';
  context.font = '24px monospace';
  context.fillText('Identity Asset Market', canvas.width / 2, 144);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.82, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5.8, 1.78, 1);
  return sprite;
}

function createEntranceGate() {
  const group = new THREE.Group();
  group.position.set(0, 0, ENTRANCE_GATE_Z);
  group.userData = { isEntranceGate: true };

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

  const panelMaterial = new THREE.MeshBasicMaterial({ color: 0x171b18, transparent: true, opacity: 0.22, side: THREE.DoubleSide });
  const panelGeometry = new THREE.PlaneGeometry(2.82, 4.95);

  const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial.clone());
  leftPanel.position.set(-1.43, 2.56, 0.06);
  const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial.clone());
  rightPanel.position.set(1.43, 2.56, 0.06);

  const divider = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.08, 0.11), new THREE.Vector3(0, 5.02, 0.11)]),
    makeLineMaterial(ACTIVE_COLOR, 0.34),
  );
  const leftLines = makeRectLines(2.82, 4.95, LINE_COLOR, 0.44);
  leftLines.position.set(-1.43, 2.56, 0.12);
  const rightLines = makeRectLines(2.82, 4.95, LINE_COLOR, 0.44);
  rightLines.position.set(1.43, 2.56, 0.12);
  const scanLine = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2.65, 2.56, 0.14), new THREE.Vector3(2.65, 2.56, 0.14)]),
    makeLineMaterial(ACTIVE_COLOR, 0.26),
  );

  const sign = makeEntranceSign();
  sign.position.set(0, 6.8, 0.12);

  const plaque = makeRectLines(2.4, 0.5, LINE_COLOR, 0.24);
  plaque.position.set(0, 0.48, 0.12);

  const hit = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 6.4),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hit.position.set(0, 3.12, 0.22);
  hit.userData = { isEntranceHit: true };

  group.add(leftPanel, rightPanel, leftLines, rightLines, divider, scanLine, sign, plaque, hit);
  group.userData.leftPanel = leftPanel;
  group.userData.rightPanel = rightPanel;
  group.userData.leftLines = leftLines;
  group.userData.rightLines = rightLines;
  group.userData.sign = sign;
  group.userData.hit = hit;
  return group;
}

function setMaterialOpacity(object, opacity) {
  object.traverse((child) => {
    if (child.userData?.isDoorHit || child.userData?.isEntranceHit) return;
    if (!child.material) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
    });
  });
}

function setMaterialColor(object, color) {
  object.traverse((child) => {
    if (child.userData?.isDoorHit || child.userData?.isEntranceHit) return;
    if (!child.material?.color) return;
    child.material.color.setHex(color);
  });
}

function createDoor(station, index, totalStations) {
  const group = new THREE.Group();
  const side = index === 0 ? -1 : index === totalStations - 1 ? 0 : index % 2 === 0 ? 1 : -1;
  const z = -index * STATION_GAP;
  const x = side === 0 ? 0 : side * 4.72;
  group.position.set(x, 2.35, z);
  group.rotation.y = side === 0 ? 0 : side > 0 ? -Math.PI / 2.7 : Math.PI / 2.7;
  group.userData = { stationIndex: index, view: station.view, label: station.label, isDoorGroup: true };

  const frame = new THREE.Group();
  frame.add(makeRectLines(4.6, 5.8, LINE_COLOR, 0.26));
  const inner = makeRectLines(3.7, 4.9, LINE_COLOR, 0.18);
  inner.position.z = 0.02;
  frame.add(inner);
  group.add(frame);

  const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x171b18, transparent: true, opacity: 0.08, side: THREE.DoubleSide });
  const halfGeometry = new THREE.PlaneGeometry(1.34, 3.8);

  const leftPivot = new THREE.Group();
  leftPivot.position.set(-0.08, 0, 0.04);
  const leftPanel = new THREE.Mesh(halfGeometry, faceMaterial.clone());
  leftPanel.position.x = -0.67;
  const leftFace = new THREE.Group();
  const leftOutline = makeEllipseLines(2.55, 4.05, 72, LINE_COLOR, 0.58);
  leftOutline.scale.x = 0.5;
  leftOutline.position.x = -0.64;
  const leftFeatures = makeFaceFeatureLines(LINE_COLOR, 0.38);
  leftFeatures.scale.x = 0.5;
  leftFeatures.position.x = -0.34;
  leftFace.add(leftPanel, leftOutline, leftFeatures);
  leftPivot.add(leftFace);

  const rightPivot = new THREE.Group();
  rightPivot.position.set(0.08, 0, 0.04);
  const rightPanel = new THREE.Mesh(halfGeometry, faceMaterial.clone());
  rightPanel.position.x = 0.67;
  const rightFace = new THREE.Group();
  const rightOutline = makeEllipseLines(2.55, 4.05, 72, LINE_COLOR, 0.58);
  rightOutline.scale.x = 0.5;
  rightOutline.position.x = 0.64;
  const rightFeatures = makeFaceFeatureLines(LINE_COLOR, 0.38);
  rightFeatures.scale.x = 0.5;
  rightFeatures.position.x = 0.34;
  rightFace.add(rightPanel, rightOutline, rightFeatures);
  rightPivot.add(rightFace);
  group.add(leftPivot, rightPivot);

  const scanGrid = new THREE.Group();
  for (let y = -1.5; y <= 1.5; y += 0.5) {
    const line = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1.15, y, 0.08), new THREE.Vector3(1.15, y, 0.08)]),
      makeLineMaterial(LINE_COLOR, 0.12),
    );
    scanGrid.add(line);
  }
  group.add(scanGrid);

  const label = makeTextSprite(station.label);
  label.position.set(0, 3.25, 0.06);
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
  group.userData.baseScale = 1;
  group.userData.nodeZ = z;
  group.userData.side = side;
  return group;
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
  const floor = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(floorLines), makeLineMaterial(LINE_COLOR, 0.16));
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
  const walls = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wallLines), makeLineMaterial(LINE_COLOR, 0.18));
  world.add(walls);

  const guideLines = [];
  stations.forEach((_, index) => {
    const z = -index * STATION_GAP;
    guideLines.push(new THREE.Vector3(-4.6, 0.04, z), new THREE.Vector3(4.6, 0.04, z));
    guideLines.push(new THREE.Vector3(-4.2, 5.4, z), new THREE.Vector3(4.2, 5.4, z));
  });
  const guides = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(guideLines), makeLineMaterial(ACTIVE_COLOR, 0.16));
  world.add(guides);
  world.add(makeMarketSign());

  const doors = stations.map((station, index) => {
    const door = createDoor(station, index, stations.length);
    world.add(door);
    return door;
  });

  return { world, doors };
}

export function initThreeCorridor({ mount, stations, initialStation = 0, reducedMotion = false, onStationChange, onEnterDoor, onEntranceChange }) {
  if (!mount || !canUseWebGL()) {
    return { isFallback: true };
  }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 180);
  camera.position.set(0, 2.25, ENTRANCE_OUTSIDE_Z);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 720 ? 1.25 : 1.75));
  mount.append(renderer.domElement);

  const { world: corridorWorld, doors } = buildCorridor(scene, stations);
  const entranceGate = createEntranceGate();
  scene.add(entranceGate);
  corridorWorld.visible = false;
  const hits = doors.map((door) => door.userData.hit);
  const entranceHits = [entranceGate.userData.hit];

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(20, 20);
  const targetCamera = new THREE.Vector3(0, 2.25, START_Z);
  const lookTarget = new THREE.Vector3(0, 2.15, START_Z - 8);
  const targetLook = new THREE.Vector3(0, 2.15, START_Z - 8);
  const clock = new THREE.Clock();

  let activeStation = clamp(initialStation, 0, stations.length - 1);
  let nearbyStation = activeStation;
  let hoveredStation = -1;
  let enabled = true;
  let entranceState = reducedMotion ? 'inside' : 'outside';
  let entering = false;
  let openingEntrance = false;
  let disposed = false;
  let enterStart = 0;
  let entranceStart = 0;
  let enterView = '';
  let corridorZ = START_Z;
  let entranceZ = ENTRANCE_OUTSIDE_Z;
  let velocity = 0;
  let entranceVelocity = 0;
  let lookOffset = 0;
  let corridorReveal = reducedMotion ? 1 : 0;
  const minZ = -((stations.length - 1) * STATION_GAP) - 4;

  if (reducedMotion) {
    camera.position.set(0, 2.25, START_Z);
    entranceGate.visible = false;
    corridorWorld.visible = true;
  }

  function resize() {
    const rect = mount.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function applyDoorStates() {
    doors.forEach((door, index) => {
      const zDistance = Math.abs(corridorZ - door.userData.nodeZ);
      const stationDistance = Math.abs(index - activeStation);
      const isActive = index === nearbyStation && zDistance < NEAR_DISTANCE;
      const isHovered = index === hoveredStation;
      const opacity = (isActive ? 0.98 : zDistance < 9 ? 0.48 : 0.16) * corridorReveal;
      const color = isActive || isHovered ? ACTIVE_COLOR : zDistance < 9 ? LINE_COLOR : MUTED_COLOR;
      const scale = isActive ? 1.06 : zDistance < 9 ? 0.9 : 0.72;
      setMaterialOpacity(door, opacity);
      setMaterialColor(door, color);
      door.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.18);
      door.visible = corridorReveal > 0.02 && (stationDistance <= 2 || zDistance < 18);
      door.userData.leftPivot.rotation.y += (0 - door.userData.leftPivot.rotation.y) * 0.16;
      door.userData.rightPivot.rotation.y += (0 - door.userData.rightPivot.rotation.y) * 0.16;
      door.userData.leftPivot.position.x += (-0.08 - door.userData.leftPivot.position.x) * 0.16;
      door.userData.rightPivot.position.x += (0.08 - door.userData.rightPivot.position.x) * 0.16;
    });
  }

  function setActiveStation(index, notify = true) {
    activeStation = clamp(index, 0, stations.length - 1);
    corridorZ = -activeStation * STATION_GAP + 3.2;
    velocity = 0;
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
    if (closestIndex !== activeStation && closestDistance < 6.5) {
      activeStation = closestIndex;
      onStationChange?.(activeStation);
    }
  }

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function updateHover() {
    if (!enabled || entering) return;
    if (entranceState !== 'inside') {
      if (entranceState !== 'ready') {
        hoveredStation = -1;
        renderer.domElement.style.cursor = 'default';
        return;
      }
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(entranceHits, false)[0];
      renderer.domElement.style.cursor = hit ? 'pointer' : 'default';
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(hits, false)[0];
    const station = hit ? hit.object.userData.stationIndex : -1;
    const isNear = station >= 0 && Math.abs(corridorZ - doors[station].userData.nodeZ) <= NEAR_DISTANCE;
    hoveredStation = isNear ? station : -1;
    renderer.domElement.style.cursor = hoveredStation >= 0 ? 'pointer' : 'default';
  }

  function enterActiveDoor() {
    if (entranceState !== 'inside') {
      enterEntrance();
      return;
    }
    if (!enabled || entering) return;
    const door = doors[nearbyStation];
    if (Math.abs(corridorZ - door.userData.nodeZ) > NEAR_DISTANCE) return;
    entering = true;
    enterStart = performance.now();
    activeStation = nearbyStation;
    enterView = stations[nearbyStation].view;
  }

  function moveStation(direction) {
    if (!enabled || entering || entranceState !== 'inside') return;
    setActiveStation(activeStation + direction);
  }

  function moveAlong(direction) {
    if (!enabled || entering) return;
    if (entranceState !== 'inside') {
      if (openingEntrance) return;
      entranceVelocity = clamp(entranceVelocity - direction * 0.08, -0.22, 0.12);
      if (entranceState === 'outside') setEntranceState('approaching');
      return;
    }
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
      setEntranceState('ready');
    }
    openingEntrance = true;
    entranceStart = performance.now();
    setEntranceState('opening');
  }

  function cancelEntrance() {
    if (entranceState !== 'approaching' && entranceState !== 'ready') return;
    entranceVelocity = 0;
    entranceZ = ENTRANCE_OUTSIDE_Z;
    setEntranceState('outside');
  }

  function onPointerMove(event) {
    updatePointer(event);
  }

  function onPointerLeave() {
    hoveredStation = -1;
    pointer.set(20, 20);
  }

  function onPointerDown(event) {
    if (!enabled || entering) return;
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    if (entranceState !== 'inside') {
      const hit = raycaster.intersectObjects(entranceHits, false)[0];
      if (hit) enterEntrance();
      return;
    }
    const hit = raycaster.intersectObjects(hits, false)[0];
    if (!hit) return;
    const station = hit.object.userData.stationIndex;
    const node = doors[station];
    const isNear = Math.abs(corridorZ - node.userData.nodeZ) <= NEAR_DISTANCE;
    if (station === nearbyStation && isNear) {
      enterActiveDoor();
      return;
    }
  }

  function onWheel(event) {
    if (!enabled || entering) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 4) return;
    if (entranceState !== 'inside') {
      if (openingEntrance) return;
      entranceVelocity = clamp(entranceVelocity - delta * WALK_SPEED, -0.22, 0.12);
      if (entranceState === 'outside') setEntranceState('approaching');
      return;
    }
    velocity = clamp(velocity - delta * WALK_SPEED, -MAX_VELOCITY, MAX_VELOCITY);
  }

  function animateEntranceOpening() {
    const progress = reducedMotion ? 1 : clamp((performance.now() - entranceStart) / 1300, 0, 1);
    const eased = easeInOut(progress);
    entranceGate.userData.leftPanel.position.x = -1.43 - eased * 1.85;
    entranceGate.userData.rightPanel.position.x = 1.43 + eased * 1.85;
    entranceGate.userData.leftLines.position.x = -1.43 - eased * 1.85;
    entranceGate.userData.rightLines.position.x = 1.43 + eased * 1.85;
    setMaterialOpacity(entranceGate, 1 - eased * 0.72);
    corridorReveal = clamp((progress - 0.35) / 0.55, 0, 1);
    corridorWorld.visible = corridorReveal > 0;
    setMaterialOpacity(corridorWorld, corridorReveal * 0.2);
    targetCamera.set(0, 2.25, ENTRANCE_READY_Z + (START_Z - ENTRANCE_READY_Z) * eased);
    targetLook.set(0, 2.15, START_Z - 8);
    if (progress >= 1) {
      openingEntrance = false;
      entranceGate.visible = false;
      corridorReveal = 1;
      corridorWorld.visible = true;
      corridorZ = START_Z;
      setEntranceState('inside');
      onStationChange?.(activeStation);
    }
  }

  function animateEntering() {
    const progress = clamp((performance.now() - enterStart) / 980, 0, 1);
    const eased = easeInOut(progress);
    const door = doors[nearbyStation];
    door.userData.leftPivot.rotation.y = -eased * 1.12;
    door.userData.rightPivot.rotation.y = eased * 1.12;
    door.userData.leftPivot.position.x = -0.08 - eased * 0.48;
    door.userData.rightPivot.position.x = 0.08 + eased * 0.48;
    const side = door.userData.side;
    const pushX = side === 0 ? 0 : side * 2.4 * eased;
    const z = door.userData.nodeZ;
    targetCamera.set(pushX, 2.3, z - 1.2 * eased);
    targetLook.set(pushX + side * 1.1, 2.15, z - 4.8);
    renderer.domElement.style.opacity = String(1 - eased * 0.8);
    if (progress >= 1) {
      enabled = false;
      entering = false;
      renderer.domElement.style.opacity = '1';
      onEnterDoor?.(enterView);
    }
  }

  function render() {
    if (disposed) return;
    requestAnimationFrame(render);
    const delta = Math.min(clock.getDelta(), 0.05);
    updateHover();
    if (entranceState !== 'inside') {
      if (openingEntrance) {
        animateEntranceOpening();
      } else {
        entranceZ = clamp(entranceZ + entranceVelocity, ENTRANCE_READY_Z, ENTRANCE_OUTSIDE_Z);
        entranceVelocity *= 0.88;
        targetCamera.set(0, 2.25, entranceZ);
        targetLook.set(0, 2.35, ENTRANCE_GATE_Z - 0.4);
        if (entranceZ <= ENTRANCE_READY_Z + 0.08) setEntranceState('ready');
        else if (entranceState === 'ready') setEntranceState('approaching');
      }
    } else if (!entering) {
      corridorZ = clamp(corridorZ + velocity, minZ, START_Z);
      velocity *= 0.9;
      updateNearbyStation();
      targetCamera.set(0, 2.25, corridorZ);
      targetLook.set(lookOffset, 2.12, corridorZ - 8);
    }
    if (entering) animateEntering();
    camera.position.lerp(targetCamera, entering ? 0.13 : 0.055 + delta * 0.5);
    lookTarget.lerp(targetLook, entering ? 0.12 : 0.06 + delta * 0.5);
    camera.lookAt(lookTarget);
    applyDoorStates();
    renderer.render(scene, camera);
  }

  mount.addEventListener('pointermove', onPointerMove);
  mount.addEventListener('pointerleave', onPointerLeave);
  mount.addEventListener('pointerdown', onPointerDown);
  mount.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('resize', resize);

  resize();
  setActiveStation(activeStation, false);
  onEntranceChange?.(entranceState);
  render();

  return {
    isFallback: false,
    setActiveStation,
    moveStation,
    moveAlong,
    enterEntrance,
    cancelEntrance,
    getEntranceState() {
      return entranceState;
    },
    look(direction) {
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
      if (entranceState !== 'inside') {
        setEntranceState('inside');
        entranceGate.visible = false;
        corridorWorld.visible = true;
        corridorReveal = 1;
      }
      setActiveStation(index, false);
    },
    dispose() {
      disposed = true;
      mount.removeEventListener('pointermove', onPointerMove);
      mount.removeEventListener('pointerleave', onPointerLeave);
      mount.removeEventListener('pointerdown', onPointerDown);
      mount.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      mount.replaceChildren();
    },
  };
}
