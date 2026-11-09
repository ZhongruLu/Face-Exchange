import * as THREE from 'three';

// Calibrated in source-image pixels; a fixed eye height is shared by every phase.
export const EYE_Y = 4.15;
export const GATE_Z = 5.45;
const WALL_Z = -0.34;
const W = 1672, H = 941;
const x = p => (p / W - 0.5) * 16;
const y = p => EYE_Y + (0.5 - p / H) * 9;

export function createEntrance() {
  const group = new THREE.Group();
  group.position.z = GATE_Z;
  const loader = new THREE.TextureLoader();
  const load = path => { const t = loader.load(path); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const source = load('/assets/entrance/face-exchange-entrance.png');
  const base = load('/assets/entrance/layers/entrance_architecture_base.png');
  const uniforms = { time: {value:0}, pointer: {value:0}, strength: {value:1} };
  const architecture = new THREE.MeshBasicMaterial({map:base, toneMapped:false, fog:false, side:THREE.DoubleSide});
  architecture.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = 'uniform float time; uniform float pointer; uniform float strength;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      vec2 pixel = vec2(vMapUv.x * 1672.0, (1.0-vMapUv.y)*941.0);
      float roof = 450.0 - sqrt(max(0.0, 162.0*162.0-pow(pixel.x-837.0,2.0)));
      if (pixel.x>675.0 && pixel.x<999.0 && pixel.y>roof && pixel.y<760.0) discard;
      if (pixel.y>=758.0 && abs(pixel.x-836.0)<112.0+(pixel.y-758.0)*1.65) discard;
      float columns = exp(-pow((pixel.x-507.0)/35.0,2.0)) + exp(-pow((pixel.x-1166.0)/35.0,2.0));
      float sweep = pow(max(0.0,sin(pixel.y*0.013-time*0.75+pointer*1.4)),18.0);
      float gold = smoothstep(0.08,0.3,diffuseColor.r-diffuseColor.b);
      diffuseColor.rgb += vec3(0.24,0.17,0.065)*columns*sweep*gold*strength;
    `);
  };
  // The wall ends at the threshold; its carpet is not drawn a second time.
  const wallGeo = new THREE.PlaneGeometry(16, 9);
  const wall = new THREE.Mesh(wallGeo,architecture);
  wall.position.set(0,EYE_Y,WALL_Z);
  group.add(wall);

  // Reverse-project the photographed floor onto a horizontal, subdivided mesh.
  // At the initial viewpoint its UVs match the photo, but its perspective changes
  // physically as the camera walks over it (no image scaling or FOV animation).
  const floorGeo = new THREE.PlaneGeometry(16,9,40,40);
  const pos = floorGeo.attributes.position, floorUV = floorGeo.attributes.uv;
  const eyeZ = 14.5-GATE_Z, distance = eyeZ-WALL_Z, ground = y(758);
  for(let i=0;i<pos.count;i++) {
    const u=floorUV.getX(i), v=floorUV.getY(i);
    const py=758+(1-v)*(H-758), ratio=(EYE_Y-ground)/(EYE_Y-y(py));
    pos.setXYZ(i,x(u*W)*ratio,ground,eyeZ-distance*ratio);
    floorUV.setXY(i,u,1-py/H);
  }
  floorGeo.computeVertexNormals();
  const carpetMaterial=new THREE.MeshBasicMaterial({map:source,toneMapped:false,fog:false,side:THREE.DoubleSide});
  carpetMaterial.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
      #include <map_fragment>
      vec2 pixel=vec2(vMapUv.x*1672.0,(1.0-vMapUv.y)*941.0);
      if(abs(pixel.x-836.0)>145.0+(pixel.y-758.0)*1.9) discard;
    `);
  };
  const floor=new THREE.Mesh(floorGeo,carpetMaterial);
  floor.name='projectedMarbleAndCarpetFloor'; group.add(floor);
  // The gallery is visible through the opening before its 3D geometry can be
  // safely revealed. This short, cropped view replaces the old carpet strip in
  // an otherwise black void; it disappears as the camera crosses the threshold.
  const galleryView = load('/assets/textures/corridor/corridor_reference.png');
  galleryView.wrapS = THREE.ClampToEdgeWrapping;
  galleryView.repeat.set(0.36, 1);
  galleryView.offset.x = 0.32;
  const doorwayView = new THREE.Mesh(
    new THREE.PlaneGeometry(3.14, 4.55),
    new THREE.MeshBasicMaterial({ map: galleryView, toneMapped: false, fog: false, side: THREE.DoubleSide }),
  );
  doorwayView.position.set(0, 3.67, WALL_Z - 0.8);
  group.add(doorwayView);

  const makeDoor=side=>{
    const hinge=side<0?675:999, seam=837, bottom=758;
    const shape=new THREE.Shape();
    shape.moveTo(x(hinge),y(bottom)); shape.lineTo(x(seam),y(bottom));
    shape.lineTo(x(seam),y(288));
    for(let i=1;i<=32;i++) {
      const px=seam+side*162*i/32;
      shape.lineTo(x(px),y(450-Math.sqrt(Math.max(0,162**2-(px-seam)**2))));
    }
    shape.closePath();
    const geometry=new THREE.ShapeGeometry(shape);
    const p=geometry.attributes.position, u=geometry.attributes.uv;
    for(let i=0;i<p.count;i++) u.setXY(i,p.getX(i)/16+0.5,(p.getY(i)-EYE_Y)/9+0.5);
    geometry.translate(-x(hinge),0,0);
    const face=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:source,side:THREE.DoubleSide,toneMapped:false,fog:false}));
    const depth=new THREE.ExtrudeGeometry(shape,{depth:0.045,bevelEnabled:false,steps:1});
    depth.translate(-x(hinge),0,-0.05);
    const edge=new THREE.Mesh(depth,new THREE.MeshBasicMaterial({color:0x593912}));
    const pivot=new THREE.Group(); pivot.position.set(x(hinge),0,WALL_Z+0.025); pivot.add(edge,face); group.add(pivot);
    return pivot;
  };
  const leftDoorPivot=makeDoor(-1),rightDoorPivot=makeDoor(1);
  const hit=new THREE.Mesh(new THREE.PlaneGeometry(3.1,4.5),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  hit.position.set(0,3.65,0.1); hit.userData.isEntranceHit=true; group.add(hit);
  // Warm light sits inside the opening; there is no second visible door frame.
  const glow=new THREE.PointLight(0xffc46d,0.5,8,2); glow.position.set(0,4,-1.7); group.add(glow);
  group.userData={leftDoorPivot,rightDoorPivot,hit,glow,uniforms,doorwayView};
  return group;
}
