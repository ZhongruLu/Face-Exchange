import * as THREE from 'three';
import { makeReflection } from './spatialArchitecture.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { compactModelGeometry, releaseUnusedPbrMaps, releaseGeometry, releaseModel } from './modelResources.js';
import { createBlackMarbleFloor } from './blackMarbleFloor.js';
import { palaceWall, palaceCeiling, palaceTimber } from './palaceSurfaces.js';
import { addDoorUplights, addWallTextureFixtures } from './doorUplights.js';
export const EYE_Y = 2.25;
export const GATE_Z = 5.45;
const COLUMN_COUNT=6;
const COLUMN_GAP=5.6;
const COLUMN_X=9.2;
const COLUMN_WIDTH=1.6;

export function createEntrance() {
  const group = new THREE.Group();
  let released=false;
  const columnFallbacks=[];
  const frameFallbacks=[];
  group.name = 'identityProcessionalHall'; group.position.z = GATE_Z;
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd7a443, metalness: 0.94, roughness: 0.23, clearcoat: 0.7 });
  const bronze = new THREE.MeshPhysicalMaterial({ color: 0x4b260e, metalness: 0.78, roughness: 0.3 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x100805, metalness: 0.12, roughness: 0.3, clearcoat: 0.5, envMapIntensity: 0.08 });
  const luminous = new THREE.MeshBasicMaterial({ color: 0xffc46a, toneMapped: false });
  const add = (parent, geo, mat, xyz) => {
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(...xyz);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const box = (parent, mat, size, xyz) => add(parent,new THREE.BoxGeometry(...size),mat,xyz);
  const ring = (parent,r,tube,xyz) => add(parent,new THREE.TorusGeometry(r,tube,10,80),gold,xyz);
  box(group,createBlackMarbleFloor(),[26,0.18,40],[0,-0.1,15]);
  const reflection=makeReflection(25,39,512);
  reflection.material.uniforms.color.value.set(0x39240c);
  reflection.material.fragmentShader=reflection.material.fragmentShader.replace('0.2 );','0.12 );');
  reflection.position.set(0,0.005,15); group.add(reflection);
  box(group,palaceCeiling(),[25,0.25,36],[0,10.5,13]);
  for(const side of [-1,1]) {
    box(group,palaceWall(10.5),[0.35,10.5,36],[side*11.8,5.2,13]);
    for(let i=0;i<COLUMN_COUNT;i++) {
      const z=i*COLUMN_GAP;
      const columnGroup=new THREE.Group(); group.add(columnGroup); columnFallbacks.push(columnGroup);
      const shaft=add(columnGroup,new THREE.CylinderGeometry(0.42,0.52,9.6,32),bronze,[side*9.2,4.95,z]);
      for(let flute=0;flute<16;flute++) {
        const a=flute/16*Math.PI*2;
        box(columnGroup,gold,[0.065,9.3,0.065],[shaft.position.x+Math.cos(a)*0.47,4.95,z+Math.sin(a)*0.47]);
      }
      box(columnGroup,gold,[1.5,0.28,1.5],[side*9.2,0.18,z]);
      box(columnGroup,gold,[1.4,0.32,1.4],[side*9.2,9.9,z]);
      if(side<0) box(group,palaceTimber(),[19,0.3,0.3],[0,10.15,z]);
      box(group,luminous,[0.04,7.8,0.04],[side*9.2,4.5,z+0.5]);
    }
  }
  // The gate is part of a continuous wall, with its threshold on the floor.
  for(const s of [-1,1]) {
    box(group,palaceWall(10.5),[9.9,10.5,0.5],[s*7.05,5.25,-1.15]);
    frameFallbacks.push(box(group,gold,[0.38,6.5,0.48],[s*2.1,3.25,0]));
  }
  const upperWall=box(group,palaceWall(10.5),[4.4,4,0.5],[0,8.5,-1.15]);
  frameFallbacks.push(box(group,gold,[4.6,0.38,0.5],[0,6.55,0]));
  const makeDoor=side=>{
    const pivot=new THREE.Group(); pivot.position.set(side*2,0,0.06); group.add(pivot);
    const center=-side;
    box(pivot,bronze,[2,6.3,0.18],[center,3.15,0]);
    box(pivot,black,[1.7,5.9,0.04],[center,3.15,0.12]);
    for(const edge of [-1,1]) box(pivot,gold,[0.09,6.3,0.12],[center+edge*0.95,3.15,0.16]);
    for(const y of [0.16,1.3,5.2,6.2]) box(pivot,gold,[1.9,0.08,0.12],[center,y,0.16]);
    const oval=ring(pivot,0.64,0.025,[center,3.25,0.19]); oval.scale.y=1.9;
    add(pivot,new THREE.IcosahedronGeometry(0.22,1),gold,[center,3.25,0.25]);
    return pivot;
  };
  const leftDoorPivot=makeDoor(-1),rightDoorPivot=makeDoor(1);
  const hit=add(group,new THREE.PlaneGeometry(4,6.3),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,3.15,0.3]);
  hit.userData.isEntranceHit=true;
  const motes=new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.035),gold,90);
  const dummy=new THREE.Object3D();
  for(let i=0;i<90;i++) {
    dummy.position.set(Math.sin(i*2.399)*8,0.8+(i%19)*0.4,(i*7.31)%29);
    dummy.rotation.set(i*0.7,i*0.4,0); dummy.updateMatrix(); motes.setMatrixAt(i,dummy.matrix);
  }
  group.add(motes);
  for(const [x,z] of [[-4,20],[4,12],[0,1]]) {
    const light=new THREE.SpotLight(0xffdfbd,55,23,0.65,0.9,2); light.position.set(x,9,z+1);
    light.target.position.set(x,2,z); group.add(light,light.target);
  }
  addDoorUplights(group, { span: 3.25, power: 28 });
  const glow=new THREE.PointLight(0xffdfbd,4,12,2); glow.position.set(0,4,1.5); group.add(glow);
  const doorwayView=new THREE.Group(); group.add(doorwayView);
  const uniforms={time:{value:0},pointer:{value:0},strength:{value:1}};
  group.userData={leftDoorPivot,rightDoorPivot,hit,glow,uniforms,doorwayView,reflection,
    dispose(){released=true;releaseModel(group,reflection);reflection.dispose();},
    update(time,reducedMotion){
      if(reducedMotion) return;
      motes.rotation.y=Math.sin(time*0.06)*0.018;
    }};
  const loader=new GLTFLoader();
  const decoder=new DRACOLoader().setDecoderPath('/assets/codecs/draco/').setWorkerLimit(2);
  loader.setDRACOLoader(decoder);
  let pendingModels=2;
  const finishModel=()=>{if(--pendingModels===0)decoder.dispose();};
  const prepare=root=>{
    const stats=compactModelGeometry(root);
    releaseUnusedPbrMaps(root);
    console.info('Entrance geometry buffers',JSON.stringify(stats));
    root.traverse(obj=>{
    if(!obj.isMesh) return;
    obj.castShadow=true; obj.receiveShadow=true;
    for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])) {
      mat.envMapIntensity=0.85;
      if(mat.map) mat.map.anisotropy=4;
    }
    });
  };
  group.userData.modelStatus={columns:'loading',door:'loading',carpet:'removed'};
  loader.load('/assets/models/entrance/classical-column-web.glb',gltf=>{
    finishModel();
    if(released){releaseModel(gltf.scene);return;}
    prepare(gltf.scene);
    gltf.scene.traverse(obj=>{
      if(!obj.isMesh) return;
      for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])) {
        mat.color.set(0xc79535); mat.metalness=0.86; mat.roughness=0.3;
        mat.metalnessMap=null; mat.roughnessMap=null; mat.normalScale.setScalar(0.6);
      }
    });
    const bounds=new THREE.Box3().setFromObject(gltf.scene);
    const scale=9.9/(bounds.max.y-bounds.min.y);
    const widthScale=COLUMN_WIDTH/(bounds.max.x-bounds.min.x);
    const depthScale=COLUMN_WIDTH/(bounds.max.z-bounds.min.z);
    for(const side of [-1,1]) for(let i=0;i<COLUMN_COUNT;i++) {
      const column=gltf.scene.clone(true); column.scale.set(widthScale,scale,depthScale);
      column.position.set(side*COLUMN_X,-bounds.min.y*scale,i*COLUMN_GAP);
      group.add(column);
    }
    columnFallbacks.forEach(releaseGeometry); columnFallbacks.length=0;
    group.userData.modelStatus.columns='ready';
  },undefined,error=>{finishModel();group.userData.modelStatus.columns='error'; console.error('Entrance column model',error);});
  loader.load('/assets/models/entrance/ornate-door-clean.glb',gltf=>{
    finishModel();
    if(released){releaseModel(gltf.scene);return;}
    const frame=gltf.scene.getObjectByName('DoorFrame');
    const left=gltf.scene.getObjectByName('LeftDoor');
    const right=gltf.scene.getObjectByName('RightDoor');
    if(!frame||!left||!right) {group.userData.modelStatus.door='error'; return;}
    prepare(gltf.scene);
    gltf.scene.traverse(obj=>{
      if(!obj.isMesh) return;
      for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])) {
        mat.color.set(0xd9ae5f); mat.metalness=0.8; mat.roughness=0.42;
        mat.metalnessMap=null; mat.roughnessMap=null;
        mat.normalScale.setScalar(0.18); mat.envMapIntensity=0.55;
      }
    });
    const scale=9.2;
    frame.removeFromParent(); frame.scale.setScalar(scale); frame.position.set(0,-0.09,0.3); group.add(frame);
    for(const [leaf,pivot] of [[left,leftDoorPivot],[right,rightDoorPivot]]) {
      pivot.position.x=Math.sign(pivot.position.x)*0.219*scale;
      // The source leaf's rear surface sits at z ~= -0.69 after scaling.
      // Hinge at that surface so its thick lower moulding swings out of the passage.
      pivot.position.z=-0.44;
      [...pivot.children].forEach(releaseGeometry); pivot.clear(); leaf.removeFromParent(); leaf.scale.setScalar(scale);
      // The authored geometry keeps world coordinates. Offset them into the existing outer-edge hinge.
      leaf.position.set(-pivot.position.x,-0.09,0.74); pivot.add(leaf);
      // A closed, thin backing seals the cut edges and stays attached to the same hinge.
      const backing=box(pivot,bronze,[0.219*scale,0.586*scale-0.09,0.08],[-pivot.position.x/2,(0.586*scale-0.09)/2,0.01]);
      backing.receiveShadow=false;
    }
    frameFallbacks.forEach(releaseGeometry); frameFallbacks.length=0;
    // The full lintel wall remains behind the ornate arch, closing its upper void.
    upperWall.name='EntranceArchBackingWall';
    group.userData.modelStatus.door='ready';
  },undefined,error=>{finishModel();group.userData.modelStatus.door='error'; console.error('Entrance door model',error);});
  addWallTextureFixtures(group);
  return group;
}
