import { initThreeCorridor } from './threeCorridor.js';

const app = document.querySelector('[data-app]');
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
const captureNext = document.querySelector('#capture-next');
const packageNext = document.querySelector('#package-next');
const metadataTags = document.querySelector('#metadata-tags');
const valueGrid = document.querySelector('#value-grid');
const auctionMessage = document.querySelector('#auction-message');
const costMessage = document.querySelector('#cost-message');
const resultPanel = document.querySelector('#result-panel');
const startAgainButton = document.querySelector('#start-again');
const reflectionResponse = document.querySelector('#reflection-response');

const roomOrder = ['enterRoom', 'submitRoom', 'classifyRoom', 'valueRoom', 'auctionRoom', 'costRoom', 'reflectRoom'];

const stations = [
  { view: 'enterRoom', label: '01 INTRO' },
  { view: 'submitRoom', label: '02 SUBMIT' },
  { view: 'classifyRoom', label: '03 CLASSIFY' },
  { view: 'valueRoom', label: '04 VALUE' },
  { view: 'auctionRoom', label: '05 AUCTION' },
  { view: 'costRoom', label: '06 COST' },
  { view: 'reflectRoom', label: '07 REFLECT' },
];

const roomLabels = {
  corridor: 'CORRIDOR HUB',
  enterRoom: 'ROOM 01 ACTIVE',
  submitRoom: 'SUBMIT ROOM ACTIVE',
  classifyRoom: 'CLASSIFY ROOM ACTIVE',
  valueRoom: 'VALUE ROOM ACTIVE',
  auctionRoom: 'AUCTION ROOM ACTIVE',
  costRoom: 'COST ROOM ACTIVE',
  reflectRoom: 'REFLECT ROOM ACTIVE',
};

const modeData = {
  corporate: {
    label: 'Professional Face',
    tags: ['work-ready signal', 'formal presentation', 'controlled expression', 'employment value', 'institutional fit'],
    values: { 'Trust Index': 72, 'Employability Rating': 88, 'Attention Demand': 38, 'Authority Signal': 78, 'Access Value': 62, 'Resale Potential': 42 },
  },
  creative: {
    label: 'Trustworthy Face',
    tags: ['clear lighting', 'stable expression', 'identity confidence', 'trust value', 'service platform value'],
    values: { 'Trust Index': 91, 'Employability Rating': 70, 'Attention Demand': 45, 'Authority Signal': 68, 'Access Value': 76, 'Resale Potential': 48 },
  },
  livestream: {
    label: 'Young Face',
    tags: ['youth signal', 'trend fit', 'attention-ready', 'lifestyle value', 'growth market'],
    values: { 'Trust Index': 54, 'Employability Rating': 58, 'Attention Demand': 82, 'Authority Signal': 34, 'Access Value': 55, 'Resale Potential': 74 },
  },
  verified: {
    label: 'Passport Face',
    tags: ['official format', 'document identity', 'border value', 'verification value', 'access control'],
    values: { 'Trust Index': 86, 'Employability Rating': 64, 'Attention Demand': 30, 'Authority Signal': 82, 'Access Value': 94, 'Resale Potential': 36 },
  },
  influencer: {
    label: 'Influencer Face',
    tags: ['audience ready', 'brand personality', 'visibility value', 'engagement value', 'platform circulation'],
    values: { 'Trust Index': 60, 'Employability Rating': 52, 'Attention Demand': 96, 'Authority Signal': 48, 'Access Value': 66, 'Resale Potential': 88 },
  },
  premium: {
    label: 'Premium Face',
    tags: ['scarcity signal', 'luxury frame', 'high-status cue', 'exclusive access', 'collector value'],
    values: { 'Trust Index': 74, 'Employability Rating': 78, 'Attention Demand': 76, 'Authority Signal': 86, 'Access Value': 84, 'Resale Potential': 92 },
  },
};

const state = {
  currentView: 'corridor',
  activeStation: 0,
  lastDoor: 'enterRoom',
  imageUrl: '',
  mode: '',
  values: {},
  hiddenCosts: [],
  stream: null,
  valuesRendered: false,
};

let wheelLocked = false;
let corridorController = null;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setStatus(message) {
  if (statusText) statusText.textContent = message;
}

function stopCamera() {
  if (!state.stream) return;
  state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  video.hidden = true;
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
    if (!Object.keys(state.values).length) state.values = { 'Trust Index': 50, 'Employability Rating': 50, 'Attention Demand': 50, 'Authority Signal': 50, 'Access Value': 50, 'Resale Potential': 50 };
    renderValues();
    state.valuesRendered = true;
  }
  if (view === 'auctionRoom') renderAuction();
  if (view === 'reflectRoom') renderResult();
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
  stationReadout.textContent = activeStation.label;
  previousDoorButton.disabled = nextIndex === 0;
  nextDoorButton.disabled = nextIndex === stations.length - 1;

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

  setStatus(`STATION ${activeStation.label} READY`);
}

function moveStation(direction) {
  if (state.currentView !== 'corridor') return;
  setActiveStation(state.activeStation + direction, true);
}

function setCurrentView(view, focusRoom = true) {
  state.currentView = view;
  app.dataset.view = view;
  setInert(corridor, view !== 'corridor');

  rooms.forEach((room) => {
    const isActive = room.dataset.room === view;
    room.classList.toggle('is-active', isActive);
    setInert(room, !isActive);
    if (isActive && focusRoom) window.setTimeout(() => room.focus({ preventScroll: true }), 360);
  });

  doors.forEach((door) => {
    const isLast = Number(door.dataset.station) === state.activeStation;
    door.classList.toggle('is-last-door', view === 'corridor' && isLast);
    door.classList.remove('is-opening');
  });

  prepareRoom(view);
  setStatus(roomLabels[view] || 'SYSTEM ACTIVE');
  if (corridorController && !corridorController.isFallback) {
    corridorController.setEnabled(view === 'corridor');
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
  state.lastDoor = view;
  stopCamera();
  setCurrentView('corridor', false);
  setActiveStation(getStationIndex(view), true);
  if (corridorController && !corridorController.isFallback) {
    corridorController.returnToStation(state.activeStation);
  }
}

function setImage(url) {
  state.imageUrl = url;
  [facePreview, packagePreview, resultPreview].forEach((image) => {
    image.src = url;
    image.hidden = false;
  });
  emptyPreview.hidden = true;
  captureNext.disabled = false;
  setStatus('FACE RECEIVED LOCALLY');
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
  context.drawImage(video, 0, 0, width, height);
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
  cameraMessage.textContent = 'Uploaded image is previewed locally. It is not sent to a server.';
}

function selectMode(modeKey) {
  state.mode = modeKey;
  state.values = { ...modeData[modeKey].values };
  state.valuesRendered = false;
  packageNext.disabled = false;
  metadataTags.replaceChildren(
    ...modeData[modeKey].tags.map((tag) => {
      const item = document.createElement('span');
      item.textContent = tag.toUpperCase();
      return item;
    }),
  );
  setStatus(`${modeData[modeKey].label.toUpperCase()} SELECTED`);
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

function renderValues() {
  valueGrid.replaceChildren();
  Object.entries(state.values).forEach(([label, value]) => {
    const card = document.createElement('div');
    card.className = 'value-card';

    const labelElement = document.createElement('label');
    const inputId = `value-${label.toLowerCase().replaceAll(' ', '-')}`;
    labelElement.setAttribute('for', inputId);
    labelElement.textContent = label;

    const output = document.createElement('output');
    output.setAttribute('for', inputId);
    output.textContent = '0';

    const tag = document.createElement('span');
    tag.className = 'score-tag';
    tag.textContent = 'FICTIONAL INTERFACE SCORE';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = value;
    slider.id = inputId;
    slider.setAttribute('aria-label', `${label} fictional interface score`);
    slider.addEventListener('input', () => {
      state.values[label] = Number(slider.value);
      animateNumber(output, Number(slider.value));
    });

    card.append(labelElement, output, tag, slider);
    valueGrid.append(card);
    animateNumber(output, value);
  });
}

function getAverageValue() {
  const values = Object.keys(state.values).length ? state.values : { 'Trust Index': 0, 'Employability Rating': 0, 'Attention Demand': 0, 'Authority Signal': 0, 'Access Value': 0, 'Resale Potential': 0 };
  const scores = Object.values(values);
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function renderAuction() {
  const values = Object.keys(state.values).length ? state.values : { 'Trust Index': 0, 'Employability Rating': 0, 'Attention Demand': 0, 'Authority Signal': 0, 'Access Value': 0, 'Resale Potential': 0 };
  const bids = {
    employer: Math.round(values['Trust Index'] * 0.25 + values['Authority Signal'] * 0.25 + values['Employability Rating'] * 0.5),
    platform: Math.round(values['Attention Demand'] * 0.52 + values['Resale Potential'] * 0.22 + getAverageValue() * 0.26),
    verification: Math.round(values['Access Value'] * 0.45 + values['Trust Index'] * 0.32 + values['Authority Signal'] * 0.23),
    collector: Math.round(values['Resale Potential'] * 0.5 + values['Authority Signal'] * 0.2 + values['Access Value'] * 0.3),
    advertiser: Math.round(values['Attention Demand'] * 0.48 + values['Trust Index'] * 0.18 + values['Resale Potential'] * 0.34),
  };

  Object.entries(bids).forEach(([agent, value]) => {
    const output = document.querySelector(`#bid-${agent}`);
    if (output) animateNumber(output, value);
  });

  const winner = Object.entries(bids).sort((a, b) => b[1] - a[1])[0];
  auctionMessage.textContent = `HIGHEST FICTIONAL BID: ${winner[0].toUpperCase()} / ${winner[1]}`;
}

function updateCosts() {
  state.hiddenCosts = Array.from(document.querySelectorAll('.cost-fieldset input:checked')).map((input) => input.value);
  costMessage.textContent = state.hiddenCosts.length ? 'HIDDEN COSTS REGISTERED' : 'AWAITING HIDDEN COST SELECTION';
  setStatus(costMessage.textContent);
}

function renderResult() {
  const values = Object.keys(state.values).length ? state.values : { 'Trust Index': 0, 'Employability Rating': 0, 'Attention Demand': 0, 'Authority Signal': 0, 'Access Value': 0, 'Resale Potential': 0 };
  const costs = state.hiddenCosts.length ? state.hiddenCosts : ['No hidden costs selected'];
  const rows = [
    ['Selected classification mode', modeData[state.mode]?.label || 'Unselected'],
    ['Trust Index', values['Trust Index']],
    ['Employability Rating', values['Employability Rating']],
    ['Attention Demand', values['Attention Demand']],
    ['Authority Signal', values['Authority Signal']],
    ['Access Value', values['Access Value']],
    ['Resale Potential', values['Resale Potential']],
    ['Average exchange value', getAverageValue()],
    ['Hidden costs registered', costs.join(', ')],
    ['System status', 'EXCHANGED'],
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
  state.activeStation = 0;
  state.lastDoor = 'enterRoom';
  state.imageUrl = '';
  state.mode = '';
  state.values = {};
  state.hiddenCosts = [];
  state.valuesRendered = false;
  uploadInput.value = '';
  facePreview.hidden = true;
  packagePreview.hidden = true;
  resultPreview.hidden = true;
  emptyPreview.hidden = false;
  captureNext.disabled = true;
  packageNext.disabled = true;
  metadataTags.replaceChildren();
  valueGrid.replaceChildren();
  resultPanel.replaceChildren();
  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });
  reflectionResponse.hidden = true;
  cameraMessage.textContent = 'Camera access is optional. Upload remains available if access is unavailable or denied.';
  costMessage.textContent = 'AWAITING HIDDEN COST SELECTION';
  auctionMessage.textContent = 'BIDS WAITING FOR VALUE INPUT';
  setCurrentView('corridor', false);
  setActiveStation(0, false);
  setStatus('SYSTEM WAITING');
}

doors.forEach((door) => {
  door.addEventListener('click', () => enterFallbackRoom(door.dataset.door, door));
});

previousDoorButton.addEventListener('click', () => moveStation(-1));
nextDoorButton.addEventListener('click', () => moveStation(1));
enterActiveButton.addEventListener('click', enterActiveDoor);

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
  if (event.key === 'Escape' && state.currentView !== 'corridor') {
    event.preventDefault();
    returnToCorridor();
    return;
  }

  if (state.currentView !== 'corridor') return;
  const isThreeMode = corridorController && !corridorController.isFallback;

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
    enterActiveDoor();
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
  button.addEventListener('click', () => continueToRoom(button.dataset.continue));
});

startCameraButton.addEventListener('click', startCamera);
takePhotoButton.addEventListener('click', takePhoto);
uploadInput.addEventListener('change', uploadImage);
startAgainButton.addEventListener('click', resetExperience);

document.querySelectorAll('input[name="package-mode"]').forEach((input) => {
  input.addEventListener('change', () => selectMode(input.value));
});

document.querySelectorAll('.cost-fieldset input').forEach((input) => {
  input.addEventListener('change', updateCosts);
});

document.querySelectorAll('input[name="reflection"]').forEach((input) => {
  input.addEventListener('change', () => {
    reflectionResponse.hidden = false;
    setStatus(`CONTROL ANSWER REGISTERED: ${input.value.toUpperCase()}`);
  });
});

corridorController = initThreeCorridor({
  mount: threeMount,
  stations,
  initialStation: 0,
  onStationChange: (index) => setActiveStation(index, false, 'three'),
  onEnterDoor: showRoom,
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
setStatus('SYSTEM WAITING');
