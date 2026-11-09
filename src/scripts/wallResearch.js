import * as THREE from 'three';
import cases from '../data/noticeImages.json';

// On the right wall, further along the corridor between the first doorways.
export function createWallResearch({world,mount,gap}) {
  const group=new THREE.Group();group.name='InspectionOppositeResearchLabel';
  group.position.set(4.80,2.8,-gap * 1.45);group.rotation.y=-Math.PI/2;world.add(group);
  const resources=[];let disposed=false;
  const own=resource=>(resources.push(resource),resource);
  const boardGeometry=own(new THREE.PlaneGeometry(2.36,2.84));
  const boardMaterial=own(new THREE.MeshBasicMaterial({transparent:true,alphaTest:.05}));
  const board=new THREE.Mesh(boardGeometry,boardMaterial);group.add(board);
  new THREE.TextureLoader().load('/assets/research/notice-cabinet.png',texture=>{
    if(disposed){texture.dispose();return;}
    own(texture);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    boardMaterial.map=texture;boardMaterial.needsUpdate=true;hoverMaterial.map=texture;hoverMaterial.needsUpdate=true;
  });
  const sheets=cases.map((item,index)=>{
    const texture=own(new THREE.TextureLoader().load(item.preview||item.image));
    texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
    if(index===3){texture.repeat.x=.574;texture.offset.x=.213;}
    const geometry=own(new THREE.PlaneGeometry(index===3?.60:.48,index===3?.574:.679));
    const material=own(new THREE.MeshBasicMaterial({map:texture}));
    const paper=new THREE.Mesh(geometry,material);
    paper.position.set(index%2===0?-.41:.39,index<2?.01:-.73,.025);
    paper.rotation.z=[.018,-.025,.02,-.012][index];paper.userData.researchId=item.id;group.add(paper);
    const pin=new THREE.Mesh(own(new THREE.SphereGeometry(.014,8,6)),own(new THREE.MeshStandardMaterial({color:0x96713b,metalness:.7,roughness:.4})));
    pin.position.set(paper.position.x,paper.position.y+.31,.04);group.add(pin);
    return{texture,paper,item,index};
  });
  const hoverMaterial=own(new THREE.MeshBasicMaterial({color:0xffdf98,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
  const hoverFace=new THREE.Mesh(boardGeometry,hoverMaterial);hoverFace.position.z=.055;group.add(hoverFace);
  let hovered=false;
  // Layer 1 redraws only the cabinet after the full-scene dimming pass.
  group.traverse(object=>object.layers.enable(1));
  const dimScene=new THREE.Scene();
  const dimCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const dimMaterial=own(new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthTest:false,depthWrite:false}));
  dimScene.add(new THREE.Mesh(own(new THREE.PlaneGeometry(2,2)),dimMaterial));
  let focusStrength=0;
  const dialog=document.querySelector('[data-wall-research-dialog]');
  const closeButton=dialog.querySelector('[data-wall-research-close]');
  let available=false,lastFocus=null;
  const reader=dialog.querySelector('[data-report-reader]'), selection=dialog.querySelector('[data-report-selection]');
  const scrollGuide=dialog.querySelector('[data-report-scroll]');
  function syncScrollGuide(){scrollGuide.hidden=reader.hidden||reader.scrollHeight-reader.clientHeight-reader.scrollTop<=4;}
  const scrollDown=()=>reader.scrollBy({top:reader.clientHeight*.72,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  scrollGuide.addEventListener('click',scrollDown);
  reader.addEventListener('scroll',syncScrollGuide,{passive:true});
  reader.addEventListener('load',syncScrollGuide,true);
  const readerResize=new ResizeObserver(syncScrollGuide);readerResize.observe(reader);
  let selectedButton=null;
  function showSelection(focus=false){reader.hidden=true;syncScrollGuide();selection.hidden=false;dialog.querySelectorAll('[data-report-article]').forEach(el=>el.hidden=true);if(focus)selectedButton?.focus();}
  function choose(event){const button=event.target.closest('[data-report-select]');if(!button)return;selectedButton=button;selection.hidden=true;reader.hidden=false;dialog.querySelectorAll('[data-report-article]').forEach(el=>{el.hidden=el.dataset.reportArticle!==button.dataset.reportSelect;if(!el.hidden)el.focus();});reader.scrollTop=0;requestAnimationFrame(syncScrollGuide);}
  selection.addEventListener('click',choose);
  const back=()=>showSelection(true);dialog.querySelector('[data-report-back]').addEventListener('click',back);
  function open(){hovered=false;showSelection();if(!available||dialog.open)return;lastFocus=document.activeElement;dialog.showModal();closeButton.focus();}
  function close(){dialog.close();}
  function restore(){if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
  function keydown(event){if(dialog.open){event.stopPropagation();if(event.key==='Escape'&&!reader.hidden){event.preventDefault();showSelection(true);}}}
  closeButton.addEventListener('click',close);
  dialog.addEventListener('close',restore);dialog.addEventListener('keydown',keydown);
  return {
    get isOpen(){return dialog.open;},open,
    pick(raycaster){return available&&raycaster.intersectObjects([board,...sheets.map(sheet=>sheet.paper)],false)[0];},
    hover(value){hovered=!!value;},
    update(visible){available=visible;group.visible=visible;hoverMaterial.opacity+=((visible&&hovered&&!dialog.open ? .16 : 0)-hoverMaterial.opacity)*.18;
      focusStrength+=((visible&&hovered&&!dialog.open ? .60 : 0)-focusStrength)*.18;
      if(focusStrength<.001)focusStrength=0;
    },
    renderFocus(renderer,scene,camera){
      if(!focusStrength||dialog.open)return;
      const autoClear=renderer.autoClear,mask=camera.layers.mask,background=scene.background;
      renderer.autoClear=false;dimMaterial.opacity=focusStrength;
      renderer.render(dimScene,dimCamera);
      camera.layers.set(1);scene.background=null;
      renderer.render(scene,camera);
      camera.layers.mask=mask;scene.background=background;renderer.autoClear=autoClear;
    },
    dispose(){readerResize.disconnect();scrollGuide.removeEventListener('click',scrollDown);reader.removeEventListener('scroll',syncScrollGuide);reader.removeEventListener('load',syncScrollGuide,true);closeButton.removeEventListener('click',close);dialog.removeEventListener('close',restore);dialog.removeEventListener('keydown',keydown);selection.removeEventListener('click',choose);dialog.querySelector('[data-report-back]').removeEventListener('click',back);disposed=true;group.removeFromParent();resources.forEach(resource=>resource.dispose());}
  };
}
