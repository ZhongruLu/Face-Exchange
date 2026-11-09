import * as THREE from 'three';

// One GPU draw for the entire hall. No per-particle objects or frame allocations.
export function createCorridorParticles({ world, mount, length, reducedMotion = false }) {
  const count = window.matchMedia('(max-width: 700px)').matches ? 1000 : 2400;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  let randomState = 5173;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  for (let i = 0; i < count; i++) {
    positions.set([(random() - .5) * 8.1, .45 + random() * 5.5, 3 - random() * length], i * 3);
    seeds.set([random(), random(), random(), random()], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('seed', new THREE.BufferAttribute(seeds, 4));
  const uniforms = { time: { value: 0 }, pixelScale: { value: 600 } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, toneMapped: false,
    vertexShader: `
      attribute vec4 seed;
      uniform float time;
      uniform float pixelScale;
      varying vec4 vSeed;
      varying float vFade;
      varying float vGlint;
      void main() {
        vSeed = seed;
        vec3 p = position;
        p.x += sin(time * .14 + seed.x * 31.) * .24;
        p.y += sin(time * .19 + seed.y * 27.) * .22;
        p.z += sin(time * .12 + seed.z * 23.) * .32;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        float distanceToEye = -mv.z;
        float flake = step(.82, seed.w);
        float size = mix(.042 + seed.x * .045, .15 + seed.x * .10, flake);
        gl_PointSize = clamp(size * pixelScale / max(1., distanceToEye), 1., 25.);
        gl_Position = projectionMatrix * mv;
        vFade = smoothstep(.65, 2.4, distanceToEye) * (1. - smoothstep(22., 52., distanceToEye));
        vGlint = pow(max(0., sin(time * (.65 + seed.y * .4) + seed.x * 53.)), 18.);
      }`,
    fragmentShader: `
      uniform float time;
      varying vec4 vSeed;
      varying float vFade;
      varying float vGlint;
      void main() {
        vec2 uv = gl_PointCoord - .5;
        float flake = step(.82, vSeed.w);
        float angle = time * (.10 + vSeed.x * .16) + vSeed.y * 6.283;
        uv = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * uv;
        float radius = length(uv);
        float dust = exp(-radius * radius * 32.);
        vec2 leaf = abs(uv) / vec2(.38, .15 + .09 * abs(sin(angle)));
        float foil = 1. - smoothstep(.7, 1., leaf.x + leaf.y);
        float rays = exp(-abs(uv.x) * 70.) * exp(-abs(uv.y) * 8.)
                   + exp(-abs(uv.y) * 70.) * exp(-abs(uv.x) * 8.);
        float alpha = mix(dust * .55, foil * .85, flake);
        alpha += rays * vGlint * .55 * step(.94, vSeed.w);
        alpha *= vFade * (.60 + vGlint * .70);
        if (alpha < .012) discard;
        vec3 gold = mix(vec3(.82, .46, .12), vec3(1., .89, .60), vSeed.z * .6 + vGlint * .4);
        gl_FragColor = vec4(gold, alpha);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.name = 'CorridorGoldDust';
  // Shader movement is small, but keep the CPU bound conservative for frustum culling.
  geometry.computeBoundingSphere(); geometry.boundingSphere.radius += .6;
  points.raycast = () => {}; // Atmospheric particles never intercept the artwork's hit tests.
  world.add(points);
  const button = mount.closest('[data-app]')?.querySelector('[data-pause-corridor-particles]');
  let paused = reducedMotion;
  function syncButton() {
    if (!button) return;
    button.textContent = paused ? 'RESUME AIR PARTICLES' : 'PAUSE AIR PARTICLES';
    button.setAttribute('aria-pressed', String(paused));
  }
  const toggle = () => { paused = !paused; syncButton(); };
  button?.addEventListener('click', toggle); syncButton();
  return {
    update(delta, camera, renderer, visible) {
      points.visible = visible;
      if (!visible) return;
      if (!paused && !document.hidden) uniforms.time.value += delta;
      uniforms.pixelScale.value = renderer.domElement.height * camera.projectionMatrix.elements[5] * .5;
    },
    dispose() {
      button?.removeEventListener('click', toggle);
      world.remove(points); geometry.dispose(); material.dispose();
    },
  };
}
