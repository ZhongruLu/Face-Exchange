import * as THREE from 'three';
import { buildChamber, ROOM_DESIGNS } from './spatialArchitecture.js';
import { createLiveFace } from './liveFace.js';

export function createSpatialRooms({ scene, camera, renderer, mount, doors, stations, onCaptureComplete }) {
  const chambers = new Map();
  const ui = document.createElement('div');
  ui.className = 'spatial-ui';
  mount.append(ui);
  let viewportWidth = 1, viewportHeight = 1;
  let activeIndex = -1;
  let portraitUrl = '';
  const loader = new THREE.TextureLoader();
  let portraitTexture = null;

  function prepare(index) {
    if (chambers.has(index)) return chambers.get(index);
    const door = doors[index];
    const group = buildChamber(index);
    group.position.set(door.position.x, 0, door.position.z);
    group.rotation.y = door.userData.side === 0 ? 0 : -door.userData.side * Math.PI / 2;
    group.visible = false;
    group.userData.reflection.visible = false;
    scene.add(group);
    const cssGroup = { visible: false };
    const element = document.querySelector(`[data-room="${stations[index].view}"]`);
    let consoleObject = null;
    if (element) {
      element.classList.add('spatial-console');
      consoleObject = (group.userData.auctionArena || group.userData.faceWaterfall || group.userData.finalReflection) ? null : { element, scale: 0.006, width: 1000, height: 720 };
      element.style.transformOrigin = '0 0';
      element.style.display = 'none';
      ui.append(element);
    }
    const room = { group, cssGroup, consoleObject, index };
    if (index === 2) room.liveFace = createLiveFace({ renderer, camera, exhibit: group.userData.exhibit, mount, onCaptureComplete });
    chambers.set(index, room);
    resizeConsole(room);
    updatePortrait(room);
    return room;
  }

  function resizeConsole(room) {
    if (!room.consoleObject) return;
    room.consoleObject.scale = 0.006;
    room.consoleObject.width = 1000;
    room.consoleObject.height = 720;
    room.consoleObject.element.style.width = `${room.consoleObject.width}px`;
    room.consoleObject.element.style.height = `${room.consoleObject.height}px`;
  }

  function updatePortrait(room) {
    const portrait = room.group.getObjectByName('PortraitDisplay');
    if (!portrait || !portraitTexture) return;
    if (!portrait.userData.personalMaterial) {
      portrait.material = portrait.material.clone();
      portrait.userData.personalMaterial = true;
    }
    portrait.material.map = portraitTexture;
    portrait.material.color.set(0xffffff);
    portrait.material.metalness = 0.08;
    portrait.material.needsUpdate = true;
    room.group.getObjectByName('PortraitSilhouetteHead').visible = false;
    room.group.getObjectByName('PortraitSilhouetteShoulders').visible = false;
  }

  function preview(index) {
    const room = prepare(index);
    chambers.forEach(entry => {
      entry.group.visible = entry === room;
      entry.group.userData.reflection.visible = false;
      entry.cssGroup.visible = false;
    });
    return room;
  }

  function activate(index) {
    chambers.forEach(entry => entry.liveFace?.deactivate());
    activeIndex = index;
    const room = preview(index);
    room.group.userData.reflection.visible = true;
    room.cssGroup.visible = index===1 || index===2;
    ui.dataset.activeRoom = stations[index].view;
    room.liveFace?.activate();
    room.group.userData.startAuction?.();
    if(room.group.userData.faceWaterfall) room.group.userData.floatPaused=false;
    room.group.userData.refreshArchive?.();
    return room;
  }

  function hide() {
    activeIndex = -1;
    document.querySelector('[data-face-inspector]').hidden=true;
    chambers.forEach(room => {
      room.liveFace?.deactivate();
      room.group.visible = false;
      room.cssGroup.visible = false;
    });
    delete ui.dataset.activeRoom;
  }

  function worldPoint(index, x, y, z) {
    const room = prepare(index);
    room.group.updateMatrixWorld(true);
    return room.group.localToWorld(new THREE.Vector3(x, y, z));
  }

  function toggleExhibit() {
    const room = chambers.get(activeIndex);
    if (!room) return false;
    if(room.group.userData.faceWaterfall){const data=room.group.userData;data.floatPaused=!data.floatPaused;return data.floatPaused;}
    if (room.liveFace) return room.liveFace.toggleDemo();
    return false;
  }

  function update(delta, time, reducedMotion) {
    chambers.forEach(room => {
      if (!room.group.visible) return;
      room.liveFace?.update(delta, time, reducedMotion);
      const data = room.group.userData;
      data.updateArena?.(time, reducedMotion, camera);
      data.updateWaterfall?.(time, reducedMotion);
      const active = data.activeExhibit;
      const amount = reducedMotion ? 0 : active ? 1 : 0.15;
      data.accentLight.intensity += ((active ? 8 : 4) - data.accentLight.intensity) * Math.min(1, delta * 3);
      for (const [i, object] of data.animated.entries()) {
        if (data.design.kind === 'index') object.scale.y = 1 + Math.sin(time * 1.4 + i) * 0.18 * amount;
        else if (data.design.kind === 'auction' && object.userData.baseY) object.position.y = object.userData.baseY + Math.sin(time + i) * 0.23 * amount;
        else if (object === data.exhibit) object.rotation.y += delta * 0.2 * amount;
        else object.rotation.y += delta * (0.18 + i * 0.04) * amount;
      }
    });
  }

  // Project the physical screen's four corners into a single DOM homography.
  // This retains the camera's perspective while keeping browser hit-testing on
  // one flat layer, including WebKit and embedded browsers.
  function renderConsole(room) {
    const panel = room.consoleObject;
    if (!panel) return;
    if (!room.cssGroup.visible || !room.group.visible) {
      panel.element.style.display = 'none';
      return;
    }
    const halfW = panel.width * panel.scale / 2;
    const halfH = panel.height * panel.scale / 2;
    const points = [[-halfW, halfH], [halfW, halfH], [halfW, -halfH], [-halfW, -halfH]].map(([x, y]) => {
      const p = worldPoint(room.index, x, 3.85 + y, -13.88).project(camera);
      return { x: (p.x + 1) * viewportWidth / 2, y: (1 - p.y) * viewportHeight / 2, z: p.z };
    });
    if (points.some(p => p.z > 1 || p.z < -1)) { panel.element.style.display = 'none'; return; }
    const [p0, p1, p2, p3] = points;
    const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
    const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;
    const denominator = dx1 * dy2 - dx2 * dy1;
    if (Math.abs(denominator) < 0.001) { panel.element.style.display = 'none'; return; }
    const g = (dx3 * dy2 - dx2 * dy3) / denominator;
    const h = (dx1 * dy3 - dx3 * dy1) / denominator;
    const a = (p1.x - p0.x + g * p1.x) / panel.width;
    const b = (p3.x - p0.x + h * p3.x) / panel.height;
    const d = (p1.y - p0.y + g * p1.y) / panel.width;
    const e = (p3.y - p0.y + h * p3.y) / panel.height;
    panel.element.style.display = 'block';
    panel.element.style.transform = `matrix3d(${a},${d},0,${g / panel.width},${b},${e},0,${h / panel.height},0,0,1,0,${p0.x},${p0.y},0,1)`;
  }

  return {
    prepare, preview, activate, hide, worldPoint, toggleExhibit,
    designs: ROOM_DESIGNS,
    setConsoleVisible(visible) {
      const room = chambers.get(activeIndex);
      if (room) {room.cssGroup.visible = visible;room.liveFace?.setConsoleFocused(visible);}
    },
    inspectFace(data) {
      const panel=document.querySelector('[data-face-inspector]');
      panel.querySelector('img').src=data.preview?.toDataURL('image/png')||data.record.image;
      panel.querySelector('[data-face-price]').textContent=data.record.price===null?'NOT SOLD':`${data.record.price.toLocaleString()} RMB`;
      panel.querySelector('[data-face-source]').textContent=`SOURCE ${data.record.id.slice(0,8)} · ${data.effect}`;
      panel.querySelector('[data-face-date]').textContent=data.record.soldAt?`SOLD ${new Date(data.record.soldAt).toLocaleString()}`:'No completed auction has been recorded for this upload.';
      panel.hidden=false;
      panel.querySelector('button').focus({preventScroll:true});
    },
    hoverFace(hit){const data=chambers.get(activeIndex)?.group.userData;if(data?.faceWaterfall)data.hoveredFace=hit?.object||null;},
    activeHits() { return chambers.get(activeIndex)?.group.userData.hits || []; },
    resize(width, height) {
      viewportWidth = width;
      viewportHeight = height;
      chambers.forEach(resizeConsole);
    },
    update,
    render() { chambers.forEach(renderConsole); },
    setAuctionBase(value) { prepare(4).group.userData.setAuctionBase(value); },
    setPortrait(url) {
      if (url === portraitUrl) return;
      portraitUrl = url || '';
      if (!url) {
        portraitTexture?.dispose();
        portraitTexture = null;
        chambers.forEach(room => {
          const portrait = room.group.getObjectByName('PortraitDisplay');
          if (!portrait?.userData.personalMaterial) return;
          portrait.material.map = null;
          portrait.material.color.set(room.group.userData.design.stone);
          portrait.material.needsUpdate = true;
          room.group.getObjectByName('PortraitSilhouetteHead').visible = true;
          room.group.getObjectByName('PortraitSilhouetteShoulders').visible = true;
        });
        return;
      }
      loader.load(url, texture => {
        if (url !== portraitUrl) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        portraitTexture?.dispose();
        portraitTexture = texture;
        chambers.forEach(updatePortrait);
      });
    },
    dispose() {
      chambers.forEach(room => {
        room.liveFace?.dispose();
        room.group.userData.disposeArchive?.();
        room.group.userData.disposeArena?.();
        room.group.userData.reflection.dispose();
        room.group.traverse(child => { if (child.isMesh) child.geometry.dispose(); });
      });
      portraitTexture?.dispose();
      ui.remove();
    },
  };
}
