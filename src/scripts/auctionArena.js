import { translate, onLanguageChange } from './language.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { compactModelGeometry, releaseGeometry, releaseModel } from './modelResources.js';
import { createAuctionBidding } from './auctionBidding.js';
import { createAuctionVoices } from './auctionVoices.js';
import { createBlackMarbleFloor } from './blackMarbleFloor.js';

export function createAuctionArena(design) {
  const group = new THREE.Group(); group.name = 'Room5_CircularAuction';
  const centerZ = -13;
  const legacyArchitecture=new THREE.Group(),legacyDesk=new THREE.Group();
  group.add(legacyArchitecture,legacyDesk);
  let meshParent=legacyArchitecture, theatreModel=null, disposed=false;
  const modelState={status:'loading'};
  const gold = new THREE.MeshStandardMaterial({ color: 0xc6974b, metalness: .78, roughness: .35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x20100a, roughness: .7, side: THREE.DoubleSide });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffcf80 });
  const mesh = (geometry, material, x, y, z) => {
    const object = new THREE.Mesh(geometry, material); object.position.set(x,y,z);meshParent.add(object);return object;
  };
  mesh(new THREE.CylinderGeometry(15,15,.3,96), createBlackMarbleFloor(),0,-.2,centerZ);
  // Three continuous stepped balconies surround the central lot.
  for(let level=0;level<3;level++) {
    const radius=8+level*2.1, y=level*2.5;
    const deck=mesh(new THREE.RingGeometry(radius-1,radius+1.4,96),dark,0,y,centerZ);deck.rotation.x=-Math.PI/2;
    for(const offset of [.2,1.05]) {
      const rail=mesh(new THREE.TorusGeometry(radius-.9,.045,8,96),gold,0,y+offset,centerZ);rail.rotation.x=Math.PI/2;
    }
    for(let i=0;i<40;i++) {
      const a=i/40*Math.PI*2;
      mesh(new THREE.CylinderGeometry(.035,.035,1.05,6),gold,Math.sin(a)*(radius-.9),y+.52,centerZ+Math.cos(a)*(radius-.9));
    }
  }
  mesh(new THREE.CylinderGeometry(14.9,14.9,10,96,1,true),dark,0,4.8,centerZ);
  for(let i=0;i<24;i++) {
    const a=i/24*Math.PI*2,x=Math.sin(a)*14,z=centerZ+Math.cos(a)*14;
    mesh(new THREE.CylinderGeometry(.16,.24,9,12),gold,x,4.5,z);
    for (const baseY of [2.3,4.8,7.3]) {
      const arc=[];
      for(let step=0;step<=16;step++) {
        const t=step/16,theta=a+t*Math.PI*2/24;
        arc.push(new THREE.Vector3(Math.sin(theta)*13.9,baseY+Math.sin(Math.PI*t)*.95,centerZ+Math.cos(theta)*13.9));
      }
      mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),20,.075,6,false),gold,0,0,0);
    }
    const lamp=mesh(new THREE.SphereGeometry(.11,10,8),glow,x*.9,7.5,centerZ+Math.cos(a)*12.6);
  }
  for(const y of [7.7,9.2]) {
    const ring=mesh(new THREE.TorusGeometry(14,.12,8,96),gold,0,y,centerZ);ring.rotation.x=Math.PI/2;
  }
  mesh(new THREE.CylinderGeometry(2.4,2.8,.6,64),dark,0,.3,centerZ);
  const stageRing=mesh(new THREE.TorusGeometry(2.45,.04,8,64),glow,0,.62,centerZ);stageRing.rotation.x=Math.PI/2;
  meshParent=group;
  const exhibit = new THREE.Group();exhibit.position.set(0,2.6,centerZ);group.add(exhibit);
  const portrait= new THREE.Mesh(new THREE.PlaneGeometry(3.4,4.4),new THREE.MeshStandardMaterial({color:0xcda45f,side:THREE.DoubleSide,roughness:.5}));
  portrait.name='PortraitDisplay';exhibit.add(portrait);
  for(const sign of [-1,1]) {
    const vertical=new THREE.Mesh(new THREE.BoxGeometry(.055,4.55,.08),gold);vertical.position.x=sign*1.76;exhibit.add(vertical);
    const horizontal=new THREE.Mesh(new THREE.BoxGeometry(3.58,.055,.08),gold);horizontal.position.y=sign*2.25;exhibit.add(horizontal);
  }
  const head=new THREE.Mesh(new THREE.SphereGeometry(.55,20,16),new THREE.MeshBasicMaterial({color:0x4b3426}));head.position.set(0,.55,.02);head.name='PortraitSilhouetteHead';exhibit.add(head);
  const shoulders=new THREE.Mesh(new THREE.SphereGeometry(1,20,16),head.material);shoulders.scale.set(1,.7,.08);shoulders.position.set(0,-.8,.02);shoulders.name='PortraitSilhouetteShoulders';exhibit.add(shoulders);
  // Repeated translucent figures use instancing, with a separate dust point cloud.
  const ghostMaterial=new THREE.MeshStandardMaterial({color:0x675c50,roughness:.95,transparent:true,opacity:.56,depthWrite:false});
  const count=108;
  const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.19,12,8),ghostMaterial,count);
  const bodies=new THREE.InstancedMesh(new THREE.CapsuleGeometry(.22,.48,3,8),ghostMaterial,count);
  heads.name='AuctionGhostHeads';bodies.name='AuctionGhostBodies';group.add(heads,bodies);
  const matrix=new THREE.Matrix4(), points=[], bidderPositions=[];
  for(let i=0;i<count;i++) {
    const level=Math.floor(i/36),a=(i%36+.5)/36*Math.PI*2,r=8.4+level*2.1,y=level*2.5;
    const x=Math.sin(a)*r,z=centerZ+Math.cos(a)*r;
    bidderPositions.push(new THREE.Vector3(x,y+2.15,z));
    heads.setMatrixAt(i,matrix.makeTranslation(x,y+1.55,z));bodies.setMatrixAt(i,matrix.makeTranslation(x,y+.85,z));
    for(let p=0;p<18;p++) points.push(x+Math.sin(p*2.399+i)*.3,y+.3+p/18*1.45,z+Math.cos(p*2.399+i)*.22);
  }
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:0xffd6a0,size:.028,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));group.add(dust);
  const accentLight=new THREE.PointLight(0xffc777,30,30,2);accentLight.position.set(0,5,centerZ);group.add(accentLight);
  const fill=new THREE.PointLight(0xffd8a0,115,35,2);fill.position.set(0,8,-6);group.add(fill);
  const ambient=new THREE.HemisphereLight(0xffe4bd,0x21140c,.65);group.add(ambient);
  // Keep the existing room-control contract without an additional reflection pass.
  const reflection=new THREE.Group();reflection.visible=false;reflection.dispose=()=>{};
  const exitHit=mesh(new THREE.PlaneGeometry(3.8,6),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide}),0,3,-.3);exitHit.userData.roomAction='exit';
  const trader = new THREE.Group(); trader.name='Auctioneer'; trader.position.set(3.1,.5,centerZ+.4);group.add(trader);
  const traderMaterial = new THREE.MeshStandardMaterial({color:0x51473b,metalness:.04,roughness:.82});
  const traderHead=new THREE.Mesh(new THREE.SphereGeometry(.26,16,12),traderMaterial);traderHead.position.y=1.95;trader.add(traderHead);
  const traderBody=new THREE.Mesh(new THREE.CapsuleGeometry(.35,.8,4,12),traderMaterial);traderBody.position.y=1.1;trader.add(traderBody);
  const arm=new THREE.Group();arm.position.set(-.4,1.45,.1);trader.add(arm);
  const forearm=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.75,10),traderMaterial);forearm.position.y=.3;arm.add(forearm);
  const gavel=new THREE.Mesh(new THREE.BoxGeometry(.42,.18,.18),gold);gavel.position.set(0,.76,0);arm.add(gavel);
  const tableWood=new THREE.MeshStandardMaterial({color:0x4e2612,roughness:.5,metalness:.12});
  meshParent=legacyDesk;
  const tabletop=mesh(new THREE.BoxGeometry(1.65,.15,1.1),tableWood,3.1,1.075,centerZ+1.05);tabletop.name='AuctioneerDesk';
  mesh(new THREE.BoxGeometry(1.72,.035,1.16),gold,3.1,1.16,centerZ+1.05);
  for(const x of [2.45,3.75])for(const z of [centerZ+.65,centerZ+1.45])mesh(new THREE.CylinderGeometry(.06,.08,1,10),tableWood,x,.52,z);
  meshParent=group;
  const bell=new THREE.Group();bell.name='AuctionDeskBell';bell.position.set(2.7,1.19,centerZ+1.115);group.add(bell);
  const bellBase=new THREE.Mesh(new THREE.CylinderGeometry(.22,.24,.045,20),gold);bell.add(bellBase);
  const bellDome=new THREE.Mesh(new THREE.SphereGeometry(.18,24,12,0,Math.PI*2,0,Math.PI/2),gold);bell.add(bellDome);
  const bellButton=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.04,12),gold);bellButton.position.y=.195;bell.add(bellButton);
  const textSprite = (width,height) => {
    const canvas=document.createElement('canvas');canvas.width=640;canvas.height=220;
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false});
    const sprite=new THREE.Sprite(material);sprite.scale.set(width,height,1);group.add(sprite);
    return {sprite,canvas,texture};
  };
  const paint = (entry,title,number,footer) => {
    entry.copy = [title, number, footer];
    const ctx=entry.canvas.getContext('2d');ctx.clearRect(0,0,640,220);
    ctx.fillStyle='rgba(20,12,7,0.92)';ctx.fillRect(0,0,640,220);
    ctx.strokeStyle='#d5ac68';ctx.lineWidth=4;ctx.strokeRect(2,2,636,216);
    ctx.textAlign='center';ctx.fillStyle='#dfbd81';ctx.font='400 24px "IBM Plex Mono", monospace';ctx.fillText(translate(title),320,40);
    ctx.fillStyle='#fff0c5';ctx.font='500 55px "IBM Plex Mono", monospace';ctx.fillText(translate(number),320,115);
    ctx.fillStyle='#dfbd81';ctx.font='400 23px "IBM Plex Mono", monospace';ctx.fillText(translate(footer),320,183);
    entry.texture.needsUpdate=true;
  };
  const unsubscribeLanguage=onLanguageChange(() => { lastBoard=''; for (const entry of bidLabels) if(entry.copy) paint(entry, ...entry.copy); });
  const board=textSprite(3.4,1.17);board.sprite.position.set(0,.83,centerZ+3.35);board.sprite.name='AuctionPriceBoard';
  const bidLabels=Array.from({length:2},(_,i)=>{const entry=textSprite(1.8,.62);entry.sprite.name=`AuctionBidPrice${i+1}`;entry.sprite.visible=false;return entry;});
  const bidderVoices=createAuctionVoices({group,bidderPositions,centerZ});
  let engine=createAuctionBidding(), baseValue=0, lastBoard='', labelIndex=0, lastBidTime=0;
  let active=false, soldAt=null, hammerPlayed=false, hammerAt=null, celebrationPlayed=false;
  const startAuction=()=>{active=true;bidderVoices.reset();engine.start(performance.now());};
  const setAuctionBase=value=>{
    const base=Math.max(0,Math.round(Number(value)||0));
    if(base!==baseValue) {baseValue=base;engine=createAuctionBidding({base});bidderVoices.reset();lastBoard='';soldAt=null;hammerPlayed=false;hammerAt=null;celebrationPlayed=false;bidLabels.forEach(entry=>entry.sprite.visible=false);if(active)engine.start(performance.now());}
  };
  const labelWorldPosition=new THREE.Vector3();
  const updateArena=(time,reduced,camera)=>{
    ghostMaterial.opacity=reduced?.56:.54+Math.sin(time*.65)*.025;
    dust.material.opacity=reduced?.22:.20+Math.sin(time*.8)*.04;
    const now=performance.now(), result=engine.update(now);
    if(active && result.remaining <= 3 && !hammerPlayed) {
      hammerPlayed=true;hammerAt=now;
      document.dispatchEvent(new CustomEvent('auction-final-hammer'));
    }
    for(const bid of result.bids) {
      const entry=bidLabels[labelIndex++%bidLabels.length];entry.bid=bid;entry.closed=false;entry.sprite.visible=true;
      entry.sprite.position.copy(bidderPositions[bid.bidder]);
      const radial=new THREE.Vector3(entry.sprite.position.x,0,entry.sprite.position.z-centerZ).normalize();
      entry.sprite.position.addScaledVector(radial,-2.2);
      paint(entry,`BIDDER ${String(bid.bidder+1).padStart(3,'0')}`,`${bid.value.toLocaleString()} RMB`,`+${bid.increment} RMB`);
      lastBidTime=now;
    }
    for(const entry of bidLabels) {
      if(!entry.bid)continue;
      const age=(now-entry.bid.time)/1000;
      const winning=result.sold&&entry.bid.bidder===result.winner&&entry.bid.value===result.highest;
      entry.sprite.visible=winning||age<2.2;
      entry.sprite.material.opacity=winning?1:Math.max(0,1-Math.max(0,age-1.3)/.9);
      entry.sprite.position.y=bidderPositions[entry.bid.bidder].y+(reduced?0:Math.min(1,age)*.35);
      if(camera){
        entry.sprite.getWorldPosition(labelWorldPosition);
        const size=THREE.MathUtils.clamp(labelWorldPosition.distanceTo(camera.position)/10,.08,1);
        entry.sprite.scale.set(1.8*size,.62*size,1);
      }
      if(winning&&!entry.closed){paint(entry,`BIDDER ${String(result.winner+1).padStart(3,'0')}`,`${result.highest.toLocaleString()} RMB`,'WINNING BID');entry.closed=true;}
    }
    bidderVoices.update(now,camera,{active,sold:result.sold,reduced});
    const key=`${result.highest}/${result.remaining}/${result.sold}`;
    if(key!==lastBoard) {
      const clock=`${Math.floor(result.remaining/60)}:${String(result.remaining%60).padStart(2,'0')}`;
      paint(board,result.sold?'SOLD · FICTIONAL AUCTION':'LIVE AUCTION · FICTIONAL',`${result.highest.toLocaleString()} RMB`,result.sold?`BIDDER ${String(result.winner+1).padStart(3,'0')} · SOLD`: `${clock} REMAINING · BASE ${baseValue} RMB`);
      lastBoard=key;
    }
    if(result.sold&&soldAt===null)soldAt=now;
    if(result.sold&&!celebrationPlayed){celebrationPlayed=true;document.dispatchEvent(new CustomEvent('auction-sale-record',{detail:{price:result.highest,bidder:result.winner+1}}));document.dispatchEvent(new CustomEvent('auction-celebration'));}
    // Three forward strikes meet the bell, matching the audio's 0/.9/1.8 second impacts.
    let strike=0;
    if(hammerAt!==null) {
      const elapsed=(now-hammerAt)/1000;
      for(const beat of [0,.9,1.8]) {const d=elapsed-beat;if(d>=0&&d<.55)strike=Math.max(strike,Math.exp(-d*6));}
    }
    arm.rotation.z=0;
    arm.rotation.x=reduced?.6:.6+strike*1.555;
    bell.rotation.z=reduced?0:Math.sin((now-(hammerAt||now))*.08)*strike*.055;
    const guide=document.querySelector('[data-auction-guide]');
    if(guide && document.querySelector('[data-app]')?.dataset.view==='termsRoom') {
      const progress=soldAt===null?0:Math.max(0,Math.min(1,(now-soldAt-1200)/1800));
      guide.hidden=progress<=0;
      guide.style.opacity=String(progress);
      guide.querySelector('button').disabled=progress<=0;
    }
    group.userData.auctionResult=result;
  };
  group.userData={reflection,exhibit,animated:[],accentLight,hits:[exitHit],activeExhibit:false,design,
    auctionArena:true,updateArena,startAuction,setAuctionBase,theatreModel:modelState,
    disposeArena(){disposed=true;unsubscribeLanguage();bidderVoices.dispose();for(const entry of [board,...bidLabels]){entry.texture.dispose();entry.sprite.material.dispose();}if(theatreModel)releaseModel(theatreModel);}
  };
  const decoder=new DRACOLoader().setDecoderPath('/assets/codecs/draco/').setWorkerLimit(2);
  new GLTFLoader().setDRACOLoader(decoder).load('/assets/models/auction-theatre/classical-auction-theatre.glb',gltf=>{
    if(disposed){releaseModel(gltf.scene);decoder.dispose();return;}
    theatreModel=gltf.scene;theatreModel.name='ClassicalAuctionTheatre';
    compactModelGeometry(theatreModel);
    theatreModel.traverse(object=>{
      if(!object.isMesh)return;
      object.castShadow=false;object.receiveShadow=true;
      for(const material of (Array.isArray(object.material)?object.material:[object.material])){
        material.envMapIntensity=.7;if(material.name==='Dark_marble'){material.color.setHex(0x696460);material.envMapIntensity=.2;material.roughness=.5;}if(material.map)material.map.anisotropy=4;
      }
    });
    group.add(theatreModel);releaseGeometry(legacyArchitecture);releaseGeometry(legacyDesk);
    modelState.status='ready';decoder.dispose();
  },undefined,error=>{modelState.status='error';decoder.dispose();console.warn('Theatre model unavailable; using the original room.',error);});
  return group;
}
