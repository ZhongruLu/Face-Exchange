import * as THREE from 'three';
import voices from '../data/auctionVoices.json';
import { onLanguageChange } from './language.js';

// This commentary has its own deterministic sequence. Never consume bidding's randomness.
export function createAuctionVoices({ group, bidderPositions, centerZ }) {
  const pool=Array.from({length:3},(_,i)=>{
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=360;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,depthTest:false,toneMapped:false});
    const sprite=new THREE.Sprite(material);sprite.name=`AuctionBidderVoice${i+1}`;sprite.visible=false;sprite.renderOrder=12;group.add(sprite);
    return {sprite,canvas,texture,started:-Infinity,bidder:-1,copy:null};
  });
  let sequence=0,nextAt=null,slot=0;
  const world=new THREE.Vector3(),projected=new THREE.Vector3();
  function paint(entry) {
    if(!entry.copy)return;
    const text=document.documentElement.lang.startsWith('zh')?entry.copy.zh:entry.copy.en;
    entry.sprite.userData.spokenText=text;
    const ctx=entry.canvas.getContext('2d');ctx.clearRect(0,0,1024,360);
    ctx.font='500 48px "Newsreader", "Songti SC", serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
    // Character wrapping works for Chinese and English; keep whole English words where possible.
    const words=/[\u3400-\u9fff]/.test(text)?[...text]:text.split(' '),join=/[\u3400-\u9fff]/.test(text)?'':' ';
    const lines=[];let line='';for(const word of words){const candidate=line?line+join+word:word;if(ctx.measureText(candidate).width>900&&line){lines.push(line);line=word;}else line=candidate;}if(line)lines.push(line);
    const y=180-(lines.length-1)*31;
    ctx.strokeStyle='#110d09';ctx.lineWidth=8;ctx.fillStyle='#f5e6c5';ctx.shadowColor='#080604';ctx.shadowBlur=5;
    lines.forEach((text,i)=>{ctx.strokeText(text,512,y+i*62);ctx.fillText(text,512,y+i*62);});
    entry.texture.needsUpdate=true;
  }
  const unsubscribe=onLanguageChange(()=>pool.forEach(paint));
  Promise.all([document.fonts?.load('500 48px "Newsreader"'),document.fonts?.ready]).then(()=>{if(!disposed)pool.forEach(paint);});
  let disposed=false;
  function chooseBidder(camera) {
    group.updateWorldMatrix(true,false);
    const occupied=pool.filter(e=>e.sprite.visible);
    const candidates=[];
    bidderPositions.forEach((p,index)=>{
      if(occupied.some(e=>e.bidder===index))return;
      world.copy(p);world.y+=.4;group.localToWorld(world);projected.copy(world).project(camera);
      if(projected.z< -1||projected.z>1||Math.abs(projected.x)>.79||projected.y<-.55||projected.y>.60)return;
      // Leave the central lot and its sale display clear.
      if(Math.abs(projected.x)<.34&&projected.y<.32&&projected.y>-.75)return;
      if(occupied.some(e=>{e.sprite.getWorldPosition(world);world.project(camera);return Math.abs(world.x-projected.x)<.5&&Math.abs(world.y-projected.y)<.25;}))return;
      // Alternate balconies and sides instead of clustering around the portrait.
      candidates.push({index,x:projected.x,y:projected.y});
    });
    if(!candidates.length)return -1;
    candidates.sort((a,b)=>a.x-b.x||a.y-b.y);
    return candidates[(sequence*7+Math.floor(sequence/2))%candidates.length].index;
  }
  return {
    reset(){sequence=0;nextAt=null;slot=0;pool.forEach(e=>{e.sprite.visible=false;e.started=-Infinity;e.copy=null;});},
    update(now,camera,{active,sold,reduced}){
      if(!active||!camera)return;
      if(nextAt===null)nextAt=now+650;
      for(const entry of pool){
        const age=now-entry.started;entry.sprite.visible=age>=0&&age<4800;
        if(!entry.sprite.visible)continue;
        entry.sprite.material.opacity=Math.min(1,age/220,Math.max(0,(4800-age)/800));
        entry.sprite.position.y=bidderPositions[entry.bidder].y+.5+(reduced?0:Math.min(age/1000,1)*.08);
        entry.sprite.getWorldPosition(world);
        const scale=THREE.MathUtils.clamp(world.distanceTo(camera.position)/10,.15,2.5);
        entry.sprite.scale.set(3.9*scale,1.37*scale,1);
      }
      if(!sold&&now>=nextAt){
        const bidder=chooseBidder(camera);
        if(bidder<0){nextAt=now+300;return;}
        const entry=pool[slot++%pool.length];entry.bidder=bidder;entry.started=now;entry.copy=voices[sequence++%voices.length];
        entry.sprite.position.copy(bidderPositions[bidder]);entry.sprite.position.y+=.5;
        const radial=new THREE.Vector3(entry.sprite.position.x,0,entry.sprite.position.z-centerZ).normalize();entry.sprite.position.addScaledVector(radial,-.65);
        entry.sprite.visible=true;entry.sprite.material.opacity=0;paint(entry);nextAt=now+1950;
      }
    },
    dispose(){disposed=true;unsubscribe();pool.forEach(e=>{group.remove(e.sprite);e.texture.dispose();e.sprite.material.dispose();});},
  };
}
