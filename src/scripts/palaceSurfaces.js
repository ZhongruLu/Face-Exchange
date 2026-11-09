import * as THREE from 'three';

// Shared textures across the hall, corridor and all lazy-loaded rooms.
// Fixed world-space UVs prevent panels stretching over differently sized walls.
const loader = new THREE.TextureLoader();
const maps = new Map();
const materials = new Map();
function texture(name) {
  if (maps.has(name)) return maps.get(name);
  const value = loader.load(`/assets/materials/palace-v2/${name}.jpg`);
  value.colorSpace = THREE.SRGBColorSpace;
  value.wrapS = value.wrapT = THREE.RepeatWrapping;
  value.anisotropy = 4;
  maps.set(name, value);
  return value;
}

function surface(kind, height) {
  const key = `${kind}-${height}`;
  if (materials.has(key)) return materials.get(key);
  const map = texture(kind === 'wall' ? 'ornate-wall-reference' : 'coffered-ceiling');
  const material = new THREE.MeshStandardMaterial({
    map, color: kind === 'wall' ? 0xffe1b0 : 0xd4ac70,
    metalness: kind === 'wall' ? 0.08 : 0.24,
    roughness: kind === 'wall' ? 0.8 : 0.58,
    envMapIntensity: 0.22,
    emissiveMap: map, emissive: 0xffc46d, emissiveIntensity: kind === 'wall' ? 0.16 : 0.065,
  });
  material.name = kind === 'wall' ? 'MutedRococoWall' : 'MutedCofferedCeiling';
  material.onBeforeCompile = shader => {
    const declarations = 'varying vec2 vPalaceUv;\n';
    shader.vertexShader = declarations + shader.vertexShader;
    shader.fragmentShader = declarations + shader.fragmentShader;
    const uv = kind === 'wall'
      ? `vec3 palaceNormal=normalize(mat3(modelMatrix)*normal);\nfloat palaceU=abs(palaceNormal.z)>0.5?palaceWorld.x:palaceWorld.z;\nvPalaceUv=vec2(palaceU/(${height.toFixed(3)}*(993.0/333.0)),palaceWorld.y/${height.toFixed(3)});`
      : 'vPalaceUv=palaceWorld.xz/(151.0/25.0);';
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\nvec3 palaceWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\n${uv}`);
    // Pixel region x=331..1324, y=178..511 selects uninterrupted wall.
    // Keep the supplied image intact; exclude its black surround and painted door.
    const sampleUv = kind === 'wall'
      ? 'vec2((331.0+fract(vPalaceUv.x)*993.0)/1376.0,(257.0+clamp(vPalaceUv.y,0.0,1.0)*333.0)/768.0)'
      : 'vPalaceUv';
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#ifdef USE_MAP\ndiffuseColor*=texture2D(map,${sampleUv});\n#endif`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', `#ifdef USE_EMISSIVEMAP\ntotalEmissiveRadiance*=texture2D(emissiveMap,${sampleUv}).rgb;\n#endif`);
  };
  material.customProgramCacheKey = () => `palace-ornate-reference-v1-${key}`;
  materials.set(key, material);
  return material;
}

export const palaceWall = (height = 7.6) => surface('wall', height);
export const palaceCeiling = () => surface('ceiling', 1);

let timber;
export function palaceTimber() {
  if (!timber) {
    const map = texture('walnut-beam');
    map.repeat.set(3, 0.35);
    timber = new THREE.MeshStandardMaterial({ map, color: 0xb5a18b, roughness: 0.72, metalness: 0.03, envMapIntensity: 0.15 });
    timber.name = 'ClassicalWalnutTimber';
  }
  return timber;
}
