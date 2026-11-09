// Conservative defaults plus a sustained frame-time check. Never change movement speed.
export function createScenePerformance(renderer,scene){
  let choice='auto';try{choice=localStorage.getItem('face-exchange-quality')||'auto';}catch{}
  let smooth=choice==='smooth'||(choice==='auto'&&((navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4));
  let slowSeconds=0,samples=0,elapsed=0;
  let width=window.innerWidth,height=window.innerHeight;
  function apply(){
    // Bound multisampled colour/depth buffers on Retina and full-screen displays.
    const pixelBudget=smooth?1500000:3000000;
    const ratio=Math.min(devicePixelRatio||1,smooth?1:1.5,Math.sqrt(pixelBudget/Math.max(1,width*height)));
    renderer.setPixelRatio(ratio);renderer.shadowMap.enabled=!smooth;renderer.shadowMap.needsUpdate=true;document.querySelector('[data-app]').dataset.sceneQuality=smooth?'smooth':'clear';}
  function change(event){choice=event.detail;smooth=choice==='smooth'||(choice==='auto'&&((navigator.hardwareConcurrency||8)<=4||(navigator.deviceMemory||8)<=4));slowSeconds=0;apply();}
  window.addEventListener('face-scene-quality',change);apply();
  return{resize(w,h){width=w;height=h;apply();},update(delta){
    if(document.querySelector('[data-app]')?.dataset.sceneLoading||document.hidden){elapsed=0;samples=0;return;}
    elapsed+=delta;samples++;if(elapsed<2)return;
    if(choice==='auto'&&!smooth){slowSeconds=elapsed/samples>.029?slowSeconds+elapsed:0;if(slowSeconds>=4){smooth=true;apply();}}
    elapsed=0;samples=0;
  },dispose(){window.removeEventListener('face-scene-quality',change);}};
}
