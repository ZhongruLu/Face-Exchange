
export function createFaceReuse(root, { onApply, onDirty }) {
  root.innerHTML = `<div class="reuse-steps" aria-label="Portrait processing stages">
    <button type="button" data-reuse-stage="0" aria-pressed="true">01 · Your original</button>
    <button type="button" data-reuse-stage="1" disabled>02 · Prepared for sale</button>
    <button type="button" data-reuse-stage="2" disabled>03 · A new use</button></div>
    <div class="reuse-comparison">
      <figure class="reuse-original"><figcaption>Your uploaded face</figcaption>
        <div class="reuse-media"><img data-reuse-original alt="Your original uploaded portrait" hidden />
          <p data-reuse-empty>Upload a portrait in the Inspection Room, or capture your face here.</p>
          <div data-capture-workstation></div></div>
        <button type="button" data-recapture-face>CAPTURE YOUR FACE</button>
      </figure>
      <figure class="reuse-output"><figcaption data-reuse-caption>What happens to your face next?</figcaption>
        <div class="reuse-media reuse-result"><p data-reuse-waiting>Your face is waiting to be processed.</p>
          <img data-reuse-crop alt="Your cropped portrait prepared as a simulated lot" hidden />
          <div class="reuse-advert" hidden><span>FICTIONAL ADVERT</span><img data-reuse-ad-face alt="Your portrait in a fictional advert" /><h3>The perfect worker</h3><p>XXX, your most trusted and reliable choice.</p></div>
        </div><p class="reuse-asset" data-reuse-asset></p>
      </figure>
    </div>
    <p class="reuse-question" data-reuse-question role="status">You uploaded a photograph. What could someone make it say?</p>
    <div class="reuse-proceed"><button class="primary-action" type="button" data-reuse-process disabled>PREPARE MY PORTRAIT</button></div>`;
  const original=root.querySelector('[data-reuse-original]'),crop=root.querySelector('[data-reuse-crop]'),advert=root.querySelector('.reuse-advert');
  const action=root.querySelector('[data-reuse-process]'),question=root.querySelector('[data-reuse-question]'),caption=root.querySelector('[data-reuse-caption]');
  let source='',prepared='',stage=0,version=0,asset='',applied=false;
  const questions=['You uploaded a photograph. What could someone make it say?','Your face has been cropped, numbered and prepared for sale.','It is still your face. But did you agree to appear in this advert?'];
  function show(next) {
    stage=next;
    crop.hidden=stage!==1;advert.hidden=stage!==2;
    root.querySelector('[data-reuse-waiting]').hidden=stage!==0;
    caption.textContent=['What happens to your face next?','A portrait becomes a lot.','A face becomes an endorsement.'][stage];
    question.hidden=stage===2;
    question.textContent=stage===0&&!source?'Start with your own face.':questions[stage];
    if(stage===2&&prepared&&!applied){applied=true;onApply({url:prepared,asset});}
    root.querySelector('[data-reuse-asset]').textContent=stage ? asset : '';
    root.querySelectorAll('[data-reuse-stage]').forEach(b=>{b.disabled=!prepared&&b.dataset.reuseStage!=='0';b.setAttribute('aria-pressed',String(Number(b.dataset.reuseStage)===stage));});
    action.hidden=stage===2;action.textContent=stage===0?'PREPARE MY PORTRAIT':'PREVIEW A COMMERCIAL USE';
  }
  async function prepare() {
    if(!source)return;
    action.disabled=true;const token=version;
    try {
      const img=new Image();img.src=source;await img.decode();if(token!==version)return;
      const canvas=document.createElement('canvas');canvas.width=600;canvas.height=720;
      const ctx=canvas.getContext('2d');ctx.fillStyle='#d8c9ac';ctx.fillRect(0,0,600,720);
      const scale=Math.max(600/img.naturalWidth,720/img.naturalHeight);
      ctx.drawImage(img,(600-img.naturalWidth*scale)/2,(720-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);
      prepared=canvas.toDataURL('image/jpeg',.9);crop.src=prepared;root.querySelector('[data-reuse-ad-face]').src=prepared;
      show(1);
    } catch {question.textContent='The portrait could not be opened. Please upload it again.';}
    finally {if(token===version)action.disabled=!source;}
  }
  action.addEventListener('click',()=>{if(stage===0)prepare();else show(2);});
  root.querySelectorAll('[data-reuse-stage]').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.reuseStage))));
  show(0);
  return {
    setReference(url) {
      if(url===source)return;
      version++;source=url||'';prepared='';applied=false;asset=url?`FX-${String(1000+Math.floor(Math.random()*9000))}`:'';
      original.hidden=!url;root.querySelector('[data-reuse-empty]').hidden=!!url;
      if(url)original.src=url;else original.removeAttribute('src');
      action.disabled=!url;onDirty();show(0);
    },
    reset(){this.setReference('');},
  };
}
