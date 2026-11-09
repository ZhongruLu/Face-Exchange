import { initLanguage } from './language.js';
import {recordFace,recordSale} from './faceArchive.js';
import { initThreeCorridor } from './threeCorridor.js';
import {HOUSE_STANDARD_KEYS,HOUSE_STANDARD_BAND,VIRTUAL_SCORE_GROUPS,VIRTUAL_SCORE_METRICS,createVirtualScores,averageVirtualScore,virtualAgentBids} from './fictionalValuation.js';
import {createRolePortrait,ROLE_STYLES} from './rolePortrait.js';
import {createFaceReuse} from './faceReuse.js';

const app = document.querySelector('[data-app]');
initLanguage(app);
const corridor = document.querySelector('[data-corridor]');
const threeMount = document.querySelector('[data-three-corridor]');
const fallbackCorridor = document.querySelector('[data-fallback-corridor]');
const doors = Array.from(document.querySelectorAll('[data-fallback-door]'));
const rooms = Array.from(document.querySelectorAll('[data-room]'));
const statusText = document.querySelector('#system-status-text');
const stationReadout = document.querySelector('#station-readout');
const previousDoorButton = document.querySelector('[data-prev-door]');
const nextDoorButton = document.querySelector('[data-next-door]');
const enterActiveButton = document.querySelector('[data-enter-active]');
const enterEntranceButton = document.querySelector('[data-enter-entrance]');
const fullscreenButton = document.querySelector('[data-fullscreen-toggle]');
const fullscreenLabel = document.querySelector('[data-fullscreen-label]');
initSceneAudio(app);
const spatialHud = document.querySelector('[data-spatial-hud]');
const roomExhibitButton = document.querySelector('[data-room-exhibit]');
const roomFeedback = document.querySelector('[data-room-feedback]');

if (fullscreenButton && document.fullscreenEnabled && app.requestFullscreen) {
  fullscreenButton.hidden = false;
  const syncFullscreen = () => {
    const isFullscreen = document.fullscreenElement === app;
    fullscreenButton.setAttribute('aria-pressed', String(isFullscreen));
    fullscreenButton.setAttribute('aria-label', isFullscreen ? 'Exit full screen' : 'Enter full screen');
    fullscreenButton.title = isFullscreen ? 'Exit full screen' : 'Enter full screen';
    fullscreenLabel.textContent = isFullscreen ? 'EXIT FULL SCREEN' : 'FULL SCREEN';
  };
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement === app) await document.exitFullscreen();
      else await app.requestFullscreen();
    } catch (error) {
      setStatus('FULL SCREEN UNAVAILABLE IN THIS BROWSER');
    }
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  syncFullscreen();
}

const video = document.querySelector('#camera-video');
const canvas = document.querySelector('#capture-canvas');
const startCameraButton = document.querySelector('#start-camera');
const takePhotoButton = document.querySelector('#take-photo');
const uploadInput = document.querySelector('#image-upload');
const facePreview = document.querySelector('#face-preview');
const packagePreview = document.querySelector('#package-preview');
const resultPreview = document.querySelector('#result-preview');
const emptyPreview = document.querySelector('#empty-preview');
const cameraMessage = document.querySelector('#camera-message');
const packageNext = document.querySelector('#package-next');
const metadataTags = document.querySelector('#metadata-tags');
const generatorStatus = document.querySelector('#generator-status');
const generatorPlaceholder = document.querySelector('#generator-placeholder');
const generatedResult = document.querySelector('#generated-result');
const valueGrid = document.querySelector('#value-grid');
const auctionMessage = document.querySelector('#auction-message');
const resultPanel = document.querySelector('#result-panel');
const fvuValue = document.querySelector('#fvu-value');
const startAgainButton = document.querySelector('#start-again');

const roomOrder = ['enterRoom', 'submitRoom', 'classifyRoom', 'valueRoom', 'termsRoom', 'soldRoom', 'auctionRoom', 'reflectRoom', 'afterlifeRoom'];

const stations = [
  { view: 'enterRoom', label: 'Introduction' },
  { view: 'submitRoom', label: 'Inspection Room' },
  { view: 'classifyRoom', label: 'Face Swap Room' },
  { view: 'valueRoom', label: 'Valuation Room' },
  { view: 'termsRoom', label: 'Auction Hall' },
  { view: 'soldRoom', label: 'Sale' },
  { view: 'auctionRoom', label: 'Honour' },
  { view: 'reflectRoom', label: 'Reflection' },
  { view: 'afterlifeRoom', label: '', interactive: false },
];

const roomLabels = {
  corridor: 'CORRIDOR HUB',
  enterRoom: 'INTRODUCTION ACTIVE',
  submitRoom: 'SUBMIT ROOM ACTIVE',
  classifyRoom: 'CLASSIFY ROOM ACTIVE',
  valueRoom: 'VALUE ROOM ACTIVE',
  termsRoom: 'COVENANT ROOM ACTIVE',
  auctionRoom: 'AUCTION ROOM ACTIVE',
  soldRoom: 'SALE RECORD ACTIVE',
  afterlifeRoom: 'AFTERLIFE ROOM ACTIVE',
  reflectRoom: 'REFLECT ROOM ACTIVE',
};

const modeData = {
  composite:{label:'Assembled Face',tags:['experimental composite','selected by visitor'],fvu:150},
  nftCollectible: {
    label: 'NFT Collectible Face',
    description: 'Turn your face into a collectible digital asset.',
    buttonLabel: 'Create Collectible Face',
    tags: ['fictional nft style', 'collectible frame', 'rarity parody', 'not a real nft'],
    fvu: 226,
    collection: 'Face Exchange Lot Archive',
  },
  pixelAvatar: {
    label: 'Pixel Avatar Face',
    description: 'Convert your face into a pixel-style avatar.',
    buttonLabel: 'Create Pixel Face',
    tags: ['pixel face asset', 'avatar shop', 'low resolution identity', 'local canvas effect'],
    fvu: 148,
  },
  jobInterview: {
    label: 'Staff Portrait',
    description: 'A work uniform, shirt collar and staff badge.',
    buttonLabel: 'Generate Face Product',
    tags: ['work uniform', 'staff badge', 'staff portrait'],
    fvu: 118,
  },
  passport: {
    label: 'Designer Portrait',
    description: 'A dark turtleneck, glasses and a sketchbook.',
    buttonLabel: 'Generate Face Product',
    tags: ['designer', 'glasses', 'sketchbook'],
    fvu: 142,
  },
  influencer: {
    label: 'Singer Portrait',
    description: 'A stage jacket and a handheld microphone.',
    buttonLabel: 'Generate Face Product',
    tags: ['stage jacket', 'microphone', 'singer'],
    fvu: 207,
  },
  luxury: {
    label: 'Artist Portrait',
    description: 'Long hair, an artist’s smock and paintbrushes.',
    buttonLabel: 'Generate Face Product',
    tags: ['long hair', 'artist smock', 'paintbrushes'],
    fvu: 260,
  },
  algorithm: {
    label: 'Algorithm-Friendly Face',
    description: 'Adjusted for visibility and machine-readable appeal.',
    buttonLabel: 'Generate Face Product',
    tags: ['trend fit', 'machine-readable', 'platform growth', 'recommendation-ready'],
    fvu: 184,
  },
};

const generatedMessages = [
  'Analysing market potential...',
  'Applying identity filter...',
  'Generating face product...',
  'Assigning Face Value Unit...',
];

const state = {
  currentView: 'corridor',
  entranceState: 'outside',
  activeStation: 0,
  lastDoor: 'enterRoom',
  imageUrl: '',
  mode: '',
  generatedImageUrl: '',
  generatedProductId: '',
  generatedFvu: 0,
  values: {},
  stream: null,
  valuesRendered: false,
  pendingCaptureArchive: false,
  auctionSale: null,
};

let wheelLocked = false;
let corridorController = null;
let generationToken = 0;
const faceProcessing=createFaceReuse(document.querySelector('[data-face-reuse]'),{
  onDirty(){generationToken++;packageNext.disabled=true;},
  onApply({url,asset}){
    if(state.pendingCaptureArchive&&state.imageUrl){
      state.pendingCaptureArchive=false;
      recordFace(state.imageUrl).catch(()=>{state.pendingCaptureArchive=true;setStatus('FACE ARCHIVE COULD NOT BE SAVED');});
    }
    generationToken++;state.mode='reuse';state.generatedImageUrl=url;state.generatedProductId=asset;
    state.values=createVirtualScores();state.valuesRendered=false;state.generatedFvu=getAverageValue();
    state.auctionSale=null;updateSaleStamp();
    packagePreview.src=url;packagePreview.hidden=false;resultPreview.src=url;resultPreview.hidden=false;
    corridorController?.setPortrait?.(url);packageNext.disabled=false;
    setStatus('PORTRAIT PREPARED FOR SIMULATED SALE');
  },
});

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setStatus(message) {
  if (statusText) statusText.textContent = message;
}

function hasEnteredCorridor() {
  return state.entranceState === 'inside';
}

function setEntranceState(nextState) {
  state.entranceState = nextState;
  app.dataset.entrance = nextState;
  const entered = hasEnteredCorridor();
  previousDoorButton.disabled = !entered || state.activeStation === 0;
  nextDoorButton.disabled = !entered || state.activeStation === stations.length - 1;
  enterActiveButton.disabled = !entered;
  if (enterEntranceButton) enterEntranceButton.disabled = nextState === 'opening' || entered;

  if (entered) {
    setStatus(`STATION ${stations[state.activeStation].label} READY`);
    return;
  }

  if (nextState === 'ready') setStatus('ENTRANCE GATE READY');
  else if (nextState === 'opening') setStatus('ENTRANCE OPENING');
  else setStatus('APPROACH FACE EXCHANGE ENTRANCE');
}

function stopCamera() {
  if (!state.stream) return;
  state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  video.hidden = true;
  facePreview.hidden = !state.imageUrl;
  emptyPreview.hidden = !!state.imageUrl;
  takePhotoButton.hidden = true;
}

function setInert(element, inert) {
  if (!element) return;
  element.inert = inert;
  element.setAttribute('aria-hidden', inert ? 'true' : 'false');
}

function prepareRoom(view) {
  if (view !== 'submitRoom') stopCamera();
  if (view === 'valueRoom' && !state.valuesRendered) {
    ensureVirtualScores();
    renderValues();
    state.valuesRendered = true;
  }
  if (view === 'auctionRoom') renderAuction();
  if (view === 'soldRoom') renderResult();
}

function getStationIndex(view) {
  return Math.max(0, stations.findIndex((station) => station.view === view));
}

function setActiveStation(index, focusDoor = false, source = 'app') {
  const nextIndex = Math.max(0, Math.min(stations.length - 1, index));
  state.activeStation = nextIndex;
  const activeStation = stations[nextIndex];
  state.lastDoor = activeStation.view;
  app.style.setProperty('--active-station', String(nextIndex));
  app.dataset.activeStation = String(nextIndex);
  document.querySelectorAll('[data-research-stations]').forEach(label => {
    const visible=label.dataset.researchStations.split(',').includes(String(nextIndex));
    label.hidden=!visible;
    if(!visible)label.open=false;
  });
  stationReadout.textContent = activeStation.label;
  previousDoorButton.disabled = !hasEnteredCorridor() || nextIndex === 0;
  nextDoorButton.disabled = !hasEnteredCorridor() || nextIndex === stations.length - 1;
  enterActiveButton.disabled = !hasEnteredCorridor() || activeStation.interactive === false;

  if (source !== 'three' && corridorController && !corridorController.isFallback) {
    corridorController.setActiveStation(nextIndex, false);
  }

  doors.forEach((door) => {
    const station = Number(door.dataset.station);
    const distance = station - nextIndex;
    door.style.setProperty('--station-distance', String(distance));
    door.classList.toggle('is-active-door', distance === 0);
    door.classList.toggle('is-near-door', Math.abs(distance) === 1);
    door.classList.toggle('is-far-door', Math.abs(distance) > 1);
    door.tabIndex = distance === 0 ? 0 : -1;
  });

  if (focusDoor && state.currentView === 'corridor') {
    if (corridorController?.isFallback) {
      document.querySelector(`[data-fallback-door][data-station="${nextIndex}"]`)?.focus({ preventScroll: true });
    } else {
      threeMount.focus({ preventScroll: true });
    }
  }

  if (hasEnteredCorridor()) setStatus(`STATION ${activeStation.label} READY`);
}

function moveStation(direction) {
  if (state.currentView !== 'corridor' || !hasEnteredCorridor()) return;
  setActiveStation(state.activeStation + direction, true);
}

function setCurrentView(view, focusRoom = true) {
  state.currentView = view;
  if(view!=='termsRoom')document.querySelector('[data-auction-guide]').hidden=true;
  app.dataset.view = view;
  const onward=document.querySelector('[data-journey-next]');
  onward.hidden=!['soldRoom','auctionRoom'].includes(view);
  onward.dataset.destination=view==='soldRoom'?'auctionRoom':'reflectRoom';
  onward.querySelector('[data-journey-note]').textContent=view==='soldRoom'?'The sale is recorded. See what happens to the copies.':'There is more after the archive. What control would you want to keep?';
  onward.querySelector('button').textContent=view==='soldRoom'?'Follow the copies →':'Continue to Reflection →';
  const spatialRoom = Boolean(corridorController?.isSpatial && view !== 'corridor');
  app.classList.toggle('is-spatial-room', spatialRoom);
  threeMount.setAttribute('aria-label', spatialRoom ? `Interactive 3D ${corridorController.roomDesigns[getStationIndex(view)].name} room` : 'Interactive 3D Face Exchange corridor');
  setInert(corridor, view !== 'corridor' && !spatialRoom);
  spatialHud.hidden = !spatialRoom;
  if (spatialRoom) {
    const index = getStationIndex(view);
    const design = corridorController.roomDesigns[index];
    document.querySelector('[data-spatial-room-number]').textContent = 'FACIAL AUCTION HALL';
    document.querySelector('[data-spatial-room-title]').textContent = design.name;
    document.querySelector('[data-spatial-room-description]').textContent = design.subtitle;
    roomExhibitButton.textContent = design.action;
    roomExhibitButton.hidden = true;
    if(index===6)roomExhibitButton.textContent='PAUSE FLOATING PHOTOS';
    roomExhibitButton.setAttribute('aria-pressed', 'false');
    roomFeedback.textContent = index===6 ? 'Drag to rotate · Scroll to zoom · Click a photo for details · Esc to return' : [4,6,7].includes(index) ? 'Move your pointer or use arrows to look · Esc to return' : 'W / S to walk · A / D to step sideways · arrows to look · Esc to return';
    if (index === 4) corridorController.setAuctionBase(state.generatedFvu || getAverageValue());
    corridorController.setPortrait(index === 4 && !['composite','reuse'].includes(state.mode) ? state.imageUrl : state.generatedImageUrl || state.imageUrl);
  }

  rooms.forEach((room) => {
    const isActive = room.dataset.room === view;
    room.classList.toggle('is-active', isActive);
    setInert(room, !isActive);
    if (isActive && focusRoom && !spatialRoom) window.setTimeout(() => room.focus({ preventScroll: true }), 360);
  });

  doors.forEach((door) => {
    const isLast = Number(door.dataset.station) === state.activeStation;
    door.classList.toggle('is-last-door', view === 'corridor' && isLast);
    door.classList.remove('is-opening');
  });

  prepareRoom(view);
  setStatus(roomLabels[view] || 'SYSTEM ACTIVE');
  if (corridorController && !corridorController.isFallback) {
    corridorController.setEnabled(view === 'corridor' || spatialRoom);
  }
}

function showRoom(view) {
  state.lastDoor = view;
  setCurrentView(view);
}

function enterFallbackRoom(view, triggerDoor) {
  const stationIndex = getStationIndex(view);
  if (stationIndex !== state.activeStation) {
    setActiveStation(stationIndex, true);
    if (!triggerDoor?.classList.contains('is-active-door')) return;
  }
  state.lastDoor = view;
  doors.forEach((door) => door.classList.remove('is-opening'));
  triggerDoor?.classList.add('is-opening');
  app.dataset.openingDoor = view;
  setStatus(`OPENING ${roomLabels[view] || view}`);

  window.setTimeout(() => {
    delete app.dataset.openingDoor;
    showRoom(view);
  }, prefersReducedMotion() ? 20 : 560);
}

function enterActiveDoor() {
  if (!hasEnteredCorridor()) {
    corridorController?.enterEntrance?.();
    return;
  }
  const view = stations[state.activeStation].view;
  const fallbackDoor = document.querySelector(`[data-fallback-door][data-station="${state.activeStation}"]`);
  if (corridorController && !corridorController.isFallback) {
    corridorController.enterActiveDoor();
    return;
  }
  enterFallbackRoom(view, fallbackDoor);
}

function returnToCorridor() {
  stopCamera();
  if (corridorController?.isSpatial && corridorController.getRoomIndex() >= 0) {
    corridorController.exitRoom();
    return;
  }
  setCurrentView('corridor', false);
  setActiveStation(getStationIndex(state.lastDoor), false);
  if (corridorController && !corridorController.isFallback) {
    corridorController.returnToStation(state.activeStation);
  }
  window.setTimeout(() => {
    if (corridorController?.isFallback) document.querySelector(`[data-fallback-door][data-station="${state.activeStation}"]`)?.focus({ preventScroll: true });
    else threeMount.focus({ preventScroll: true });
  }, 120);
}

function continueToRoom(view) {
  if (corridorController?.isSpatial && corridorController.getRoomIndex() >= 0) {
    stopCamera();
    corridorController.travelToRoom(getStationIndex(view));
    return;
  }
  state.lastDoor = view;
  stopCamera();
  setCurrentView('corridor', false);
  setActiveStation(getStationIndex(view), true);
  if (corridorController && !corridorController.isFallback) {
    corridorController.returnToStation(state.activeStation);
  }
}

function setImage(url,{archive=true}={}) {
  state.imageUrl = url;
  state.mode='';state.generatedImageUrl='';state.generatedProductId='';state.generatedFvu=0;
  faceProcessing.setReference(url);
  state.auctionSale=null;
  updateSaleStamp();
  state.values = {};
  state.valuesRendered = false;
  state.pendingCaptureArchive=!archive;
  if(archive)recordFace(url).catch(()=>setStatus('FACE ARCHIVE COULD NOT BE SAVED'));
  corridorController?.setPortrait?.(url);
  [facePreview, packagePreview, resultPreview].forEach((image) => {
    image.src = url;
    image.hidden = false;
  });
  if (generatorPlaceholder) generatorPlaceholder.hidden = true;
  emptyPreview.hidden = true;
  setStatus('FACE RECEIVED LOCALLY');
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function createPlaceholderFace() {
  const placeholder = document.createElement('canvas');
  placeholder.width = 512;
  placeholder.height = 512;
  const context = placeholder.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#17221d');
  gradient.addColorStop(1, '#0b0f0d');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);
  context.strokeStyle = 'rgba(156, 201, 164, 0.56)';
  context.lineWidth = 4;
  context.beginPath();
  context.ellipse(256, 238, 116, 154, 0, 0, Math.PI * 2);
  context.stroke();
  context.fillStyle = 'rgba(156, 201, 164, 0.12)';
  context.beginPath();
  context.ellipse(256, 238, 106, 144, 0, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = 'rgba(218, 229, 220, 0.42)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(210, 224);
  context.lineTo(238, 224);
  context.moveTo(274, 224);
  context.lineTo(302, 224);
  context.moveTo(224, 314);
  context.lineTo(288, 314);
  context.stroke();
  context.fillStyle = '#9cc9a4';
  context.font = '22px monospace';
  context.textAlign = 'center';
  context.fillText('PLACEHOLDER FACE', 256, 438);
  return placeholder.toDataURL('image/png');
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function drawCoverImage(context, image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  const sourceWidth = imageRatio > boxRatio ? image.height * boxRatio : image.width;
  const sourceHeight = imageRatio > boxRatio ? image.height : image.width / boxRatio;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function createPixelatedImage(image) {
  const small = document.createElement('canvas');
  small.width = 64;
  small.height = 64;
  const smallContext = small.getContext('2d');
  drawCoverImage(smallContext, image, 0, 0, 64, 64);

  const large = document.createElement('canvas');
  large.width = 512;
  large.height = 512;
  const context = large.getContext('2d');
  context.imageSmoothingEnabled = false;
  context.fillStyle = '#0b0f0d';
  context.fillRect(0, 0, 512, 512);
  context.drawImage(small, 48, 48, 416, 416);
  context.strokeStyle = '#9cc9a4';
  context.lineWidth = 12;
  context.strokeRect(34, 34, 444, 444);
  context.fillStyle = 'rgba(11, 15, 13, 0.82)';
  context.fillRect(70, 418, 372, 44);
  context.fillStyle = '#9cc9a4';
  context.font = '22px monospace';
  context.textAlign = 'center';
  context.fillText('PIXEL FACE ASSET', 256, 448);
  return large.toDataURL('image/png');
}

function createNFTStylePreview(image, style) {
  const output = document.createElement('canvas');
  output.width = 512;
  output.height = 512;
  const context = output.getContext('2d');
  const gradient = context.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, '#9cc9a4');
  gradient.addColorStop(0.45, '#d7d2a0');
  gradient.addColorStop(1, '#6551a8');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 512, 512);
  context.fillStyle = 'rgba(11, 15, 13, 0.78)';
  context.fillRect(34, 34, 444, 444);
  drawCoverImage(context, image, 62, 74, 388, 330);
  context.strokeStyle = '#d7d2a0';
  context.lineWidth = 8;
  context.strokeRect(54, 66, 404, 348);
  context.fillStyle = '#d7d2a0';
  context.fillRect(54, 420, 150, 42);
  context.fillStyle = '#111412';
  context.font = '700 24px monospace';
  context.fillText('RARE', 92, 449);
  context.fillStyle = '#9cc9a4';
  context.font = '18px monospace';
  context.fillText(`LOT ${state.generatedProductId || 'FX-0000'}`, 226, 448);
  context.fillText(style.collection, 54, 494);
  return output.toDataURL('image/png');
}

function createFilteredPreview(image, styleId) {
  const output = document.createElement('canvas');
  output.width = 512;
  output.height = 512;
  const context = output.getContext('2d');
  const filters = {
    jobInterview: 'grayscale(0.65) contrast(1.14) brightness(0.96)',
    passport: 'grayscale(0.9) contrast(1.08) brightness(1.06)',
    influencer: 'saturate(1.7) contrast(1.16) brightness(1.05)',
    luxury: 'sepia(0.28) saturate(1.35) contrast(1.12) brightness(0.94)',
    algorithm: 'contrast(1.35) saturate(0.8) hue-rotate(42deg)',
  };
  context.fillStyle = '#0b0f0d';
  context.fillRect(0, 0, 512, 512);
  context.filter = filters[styleId] || 'contrast(1.08)';
  drawCoverImage(context, image, 54, 54, 404, 404);
  context.filter = 'none';
  context.strokeStyle = styleId === 'luxury' ? '#d7d2a0' : '#9cc9a4';
  context.lineWidth = 5;
  context.strokeRect(44, 44, 424, 424);
  context.fillStyle = 'rgba(11, 15, 13, 0.78)';
  context.fillRect(64, 408, 384, 42);
  context.fillStyle = styleId === 'luxury' ? '#d7d2a0' : '#9cc9a4';
  context.font = '18px monospace';
  context.textAlign = 'center';
  context.fillText('FICTIONAL FACE PRODUCT', 256, 435);
  return output.toDataURL('image/png');
}

function assignFictionalFVU(style) {
  return style.fvu;
}

async function generateStyledFace(styleId) {
  const style = modeData[styleId];
  const sourceUrl = state.imageUrl || createPlaceholderFace();
  const image = await loadImage(sourceUrl);
  if(ROLE_STYLES[styleId])return createRolePortrait(image,styleId);
  if (styleId === 'pixelAvatar') return createPixelatedImage(image);
  if (styleId === 'nftCollectible') return createNFTStylePreview(image, style);
  return createFilteredPreview(image, styleId);
}

function createGeneratedFaceCard(style, imageUrl) {
  const article = document.createElement('article');
  article.className = `generated-face-card generated-face-card--${state.mode}`;

  const image = document.createElement('img');
  image.src = imageUrl;
  image.alt = `Generated ${style.label} preview`;

  const content = document.createElement('div');
  content.className = 'generated-face-card__content';

  const kicker = document.createElement('p');
  kicker.className = 'terminal-label';
  kicker.textContent = 'GENERATED FACE PRODUCT';

  const title = document.createElement('h3');
  title.textContent = style.label;

  const note = document.createElement('p');
  note.textContent = 'Your face has been transformed into a fictional market asset.';

  const disclaimer = document.createElement('p');
  disclaimer.className = 'microcopy';
  disclaimer.textContent = state.mode === 'nftCollectible'
    ? ''
    : '';

  const meta = document.createElement('div');
  meta.className = 'generated-face-meta';
  meta.innerHTML = `<span>PRODUCT ID</span><strong>${state.generatedProductId}</strong><span>FVU VALUE</span><strong>${state.generatedFvu} FVU</strong>`;

  const actions = document.createElement('div');
  actions.className = 'room-actions generated-face-actions';

  const valueButton = document.createElement('button');
  valueButton.className = 'primary-action';
  valueButton.type = 'button';
  valueButton.textContent = 'Send to Value Room';
  valueButton.addEventListener('click', () => continueToRoom('valueRoom'));

  const auctionButton = document.createElement('button');
  auctionButton.className = 'secondary-action';
  auctionButton.type = 'button';
  auctionButton.textContent = 'Send to Auction';
  auctionButton.addEventListener('click', () => continueToRoom('soldRoom'));

  actions.append(valueButton, auctionButton);
  content.append(kicker, title, note, disclaimer, meta, actions);
  article.append(image, content);
  return article;
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraMessage.textContent = 'Camera is unavailable in this browser. Use image upload instead.';
    setStatus('CAMERA FALLBACK AVAILABLE');
    return;
  }

  try {
    state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    video.srcObject = state.stream;
    video.hidden = false;
    emptyPreview.hidden = true;
    facePreview.hidden = true;
    takePhotoButton.hidden = false;
    await video.play();
    cameraMessage.textContent = 'Camera is active locally. Take a still image when ready.';
    setStatus('LOCAL CAMERA STREAM ACTIVE');
  } catch (error) {
    cameraMessage.textContent = 'Camera permission was denied or unavailable. Use image upload instead.';
    setStatus('CAMERA FALLBACK AVAILABLE');
  }
}

function takePhoto() {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.save();
  context.translate(width,0);
  context.scale(-1,1);
  context.drawImage(video, 0, 0, width, height);
  context.restore();
  setImage(canvas.toDataURL('image/png'));
  cameraMessage.textContent = 'Still image captured locally inside this browser session.';
  stopCamera();
}

function uploadImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    cameraMessage.textContent = 'Please upload an image file.';
    return;
  }
  if (state.imageUrl.startsWith('blob:')) URL.revokeObjectURL(state.imageUrl);
  setImage(URL.createObjectURL(file));
  stopCamera();
  cameraMessage.textContent = import.meta.env.PUBLIC_ARCHIVE_MODE==='browser'
    ? 'Your image is ready. It is saved only in this browser on your device.'
    : 'Your image is ready. It will be saved in this project’s face archive.';
}

async function selectMode(modeKey) {
  const style = modeData[modeKey];
  if (!style) return;
  const token = generationToken + 1;
  generationToken = token;
  state.mode = modeKey;
  state.auctionSale=null;
  updateSaleStamp();
  if(state.pendingCaptureArchive&&state.imageUrl){
    state.pendingCaptureArchive=false;
    recordFace(state.imageUrl).catch(()=>{state.pendingCaptureArchive=true;setStatus('FACE ARCHIVE COULD NOT BE SAVED');});
  }
  state.values = createVirtualScores();
  state.generatedFvu = assignFictionalFVU(style);
  state.generatedProductId = `FX-${String(Math.floor(1000 + Math.random() * 9000))}`;
  state.generatedImageUrl = '';
  state.valuesRendered = false;
  packageNext.disabled = true;
  generatedResult.replaceChildren();
  metadataTags.replaceChildren(
    ...style.tags.map((tag) => {
      const item = document.createElement('span');
      item.textContent = tag.toUpperCase();
      return item;
    }),
  );
  setStatus(`${style.label.toUpperCase()} SELECTED`);
  for (const message of generatedMessages) {
    if (token !== generationToken) return;
    generatorStatus.textContent = message;
    await delay(prefersReducedMotion() ? 20 : 420);
  }
  if (token !== generationToken) return;
  let generatedImage;
  try {generatedImage=await generateStyledFace(modeKey);}
  catch {
    if(token===generationToken)generatorStatus.textContent='Portrait could not be created. Choose a style to retry.';
    return;
  }
  if (token !== generationToken) return;
  state.generatedImageUrl = generatedImage;
  corridorController?.setPortrait?.(state.generatedImageUrl);
  if (packagePreview) {
    packagePreview.src = state.generatedImageUrl;
    packagePreview.hidden = false;
  }
  if (resultPreview) {
    resultPreview.src = state.generatedImageUrl;
    resultPreview.hidden = false;
  }
  if (generatorPlaceholder) generatorPlaceholder.hidden = true;
  generatedResult.replaceChildren(createGeneratedFaceCard(style, state.generatedImageUrl));
  generatorStatus.textContent = `${style.label.toUpperCase()} READY / ${state.generatedFvu} FVU`;
  packageNext.disabled = false;
  setStatus('GENERATED FACE PRODUCT READY');
}

function animateNumber(output, value) {
  if (prefersReducedMotion()) {
    output.textContent = value;
    return;
  }

  const start = Number(output.textContent) || 0;
  const diff = value - start;
  const duration = 380;
  const started = performance.now();

  function tick(now) {
    const progress = Math.min((now - started) / duration, 1);
    output.textContent = Math.round(start + diff * progress);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function ensureVirtualScores() {
  if (!VIRTUAL_SCORE_METRICS.every(metric=>Number.isFinite(state.values[metric.key]))) state.values=createVirtualScores();
  return state.values;
}

function renderValues() {
  ensureVirtualScores();
  valueGrid.replaceChildren();
  const portrait=document.querySelector('[data-value-portrait]');
  const source=['composite','reuse'].includes(state.mode)?state.generatedImageUrl:state.imageUrl||state.generatedImageUrl;
  portrait.hidden=!source;
  if(source)portrait.src=source;else portrait.removeAttribute('src');
  document.querySelector('[data-value-portrait-empty]').hidden=!!source;
  const heading=document.createElement('h3');
  heading.className='house-score-heading';
  heading.textContent='The house standard';
  const legend=document.createElement('p');
  legend.className='house-score-legend';
  legend.textContent='Reference band 65–85 · Scale 0–100';
  const ledger=document.createElement('dl');
  ledger.className='house-score-ledger';
  for (const key of HOUSE_STANDARD_KEYS) {
    const metric=VIRTUAL_SCORE_METRICS.find(item=>item.key===key);
    const score=state.values[key];
    const row=document.createElement('div');
    row.className='house-score-row';
    row.dataset.metric=key;
    const label=document.createElement('dt');
    label.textContent=metric.label;
    const detail=document.createElement('dd');
    const track=document.createElement('span');
    track.className='house-score-track';
    track.setAttribute('aria-hidden','true');
    const band=document.createElement('span');
    band.className='house-score-band';
    band.style.left=`${HOUSE_STANDARD_BAND.min}%`;
    band.style.width=`${HOUSE_STANDARD_BAND.max-HOUSE_STANDARD_BAND.min}%`;
    const fill=document.createElement('span');
    fill.className='house-score-fill';
    fill.style.width=`${score}%`;
    track.append(band,fill);
    const value=document.createElement('span');
    value.className='house-score-number';
    value.textContent=`${score} / 100`;
    detail.append(track,value);
    row.append(label,detail);
    ledger.append(row);
  }
  const disclosure=document.createElement('p');
  disclosure.className='house-score-disclosure';
  disclosure.textContent='Fictional scores and standards. No facial analysis is performed.';
  valueGrid.append(heading,legend,ledger,disclosure);
  if (fvuValue) fvuValue.textContent = getAverageValue();
}

function getAverageValue() {
  return averageVirtualScore(ensureVirtualScores());
}

function renderAuction() {
  const bids = virtualAgentBids(ensureVirtualScores());

  Object.entries(bids).forEach(([agent, value]) => {
    const output = document.querySelector(`#bid-${agent}`);
    if (output) animateNumber(output, value);
  });

  const winner = Object.entries(bids).sort((a, b) => b[1] - a[1])[0];
  const average = getAverageValue();
  const marketLine = average > 75 ? 'FACE VALUE RISING' : average > 55 ? 'AGENT INTEREST DETECTED' : 'NEW BID RECEIVED';
  auctionMessage.textContent = `${marketLine}: ${winner[0].toUpperCase()} LEADS / ${winner[1]} FVU`;
}

function updateSaleStamp() {
  const stamp=document.querySelector('[data-sold-stamp]');
  if(stamp)stamp.hidden=!(Number.isFinite(state.auctionSale?.price)&&state.auctionSale.price>0&&!resultPreview.hidden);
}

function renderResult() {
  updateSaleStamp();
  const values = ensureVirtualScores();
  const rows = [
    ['Asset', modeData[state.mode]?.label || 'Uncatalogued likeness'],
    ['Lot record', state.generatedProductId || 'LOT-041'],
    ['Final price', state.auctionSale ? `${state.auctionSale.price.toLocaleString()} RMB` : 'Not sold'],
    ['Buyer', 'PRIVATE LICENSING AGENT'],
    ['Licence', 'DERIVATIVE / COMMERCIAL / TRANSFERABLE'],
    ['This round’s estimate', `${getAverageValue()} / 100`],
    ['Archive status', 'TRANSFERRED / FICTIONAL RECORD'],
  ];

  resultPanel.replaceChildren(
    ...rows.map(([label, value]) => {
      const row = document.createElement('p');
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      return row;
    }),
  );
}

function resetExperience() {
  stopCamera();
  if (state.imageUrl.startsWith('blob:')) URL.revokeObjectURL(state.imageUrl);
  state.currentView = 'corridor';
  state.entranceState = corridorController?.getEntranceState?.() || 'inside';
  state.activeStation = 0;
  state.lastDoor = 'enterRoom';
  state.imageUrl = '';
  faceProcessing.reset();faceProcessing.setReference('');
  state.mode = '';
  state.generatedImageUrl = '';
  state.generatedProductId = '';
  state.generatedFvu = 0;
  state.auctionSale = null;
  updateSaleStamp();
  state.values = {};
  state.valuesRendered = false;
  uploadInput.value = '';
  state.pendingCaptureArchive = false;
  corridorController?.setPortrait?.('');
  if (corridorController?.isSpatial) corridorController.returnToStation(0);
  facePreview.hidden = true;
  packagePreview.hidden = true;
  resultPreview.hidden = true;
  if (generatorPlaceholder) generatorPlaceholder.hidden = false;
  emptyPreview.hidden = false;
  packageNext.disabled = true;
  generationToken += 1;
  metadataTags.replaceChildren();
  generatedResult.replaceChildren();
  if (generatorStatus) generatorStatus.textContent = 'SELECT A STYLE TO GENERATE';
  valueGrid.replaceChildren();
  resultPanel.replaceChildren();
  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });
  cameraMessage.textContent = 'Dear guest, please upload your own face and await our appraisal.';
  auctionMessage.textContent = 'BIDS WAITING FOR VALUE INPUT';
  setCurrentView('corridor', false);
  setEntranceState(state.entranceState);
  setActiveStation(0, false);
  setStatus(hasEnteredCorridor() ? 'SYSTEM WAITING' : 'APPROACH FACE EXCHANGE ENTRANCE');
}

doors.forEach((door) => {
  door.addEventListener('click', () => enterFallbackRoom(door.dataset.door, door));
});

previousDoorButton.addEventListener('click', () => moveStation(-1));
nextDoorButton.addEventListener('click', () => moveStation(1));
document.querySelector('[data-journey-button]').addEventListener('click',()=>continueToRoom(document.querySelector('[data-journey-next]').dataset.destination));
document.querySelectorAll('[data-open-exhibit]').forEach(button=>button.addEventListener('click',()=>corridorController?.openExhibit?.(button.dataset.openExhibit)));
enterActiveButton.addEventListener('click', enterActiveDoor);
enterEntranceButton?.addEventListener('click', () => {
  if (corridorController?.isFallback) {
    setEntranceState('inside');
    setCurrentView('corridor', false);
    return;
  }
  corridorController?.enterEntrance?.(true);
});

corridor.addEventListener('wheel', (event) => {
  if (state.currentView !== 'corridor') return;
  if (corridorController && !corridorController.isFallback) return;
  event.preventDefault();
  if (wheelLocked) return;
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (Math.abs(delta) < 8) return;
  wheelLocked = true;
  moveStation(delta > 0 ? 1 : -1);
  window.setTimeout(() => {
    wheelLocked = false;
  }, prefersReducedMotion() ? 60 : 420);
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if(event.key==='Escape'&&!document.querySelector('[data-face-inspector]').hidden){document.querySelector('[data-face-inspector]').hidden=true;threeMount.focus({preventScroll:true});event.preventDefault();return;}
  const editableTarget = event.target.closest('input, textarea, select, [contenteditable="true"]');
  if (editableTarget && event.key !== 'Escape') return;
  const nativeControl = event.target.closest('button, summary, a');
  if (nativeControl && (event.key === 'Enter' || event.key === ' ')) return;
  // Escape belongs to the browser while full screen is active. Do not also
  // close the current room or cancel the entrance on that same key press.
  if (event.key === 'Escape' && document.fullscreenElement === app) return;
  if (event.key === 'Escape' && state.currentView !== 'corridor') {
    event.preventDefault();
    returnToCorridor();
    return;
  }

  if (state.currentView !== 'corridor') {
    if (corridorController?.isSpatial) {
      const key = event.key.toLowerCase();
      if (key === 'w' || event.key === 'ArrowUp') { event.preventDefault(); corridorController.moveAlong(1); }
      if (key === 's' || event.key === 'ArrowDown') { event.preventDefault(); corridorController.moveAlong(-1); }
      if (key === 'a') { event.preventDefault(); corridorController.moveInRoom(-0.3, 0); }
      if (key === 'd') { event.preventDefault(); corridorController.moveInRoom(0.3, 0); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); corridorController.look(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); corridorController.look(1); }
    }
    return;
  }
  const isThreeMode = corridorController && !corridorController.isFallback;

  if (event.key === 'Escape' && isThreeMode && !hasEnteredCorridor()) {
    event.preventDefault();
    corridorController.cancelEntrance?.();
    return;
  }

  if (isThreeMode && (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w')) {
    event.preventDefault();
    corridorController.moveAlong(1);
    return;
  }
  if (isThreeMode && (event.key === 'ArrowDown' || event.key.toLowerCase() === 's')) {
    event.preventDefault();
    corridorController.moveAlong(-1);
    return;
  }
  if (isThreeMode && event.key === 'ArrowLeft') {
    event.preventDefault();
    corridorController.look(-1);
    return;
  }
  if (isThreeMode && event.key === 'ArrowRight') {
    event.preventDefault();
    corridorController.look(1);
    return;
  }
  if (isThreeMode && event.key === 'Enter') {
    event.preventDefault();
    if (hasEnteredCorridor()) enterActiveDoor();
    else corridorController.enterEntrance?.();
    return;
  }

  if (!isThreeMode && !hasEnteredCorridor()) {
    if (event.key === 'Enter' || event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
      event.preventDefault();
      setEntranceState('inside');
    }
    return;
  }

  if (!isThreeMode && (event.key === 'ArrowRight' || event.key === 'ArrowDown')) {
    event.preventDefault();
    moveStation(1);
  }
  if (!isThreeMode && (event.key === 'ArrowLeft' || event.key === 'ArrowUp')) {
    event.preventDefault();
    moveStation(-1);
  }
  if (event.key === 'Enter' && document.activeElement?.classList.contains('corridor-door')) {
    enterFallbackRoom(stations[state.activeStation].view, document.activeElement);
    return;
  }
  if (event.key === 'Enter' && document.activeElement === enterActiveButton) {
    enterActiveDoor();
  }
});

document.querySelectorAll('[data-return-corridor]').forEach((button) => {
  button.addEventListener('click', returnToCorridor);
});

document.querySelectorAll('[data-continue]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!corridorController?.isSpatial && state.currentView === 'enterRoom' && button.dataset.continue === 'submitRoom') {
      setActiveStation(getStationIndex('submitRoom'), false);
      showRoom('submitRoom');
    } else continueToRoom(button.dataset.continue);
  });
});

document.addEventListener('auction-sale-record',event=>{state.auctionSale=event.detail;updateSaleStamp();recordSale(event.detail.price,event.detail.bidder).catch(()=>setStatus('SALE ARCHIVE COULD NOT BE SAVED'));});
document.querySelector('[data-face-inspector-close]').addEventListener('click',()=>document.querySelector('[data-face-inspector]').hidden=true);
document.querySelector('[data-final-return]').addEventListener('click',returnToCorridor);
document.querySelector('[data-auction-guide]').addEventListener('wheel',event=>{event.preventDefault();event.stopPropagation();},{passive:false});
document.querySelector('[data-auction-next]').addEventListener('click',()=>continueToRoom('soldRoom'));
roomExhibitButton.addEventListener('click', () => corridorController?.interactWithRoom());

startCameraButton.addEventListener('click', startCamera);
takePhotoButton.addEventListener('click', takePhoto);
uploadInput.addEventListener('change', uploadImage);
document.querySelector('#upload-image-button').addEventListener('click', () => uploadInput.click());
startAgainButton.addEventListener('click', resetExperience);

document.querySelectorAll('input[name="package-mode"]').forEach((input) => {
  input.addEventListener('change', () => selectMode(input.value));
});

corridorController = initThreeCorridor({
  mount: threeMount,
  stations,
  initialStation: 0,
  onStationChange: (index) => setActiveStation(index, false, 'three'),
  onEnterDoor: showRoom,
  onFaceCaptureComplete: ({imageUrl})=>{
    if(imageUrl)setImage(imageUrl,{archive:false});
  },
  onEntranceChange: setEntranceState,
  onReturnRoom: (index) => {
    setCurrentView('corridor', false);
    setActiveStation(index, false, 'three');
    threeMount.focus({ preventScroll: true });
  },
  onRoomAction: active => {
    roomExhibitButton.setAttribute('aria-pressed', String(active));
    if(state.currentView==='auctionRoom'){roomExhibitButton.textContent=active?'RESUME FLOATING PHOTOS':'PAUSE FLOATING PHOTOS';roomFeedback.textContent='Drag to rotate · Scroll to zoom · Click a photo for details · Esc to return';return;}
    roomFeedback.textContent = active ? 'The artwork is active. Click it again to quiet the motion.' : 'The artwork has returned to rest.';
  },
  reducedMotion: prefersReducedMotion(),
});


if (corridorController?.isFallback) {
  app.classList.add('is-webgl-fallback');
  fallbackCorridor.hidden = false;
  threeMount.hidden = true;
} else {
  app.classList.add('is-webgl-ready');
  fallbackCorridor.hidden = true;
}

setActiveStation(0, false);
setCurrentView('corridor', false);
setEntranceState(corridorController?.getEntranceState?.() || state.entranceState);
import { initSceneAudio } from './sceneAudio.js';
