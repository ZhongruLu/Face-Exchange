import * as THREE from 'three';
import { translate, onLanguageChange } from './language.js';
import { loadGalleryFrameModel, GALLERY_FRAME_DISPLAY_SCALE } from './ornateGalleryFrame.js';

const PLACEHOLDER = '/assets/gallery/placeholder.svg';
// Keep the cleared approaches, with the requested left frame between rooms 2–3 restored.
const CLEAR_APPROACH_SEGMENTS = new Set([0, 1, 3]);
export function wallGallerySlots(count, gap) {
  return Array.from({length:Math.max(0,count-1)},(_,index)=>[-1,1].filter(side=>!CLEAR_APPROACH_SEGMENTS.has(index)||(index===1&&side===-1)).map(side=>({
    id:`wall-${side<0?'left':'right'}-${String(index+1).padStart(2,'0')}`,
    side, z:-(index+.5)*gap,
  }))).flat();
}

export function galleryPages(item) {
  const pages = Array.isArray(item.pages) ? item.pages.filter(path=>typeof path==='string' && path.length) : [];
  return pages.length ? pages : [item.image || PLACEHOLDER];
}

export function createWallGallery({world, mount, count, gap, frameLoader}) {
  const group = new THREE.Group(); group.name = 'CorridorWallCollection'; world.add(group);
  const brass = new THREE.MeshStandardMaterial({color:0xb99a62,metalness:.78,roughness:.38});
  const fallbackGeometry = new THREE.TorusGeometry(1,.035,8,64);
  const pictureGeometry = new THREE.CircleGeometry(1,96);
  pictureGeometry.scale(.625,.79,1);pictureGeometry.translate(0,.02,0);
  const highlightGeometry = new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0,.02,.64,.81,0,Math.PI*2).getPoints(96).map(p=>new THREE.Vector3(p.x,p.y,0)));
  const frameHitGeometry=new THREE.PlaneGeometry(1.7,2.2);
  const frameHitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
  const highlightMaterial = new THREE.LineBasicMaterial({color:0xefcf93});
  const abort = new AbortController();
  const textures = new Map();
  const pictures = [];
  let disposed = false, manifest = {default:{title:'Face archive',caption:'Image awaiting collection.',image:PLACEHOLDER},items:{}};
  // One small GPU preview per unique image, even when many frames reuse it.
  function preview(url) {
    url=manifest.previews?.[url]||url;
    if (textures.has(url)) return textures.get(url);
    const promise = new Promise(resolve=>{
      const image = new Image(); image.crossOrigin = 'anonymous';
      image.onload = ()=>{
        if (disposed) return resolve(null);
        const canvas = document.createElement('canvas'); canvas.width=512; canvas.height=640;
        const ctx=canvas.getContext('2d'); ctx.fillStyle='#241a17'; ctx.fillRect(0,0,512,640);
        const scale=Math.max(512/image.naturalWidth,640/image.naturalHeight);
        const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
        ctx.drawImage(image,(512-width)/2,(640-height)/2,width,height);
        const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; texture.anisotropy=4;
        resolve(texture);
      };
      image.onerror=()=>resolve(null); image.src=url;
    });
    textures.set(url,promise); return promise;
  }
  for (const slot of wallGallerySlots(count,gap)) {
    const frame=new THREE.Group(); frame.position.set(slot.side*4.84,3.25,slot.z); frame.rotation.y=-slot.side*Math.PI/2;
    frame.scale.set(GALLERY_FRAME_DISPLAY_SCALE,GALLERY_FRAME_DISPLAY_SCALE,1);
    frame.name=slot.id;
    const fallback=new THREE.Mesh(fallbackGeometry,brass);fallback.scale.set(.71,.94,1);fallback.position.z=.07;frame.add(fallback);
    const material=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:true});
    const picture=new THREE.Mesh(pictureGeometry,material); picture.position.z=.02; frame.add(picture);
    const glow=new THREE.Line(highlightGeometry,highlightMaterial); glow.position.z=.14; glow.visible=false; frame.add(glow);
    const wash=new THREE.Mesh(pictureGeometry,new THREE.MeshBasicMaterial({color:0xffdda0,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));wash.position.z=.13;frame.add(wash);
    const entry={...slot,frame,picture,glow,fallback,wash}; picture.userData.wallGalleryEntry=entry;
    const frameHit=new THREE.Mesh(frameHitGeometry,frameHitMaterial);frameHit.position.z=.15;frameHit.userData.wallGalleryEntry=entry;frame.add(frameHit);entry.frameHit=frameHit;
    pictures.push(entry); group.add(frame);
  }
  const frameModels=loadGalleryFrameModel(pictures,frameLoader);
  function refreshPictures() {
    for(const entry of pictures) {
      const item={...manifest.default,...manifest.items?.[entry.id]};
      entry.item=item;
      const url=galleryPages(item)[0]; entry.previewUrl=url;
      preview(url).then(texture=>{
        if(disposed || entry.previewUrl!==url) return;
        if(texture) {entry.picture.material.map=texture;entry.picture.material.needsUpdate=true;}
      });
    }
  }
  refreshPictures();
  fetch('/assets/gallery/collection.json',{signal:abort.signal}).then(response=>{
    if(!response.ok) throw new Error('Collection unavailable'); return response.json();
  }).then(data=>{if(disposed)return;manifest={default:{...manifest.default,...data.default},items:{...data.items},previews:data.previews||{}};
    const pool=Array.isArray(data.randomPortraits)?data.randomPortraits.filter(item=>typeof item.image==='string'&&item.image):[];
    // Shuffle complete sets so every supplied portrait appears before repeating.
    let remaining=[];
    for(const entry of pictures){
      if(!pool.length)break;
      if(!remaining.length){remaining=[...pool];for(let i=remaining.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[remaining[i],remaining[j]]=[remaining[j],remaining[i]];}}
      manifest.items[entry.id]={...manifest.items[entry.id],...remaining.pop()};
    }
    refreshPictures();}).catch(()=>{});

  const dialog=document.createElement('dialog'); dialog.className='wall-art-viewer';
  dialog.innerHTML=`<header><div><h2 id="wall-art-title"></h2></div><button type="button" data-art-close aria-label="Close image">×</button></header><p class="wall-art-context" data-i18n-ignore></p><div class="wall-art-viewport"><img draggable="false" alt=""/><p class="wall-art-state" role="status"></p></div><footer><p class="wall-art-caption"></p><div class="wall-art-tools"><button type="button" data-art-prev>Previous page</button><span data-art-page></span><button type="button" data-art-next>Next page</button><button type="button" data-art-minus aria-label="Zoom out">−</button><button type="button" data-art-reset>100%</button><button type="button" data-art-plus aria-label="Zoom in">+</button></div></footer>`;
  dialog.setAttribute('aria-labelledby','wall-art-title'); mount.append(dialog);
  const image=dialog.querySelector('img'), viewport=dialog.querySelector('.wall-art-viewport'), state=dialog.querySelector('.wall-art-state');
  const title=dialog.querySelector('h2'),caption=dialog.querySelector('.wall-art-caption');
  let opened=null,page=0,scale=1,x=0,y=0,drag=null,returnFocus=null;
  function transform() {
    const maxX=Math.max(0,(image.clientWidth*scale-viewport.clientWidth)/2);
    const maxY=Math.max(0,(image.clientHeight*scale-viewport.clientHeight)/2);
    x=THREE.MathUtils.clamp(x,-maxX,maxX);y=THREE.MathUtils.clamp(y,-maxY,maxY);
    image.style.transform=`translate(${x}px,${y}px) scale(${scale})`;
    viewport.classList.toggle('is-zoomed',scale>1);
    dialog.querySelector('[data-art-reset]').textContent=`${Math.round(scale*100)}%`;
    dialog.querySelector('[data-art-minus]').disabled=scale<=1;
    dialog.querySelector('[data-art-plus]').disabled=scale>=4;
  }
  function zoom(value) {scale=THREE.MathUtils.clamp(value,1,4);transform();}
  function showPage() {
    const pages=galleryPages(opened.item); scale=1;x=0;y=0;transform();
    image.hidden=true;state.hidden=false;state.textContent=translate('Loading image…');
    image.alt=translate(opened.item.title); image.src=pages[page];
    dialog.querySelector('[data-art-prev]').hidden=pages.length<2;
    dialog.querySelector('[data-art-next]').hidden=pages.length<2;
    dialog.querySelector('[data-art-prev]').disabled=page===0;
    dialog.querySelector('[data-art-next]').disabled=page===pages.length-1;
    dialog.querySelector('[data-art-page]').textContent=pages.length>1?`${page+1} / ${pages.length}`:'';
  }
  function open(entry) {
    if(!entry || disposed) return;
    returnFocus=document.activeElement;opened=entry;page=0;
    dialog.querySelector('.wall-art-context').textContent=translate(entry.item.context||'');title.textContent=translate(entry.item.title);caption.textContent=translate(entry.item.caption||'');
    if(!dialog.open) dialog.showModal(); showPage();
    dialog.querySelector('[data-art-close]').focus({preventScroll:true});
  }
  image.onload=()=>{image.hidden=false;state.hidden=true;transform();};
  image.onerror=()=>{image.hidden=true;state.hidden=false;state.textContent=translate('Image unavailable. Close to return to the gallery.');};
  dialog.querySelector('[data-art-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-art-plus]').onclick=()=>zoom(scale+.25);
  dialog.querySelector('[data-art-minus]').onclick=()=>zoom(scale-.25);
  dialog.querySelector('[data-art-reset]').onclick=()=>{x=0;y=0;zoom(1);};
  dialog.querySelector('[data-art-prev]').onclick=()=>{if(page>0){page--;showPage();}};
  dialog.querySelector('[data-art-next]').onclick=()=>{if(page<galleryPages(opened.item).length-1){page++;showPage();}};
  dialog.addEventListener('close',()=>{
    opened=null;image.removeAttribute('src');image.hidden=true;drag=null;
    const focus=returnFocus?.isConnected&&returnFocus!==document.body?returnFocus:mount;
    focus.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown',event=>{event.stopPropagation();});
  dialog.addEventListener('wheel',event=>{event.stopPropagation();event.preventDefault();zoom(scale*Math.exp(-event.deltaY*.0015));},{passive:false});
  dialog.addEventListener('pointerdown',event=>event.stopPropagation());
  viewport.addEventListener('pointerdown',event=>{
    if(scale<=1||event.button!==0)return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,panX:x,panY:y};viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove',event=>{if(!drag||drag.id!==event.pointerId)return;x=drag.panX+event.clientX-drag.x;y=drag.panY+event.clientY-drag.y;transform();});
  viewport.addEventListener('pointerup',()=>{drag=null;});viewport.addEventListener('pointercancel',()=>{drag=null;});
  function translateUi() {
    for(const [selector,text] of [['[data-art-prev]','Previous page'],['[data-art-next]','Next page']]) dialog.querySelector(selector).textContent=translate(text);
    for(const [selector,text] of [['[data-art-close]','Close image'],['[data-art-minus]','Zoom out'],['[data-art-plus]','Zoom in']]) dialog.querySelector(selector).setAttribute('aria-label',translate(text));
    if(opened){dialog.querySelector('.wall-art-context').textContent=translate(opened.item.context||'');title.textContent=translate(opened.item.title);caption.textContent=translate(opened.item.caption||'');}
  }
  translateUi();const unsubscribe=onLanguageChange(translateUi);
  return {
    get isOpen(){return dialog.open;},
    pick(raycaster){return raycaster.intersectObjects(pictures.flatMap(entry=>[entry.picture,entry.frameHit]),false).find(hit=>hit.distance<18)?.object.userData.wallGalleryEntry;},
    open,
    openNearest(camera){const entry=pictures.reduce((best,item)=>!best||camera.position.distanceToSquared(item.frame.position)<camera.position.distanceToSquared(best.frame.position)?item:best,null);if(entry)open(entry);},
    hover(entry){for(const picture of pictures){picture.glow.visible=picture===entry;picture.wash.material.opacity=picture===entry ? .12 : 0;}},
    update(camera,visible){
      group.visible=visible;
    },
    dispose(){disposed=true;abort.abort();unsubscribe();dialog.remove();frameModels.dispose();group.removeFromParent();frameHitGeometry.dispose();frameHitMaterial.dispose();fallbackGeometry.dispose();pictureGeometry.dispose();highlightGeometry.dispose();brass.dispose();highlightMaterial.dispose();for(const entry of pictures){entry.picture.material.dispose();entry.wash.material.dispose();}for(const promise of textures.values())promise.then(texture=>texture?.dispose());},
  };
}
