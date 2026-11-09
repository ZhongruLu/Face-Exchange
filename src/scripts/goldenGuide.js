import * as THREE from 'three';

// Split-layer concept adapted from ITomPoland's MIT Split Text Preloader.
// The scroll and particles are original; all displacement is a pure function
// of camera distance, so reversing the wheel retraces precisely the same path.
export function createGoldenGuide({ scene, camera, mount, reducedMotion }) {
  const group = new THREE.Group();
  group.name = 'FloatingGoldenGuide';
  group.position.set(0, 2.75, -3.1);
  scene.add(group);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xc49131, metalness: 0.88, roughness: 0.28, clearcoat: 0.4, transparent: true });
  const texture = new THREE.TextureLoader().load('/assets/guide/golden-scroll-reference.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;
  // Sample only the photographed gilt sheet, not the black photo backdrop.
  const sheet = texture.clone(); sheet.repeat.set(0.265, 0.70); sheet.offset.set(0.37, 0.15);
  texture.onUpdate = () => { sheet.image = texture.image; sheet.needsUpdate = true; };
  const dissolve = { value: 0 };
  const paperMaterial = new THREE.MeshStandardMaterial({ map: sheet, color: 0xf0ce70, metalness: 0.3, roughness: 0.52, side: THREE.DoubleSide });
  paperMaterial.onBeforeCompile = shader => {
    shader.uniforms.guideProgress = dissolve;
    shader.fragmentShader = 'uniform float guideProgress;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      float edge = abs(vMapUv.x - 0.5025) / 0.1325;
      float noise = fract(sin(dot(floor(vMapUv*650.0),vec2(12.9898,78.233)))*43758.5453);
      if (edge < guideProgress*1.12 - noise*0.08) discard;
    `);
  };
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 4.7, 32, 48), paperMaterial);
  const position = cloth.geometry.attributes.position;
  for (let i = 0; i < position.count; i++) position.setZ(i, -0.04 * Math.cos(position.getY(i)*2));
  cloth.geometry.computeVertexNormals(); group.add(cloth);
  const mesh = (geometry, xyz) => {
    const object = new THREE.Mesh(geometry, gold); object.position.set(...xyz); group.add(object); return object;
  };
  for (const side of [-1, 1]) {
    const rod = mesh(new THREE.CylinderGeometry(0.13,0.13,4.65,40),[0,side*2.39,0]); rod.rotation.z = Math.PI/2;
    for (const x of [-2.48,-2.27,-2.15,2.15,2.27,2.48]) {
      const collar=mesh(new THREE.TorusGeometry(0.15,0.027,10,32),[x,side*2.39,0]); collar.rotation.y=Math.PI/2;
    }
    for (const x of [-2.62,2.62]) mesh(new THREE.SphereGeometry(0.16,24,16),[x,side*2.39,0]);
  }
  for (const x of [-2.12,2.12]) {
    mesh(new THREE.CylinderGeometry(0.018,0.018,1.1,10),[x,1.7,0]);
    mesh(new THREE.ConeGeometry(0.09,0.23,16),[x,1.05,0]);
  }
  const light = new THREE.PointLight(0xffb743, 5, 7, 2); light.position.set(0,3,2); group.add(light);

  const count = 1800, positions = new Float32Array(count*3), seeds = new Float32Array(count), uvs = new Float32Array(count*2);
  for (let i=0;i<count;i++) {
    // Fixed low-discrepancy sampling; do not randomize when scrolling backward.
    const u=((i*0.61803398875)%1), v=((i*0.754877666)%1);
    positions.set([(u-0.5)*4,(v-0.5)*4.7,0.05],i*3);
    uvs.set([0.37+u*0.265,0.15+v*0.7],i*2); seeds[i]=(i*0.381966)%1;
  }
  const particleGeo=new THREE.BufferGeometry();
  particleGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
  particleGeo.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
  particleGeo.setAttribute('seed',new THREE.BufferAttribute(seeds,1));
  const particleMaterial=new THREE.ShaderMaterial({
    uniforms:{progress:dissolve,map:{value:texture}}, transparent:true, depthWrite:false, blending: THREE.AdditiveBlending,
    vertexShader:`
      uniform float progress; attribute float seed; varying float alpha; varying vec2 texUv;
      void main(){
        texUv=uv;
        float threshold=abs(position.x)/2.0;
        float release=smoothstep(threshold*0.82,threshold*0.82+0.18,progress);
        vec3 p=position;
        float direction=position.x<0.0?-1.0:1.0;
        p.x+=direction*release*(0.4+seed*1.8);
        p.y+=sin(seed*26.0)*release*(0.5+progress*1.7);
        p.z+=release*(seed-0.5)*2.2;
        alpha=release*(1.0-smoothstep(0.66,1.0,progress));
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=clamp((3.0+seed*3.0)*12.0/-mv.z,1.5,12.0);
      }`,
    fragmentShader:`
      uniform sampler2D map; varying float alpha; varying vec2 texUv;
      void main(){
        float r=length(gl_PointCoord-0.5);
        if(r>0.5 || alpha<0.01)discard;
        vec3 c=texture2D(map,texUv).rgb;
        gl_FragColor=vec4(c*1.25,alpha*(1.0-smoothstep(0.1,0.5,r)));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const particles=new THREE.Points(particleGeo,particleMaterial); particles.frustumCulled=false; group.add(particles);

  const ui=document.createElement('section'); ui.className='golden-guide';
  ui.setAttribute('aria-label','Facial Auction Hall guest code of conduct'); ui.hidden=true;
  ui.innerHTML=`<div class="guide-print guide-print--conduct">
    <p class="guide-kicker">Facial Auction Hall</p>
    <h2>GUEST CODE<br>OF CONDUCT</h2>
    <p class="guide-welcome"><em>Welcome, Distinguished Guest.</em></p>
    <ol>
      <li><span>I.</span><div><h3>This is Face Exchange.</h3><p>Every face is welcome. Every face has a price.</p></div></li>
      <li><span>II.</span><div><h3>PRESENT YOUR FINEST FACE</h3><p>A fine portrait deserves an even finer owner.</p></div></li>
      <li><span>III.</span><div><h3>ACCEPT YOUR VALUATION</h3><p>Our system will determine your fictional market value. We appreciate your trust.</p></div></li>
      <li><span>IV.</span><div><h3>READ BEFORE YOU SIGN</h3><p>A signature opens many doors. Some may never close.</p></div></li>
      <li><span>V.</span><div><h3>ENJOY YOUR SALE</h3></div></li>
    </ol>
    <div class="guide-final-notice">
      <button type="button" class="guide-fine-print" aria-expanded="false" aria-controls="guide-notice-lens">
        <strong>ALL SALES ARE FINAL.</strong>
        <span>NO RETURNS. NO REFUNDS.</span>
      </button>
      <div class="guide-notice-lens" id="guide-notice-lens" aria-hidden="true">
        <p>IMPORTANT NOTICE</p>
        <strong>ALL SALES ARE FINAL.</strong>
        <span>NO RETURNS. NO REFUNDS.</span>
      </div>
    </div>
  </div>`;
  mount.append(ui);
  const finePrint=ui.querySelector('.guide-fine-print');
  const lens=ui.querySelector('.guide-notice-lens');
  let hovering=false,pinned=false,keyboardFocus=false;
  const syncLens=()=>{
    const open=hovering||pinned||keyboardFocus;
    finePrint.parentElement.classList.toggle('is-magnified',open);
    finePrint.setAttribute('aria-expanded',String(open));
    lens.setAttribute('aria-hidden',String(!open));
  };
  finePrint.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){hovering=true;syncLens();}});
  finePrint.addEventListener('pointerleave',()=>{hovering=false;syncLens();});
  finePrint.addEventListener('focus',()=>{keyboardFocus=finePrint.matches(':focus-visible');syncLens();});
  finePrint.addEventListener('blur',()=>{keyboardFocus=false;pinned=false;syncLens();});
  finePrint.addEventListener('click',event=>{
    event.stopPropagation();
    // Touch and keyboard activation can toggle the lens without a hover state.
    if(!hovering){pinned=!pinned;keyboardFocus=false;syncLens();}
  });
  finePrint.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.stopPropagation();pinned=false;keyboardFocus=false;hovering=false;syncLens();finePrint.blur();}
  });
  let width=1,height=1;
  function project() {
    const panelW=760,panelH=860;
    group.updateMatrixWorld(true);
    const corners=[[-1.7,2.1],[1.7,2.1],[1.7,-2.1],[-1.7,-2.1]].map(([x,y])=>{
      const v=group.localToWorld(new THREE.Vector3(x,y,0.08)).project(camera);
      return {x:(v.x+1)*width/2,y:(1-v.y)*height/2,z:v.z};
    });
    if(corners.some(p=>p.z>1||p.z<-1)){ui.hidden=true;return;}
    const [p0,p1,p2,p3]=corners;
    const dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x;
    const dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
    const den=dx1*dy2-dx2*dy1;if(Math.abs(den)<0.001){ui.hidden=true;return;}
    const g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;
    const a=(p1.x-p0.x+g*p1.x)/panelW,b=(p3.x-p0.x+h*p3.x)/panelH;
    const d=(p1.y-p0.y+g*p1.y)/panelW,e=(p3.y-p0.y+h*p3.y)/panelH;
    ui.hidden=false;
    ui.style.transform=`matrix3d(${a},${d},0,${g/panelW},${b},${e},0,${h/panelH},0,0,1,0,${p0.x},${p0.y},0,1)`;
  }
  return {
    resize(w,h){width=w;height=h;},
    render(visible){
      const raw=THREE.MathUtils.clamp((3.2-camera.position.z)/5.6,0,1);
      const p=THREE.MathUtils.smoothstep(raw,0,1);
      dissolve.value=p;gold.opacity=1-THREE.MathUtils.smoothstep(p,0.05,0.7);
      group.visible=visible&&p<0.999;
      ui.dataset.dissolve=p.toFixed(3);
      ui.style.setProperty('--guide-dissolve',p);
      // Both sides erode toward the edges from the same middle opening.
      const left=(50-p*56),right=(50+p*56);
      ui.style.maskImage=p<0.001?'none':`linear-gradient(to right,black ${Math.max(0,left-3)}%,transparent ${Math.max(0,left)}%,transparent ${Math.min(100,right)}%,black ${Math.min(100,right+3)}%)`;
      ui.style.opacity=String(1-THREE.MathUtils.smoothstep(p,0.4,0.92));
      particles.visible=!reducedMotion;
      if(!group.visible || camera.position.z>5.25){ui.hidden=true;hovering=false;pinned=false;keyboardFocus=false;syncLens();return;}project();
    },
    dispose(){group.traverse(o=>{o.geometry?.dispose();});gold.dispose();paperMaterial.dispose();particleMaterial.dispose();texture.dispose();sheet.dispose();scene.remove(group);ui.remove();},
  };
}
