import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Mirroring is a display/capture transform only. Detection always reads the raw video.
export function createLiveFace({ mount, onCaptureComplete }) {
  const host=document.querySelector('[data-capture-workstation]');
  const trigger=document.querySelector('[data-recapture-face]');
  const panel=document.createElement('section');panel.className='face-capture-simple';panel.hidden=true;
  panel.innerHTML=`<video playsinline muted aria-label="Mirrored camera preview"></video>
    <div class="face-capture-instructions"><p data-face-status role="status">Face the camera and hold still for a moment.</p>
      <progress max="100" value="0" aria-label="Face capture progress"></progress><span data-capture-percent>0%</span>
      <button type="button" data-cancel-capture>CANCEL CAPTURE</button></div>`;
  host.append(panel);
  const video=panel.querySelector('video'),status=panel.querySelector('[data-face-status]'),meter=panel.querySelector('progress'),percent=panel.querySelector('[data-capture-percent]');
  let active=false,disposed=false,starting=false,stream=null,detector=null,generation=0,lastVideoTime=-1,lastDetect=0,held=0;
  function message(text){status.textContent=text;}
  function stop(){generation++;starting=false;stream?.getTracks().forEach(t=>t.stop());stream=null;video.pause();video.srcObject=null;detector?.close();detector=null;trigger.disabled=false;}
  function restore(){panel.hidden=true;host.closest('.reuse-media').classList.remove('is-capturing');}
  function cancel(){stop();restore();}
  async function start(){
    if(starting||stream||disposed||!active)return;
    const token=++generation;starting=true;trigger.disabled=true;panel.hidden=false;host.closest('.reuse-media').classList.add('is-capturing');held=0;meter.value=0;percent.textContent='0%';
    message('Allow camera access to capture your face.');
    let pendingStream,pendingDetector;
    const stale=()=>disposed||!active||token!==generation;
    try {
      pendingStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
      if(stale()){pendingStream.getTracks().forEach(t=>t.stop());return;}
      stream=pendingStream;video.srcObject=stream;await video.play();
      message('Loading local face tracking…');
      const files=await FilesetResolver.forVisionTasks('/assets/live-face/wasm');if(stale())return;
      const options={baseOptions:{modelAssetPath:'/assets/live-face/face_landmarker.task',delegate:'GPU'},runningMode:'VIDEO',numFaces:1,outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false};
      try{pendingDetector=await FaceLandmarker.createFromOptions(files,options);}
      catch{if(stale())return;options.baseOptions.delegate='CPU';pendingDetector=await FaceLandmarker.createFromOptions(files,options);}
      if(stale()){pendingDetector.close();return;}
      detector=pendingDetector;starting=false;lastVideoTime=-1;lastDetect=0;
      message('Face the camera and hold still for a moment.');
    } catch(error){
      pendingStream?.getTracks().forEach(t=>t.stop());
      if(stale())return;
      stop();message(error.name==='NotAllowedError'?'Camera permission was declined. You can upload a portrait in the Inspection Room.':'The camera could not start. Please retry or upload a portrait in the Inspection Room.');
    }
  }
  const visibility=()=>{if(document.hidden)cancel();};
  trigger.addEventListener('click',start);panel.querySelector('[data-cancel-capture]').addEventListener('click',cancel);document.addEventListener('visibilitychange',visibility);
  return {
    activate(){active=true;},
    deactivate(){active=false;cancel();},
    setConsoleFocused(){},
    toggleDemo(){return false;},
    update(){
      if(!active||!detector||!stream||video.readyState<2||lastVideoTime===video.currentTime)return;
      const now=performance.now();if(now-lastDetect<66)return;
      const dt=lastDetect?Math.min((now-lastDetect)/1000,.12):0;lastDetect=now;lastVideoTime=video.currentTime;
      try {
        const result=detector.detectForVideo(video,now),points=result.faceLandmarks[0];
        panel.dataset.detectFrames=String(Number(panel.dataset.detectFrames||0)+1);
        let inFrame=false;
        if(points){
          let left=1,right=0,top=1,bottom=0;for(const p of points){left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);}
          const x=(left+right)/2,y=(top+bottom)/2;
          inFrame=right-left>.12&&bottom-top>.18&&x>.15&&x<.85&&y>.15&&y<.85;
        }
        held=inFrame?held+dt:Math.max(0,held-dt*2);
        const value=Math.min(100,Math.floor(held/1.4*100));meter.value=value;percent.textContent=`${value}%`;
        message(inFrame?'Hold still. Capturing your face…':'Move your face into the centre of the camera view.');
        if(value===100){
          const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
          const ctx=canvas.getContext('2d');ctx.translate(canvas.width,0);ctx.scale(-1,1);ctx.drawImage(video,0,0);
          const imageUrl=canvas.toDataURL('image/jpeg',.9);stop();restore();onCaptureComplete?.({imageUrl});
        }
      } catch {stop();message('Face tracking stopped. Please try again.');}
    },
    dispose(){disposed=true;active=false;cancel();trigger.removeEventListener('click',start);document.removeEventListener('visibilitychange',visibility);panel.remove();},
  };
}
