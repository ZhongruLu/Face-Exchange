import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { compactModelGeometry, releaseGeometry, releaseModel } from './modelResources.js';

export const ORNATE_DOOR_URL = '/assets/models/doors/ornate-corridor-doors.glb';

export function installOrnateDoors(source, doors) {
  const left = source.getObjectByName('DoorLeft');
  const right = source.getObjectByName('DoorRight');
  const frames = source.children.filter(child => child.name.startsWith('Frame'));
  if (!left?.isMesh || !right?.isMesh || frames.length !== 4) throw new Error('Incomplete ornate door assembly');
  const instances = [];
  for (const door of doors) {
    // Swap only the shell; the handle mounts and interaction pivots stay alive.
    releaseGeometry(door.userData.jambs);
    for (const frame of frames) {
      const instance = frame.clone(true);
      instance.userData.isDoorArchitecture = true;
      door.add(instance); instances.push(instance);
    }
    for (const [part, pivot] of [[left,door.userData.leftPivot],[right,door.userData.rightPivot]]) {
      for (const shell of pivot.userData.doorShell) releaseGeometry(shell);
      pivot.userData.doorShell = [];
      const instance = part.clone(true);
      instance.position.x -= pivot.position.x;
      instance.position.z -= pivot.position.z;
      instance.userData.isDoorPanel = true;
      pivot.add(instance); instances.push(instance);
      const panel = pivot.userData.handlePanel;
      panel.userData.handleFrontZ = .085;
      for (const handle of panel.children) if (handle.name === 'MedusaHandle') handle.position.z = .085;
    }
  }
  return instances;
}

export function loadOrnateCorridorDoors(doors, loader = new GLTFLoader()) {
  let disposed = false, source;
  let instances = [];
  const state = {status:'loading', dispose() {
    disposed = true;
    for (const instance of instances) instance.removeFromParent();
    instances = [];
    if (source) { releaseModel(source); source = null; }
    state.status = 'disposed';
  }};
  loader.load(ORNATE_DOOR_URL, gltf => {
    if (disposed) { releaseModel(gltf.scene); return; }
    source = gltf.scene;
    compactModelGeometry(source);
    const frameMaterials = new Map();
    source.traverse(child => {
      if (!child.isMesh) return;
      if (child.name.startsWith('Frame')) {
        if (!frameMaterials.has(child.material)) frameMaterials.set(child.material, child.material.clone());
        child.material = frameMaterials.get(child.material);
      }
      child.material.envMapIntensity = .45;
      if (child.material.map) child.material.map.anisotropy = 4;
    });
    try {
      instances = installOrnateDoors(source,doors);
      state.status = 'ready';
    } catch (error) {
      releaseModel(source); source = null;
      state.status = 'error';
      console.warn('Could not install ornate corridor doors.',error);
    }
  }, undefined, error => {
    if (disposed) return;
    state.status = 'error';
    console.warn('Could not load ornate corridor doors; keeping the existing doors.',error);
  });
  return state;
}
