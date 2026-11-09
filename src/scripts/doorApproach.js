import * as THREE from 'three';

const MAX_APPROACH_ANGLE = THREE.MathUtils.degToRad(19);
const smooth = (a, b, value) => THREE.MathUtils.smoothstep(value, a, b);
export function doorApproachWeight(cameraZ, doorZ) {
  const distance = cameraZ - doorZ;
  return smooth(-2, 6, distance) * (1 - smooth(10, 25, distance));
}

// Camera attention ends before the door centre reaches the viewer.
// Wall motion has its own slower curve and may overlap the next doorway.
export function doorCameraWeight(cameraZ, doorZ) {
  const distance = cameraZ - doorZ;
  return smooth(2, 8, distance) * (1 - smooth(10, 21, distance));
}

// Rotate a flat neighbourhood of the opening; feather the ends into the wall.
export function bendDoorWall(x, z, side, doorZ, angle) {
  if (angle === 0) return [x, z];
  if (!side) {
    if (Math.abs(z - doorZ) > 0.6) return [x, z];
    const yaw = angle * 0.5;
    return [x * Math.cos(yaw) + (z - doorZ) * Math.sin(yaw),
      doorZ - x * Math.sin(yaw) + (z - doorZ) * Math.cos(yaw)];
  }
  if (x * side < 4.6) return [x, z];
  const dz = z - doorZ;
  const blend = 1 - smooth(3.5, 7, Math.abs(dz));
  const yaw = side * angle * blend;
  const dx = x - side * 4.9;
  return [side * 4.9 + dx * Math.cos(yaw) + dz * Math.sin(yaw),
    doorZ - dx * Math.sin(yaw) + dz * Math.cos(yaw)];
}

// The next door takes over once the previous frame has passed the camera.
export function findApproachDoor(doors, cameraZ) {
  let selected = -1, nearest = Infinity;
  doors.forEach((door, index) => {
    const distance = cameraZ - door.userData.nodeZ;
    if (distance >= -2 && distance < nearest) { selected = index; nearest = distance; }
  });
  return selected;
}

export function createDoorApproach(world, doors) {
  const surfaces = [];
  const fixtures = [];
  for (const mesh of world.children) {
    if (!mesh.isMesh) continue;
    if (mesh.isInstancedMesh && mesh.name.startsWith('WallTextureGround')) {
      const matrices = Array.from({ length: mesh.count }, (_, i) => {
        const matrix = new THREE.Matrix4(); mesh.getMatrixAt(i, matrix); return matrix;
      });
      fixtures.push({ mesh, matrices });
    } else if (mesh.geometry?.type === 'BoxGeometry' && (Math.abs(mesh.position.x) > 4.7 || mesh.position.z === doors.at(-1).userData.nodeZ - 0.16)) {
      // Shared long cornices need vertices along the corridor as well.
      const old = mesh.geometry;
      const p = old.parameters;
      mesh.geometry = new THREE.BoxGeometry(p.width, p.height, p.depth, 1, 1, Math.max(1, Math.ceil(p.depth / 0.45)));
      old.dispose();
      surfaces.push({ mesh, base: mesh.geometry.attributes.position.array.slice() });
    }
  }
  const angles = doors.map(() => 0);
  let previousAngles = doors.map(() => -1);
  const matrix = new THREE.Matrix4();
  function renderAngles() {
    if (angles.every((angle, i) => Math.abs(angle - previousAngles[i]) < 0.00001)) return;
    previousAngles = angles.slice();
    doors.forEach((entry, i) => {
      const side = entry.userData.side;
      entry.rotation.y = (side === 0 ? 0 : -side * Math.PI / 2) + (side || 0.5) * angles[i];
    });
    function bend(x, z) {
      for (let i = 0; i < doors.length; i++) {
        if (angles[i] < 0.00001) continue;
        [x, z] = bendDoorWall(x, z, doors[i].userData.side, doors[i].userData.nodeZ, angles[i]);
      }
      return [x, z];
    }
    for (const { mesh, base } of surfaces) {
      const position = mesh.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        const offset = i * 3;
        const [x, depth] = bend(base[offset] + mesh.position.x, base[offset + 2] + mesh.position.z);
        position.setXYZ(i, x - mesh.position.x, base[offset + 1], depth - mesh.position.z);
      }
      position.needsUpdate = true;
      mesh.geometry.computeVertexNormals();
      mesh.geometry.computeBoundingSphere();
    }
    for (const { mesh, matrices } of fixtures) {
      matrices.forEach((base, i) => {
        matrix.copy(base);
        const [x, depth] = bend(base.elements[12], base.elements[14]);
        matrix.elements[12] = x; matrix.elements[14] = depth;
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }
  function apply(index, angle) {
    angles.fill(0);
    if (index >= 0) angles[index] = angle;
    renderAngles();
  }
  function update(cameraZ, delta, reducedMotion = false) {
    let amount = 0, side = 0, doorZ = 0;
    doors.forEach((door, i) => {
      const desired = reducedMotion || door.userData.interactive === false ? 0 : doorApproachWeight(cameraZ, door.userData.nodeZ) * MAX_APPROACH_ANGLE;
      angles[i] = THREE.MathUtils.damp(angles[i], desired, desired < angles[i] ? 1.6 : 2.6, delta);
      if (desired === 0 && angles[i] < 0.00001) angles[i] = 0;
      const weight = reducedMotion || door.userData.interactive === false ? 0 : doorCameraWeight(cameraZ, door.userData.nodeZ);
      amount += weight;
      side += door.userData.side * weight;
      doorZ += door.userData.nodeZ * weight;
    });
    renderAngles();
    return { amount: Math.min(1, amount), side: amount ? side / amount : 0, doorZ: amount ? doorZ / amount : cameraZ - 8 };
  }
  return { apply, update, reset: () => apply(-1, 0) };
}
