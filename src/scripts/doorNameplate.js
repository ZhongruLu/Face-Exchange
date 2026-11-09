import * as THREE from 'three';
import {translate,onLanguageChange} from './language.js';

// Painted once per language; the gold sweep runs on the GPU, not on the canvas.
export function createDoorNameplate(text,index=0) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;
  const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const gold=()=>{const g=ctx.createLinearGradient(0,30,0,220);for(const [p,c] of [[0,'#fff0b5'],[.27,'#bd812b'],[.48,'#ffe8a0'],[.64,'#9d601c'],[.85,'#e9b65a'],[1,'#fff0bd']])g.addColorStop(p,c);return g;};
  const draw=()=>{
    ctx.clearRect(0,0,1024,256);ctx.lineJoin='round';
    // Scalloped cartouche with double engraved borders.
    const outline=new Path2D('M160 53 Q115 53 112 87 Q65 91 55 128 Q65 165 112 169 Q115 203 160 203 L435 203 Q475 204 512 231 Q549 204 589 203 L864 203 Q909 203 912 169 Q959 165 969 128 Q959 91 912 87 Q909 53 864 53 L589 53 Q549 52 512 25 Q475 52 435 53 Z');
    const ground=ctx.createLinearGradient(0,50,0,210);ground.addColorStop(0,'#301b0e');ground.addColorStop(.55,'#120c08');ground.addColorStop(1,'#39200d');
    ctx.fillStyle=ground;ctx.fill(outline);ctx.strokeStyle=gold();ctx.lineWidth=10;ctx.shadowColor='#edba55';ctx.shadowBlur=10;ctx.stroke(outline);ctx.shadowBlur=0;
    ctx.save();ctx.translate(512,128);ctx.scale(.96,.86);ctx.translate(-512,-128);ctx.lineWidth=2;ctx.stroke(outline);ctx.restore();
    // Paired rococo scrolls, leaf tips and a central jewel.
    for(const side of [-1,1]){ctx.save();ctx.translate(side<0?0:1024,0);ctx.scale(side<0?1:-1,1);ctx.strokeStyle=gold();ctx.lineWidth=3;
      for(const y of [82,174]){const sign=y<128?-1:1;ctx.beginPath();ctx.moveTo(134,y);ctx.bezierCurveTo(170,y+sign*38,230,y+sign*20,253,y);ctx.bezierCurveTo(206,y+sign*13,174,y-sign*4,164,y-sign*10);ctx.stroke();}
      ctx.fillStyle=gold();for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(100+i*17,124-i*14,5,15,-.8,0,Math.PI*2);ctx.fill();}ctx.restore();}
    ctx.fillStyle=gold();ctx.beginPath();ctx.moveTo(512,12);ctx.lineTo(523,30);ctx.lineTo(512,47);ctx.lineTo(501,30);ctx.closePath();ctx.fill();
    const title=translate(text);let size=/[\u3400-\u9fff]/.test(title)?78:66;
    const font=()=>`500 ${size}px 'Bodoni Moda', 'Songti SC', 'Noto Serif CJK SC', serif`;ctx.font=font();
    while(ctx.measureText(title).width>690&&size>32){size--;ctx.font=font();}
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#704013';ctx.fillText(title,513,133);
    ctx.fillStyle=gold();ctx.shadowColor='#eeb952';ctx.shadowBlur=5;ctx.fillText(title,512,129);ctx.shadowBlur=0;
    texture.needsUpdate=true;
  };
  draw();const unsubscribe=onLanguageChange(draw);let disposed=false;
  Promise.all([
    document.fonts?.load('500 66px "Bodoni Moda"'),
    document.fonts?.ready,
  ]).then(()=>{if(!disposed)draw();});
  const clock={value:index*.83};
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,alphaTest:.015,depthWrite:false,toneMapped:false});
  material.onBeforeCompile=shader=>{
    shader.uniforms.nameplateTime=clock;
    shader.fragmentShader='uniform float nameplateTime;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float goldMask=smoothstep(.16,.52,diffuseColor.r)*smoothstep(.07,.25,diffuseColor.r-diffuseColor.b);
      float sweep=exp(-pow((vMapUv.x+vMapUv.y*.16-mod(nameplateTime*.13,1.5)+.2)/.055,2.));
      float glitter=pow(max(0.,sin(nameplateTime*1.7+vMapUv.x*37.)),20.)*pow(max(0.,sin(vMapUv.y*47.+vMapUv.x*19.)),18.);
      diffuseColor.rgb+=vec3(1.,.78,.36)*goldMask*(sweep*.65+glitter*.35);
    `);
  };
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.95),material);mesh.name='OrnateDoorNameplate';
  mesh.userData.updateNameplate=(time,reducedMotion)=>{clock.value=reducedMotion?index*.83:time+index*.83;};
  mesh.userData.disposeNameplate=()=>{disposed=true;unsubscribe();texture.dispose();material.dispose();mesh.geometry.dispose();};
  return mesh;
}
