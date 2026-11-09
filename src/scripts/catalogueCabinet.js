import * as THREE from 'three';
import {onLanguageChange} from './language.js';
import catalogue from '../data/catalogue.json';

export function createCatalogueCabinet({world,mount,reducedMotion=false}) {
  const group=new THREE.Group();group.name='CatalogueDisplayCabinet';
  group.position.set(-3.85,0,-39);group.rotation.y=Math.PI/2;world.add(group);
  const resources=[],own=r=>(resources.push(r),r);
  const woodTexture=own(new THREE.TextureLoader().load('/assets/materials/catalogue/walnut-grain.jpg'));
  woodTexture.colorSpace=THREE.SRGBColorSpace;woodTexture.wrapS=woodTexture.wrapT=THREE.RepeatWrapping;woodTexture.anisotropy=8;
  const wood=own(new THREE.MeshStandardMaterial({map:woodTexture,color:0xe8d9c8,metalness:0,roughness:.58,envMapIntensity:.35}));
  const gold=own(new THREE.MeshStandardMaterial({color:0x8b744b,metalness:.65,roughness:.48,envMapIntensity:.45}));
  const bronze=own(new THREE.MeshStandardMaterial({map:woodTexture,color:0xc5b3a0,metalness:0,roughness:.5,envMapIntensity:.3}));
  const velvet=own(new THREE.MeshStandardMaterial({color:0x5a2426,roughness:.96}));
  const paper=own(new THREE.MeshStandardMaterial({color:0xe9dfc5,roughness:.8}));
  const glass=own(new THREE.MeshPhysicalMaterial({color:0xbcd0c9,transparent:true,opacity:.15,metalness:0,roughness:.08,depthWrite:false,side:THREE.DoubleSide}));
  function box(parent,w,h,d,x,y,z,material){const mesh=new THREE.Mesh(own(new THREE.BoxGeometry(w,h,d)),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
  function tube(parent,points,r=.035){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(own(new THREE.TubeGeometry(curve,28,r,8,false)),wood);parent.add(mesh);return mesh;}
  box(group,2.55,.16,1.22,0,1.29,0,wood);
  box(group,2.40,.04,1.08,0,1.39,0,velvet);
  for(const x of [-1.10,1.10])for(const z of [-.45,.45]){
    tube(group,[[x,1.28,z],[x*1.08,1.05,z*1.10],[x*.95,.57,z*1.07],[x*1.1,.10,z*1.18]],.055);
    box(group,.14,.05,.14,x*1.1,.08,z*1.18,wood);
    const ornament=new THREE.Mesh(own(new THREE.SphereGeometry(.1,10,8)),wood);ornament.scale.set(.7,1.4,.7);ornament.position.set(x,1.15,z);group.add(ornament);
  }
  for(const z of [-.42,.42])tube(group,[[-1.12,.3,z],[0,.19,z*.3],[1.12,.3,z]],.025);
  // Repeated small carved wood leaves suggest the carved apron of the supplied reference.
  for(let i=-5;i<=5;i++)for(const z of [-.615,.615]){
    const leaf=new THREE.Mesh(own(new THREE.SphereGeometry(.07,8,6)),wood);leaf.scale.set(.55,1.3,.3);leaf.rotation.z=i%2?.5:-.5;leaf.position.set(i*.20,1.21,z);group.add(leaf);
  }
  const lid=new THREE.Group();lid.position.set(0,1.69,-.60);group.add(lid);
  const lidGlass=box(lid,2.50,.025,1.18,0,0,.60,glass);
  for(const x of [-1.25,1.25])box(lid,.035,.04,1.2,x,0,.60,bronze);
  for(const z of [0,1.2])box(lid,2.54,.04,.035,0,0,z,bronze);
  box(lid,.18,.035,.06,0,-.02,1.23,gold);
  for(const x of [-1.25,1.25])for(const z of [-.60,.60])box(group,.035,.30,.035,x,1.54,z,bronze);
  for(const x of [-1.25,1.25])box(group,.018,.28,1.18,x,1.54,0,glass);
  for(const z of [-.60,.60])box(group,2.48,.28,.018,0,1.54,z,glass);
  const supports=[-1.12,1.12].map(x=>{
    const rod=new THREE.Mesh(own(new THREE.CylinderGeometry(.014,.014,1,8)),gold);group.add(rod);
    return{rod,base:new THREE.Vector3(x,1.40,-.05),end:new THREE.Vector3(),direction:new THREE.Vector3()};
  });
  const up=new THREE.Vector3(0,1,0);
  const book=new THREE.Group();book.position.set(0,1.45,0);book.rotation.y=-.13;group.add(book);
  box(book,.78,.08,.98,0,0,0,paper);
  const coverTexture=own(new THREE.TextureLoader().load(`${catalogue.assetDirectory}/cover.webp`));
  coverTexture.colorSpace=THREE.SRGBColorSpace;
  coverTexture.anisotropy=8;
  const cover=new THREE.Mesh(own(new THREE.PlaneGeometry(.80,1.0)),own(new THREE.MeshBasicMaterial({map:coverTexture})));cover.rotation.x=-Math.PI/2;cover.position.y=.046;book.add(cover);
  const hit=box(group,2.6,.45,1.3,0,1.51,0,own(new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})));
  const glow=box(group,2.6,.025,1.28,0,1.38,0,own(new THREE.MeshBasicMaterial({color:0xffd98a,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending})));
  const app=mount.closest('[data-app]');
  const dialog=document.createElement('dialog');
  dialog.className='catalogue-preview-dialog';
  dialog.dataset.cataloguePreview='';
  dialog.dataset.i18nIgnore='';
  dialog.setAttribute('aria-labelledby','catalogue-reader-title');
  dialog.innerHTML=`
    <header>
      <h2 id="catalogue-reader-title"></h2>
      <button type="button" data-catalogue-close></button>
    </header>
    <div class="catalogue-reader-page"><img decoding="async" alt=""></div>
    <nav>
      <button type="button" data-catalogue-prev>←</button>
      <span data-catalogue-count aria-live="polite"></span>
      <button type="button" data-catalogue-next>→</button>
      <button type="button" data-catalogue-zoom aria-pressed="false"></button>
    </nav>`;
  app.append(dialog);
  const stage=dialog.querySelector('.catalogue-reader-page');
  const pageImage=stage.querySelector('img');
  const previous=dialog.querySelector('[data-catalogue-prev]');
  const next=dialog.querySelector('[data-catalogue-next]');
  const zoom=dialog.querySelector('[data-catalogue-zoom]');
  const close=dialog.querySelector('[data-catalogue-close]');
  let opened=false,available=false,hovered=false,page=1,lastFocus=null,focused=false,focusAge=0;
  const controls=document.createElement('aside');controls.className='catalogue-focus-controls';controls.hidden=true;controls.dataset.i18nIgnore='';
  controls.innerHTML='<p data-catalogue-focus-hint></p><div><button type="button" data-catalogue-read></button><button type="button" data-catalogue-return></button></div>';
  app.append(controls);
  const focusCamera=new THREE.Vector3(),focusLook=new THREE.Vector3();
  function leave(){focused=false;opened=false;hovered=false;controls.hidden=true;delete app.dataset.catalogueFocus;paint();mount.focus({preventScroll:true});}
  controls.querySelector('[data-catalogue-return]').onclick=leave;
  controls.querySelector('[data-catalogue-read]').onclick=()=>{if(focusAge>.8)preview();};
  const focusKeys=event=>{
    if(!focused||dialog.open)return;
    if(event.key==='Escape'&&!document.fullscreenElement){event.preventDefault();event.stopImmediatePropagation();leave();return;}
    if(['w','s','a','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();event.stopImmediatePropagation();}
  };
  window.addEventListener('keydown',focusKeys,true);
  const zh=()=>document.documentElement.lang==='zh-CN';
  function paint(){
    const chinese=zh();
    controls.querySelector('[data-catalogue-focus-hint]').textContent=chinese?'点击图录阅读 · Esc 返回走廊':'Click the catalogue to read · Esc to return';
    controls.querySelector('[data-catalogue-return]').textContent=chinese?'返回走廊':'Return to corridor';
    controls.querySelector('[data-catalogue-read]').textContent=chinese?'阅读图录':'Read catalogue';
    dialog.querySelector('h2').textContent=catalogue.title[chinese?'zh':'en'];
    close.textContent=chinese?'关闭 ×':'Close ×';
    previous.setAttribute('aria-label',chinese?'上一页':'Previous page');
    next.setAttribute('aria-label',chinese?'下一页':'Next page');
    zoom.textContent=stage.classList.contains('is-zoomed')
      ? (chinese?'适应窗口':'Fit page')
      : (chinese?'放大':'Zoom in');
    pageImage.alt=chinese?`拍卖图录，第 ${page} 页`:`Auction catalogue, page ${page}`;
    dialog.querySelector('[data-catalogue-count]').textContent=`${page} / ${catalogue.pageCount}`;
    previous.disabled=page===1;
    next.disabled=page===catalogue.pageCount;
  }

  function showPage(){
    const number=String(page).padStart(2,'0');
    pageImage.src=`${catalogue.assetDirectory}/page-${number}.webp`;
    stage.scrollTo(0,0);
    paint();
  }

  function turnPage(direction){
    const target=page+direction;
    if(target<1||target>catalogue.pageCount)return;
    page=target;
    showPage();
  }

  function preview(){
    lastFocus=document.activeElement;
    dialog.showModal();
    showPage();
    close.focus();
  }
  function interact(action){
    if(!available)return;
    if(!focused){opened=true;focused=true;focusAge=0;hovered=false;controls.hidden=false;app.dataset.catalogueFocus='true';paint();return;}
    if(focusAge<.9)return;
    if(action==='book'){preview();return;}leave();
  }
  close.onclick=()=>dialog.close();
  dialog.onclose=()=>lastFocus?.isConnected&&lastFocus.focus({preventScroll:true});
  previous.onclick=()=>turnPage(-1);
  next.onclick=()=>turnPage(1);
  zoom.onclick=()=>{
    const enlarged=stage.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed',String(enlarged));
    stage.tabIndex=enlarged?0:-1;
    stage.scrollTo(0,0);
    paint();
  };
  dialog.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(stage.classList.contains('is-zoomed')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    turnPage(event.key==='ArrowLeft'?-1:1);
  });
  const unsubscribe=onLanguageChange(paint);paint();
  return{get isOpen(){return dialog.open;},get isFocused(){return focused;},get focusReady(){return focusAge>.22;},
    cameraPosition(camera){const distance=Math.max(2.9,1.4/(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));return group.localToWorld(focusCamera.set(0,1.45+distance*.45,distance));},
    cameraLook(){return group.localToWorld(focusLook.set(0,1.45,0));},pick(raycaster){if(!available)return null;const bookHit=opened&&raycaster.intersectObject(cover,false)[0];if(bookHit)return{action:'book'};const hits=raycaster.intersectObjects(opened?[lidGlass,hit]:[hit],false);return hits[0]?{action:hits[0].object===cover?'book':'lid'}:null;},interact,hover(value){hovered=!!value;},
    update(visible,delta){if(focused)focusAge+=delta;available=visible;group.visible=visible;lid.rotation.x=THREE.MathUtils.damp(lid.rotation.x,opened?-.96:0,reducedMotion?1000:7,delta);glow.material.opacity=hovered&&visible ? .16 : 0;
      supports.forEach(({rod,base,end,direction})=>{
        end.set(base.x,1.69-Math.sin(lid.rotation.x)*.88,-.60+Math.cos(lid.rotation.x)*.88);
        direction.subVectors(end,base);rod.visible=Math.abs(lid.rotation.x)>.06;
        rod.position.copy(base).add(end).multiplyScalar(.5);rod.scale.y=direction.length();rod.quaternion.setFromUnitVectors(up,direction.normalize());
      });},
    dispose(){window.removeEventListener('keydown',focusKeys,true);controls.remove();delete app.dataset.catalogueFocus;unsubscribe();dialog.remove();group.removeFromParent();resources.forEach(r=>r.dispose());}
  };
}
