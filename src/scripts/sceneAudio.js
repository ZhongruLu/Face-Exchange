export function initSceneAudio(app) {
  const controls=app.querySelector('[data-audio-controls]');
  const menu=app.querySelector('[data-audio-menu]');
  const panel=app.querySelector('[data-audio-panel]');
  const button=app.querySelector('[data-sound-toggle]');
  const slider=app.querySelector('[data-sound-volume]');
  const label=app.querySelector('[data-sound-label]');
  const status=app.querySelector('[data-sound-status]');
  const music=new Audio('/assets/audio/corridor-ambience.wav');
  const door=new Audio('/assets/audio/door-open.wav');
  const crowd=new Audio('/assets/audio/auction-crowd.mp3');
  const hammer=new Audio('/assets/audio/auction-three-gavels.wav');
  const applause=new Audio('/assets/audio/auction-applause.mp3');
  const cheer=new Audio('/assets/audio/auction-yes.mp3');
  applause.preload=cheer.preload='auto';applause.hidden=cheer.hidden=true;
  applause.volume=cheer.volume=0;applause.dataset.auctionApplause='';cheer.dataset.auctionCheer='';app.append(applause,cheer);
  let celebrationAt=0;
  crowd.loop=true;crowd.preload='auto';crowd.volume=0;hammer.preload='auto';hammer.volume=0;
  crowd.hidden=hammer.hidden=true;crowd.dataset.auctionCrowd='';hammer.dataset.auctionHammer='';app.append(crowd,hammer);
  let inAuction=app.dataset.view==='termsRoom';
  music.loop=true; music.preload='none'; music.volume=0; door.preload='auto';
  music.hidden=door.hidden=true;music.dataset.sceneMusic='';door.dataset.sceneDoorSound='';app.append(music,door);
  let enabled=true, started=false, volume=0.35, frame=0, previousTime=0, pendingDoor=false;
  try { const prefs=JSON.parse(localStorage.getItem('faceExchangeAudio')||'null'); if(prefs){enabled=prefs.enabled!==false;volume=Math.max(0,Math.min(1,Number(prefs.volume)||0));} } catch {}
  slider.value=String(Math.round(volume*100));
  function sync(){
    app.dataset.soundEnabled=String(enabled);app.dataset.soundVolume=String(volume);app.dataset.soundStarted=String(started);
    menu.dataset.soundState=enabled&&started&&volume>0?'on':'off';
    button.setAttribute('aria-pressed',String(enabled&&started));
    button.setAttribute('aria-label',enabled&&started?'Mute sound':'Enable sound');
    label.textContent=!started?'ENABLE SOUND':enabled?'SOUND ON':'SOUND OFF';
    slider.setAttribute('aria-valuetext',`${Math.round(volume*100)} percent`);
    try {localStorage.setItem('faceExchangeAudio',JSON.stringify({enabled,volume}));}catch{}
  }
  function closePanel(){panel.hidden=true;menu.setAttribute('aria-expanded','false');}
  menu.addEventListener('click',()=>{panel.hidden=!panel.hidden;menu.setAttribute('aria-expanded',String(!panel.hidden));});
  document.addEventListener('pointerdown',event=>{if(!controls.contains(event.target))closePanel();});
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden){closePanel();menu.focus();event.preventDefault();event.stopImmediatePropagation();}
  },true);
  function fade(time){
    const dt=previousTime?Math.min((time-previousTime)/1000,0.1):0.016;previousTime=time;
    const audible=enabled&&!document.hidden;
    const target=audible?volume*(inAuction?.32:1):0;
    const crowdTarget=audible&&inAuction?volume*.9:0;
    music.volume+=(target-music.volume)*(1-Math.exp(-5*dt));
    crowd.volume+=(crowdTarget-crowd.volume)*(1-Math.exp(-.9*dt));
    const celebrationAge=(performance.now()-celebrationAt)/1000;
    if(celebrationAt && celebrationAge>=8)applause.pause();
    const celebrationFade=celebrationAt?Math.max(0,Math.min(1,(8-celebrationAge)/3)):0;
    const roomGain=inAuction?1:Math.min(1,crowd.volume/Math.max(.001,volume*.9));
    applause.volume=audible?volume*.35*celebrationFade*roomGain:0;
    cheer.volume=audible?volume*.65*roomGain:0;
    hammer.volume=audible?Math.min(volume*.95,crowd.volume*1.1):0;
    if(Math.abs(music.volume-target)<0.002&&Math.abs(crowd.volume-crowdTarget)<0.002 && !(celebrationAt && celebrationAge<8 && !applause.paused)){
      music.volume=target;crowd.volume=crowdTarget;frame=0;
      if(!target)music.pause();if(!crowdTarget){crowd.pause();hammer.pause();applause.pause();cheer.pause();}return;
    }
    frame=requestAnimationFrame(fade);
  }
  function updateVolume(){door.volume=enabled?volume*0.75:0;if(!frame){previousTime=0;frame=requestAnimationFrame(fade);}}
  async function start(){
    if(!enabled||document.hidden)return;
    try {await music.play();started=true;status.textContent='';sync();if(inAuction)crowd.play().catch(()=>{status.textContent='Click ENABLE SOUND to play the auction ambience.';});updateVolume();if(pendingDoor){pendingDoor=false;playDoor();}}
    catch {status.textContent='Click ENABLE SOUND to play.';}
  }
  function playDoor(){
    if(!enabled||document.hidden)return;
    if(!started){pendingDoor=true;return;}
    door.currentTime=0;door.volume=volume*0.75;
    door.play().catch(()=>{status.textContent='Sound playback was blocked.';});
  }
  button.addEventListener('click',()=>{
    if(!started){enabled=true;start();return;}
    enabled=!enabled;sync();if(enabled)start();else{door.pause();updateVolume();}
  });
  slider.addEventListener('input',()=>{volume=Number(slider.value)/100;sync();if(enabled)start();updateVolume();});
  function unlock(event){
    if(event.target.closest('[data-audio-controls]'))return;
    if(event.type==='keydown'&&(event.metaKey||event.ctrlKey||event.altKey||event.key==='Tab'))return;
    if(!started&&enabled)start();
  }
  document.addEventListener('pointerdown',unlock,true);
  document.addEventListener('keydown',unlock,true);
  let lastEntrance=app.dataset.entrance,lastView=app.dataset.view;
  new MutationObserver(()=>{
    const entrance=app.dataset.entrance,view=app.dataset.view;
    if(entrance==='opening'&&lastEntrance!=='opening')playDoor();
    if(view!==lastView&&view!=='corridor')playDoor();
    if(view!==lastView){
      inAuction=view==='termsRoom';
      if(inAuction&&enabled&&started)crowd.play().catch(()=>{status.textContent='Click ENABLE SOUND to play the auction ambience.';});
      updateVolume();
    }
    lastEntrance=entrance;lastView=view;
  }).observe(app,{attributes:true,attributeFilter:['data-entrance','data-view']});
  document.addEventListener('auction-celebration',()=>{
    if(!inAuction||!enabled||!started||document.hidden)return;
    celebrationAt=performance.now();applause.currentTime=0;cheer.currentTime=0;
    applause.volume=volume*.35;cheer.volume=volume*.65;
    applause.play().catch(()=>{});cheer.play().catch(()=>{});updateVolume();
  });
  document.addEventListener('auction-final-hammer',()=>{
    if(!inAuction||!enabled||!started||document.hidden)return;
    hammer.currentTime=0;hammer.volume=volume*.95;
    hammer.play().catch(()=>{status.textContent='Gavel sound could not play.';});
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){music.pause();door.pause();crowd.pause();hammer.pause();applause.pause();cheer.pause();music.volume=0;crowd.volume=0;}
    else if(started&&enabled)start();
  });
  music.addEventListener('error',()=>{status.textContent='Music file unavailable. Check public/assets/audio/.';});
  door.addEventListener('error',()=>{status.textContent='Door sound unavailable. Check public/assets/audio/.';});
  crowd.addEventListener('error',()=>{status.textContent='Auction ambience unavailable.';});
  sync();
  return {playDoor};
}
