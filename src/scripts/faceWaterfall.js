import { translate, onLanguageChange } from './language.js';
import * as THREE from 'three';
import {createNanoFaceEffects,disposeNanoEngine} from './nanoFaceEffects.js';
import {readFaces} from './faceArchive.js';
// Low-discrepancy positions spread cards through a volume, without a wall/grid.
export function floatingFacePose(index){
 const fract=value=>value-Math.floor(value),layer=index%4;
 return {x:(fract((index+1)*.61803398875)*2-1)*(6+layer*3.4),y:1.8+fract((index+1)*.41421356237)*13,
  z:-13-layer*8-fract((index+1)*.754877666)*3,
  scale:.55+fract((index+1)*.56984029)*.25,phase:index*2.399963,
  rx:(fract((index+1)*.317)-.5)*.22,ry:(fract((index+1)*.713)-.5)*.65,rz:(fract((index+1)*.193)-.5)*.22};
}
export function createFaceWaterfall(design){
 const group=new THREE.Group();group.name='Room7_FaceWaterfall';
 const reflection=new THREE.Group();reflection.dispose=()=>{};
 const exhibit=new THREE.Group();group.add(exhibit);
 const accentLight=new THREE.PointLight(0xffd9a0,8,50,2);accentLight.position.set(0,12,-10);group.add(accentLight);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,70),new THREE.MeshBasicMaterial({color:0x0c0907}));floor.rotation.x=-Math.PI/2;floor.position.z=-20;group.add(floor);
 const cards=new THREE.Group();cards.name='FloatingFaceArchive';group.add(cards);
 const text=(message,width=18,height=1)=>{
  const canvas=document.createElement('canvas');canvas.width=Math.max(512,Math.round(width/height*128));canvas.height=128;const ctx=canvas.getContext('2d');
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f4eedf';ctx.font='500 88px "IBM Plex Mono", monospace';ctx.textAlign='center';ctx.fillText(translate(message),canvas.width/2,98,canvas.width-16);texture.needsUpdate=true;};draw();const unsubscribe=onLanguageChange(draw);texture.addEventListener('dispose',unsubscribe);
  return new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
 };
 const heading=text('HONOUR');heading.position.set(0,3,-17);group.add(heading);
 const textures=new Map(),loader=new THREE.TextureLoader();let rows=[],cancelled=false,lastTime=null,motionTime=0;const nanoEffects=new Map();
 async function refresh(){
  try{
   const request=Symbol();group.userData.archiveRequest=request;
   const records=await readFaces();if(cancelled||group.userData.archiveRequest!==request)return;
   cards.children.forEach(row=>row.traverse(o=>{o.geometry?.dispose();if(o.material?.map && ![...textures.values(),...[...nanoEffects.values()].flatMap(e=>e.variants.map(v=>v.texture))].includes(o.material.map))o.material.map.dispose();o.material?.dispose();}));cards.clear();rows=[];group.userData.hits=[];motionTime=0;lastTime=null;
   heading.visible=!records.length;
   if(!records.length){return;}
   // Repeated versions are explicitly labelled; every source is a real upload.
   const cols=10,rowCount=Math.max(8,Math.ceil(records.length/cols));
   const generation=Symbol();group.userData.generation=generation;
   for(let row=0;row<rowCount;row++){
    for(let col=0;col<cols;col++){
     const index=row*cols+col,record=records[index%records.length];
     let map=textures.get(record.id);if(!map){map=loader.load(record.image,loaded=>{if(cancelled)return;const original=loaded.image;const thumb=document.createElement('canvas');thumb.width=384;thumb.height=480;thumb.getContext('2d').drawImage(original,0,0,384,480);loaded.image=thumb;loaded.needsUpdate=true;const effects=createNanoFaceEffects(original);nanoEffects.get(record.id)?.dispose();nanoEffects.set(record.id,effects);cards.traverse(card=>{if(card.userData.recordId===record.id&&card.userData.nanoIndex!==undefined){const variant=effects.variants[card.userData.nanoIndex];card.material.dispose();card.material=new THREE.MeshBasicMaterial({map:variant.texture,side:THREE.DoubleSide});card.userData.effect=variant.name;card.userData.preview=variant.canvas;}});});map.colorSpace=THREE.SRGBColorSpace;textures.set(record.id,map);}
     const seed=Math.random()*100,material=new THREE.ShaderMaterial({uniforms:{map:{value:map},seed:{value:seed}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:`
      uniform sampler2D map;uniform float seed;varying vec2 vUv;
      void main(){vec2 uv=vUv;float mode=mod(floor(seed),4.0);
       if(mode<1.0){for(int i=0;i<2;i++){vec2 eye=vec2(i==0?0.36:0.64,0.61);vec2 d=uv-eye;float f=1.0-smoothstep(0.0,0.19,length(d));uv-=d*f*.65;}}
       else if(mode<2.0){uv.x+=sin(uv.y*15.0+seed)*.075;uv.y+=sin(uv.x*12.0)*.035;}
       else if(mode<3.0){vec2 d=uv-.5;float a=length(d)*4.0;uv=.5+mat2(cos(a),-sin(a),sin(a),cos(a))*d;}
       else{uv.x=.5+(uv.x-.5)*(1.0+.45*sin(uv.y*9.0));uv.y+=.045*sin(uv.x*18.0);}
       vec3 c=texture2D(map,clamp(uv,.001,.999)).rgb;float gray=dot(c,vec3(.299,.587,.114));c=mix(c,vec3(gray)*vec3(1.12,.92,.75),.35);gl_FragColor=vec4(c,1.0);
       #include <tonemapping_fragment>
       #include <colorspace_fragment>
      }`});
     const portrait=new THREE.Mesh(new THREE.PlaneGeometry(1.8,2.3),material);portrait.position.set(0,0,0);portrait.name='ArchivedFaceVariant';portrait.userData.recordId=record.id;portrait.userData.roomAction='inspect-face';
     portrait.userData.record=record;portrait.userData.effect=['ENLARGED EYES','DISPLACED','SWIRL','STRETCHED'][Math.floor(seed)%4];
     if(index%7>=4){portrait.userData.nanoIndex=index%7-4;const effects=nanoEffects.get(record.id);if(effects){const effect=effects.variants[portrait.userData.nanoIndex];material.dispose();portrait.material=new THREE.MeshBasicMaterial({map:effect.texture,side:THREE.DoubleSide});portrait.userData.effect=effect.name;portrait.userData.preview=effect.canvas;}}
     const band=new THREE.Group(),pose=floatingFacePose(index);band.userData.pose=pose;
     band.position.set(pose.x,pose.y,pose.z);band.rotation.set(pose.rx,pose.ry,pose.rz);band.scale.setScalar(pose.scale);cards.add(band);rows.push(band);
     portrait.material.side=THREE.DoubleSide;
     band.add(portrait);group.userData.hits.push(portrait);
     const outlineGeometry=new THREE.BufferGeometry().setFromPoints([[-.94,-1.19],[.94,-1.19],[.94,1.19],[-.94,1.19]].map(([x,y])=>new THREE.Vector3(x,y,.025)));
     const outline=new THREE.LineLoop(outlineGeometry,new THREE.LineBasicMaterial({color:0xd8bb7c}));outline.visible=false;band.add(outline);band.userData.portrait=portrait;band.userData.outline=outline;
     const variant=Math.floor(index/records.length)+1,price=record.price===null?'NOT SOLD':`${record.price.toLocaleString()} RMB`;
     // One label texture/draw per card, containing both price and identity.
     const captionCanvas=document.createElement('canvas');captionCanvas.width=512;captionCanvas.height=144;
     const ctx=captionCanvas.getContext('2d'),captionTexture=new THREE.CanvasTexture(captionCanvas);captionTexture.colorSpace=THREE.SRGBColorSpace;
     const drawCaption=()=>{ctx.clearRect(0,0,512,144);ctx.fillStyle='#f4eedf';ctx.textAlign='center';ctx.font='500 56px monospace';ctx.fillText(translate(price),256,61,500);ctx.font='24px monospace';ctx.fillText(`${record.id.slice(0,6)} / VERSION ${variant}`,256,111,500);captionTexture.needsUpdate=true;};drawCaption();const unsubscribe=onLanguageChange(drawCaption);captionTexture.addEventListener('dispose',unsubscribe);
     const caption=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.62),new THREE.MeshBasicMaterial({map:captionTexture,transparent:true,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));caption.position.set(0,-1.55,.015);band.add(caption);
    }
   }
   group.userData.recordCount=records.length;
  }catch(error){heading.visible=true;group.userData.archiveError=error.message;}
 }
 group.userData={reflection,exhibit,accentLight,animated:[],hits:[],design,faceWaterfall:true,refreshArchive:refresh,
  floatPaused:false,hoveredFace:null,
  updateWaterfall:(time,reduced)=>{
   const delta=lastTime===null?0:Math.max(0,Math.min(.05,time-lastTime));lastTime=time;
   const inspecting=!document.querySelector('[data-face-inspector]')?.hidden;
   if(!reduced&&!group.userData.floatPaused&&!inspecting)motionTime+=delta;
   // Portrait effects are baked once per source; only card transforms animate.
   rows.forEach(card=>{const p=card.userData.pose,t=motionTime,phase=p.phase;
    card.position.set(p.x+Math.sin(t*.18+phase)*.40,p.y+Math.sin(t*.23+phase)*.48,p.z+Math.cos(t*.15+phase)*.7);
    card.rotation.set(p.rx+Math.sin(t*.13+phase)*.10,p.ry+Math.sin(t*.17+phase)*.20,p.rz+Math.sin(t*.11+phase)*.08);
    card.userData.outline.visible=group.userData.hoveredFace===card.userData.portrait;
   });
  },disposeArchive:()=>{cancelled=true;textures.forEach(t=>t.dispose());nanoEffects.forEach(effects=>effects.dispose());disposeNanoEngine();}};
 return group;
}
export function createFinalReflection(design){const group=new THREE.Group();group.name='Room8_FinalReflection';const reflection=new THREE.Group();reflection.dispose=()=>{};group.userData={reflection,exhibit:new THREE.Group(),accentLight:new THREE.PointLight(),animated:[],hits:[],design,finalReflection:true};return group;}
