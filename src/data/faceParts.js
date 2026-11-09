// Original vector sketches for the assembly experiment. Replace or extend here.
const pair=(left,right=left)=>`<g>${left}</g><g transform="translate(0 0) scale(-1 1)">${right}</g>`;
const eye=(path)=>pair(`<path d="${path}" fill="#f1e9d9"/><ellipse cx="-53" cy="0" rx="10" ry="12" fill="#756d62"/><circle cx="-53" cy="0" r="5" fill="#302b27"/><circle cx="-50" cy="-4" r="2" fill="#fff9ed"/>`);
export const FACE_PARTS=[
 {id:'head',label:'Face shape',x:200,y:238,box:[-121,-178,242,356],options:[
  {label:'Oval',svg:'<path d="M-103-98C-99-192 99-192 103-98C128-9 94 132 0 173C-94 132-128-9-103-98Z" fill="#d7cbbb"/><path d="M-94-47Q-78 29-65 56M94-47Q78 29 65 56" stroke="#a49989" stroke-width="1"/>'},
  {label:'Angular',svg:'<path d="M-108-108Q0-201 108-108L104 34L75 123L28 163H-28L-75 123L-104 34Z" fill="#d4c7b5"/><path d="M-101 26L-66 82M101 26L66 82" stroke="#a49989"/>'},
  {label:'Round',svg:'<path d="M-114-92C-118-181 118-181 114-92C150 24 104 145 0 155C-104 145-150 24-114-92Z" fill="#ded3c2"/><path d="M-103 19Q-85 51-72 59M103 19Q85 51 72 59" stroke="#a49989"/>'}]},
 {id:'brows',label:'Eyebrows',x:200,y:175,box:[-91,-20,182,40],options:[
  {label:'Soft arch',svg:pair('<path d="M-85 2Q-58-20-25-4L-26 2Q-59-9-85 7Z" fill="#51473d"/>')},
  {label:'Straight',svg:pair('<path d="M-86-5L-28-5L-26 3L-84 4Z" fill="#51473d"/>')},
  {label:'High arch',svg:pair('<path d="M-87 8L-63-12Q-43-16-25-3L-26 5Q-46-6-62-4Z" fill="#51473d"/>')}]},
 {id:'eyes',label:'Eyes',x:200,y:207,box:[-89,-20,178,40],options:[
  {label:'Almond',svg:eye('M-85 0Q-56-27-23 0Q-54 23-85 0Z')},
  {label:'Wide',svg:eye('M-84 0Q-56-34-24 0Q-54 31-84 0Z')},
  {label:'Narrow',svg:eye('M-85 0Q-55-13-23 0Q-54 14-85 0Z')}]},
 {id:'nose',label:'Nose',x:200,y:262,box:[-32,-48,64,96],options:[
  {label:'Long bridge',svg:'<path d="M-7-44Q-9-11-20 19Q-27 35-9 34Q0 43 9 34Q27 35 20 19Q9-11 7-44" fill="none"/><path d="M-18 31Q-11 25-7 32M7 32Q11 25 18 31"/>'},
  {label:'Broad',svg:'<path d="M-9-40L-14 4Q-39 28-23 38Q-9 41 0 34Q9 41 23 38Q39 28 14 4L9-40" fill="none"/><path d="M-23 30Q-15 22-9 31M9 31Q15 22 23 30"/>'},
  {label:'Short bridge',svg:'<path d="M-6-29Q-4-4-18 13Q-27 29-14 31Q0 42 14 31Q27 29 18 13Q4-4 6-29" fill="none"/><path d="M-17 27L-8 29M8 29L17 27"/>'}]},
 {id:'mouth',label:'Mouth',x:200,y:329,box:[-57,-25,114,50],options:[
  {label:'Closed',svg:'<path d="M-52 0Q-22-10 0-6Q22-10 52 0Q22 27 0 20Q-22 27-52 0Z" fill="#b49b8e"/><path d="M-52 0Q-22 7 0 2Q22 7 52 0" fill="none"/>'},
  {label:'Full',svg:'<path d="M-51 0Q-18-23 0-11Q18-23 51 0Q19 33 0 25Q-19 33-51 0Z" fill="#b49b8e"/><path d="M-51 0Q0 10 51 0" fill="none"/>'},
  {label:'Slight smile',svg:'<path d="M-52-7Q0 14 52-7Q29 30 0 22Q-29 30-52-7Z" fill="#b49b8e"/><path d="M-52-7Q0 14 52-7" fill="none"/>'}]},
];
