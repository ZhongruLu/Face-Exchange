import * as THREE from 'three';
import exhibit from '../data/videoExhibit.json';
import {onLanguageChange} from './language.js';

export function resolveExhibitSource(value,base=location.origin) {
  const url=new URL(value,base);
  if(!['http:','https:'].includes(url.protocol))throw new Error('Unsupported URL');
  const host=url.hostname.toLowerCase();let id=null;
  if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
    id=url.searchParams.get('v')||(/^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1]);
    if(!id||!/^[-\w]{11}$/.test(id))throw new Error('Invalid YouTube link');
  }else if(host==='youtu.be'){id=url.pathname.split('/')[1];if(!/^[-\w]{11}$/.test(id))throw new Error('Invalid YouTube link');}
  if(id)return{type:'youtube',url:`https://www.youtube-nocookie.com/embed/${id}?playsinline=1`,original:`https://www.youtube.com/watch?v=${id}`};
  if(!/\.(mp4|webm|ogv|mov|m4v)$/i.test(url.pathname))throw new Error('Use a YouTube link or direct video URL');
  return{type:'video',url:url.href,original:url.href};
}

export function createVideoExhibit({world,mount}){
  const group=new THREE.Group();group.name='ClassicalVideoExhibit';group.position.set(-4.55,0,-82);group.scale.setScalar(1.8);group.rotation.y=Math.PI/2;world.add(group);
  const resources=[],own=r=>(resources.push(r),r);
  const woodMap=own(new THREE.TextureLoader().load('/assets/materials/catalogue/walnut-grain.jpg'));woodMap.colorSpace=THREE.SRGBColorSpace;woodMap.anisotropy=8;
  const wood=own(new THREE.MeshStandardMaterial({map:woodMap,color:0xc9b9a4,roughness:.55,metalness:0}));
  const gold=own(new THREE.MeshStandardMaterial({color:0xa78b53,roughness:.4,metalness:.7}));
  function box(w,h,d,x,y,z,material){const mesh=new THREE.Mesh(own(new THREE.BoxGeometry(w,h,d)),material);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
  // Mount the framed screen directly against the left corridor wall.
  box(2.34,1.48,.14,0,2.06,-.13,wood);
  for(const x of [-1.1,1.1])box(.035,1.38,.04,x,2.06,-.035,gold);
  for(const y of [1.39,2.73])box(2.23,.035,.04,0,y,-.035,gold);
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
  const texture=own(new THREE.CanvasTexture(canvas));texture.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(own(new THREE.PlaneGeometry(2.13,1.2)),own(new THREE.MeshBasicMaterial({map:texture})));screen.position.set(0,2.06,-.025);group.add(screen);
  const wash=new THREE.Mesh(screen.geometry,own(new THREE.MeshBasicMaterial({color:0xffd99a,opacity:0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})));wash.position.copy(screen.position);wash.position.z+=.01;group.add(wash);
  const dialog=document.createElement('dialog');dialog.className='video-exhibit-dialog';dialog.dataset.videoExhibit='';dialog.dataset.i18nIgnore='';dialog.setAttribute('aria-label','Video exhibit');
  dialog.innerHTML=`<button type="button" data-video-close></button><h2 data-video-title></h2><div class="video-exhibit-player" data-video-player></div><p data-video-status role="status"></p><a data-video-original target="_blank" rel="noopener noreferrer" hidden></a><details data-video-connect><summary data-video-connect-label></summary><form data-video-form><label><span data-video-url-label></span><input data-video-url type="url" placeholder="https://www.youtube.com/watch?v=…" /></label><button type="submit" data-video-apply></button><label class="video-file-label"><span data-video-file-label></span><input data-video-file type="file" accept="video/*" /></label><p data-video-file-note></p></form></details>`;
  mount.closest('[data-app]').append(dialog);
  const player=dialog.querySelector('[data-video-player]'),status=dialog.querySelector('[data-video-status]'),original=dialog.querySelector('[data-video-original]');
  let available=false,hovered=false,current=null,objectUrl=null,previousFocus=null,statusKey='empty',disposed=false;
  const zh=()=>document.documentElement.lang==='zh-CN';
  const texts={empty:['The video exhibit is awaiting its local film.','影像展台正在等待本地影片。'],ready:['Use the player controls to start playback.','请使用播放器控件开始播放。'],invalid:['Use a valid YouTube link or a direct MP4 / WebM video URL.','请输入有效的 YouTube 链接或 MP4 / WebM 视频直链。'],error:['This video could not play. Check the file format or source link.','视频无法播放，请检查文件格式或来源链接。']};
  function setStatus(key){statusKey=key;status.textContent=texts[key][zh()?1:0];}
  function paint(){const cn=zh(),ctx=canvas.getContext('2d');ctx.fillStyle='#201914';ctx.fillRect(0,0,960,540);ctx.strokeStyle='#9e824e';ctx.strokeRect(24,24,912,492);ctx.fillStyle='#bca271';ctx.font='26px Georgia';ctx.textAlign='center';ctx.fillText('FACE EXCHANGE',480,98);ctx.beginPath();ctx.moveTo(447,213);ctx.lineTo(447,315);ctx.lineTo(530,264);ctx.closePath();ctx.fill();ctx.font='32px Georgia';ctx.fillText(cn?'影像展台':'VIDEO EXHIBIT',480,389);ctx.font='22px sans-serif';ctx.fillText(cn?'靠近观看':'APPROACH TO WATCH',480,450);texture.needsUpdate=true;
    const labels={'[data-video-close]':cn?'返回走廊 ×':'Return to corridor ×','[data-video-connect-label]':cn?'接入或更换视频':'Connect or change video','[data-video-url-label]':cn?'YouTube 链接或视频直链':'YouTube link or direct video URL','[data-video-apply]':cn?'载入视频':'Load video','[data-video-file-label]':cn?'选择本地视频':'Choose a local video','[data-video-file-note]':cn?'本地文件仅在本次浏览中播放，不会上传。':'Local files play in this browsing session and are not uploaded.','[data-video-original]':cn?'在来源网站打开 ↗':'Open at source ↗'};
    Object.entries(labels).forEach(([selector,text])=>dialog.querySelector(selector).textContent=text);
    dialog.querySelector('[data-video-title]').textContent=cn?exhibit.zhTitle:exhibit.title;setStatus(statusKey);
  }
  // One video drives both the wall texture and the enlarged player.
  const app=mount.closest('[data-app]');
  const video=document.createElement('video');video.playsInline=true;video.loop=true;video.preload='none';video.volume=0;
  video.dataset.spatialExhibitVideo='';
  const mediaHost=document.createElement('div');mediaHost.hidden=true;app.append(mediaHost);mediaHost.append(video);
  const videoTexture=own(new THREE.VideoTexture(video));videoTexture.colorSpace=THREE.SRGBColorSpace;
  video.onerror=()=>setStatus('error');
  let gain=0,visual=0,playPending=false,retryAt=0,sourceRequest=false,pollElapsed=10;
  const zone=exhibit.spatialPlayback||{start:52,fullVolume:78,fadeAfter:88,stop:101,maxVolume:.85};
  const smooth=(a,b,x)=>{const t=THREE.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  function applySource(source){
    if(!source||source.type!=='video'||source.url===current?.url)return;
    video.pause();gain=0;visual=0;video.volume=0;video.removeAttribute('src');video.load();current=source;retryAt=0;
    if(dialog.open)renderPlayer();
  }
  function prepareVideo(){if(current&&video.getAttribute('src')!==current.url){video.preload='auto';video.src=current.url;video.load();}}
  async function discover(){
    if(sourceRequest||disposed)return;sourceRequest=true;
    try{const response=await fetch('/assets/video-exhibit/manifest.json',{cache:'no-store'});if(response.ok){const data=await response.json();if(data.url)applySource(resolveExhibitSource(data.url));}}catch{}finally{sourceRequest=false;}
  }
  function renderPlayer(){
    original.hidden=true;dialog.querySelector('[data-video-connect]').hidden=true;
    if(!current){setStatus('empty');return;}
    prepareVideo();video.controls=true;player.replaceChildren(video);status.hidden=true;
  }
  function replaceSource(source){applySource(source);}
  const form=dialog.querySelector('[data-video-form]');const submit=event=>{event.preventDefault();try{replaceSource(resolveExhibitSource(dialog.querySelector('[data-video-url]').value));}catch{setStatus('invalid');}};form.addEventListener('submit',submit);
  const file=dialog.querySelector('[data-video-file]');const choose=()=>{const selected=file.files?.[0];if(!selected)return;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(selected);applySource({type:'video',url:objectUrl});};file.addEventListener('change',choose);
  const close=()=>dialog.close();dialog.querySelector('[data-video-close]').addEventListener('click',close);
  const onClose=()=>{video.controls=false;mediaHost.append(video);previousFocus?.isConnected&&previousFocus.focus({preventScroll:true});};dialog.addEventListener('close',onClose);
  const stop=event=>event.stopPropagation();dialog.addEventListener('keydown',stop);
  const unlock=()=>{retryAt=0;};document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);
  if(exhibit.source?.url){try{applySource(resolveExhibitSource(exhibit.source.url));}catch{statusKey='invalid';}}
  const unsubscribe=onLanguageChange(paint);paint();dialog.querySelector('[data-video-connect]').hidden=true;discover();
  screen.material.transparent=true;
  return{
    get isOpen(){return dialog.open;},
    pick(raycaster){return available&&raycaster.intersectObject(screen,false).find(hit=>hit.distance<22);},
    hover(value){hovered=!!value;},
    open(){if(!available||dialog.open)return;previousFocus=document.activeElement;renderPlayer();dialog.showModal();dialog.querySelector('[data-video-close]').focus();},
    update(visible,delta=.016,context={}){
      available=visible;group.visible=visible;wash.material.opacity=hovered&&visible ? .13 : 0;
      pollElapsed+=delta;if(pollElapsed>10){pollElapsed=0;discover();}
      const progress=-context.corridorZ;
      const inZone=visible&&context.inside&&context.roomIndex<0;
      const envelope=inZone?smooth(zone.start,zone.fullVolume,progress)*(1-smooth(zone.fadeAfter,zone.stop,progress)):0;
      if(inZone&&progress>zone.start-12&&progress<zone.stop)prepareVideo();
      const wantsPlayback=!!current&&!document.hidden&&envelope>.001;
      const audible=app.dataset.soundEnabled!=='false';
      const master=Number(app.dataset.soundVolume??.35);
      const target=wantsPlayback&&audible?envelope*master*zone.maxVolume:0;
      gain+=(target-gain)*(1-Math.exp(-2*delta));video.volume=THREE.MathUtils.clamp(gain,0,1);
      visual+=((wantsPlayback?1:0)-visual)*(1-Math.exp(-2.8*delta));
      if(wantsPlayback&&video.paused&&!playPending&&performance.now()>retryAt){
        playPending=true;video.muted=!audible;
        video.play().catch(()=>{
          // A browser may require a further gesture for sound; keep the picture playing.
          video.muted=true;return video.play().catch(()=>{});
        }).finally(()=>{playPending=false;retryAt=performance.now()+2000;});
      }
      if(!wantsPlayback&&gain<.001&&visual<.01&&!video.paused){video.pause();video.volume=0;gain=0;}
      if(video.readyState>=2&&visual>.005){screen.material.map=videoTexture;screen.material.opacity=visual;}
      else{screen.material.map=texture;screen.material.opacity=1;}
      // Unmute only after the visitor has enabled sound or interacted with the page.
      if(!audible)video.muted=true;
      else if(video.muted&&navigator.userActivation?.hasBeenActive&&performance.now()>retryAt){video.muted=false;retryAt=performance.now()+2000;}
      screen.material.needsUpdate=screen.material.map!==screen.userData.lastMap;screen.userData.lastMap=screen.material.map;
    },
    dispose(){disposed=true;unsubscribe();video.pause();video.removeAttribute('src');video.load();mediaHost.remove();if(objectUrl)URL.revokeObjectURL(objectUrl);document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);dialog.remove();group.removeFromParent();resources.forEach(r=>r.dispose());}
  };
}
