import * as THREE from 'three';

const casing = new THREE.MeshStandardMaterial({ color: 0x574535, metalness: 0.6, roughness: 0.4 });
const lens = new THREE.MeshBasicMaterial({ color: 0xffdfb5 });
let washTexture;
function wash() {
  if (!washTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    // A narrow source opens upward and fades before reaching the ceiling.
    // Canvas top is the top of the wall plane.
    for (let row = 0; row < canvas.height; row++) {
      const height = 1 - row / (canvas.height - 1);
      const width = 5 + height * 54;
      const fade = Math.pow(1 - height, 0.65) * Math.min(1, height * 18);
      const gradient = ctx.createLinearGradient(64 - width, 0, 64 + width, 0);
      gradient.addColorStop(0, 'rgba(255,190,80,0)');
      gradient.addColorStop(0.3, `rgba(255,202,108,${fade * 0.36})`);
      gradient.addColorStop(0.5, `rgba(255,225,157,${fade * 0.82})`);
      gradient.addColorStop(0.7, `rgba(255,202,108,${fade * 0.36})`);
      gradient.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, row, canvas.width, 1);
    }
    washTexture = new THREE.CanvasTexture(canvas);
    washTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return washTexture;
}

// Upward spotlights and feathered wall beams share one texture and no shadow maps.
export function addDoorUplights(parent, { floorY = 0, span = 2.16, wallZ = 0, power = 24 } = {}) {
  const lights = [];
  for (const side of [-1, 1]) {
    const x = side * span;
    const fixture = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.045, 16), casing);
    fixture.position.set(x, floorY + 0.024, wallZ + 0.42);
    fixture.name = 'RecessedDoorUplight';
    const glass = new THREE.Mesh(new THREE.CircleGeometry(0.105, 16), lens);
    glass.rotation.x = -Math.PI / 2;
    glass.position.copy(fixture.position); glass.position.y += 0.025;
    const light = new THREE.SpotLight(0xffcc78, power, 8, 0.48, 0.85, 2);
    light.name = side < 0 ? 'DoorUplightLeft' : 'DoorUplightRight';
    light.position.set(x, floorY + 0.11, wallZ + 0.48);
    light.target.position.set(x, floorY + 4.8, wallZ - 0.1);
    light.castShadow = false;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 5.4), new THREE.MeshBasicMaterial({
      map: wash(), transparent: true, opacity: 0.72,
      blending: THREE.AdditiveBlending, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -1,
    }));
    glow.position.set(x, floorY + 2.73, wallZ + 0.035);
    glow.name = 'SoftDoorWallWash';
    parent.add(fixture, glass, light, light.target, glow);
    lights.push(light);
  }
  return lights;
}

const cameraLocal = new THREE.Vector3();
export function updateCorridorUplights(world, camera) {
  world.updateWorldMatrix(true, false);
  cameraLocal.copy(camera.position);
  world.worldToLocal(cameraLocal);
  const entries = world.userData.uplightEntries;
  if (!entries) return;
  // Only two nearby door pairs contribute actual lights. Distant fixtures use
  // their cheap emissive lenses and wall washes, avoiding an ever-growing shader.
  let first = null, second = null, firstDistance = 20, secondDistance = 20;
  for (const entry of entries) {
    const distance = Math.abs(entry.z - cameraLocal.z);
    if (distance < firstDistance) {
      second = first; secondDistance = firstDistance;
      first = entry; firstDistance = distance;
    } else if (distance < secondDistance) { second = entry; secondDistance = distance; }
  }
  for (const entry of entries) for (const light of entry.lights) light.visible = entry === first || entry === second;
}

// Decorative fixtures follow the five baked light pools in the supplied wall image.
// They emit visually without increasing the number of scene lights.
const wallPoolPixels = [380, 587, 779, 982, 1264];
const decorativeCasing = new THREE.CylinderGeometry(0.15, 0.15, 0.035, 20);
const decorativeLens = new THREE.CircleGeometry(0.115, 20);
const decorativeHalo = new THREE.CircleGeometry(0.26, 24);
const haloMaterial = new THREE.MeshBasicMaterial({
  color: 0xffc46d, transparent: true, opacity: 0.13,
  blending: THREE.AdditiveBlending, depthWrite: false,
});
export function addWallTextureFixtures(parent) {
  parent.updateWorldMatrix(true, true);
  const points = [];
  parent.traverse(wall => {
    if (wall.material?.name !== 'MutedRococoWall') return;
    const size = wall.geometry?.parameters;
    if (!size || size.height < 6) return;
    const center = new THREE.Vector3();
    wall.getWorldPosition(center);
    const bottom = center.y - size.height / 2;
    // Upper lintels have no floor below their painted panels.
    if (Math.abs(bottom) > 0.2) return;
    const alongZ = size.width < size.depth;
    const axis = alongZ ? 'z' : 'x';
    const length = alongZ ? size.depth : size.width;
    const minimum = center[axis] - length / 2;
    const maximum = center[axis] + length / 2;
    const period = size.height * 993 / 333;
    for (let tile = Math.floor(minimum / period); tile <= Math.floor(maximum / period); tile++) {
      for (const pixel of wallPoolPixels) {
        const position = (tile + (pixel - 331) / 993) * period;
        if (position < minimum + 0.16 || position > maximum - 0.16) continue;
        const point = center.clone();
        point[axis] = position;
        point.y = bottom + 0.025;
        // Place on the visible, interior side of each wall, clear of the skirting.
        if (alongZ) point.x -= Math.sign(center.x) * (size.width / 2 + 0.32);
        else point.z += size.depth / 2 + 0.32;
        parent.worldToLocal(point);
        points.push(point);
      }
    }
  });
  if (!points.length) return;
  const bodies = new THREE.InstancedMesh(decorativeCasing, casing, points.length);
  const lenses = new THREE.InstancedMesh(decorativeLens, lens, points.length);
  const halos = new THREE.InstancedMesh(decorativeHalo, haloMaterial, points.length);
  bodies.name = 'WallTextureGroundFixtures';
  lenses.name = 'WallTextureGroundLenses';
  halos.name = 'WallTextureGroundHalos';
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
  const scale = new THREE.Vector3(1, 1, 1);
  points.forEach((point, index) => {
    bodies.setMatrixAt(index, matrix.makeTranslation(point.x, point.y, point.z));
    lenses.setMatrixAt(index, matrix.compose(new THREE.Vector3(point.x, point.y + 0.019, point.z), rotation, scale));
    halos.setMatrixAt(index, matrix.compose(new THREE.Vector3(point.x, point.y - 0.005, point.z), rotation, scale));
  });
  parent.add(bodies, lenses, halos);
}
