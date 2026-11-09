import * as THREE from 'three';

let texture;
function floorTexture() {
  if(texture) return texture;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#0d0906';ctx.fillRect(0,0,512,512);
  for(let i=0;i<24;i++) {
    ctx.beginPath();
    for(let y=0;y<=512;y+=8) {
      const x=(i*97)%640-70+y*.22+Math.sin(y*.024+i*3)*18;
      if(y===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=i%4===0?'#99703f':'#3d2b18';ctx.lineWidth=i%4===0?.8:.4;ctx.stroke();
  }
  texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  return texture;
}

export function createBlackMarbleFloor() {
  const material=new THREE.MeshBasicMaterial({map:floorTexture()});
  material.onBeforeCompile=shader=>{
    shader.vertexShader='varying vec2 vMarbleWorldUv;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvMarbleWorldUv=(modelMatrix*vec4(transformed,1.0)).xz/vec2(5.2,151.0/30.0);');
    shader.fragmentShader='varying vec2 vMarbleWorldUv;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
      '#ifdef USE_MAP\ndiffuseColor*=texture2D(map,vMarbleWorldUv);\n#endif');
  };
  // 151 units is the loop translation; matching its period avoids a UV jump at wrap.
  material.customProgramCacheKey=()=> 'sharedBlackMarbleWorldUv-v1';
  return material;
}
