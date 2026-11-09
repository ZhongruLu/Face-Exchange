import * as THREE from 'three';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { compactModelGeometry, releaseGeometry, releaseModel } from './modelResources.js';

export const MEDUSA_HANDLE_URL = '/assets/models/handles/medusa-handle-compact.glb';

// glTF +Z is the face side. Keep the back clear of the door's front at z=.06.
export function fitMedusaHandle(source) {
  const wrapper = new THREE.Group();
  wrapper.name = 'MedusaHandle';
  const model = source.clone(true);
  model.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const scale = 1.28 / size.y;
  wrapper.scale.set(scale, scale, Math.min(scale, .085 / size.z));
  model.position.sub(new THREE.Vector3(center.x, center.y, bounds.min.z));
  wrapper.position.set(0, .22, .085);
  model.traverse(child => { child.userData.isDoorPanel = true; });
  wrapper.add(model);
  return wrapper;
}

export function loadMedusaDoorHandles(doors, loader = new GLTFLoader()) {
  const ownsDecoder=!loader.dracoLoader;
  const releaseDecoder=()=>{if(ownsDecoder)loader.dracoLoader.dispose();};
  if(ownsDecoder)loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/assets/codecs/draco/').setWorkerLimit(2));
  let disposed = false;
  let source;
  const instances = [];
  const state = { status: 'loading', dispose() {
    disposed = true;
    for (const instance of instances) instance.removeFromParent();
    instances.length = 0;
    if (source) { releaseModel(source); source = null; }
    state.status = 'disposed';
  } };
  loader.load(MEDUSA_HANDLE_URL, gltf => {
    releaseDecoder();
    if (disposed) { releaseModel(gltf.scene); return; }
    source = gltf.scene;
    compactModelGeometry(source);
    source.traverse(child => {
      if (!child.isMesh) return;
      for (const material of (Array.isArray(child.material) ? child.material : [child.material])) {
        material.envMapIntensity = .65;
        if (material.map) material.map.anisotropy = 4;
      }
    });
    // Clones share geometry, materials and textures across every door leaf.
    for (const door of doors) {
      for (const pivot of [door.userData.leftPivot, door.userData.rightPivot]) {
        const { handlePanel, handleFallback } = pivot.userData;
        const instance = fitMedusaHandle(source);
        instance.position.z = handlePanel.userData.handleFrontZ ?? .085;
        handlePanel.add(instance);
        instances.push(instance);
        releaseGeometry(handleFallback);
      }
    }
    state.status = 'ready';
  }, undefined, error => {
    releaseDecoder();
    if (disposed) return;
    state.status = 'error';
    console.warn('Medusa handle could not load; keeping the existing door handles.', error);
  });
  return state;
}
