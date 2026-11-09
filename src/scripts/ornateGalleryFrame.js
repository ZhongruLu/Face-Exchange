import * as THREE from 'three';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { compactModelGeometry, releaseModel } from './modelResources.js';

export const ORNATE_FRAME_URL='/assets/models/gallery/ornate-gold-frame-compact.glb';
export const GALLERY_FRAME_HEIGHT=2.05;
export const GALLERY_FRAME_DISPLAY_SCALE=(GALLERY_FRAME_HEIGHT+.5)/GALLERY_FRAME_HEIGHT;

export function fitGalleryFrame(source) {
  const model=source.clone(true);
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const wrapper=new THREE.Group(); wrapper.name='OrnateGoldGalleryFrame';
  const scale=GALLERY_FRAME_HEIGHT/size.y;
  wrapper.scale.set(scale,scale,Math.min(scale,.11/size.z));
  wrapper.position.z=.025;
  model.position.sub(new THREE.Vector3(center.x,center.y,bounds.min.z));
  wrapper.add(model);
  return wrapper;
}

export function loadGalleryFrameModel(entries,loader=new GLTFLoader()) {
  const ownsDecoder=!loader.dracoLoader;
  const releaseDecoder=()=>{if(ownsDecoder)loader.dracoLoader.dispose();};
  if(ownsDecoder)loader.setDRACOLoader(new DRACOLoader().setDecoderPath('/assets/codecs/draco/').setWorkerLimit(2));
  let disposed=false,source;
  const instances=[];
  const state={status:'loading',dispose(){
    disposed=true;
    for(const instance of instances)instance.removeFromParent();
    instances.length=0;
    if(source){releaseModel(source);source=null;}
    state.status='disposed';
  }};
  loader.load(ORNATE_FRAME_URL,gltf=>{
    releaseDecoder();
    if(disposed){releaseModel(gltf.scene);return;}
    source=gltf.scene;compactModelGeometry(source);
    source.traverse(child=>{
      if(!child.isMesh)return;
      for(const material of Array.isArray(child.material)?child.material:[child.material]){
        material.envMapIntensity=.5;
        if(material.map)material.map.anisotropy=4;
      }
    });
    for(const entry of entries){
      const instance=fitGalleryFrame(source);entry.frame.add(instance);instances.push(instance);
      entry.fallback.removeFromParent();
    }
    state.status='ready';
  },undefined,error=>{releaseDecoder();if(!disposed){state.status='error';console.warn('Ornate frame unavailable; keeping the oval fallback.',error);}});
  return state;
}
