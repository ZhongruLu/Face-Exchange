import * as THREE from 'three';

// Keep positions/topology unchanged. Normals and UVs need less precision than positions.
export function compactModelGeometry(root) {
  const geometries=new Set();
  root.traverse(obj=>{if(obj.isMesh) geometries.add(obj.geometry);});
  let before=0,after=0;
  for(const geometry of geometries) {
    const bytes=()=>Object.values(geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(geometry.index?.array.byteLength||0);
    before+=bytes();
    const normal=geometry.getAttribute('normal');
    if(normal?.array instanceof Float32Array) {
      const packed=new Int16Array(normal.count*3);
      for(let i=0;i<normal.count;i++) for(let c=0;c<3;c++) packed[i*3+c]=Math.round(THREE.MathUtils.clamp(normal.getComponent(i,c),-1,1)*32767);
      geometry.setAttribute('normal',new THREE.BufferAttribute(packed,3,true));
    }
    const uv=geometry.getAttribute('uv');
    if(uv?.array instanceof Float32Array) {
      let inRange=true;
      for(let i=0;i<uv.count&&inRange;i++) inRange=uv.getX(i)>=0&&uv.getX(i)<=1&&uv.getY(i)>=0&&uv.getY(i)<=1;
      if(inRange) {
        const packed=new Uint16Array(uv.count*2);
        for(let i=0;i<uv.count;i++){packed[i*2]=Math.round(uv.getX(i)*65535);packed[i*2+1]=Math.round(uv.getY(i)*65535);}
        geometry.setAttribute('uv',new THREE.BufferAttribute(packed,2,true));
      }
    }
    const index=geometry.index;
    if(index?.array instanceof Uint32Array) {
      let max=0;for(const value of index.array) max=Math.max(max,value);
      if(max<=65535) geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(index.array),1));
    }
    after+=bytes();
  }
  return {before,after,saved:before-after};
}

export function releaseUnusedPbrMaps(root) {
  const removed=new Set(),used=new Set();
  root.traverse(obj=>{
    if(!obj.isMesh) return;
    for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])) {
      for(const key of ['roughnessMap','metalnessMap']) {if(mat[key]) removed.add(mat[key]);mat[key]=null;}
      for(const value of Object.values(mat)) if(value?.isTexture) used.add(value);
    }
  });
  const usedImages=new Set([...used].map(t=>t.source.data)),closed=new Set();
  for(const texture of removed) if(!used.has(texture)) {
    texture.dispose();
    const image=texture.source.data;
    if(!usedImages.has(image)&&!closed.has(image)){image?.close?.();closed.add(image);}
  }
}

export function releaseGeometry(root) {
  const geometries=new Set();root.traverse(obj=>{if(obj.geometry) geometries.add(obj.geometry);});
  for(const geometry of geometries) geometry.dispose();
  root.removeFromParent();
}

export function releaseModel(root,skip=null) {
  const geometries=new Set(),materials=new Set(),textures=new Set(),images=new Set();
  root.traverse(obj=>{
    if(obj===skip) return;
    if(obj.geometry) geometries.add(obj.geometry);
    if(obj.material) for(const mat of (Array.isArray(obj.material)?obj.material:[obj.material])) materials.add(mat);
  });
  for(const mat of materials) for(const value of Object.values(mat)) if(value?.isTexture) textures.add(value);
  for(const texture of textures){texture.dispose();images.add(texture.source.data);}
  for(const image of images) image?.close?.();
  for(const geometry of geometries) geometry.dispose();
  for(const mat of materials) mat.dispose();
  root.removeFromParent();
}
