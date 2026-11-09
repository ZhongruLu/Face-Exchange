import * as THREE from 'three';
import {renderAscii} from '../vendor/nano-design/engines/ascii';
import {renderGlitch} from '../vendor/nano-design/engines/glitch';
import {createFlowEngine} from '../vendor/nano-design/engines/flow';
import {DEFAULT_ASCII_PARAMS} from '../vendor/nano-design/presets/ascii-presets';
import {DEFAULT_GLITCH_PARAMS} from '../vendor/nano-design/presets/glitch-presets';
import {DEFAULT_FLOW_PARAMS} from '../vendor/nano-design/presets/flow-presets';
let flow;
export function createNanoFaceEffects(image){
 const variants=['GLITCH','ASCII','LIQUID'].map(name=>{
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;
  const context=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  return {name,canvas,context,texture};
 });
 let lastFrame=-1;
 const update=(time,reduced=false)=>{
  const frame=reduced?0:Math.floor(time*5);if(frame===lastFrame)return;lastFrame=frame;
  renderGlitch(variants[0].context,image,{...DEFAULT_GLITCH_PARAMS,stripeDensity:12,displacement:5,rgbSplit:8,corruption:12,scanlines:true,verticalSpeed:1},256,320,frame*2);
  renderAscii(variants[1].context,image,{...DEFAULT_ASCII_PARAMS,fontSize:6,bgColor:'#100c09',bgBlur:0,bgOpacity:22,charOpacity:100,colorTint:'#e9d1aa',colorTintOpacity:35,animated:!reduced,animIntensity:18},256,320,frame);
  if(flow===undefined)flow=createFlowEngine();
  if(flow){flow.resize(256,320);flow.setTexture(image);flow.setTime(reduced?0:time*.35);flow.render({...DEFAULT_FLOW_PARAMS,amplitude:.055,frequency:24,complexity:1.4,yStart:0,maskAngle:0,waveAngle:25,spacerSize:0},false);flow.copyTo2D(variants[2].context,0,0,256,320);}
  else variants[2].context.drawImage(image,0,0,256,320);
  variants.forEach(v=>v.texture.needsUpdate=true);
 };
 update(0,true);
 return {variants,update,dispose:()=>variants.forEach(v=>v.texture.dispose())};
}
export function disposeNanoEngine(){flow?.destroy();flow=undefined;}
