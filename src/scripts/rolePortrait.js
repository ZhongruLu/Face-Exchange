import {FaceLandmarker,FilesetResolver} from '@mediapipe/tasks-vision';

export const ROLE_STYLES={
  jobInterview:{name:'Staff',color:'#253f59'},
  luxury:{name:'Artist',color:'#725341'},
  influencer:{name:'Singer',color:'#4c3450'},
  passport:{name:'Designer',color:'#46534a'},
};

export function portraitCrop(width,height,landmarks) {
  if(!landmarks?.length) {
    const side=Math.min(width*.72,height*.85);
    return{x:(width-side)/2,y:Math.max(0,height*.05),width:side,height:Math.min(height*.9,side*1.3)};
  }
  const xs=landmarks.map(p=>p.x*width),ys=landmarks.map(p=>p.y*height);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  const w=right-left,h=bottom-top;
  const x=Math.max(0,left-w*.16),y=Math.max(0,top-h*.25);
  return{x,y,width:Math.min(width-x,w*1.32),height:Math.min(height-y,h*1.3)};
}

const defs=`<defs>
 <linearGradient id="fabric"><stop stop-color="#0e171c"/><stop offset=".45" stop-color="#36516a"/><stop offset="1" stop-color="#132332"/></linearGradient>
 <linearGradient id="linen"><stop stop-color="#665543"/><stop offset=".5" stop-color="#b8a88b"/><stop offset="1" stop-color="#6d5946"/></linearGradient>
 <linearGradient id="leather"><stop stop-color="#111016"/><stop offset=".5" stop-color="#493649"/><stop offset="1" stop-color="#18141e"/></linearGradient>
 <linearGradient id="hair"><stop stop-color="#17100d"/><stop offset=".42" stop-color="#4c2f20"/><stop offset=".58" stop-color="#72503a"/><stop offset="1" stop-color="#22130d"/></linearGradient>
 <linearGradient id="metal"><stop stop-color="#62666d"/><stop offset=".38" stop-color="#eeeee5"/><stop offset=".65" stop-color="#9e9e95"/><stop offset="1" stop-color="#40454b"/></linearGradient>
 <pattern id="mesh" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 0h7M0 0v7" stroke="#343940" stroke-width="1"/></pattern>
 </defs>`;

export function roleLayerSvg(styleId,layer,skin='#c39070') {
  if(!ROLE_STYLES[styleId])throw new Error('Unknown portrait role');
  let content='';
  if(layer==='back'){
    if(styleId==='luxury')content=`<path d="M210 652Q164 427 207 226Q224 104 380 98Q538 94 567 239Q605 463 565 729L476 709L453 258L308 248L287 717Z" fill="url(#hair)"/><g fill="none" stroke="#a17b5350" stroke-width="3"><path d="M252 208Q199 387 253 682M278 177Q233 396 276 682M510 185Q561 399 516 689M538 235Q577 438 545 674"/></g>`;
  }else if(layer==='body'){
    const body='M300 529Q234 545 177 589Q111 648 103 960H665Q656 657 598 597Q547 554 468 529L439 550H328Z';
    content=`<path d="M327 479H441L452 569L385 636L316 566Z" fill="${skin}"/>`;
    if(styleId==='jobInterview')content+=`<path d="${body}" fill="url(#fabric)"/><path d="M302 533L384 608L466 533L447 661L386 623L323 661Z" fill="#d3d1bd"/><path d="M384 614V960M177 647L193 960M594 650L580 960" stroke="#8a9dab70" stroke-width="3"/><path d="M315 554L339 754H426L453 555" stroke="#14212c" stroke-width="13" fill="none"/><rect x="333" y="737" width="104" height="128" rx="7" fill="#ded7c0"/><rect x="347" y="751" width="76" height="45" fill="#83908c"/><path d="M348 813H420M348 829H395" stroke="#616c6b" stroke-width="4"/><path d="M203 700H296V783H203Z" fill="none" stroke="#b8b8a25c" stroke-width="3"/><text x="250" y="737" text-anchor="middle" fill="#ddd2ad" font-size="15" font-family="Georgia">STAFF</text>`;
    if(styleId==='luxury')content+=`<path d="${body}" fill="url(#linen)"/><path d="M319 537L383 609L450 537L423 695L383 644L343 695Z" fill="#e0d4b9"/><path d="M382 646V960M209 735H307V850H209Z" fill="none" stroke="#584536" stroke-width="4"/><path d="M228 702L212 632M249 704L258 615M270 702L284 646" stroke="#a6633a" stroke-width="10"/><path d="M213 631l-5-28M258 617l2-30M284 646l8-23" stroke="#37251e" stroke-width="15"/><path d="M471 750l32 13m-47 52l17-20m-247 72l14 13" stroke="#aa714e" stroke-width="7"/>`;
    if(styleId==='influencer')content+=`<path d="${body}" fill="url(#leather)"/><path d="M327 537L384 586L441 537L448 960H320Z" fill="#171416"/><path d="M295 542L337 723L302 699L264 577M473 542L430 723L466 700L506 577" fill="#594251" stroke="#9b8283" stroke-width="2"/><path d="M343 706L328 960M451 705L466 960" stroke="#b3a39b" stroke-width="4"/><circle cx="310" cy="629" r="5" fill="#d0c3a5"/><circle cx="460" cy="628" r="5" fill="#d0c3a5"/>`;
    if(styleId==='passport')content+=`<path d="${body}" fill="#23332e"/><path d="M320 522Q384 550 448 522L450 604Q384 630 317 604Z" fill="#161e1b"/><path d="M286 554L323 960H448L480 550L513 567L485 960H279L256 571Z" fill="#637365"/><path d="M283 574L309 743L272 716M482 574L455 743L495 716M322 814H442" fill="none" stroke="#a3ad8d" stroke-width="3"/><g transform="rotate(-13 241 803)"><rect x="175" y="733" width="175" height="237" rx="4" fill="#d1c7a7"/><path d="M195 765H326M195 797H326M195 829H299" stroke="#6c817a" stroke-width="3"/><path d="M204 919V866L261 841L316 868V919Z" fill="none" stroke="#68776c" stroke-width="3"/></g>`;
  }else if(layer==='front'){
    if(styleId==='luxury')content=`<g fill="url(#hair)"><path d="M254 194Q207 276 213 405Q215 464 204 581Q201 664 242 724L284 682Q243 567 267 459Q238 346 285 203Z"/><path d="M512 195Q562 292 549 404Q545 496 568 581Q577 667 529 728L490 683Q530 560 505 463Q527 326 479 198Z"/></g><g stroke="#ac825150" stroke-width="3" fill="none"><path d="M248 269Q218 393 244 469Q223 598 251 675M521 259Q550 396 523 473Q551 597 521 680"/></g>`;
    if(styleId==='influencer')content=`<path d="M563 902Q598 820 588 687L543 668Q535 778 498 856Z" fill="url(#leather)"/><g transform="rotate(24 546 576)"><rect x="526" y="482" width="39" height="214" rx="14" fill="#20252a"/><rect x="512" y="429" width="67" height="101" rx="31" fill="url(#metal)"/><rect x="512" y="429" width="67" height="101" rx="31" fill="url(#mesh)" opacity=".75"/><path d="M516 508H574" stroke="#b5b4a7" stroke-width="4"/><rect x="535" y="548" width="15" height="23" rx="3" fill="#a5a491"/><path d="M552 696Q568 823 501 936" stroke="#15171a" stroke-width="6" fill="none"/></g><path d="M539 665Q515 628 525 605Q533 594 544 611L563 633Q588 634 597 654L580 698Z" fill="${skin}"/><path d="M557 645L578 661M550 657L575 674" stroke="#7d564754" stroke-width="3"/>`;
    if(styleId==='passport')content=`<path d="M525 433L551 343" stroke="#c1a25e" stroke-width="8"/><path d="M551 343l7-23" stroke="#34392d" stroke-width="8"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="960" viewBox="0 0 768 960">${defs}${content}</svg>`;
}

async function imageFromSvg(svg) {
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
  try{return await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=url;});}
  finally{URL.revokeObjectURL(url);}
}

async function detectLandmarks(image) {
  let detector;
  try {
    const files=await FilesetResolver.forVisionTasks('/assets/live-face/wasm');
    detector=await FaceLandmarker.createFromOptions(files,{baseOptions:{modelAssetPath:'/assets/live-face/face_landmarker.task',delegate:'CPU'},runningMode:'IMAGE',numFaces:1});
    return detector.detect(image).faceLandmarks?.[0]||null;
  }catch{return null;}finally{detector?.close();}
}

let lastSource='',lastDetection;
function faceLandmarks(image) {
  if(image.src&&image.src===lastSource)return lastDetection;
  lastSource=image.src;
  lastDetection=detectLandmarks(image);
  return lastDetection;
}

export async function createRolePortrait(image,styleId) {
  if(!ROLE_STYLES[styleId])throw new Error('Unknown portrait role');
  const landmarks=await faceLandmarks(image);
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  const crop=portraitCrop(width,height,landmarks);
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=960;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(384,330,60,384,400,670);
  gradient.addColorStop(0,ROLE_STYLES[styleId].color);gradient.addColorStop(1,'#15120f');ctx.fillStyle=gradient;ctx.fillRect(0,0,768,960);
  const skinCanvas=document.createElement('canvas');skinCanvas.width=skinCanvas.height=1;
  const skinCtx=skinCanvas.getContext('2d');
  skinCtx.drawImage(image,crop.x+crop.width*.48,crop.y+crop.height*.6,Math.max(1,crop.width*.04),Math.max(1,crop.height*.04),0,0,1,1);
  const skinPixel=skinCtx.getImageData(0,0,1,1).data;
  const skin=`rgb(${skinPixel[0]},${skinPixel[1]},${skinPixel[2]})`;
  const layers=await Promise.all(['back','body','front'].map(layer=>imageFromSvg(roleLayerSvg(styleId,layer,skin))));
  ctx.drawImage(layers[0],0,0);ctx.drawImage(layers[1],0,0);
  ctx.save();ctx.beginPath();ctx.ellipse(384,337,151,211,0,0,Math.PI*2);ctx.clip();
  ctx.drawImage(image,crop.x,crop.y,crop.width,crop.height,233,126,302,422);ctx.restore();
  ctx.drawImage(layers[2],0,0);
  if(styleId==='passport') {
    const point=index=>landmarks?.[index]?{x:233+(landmarks[index].x*width-crop.x)/crop.width*302,y:126+(landmarks[index].y*height-crop.y)/crop.height*422}:null;
    const left=point(33)||{x:319,y:331},right=point(263)||{x:449,y:331};
    const eyeY=(left.y+right.y)/2,rx=Math.abs(right.x-left.x)*.32;
    ctx.strokeStyle='#baab89';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(left.x+rx*.35,eyeY,rx,rx*.7,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(right.x-rx*.35,eyeY,rx,rx*.7,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(left.x+rx*1.35,eyeY);ctx.quadraticCurveTo((left.x+right.x)/2,eyeY-9,right.x-rx*1.35,eyeY);ctx.stroke();
  }
  ctx.strokeStyle='#b89a655e';ctx.lineWidth=2;ctx.strokeRect(23,23,722,914);
  return canvas.toDataURL('image/jpeg',.92);
}
