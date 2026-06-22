const stages = Array.from(document.querySelectorAll('[data-stage]'));
const progressSteps = Array.from(document.querySelectorAll('[data-progress-step]'));
const statusText = document.querySelector('#system-status-text');
const nextButtons = Array.from(document.querySelectorAll('[data-next]'));

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
const costMessage = document.querySelector('#cost-message');
const resultPanel = document.querySelector('#result-panel');
const startAgainButton = document.querySelector('#start-again');
const restartFinalButton = document.querySelector('#restart-final');
const reflectionResponse = document.querySelector('#reflection-response');

const modeData = {
  corporate: {
    label: 'Corporate Face',
    tags: ['formal clothing signal', 'neutral background signal', 'controlled expression', 'employability value', 'authority value'],
    values: { Trust: 76, Employability: 88, Attention: 42, Authority: 82, Access: 58 },
  },
  creative: {
    label: 'Creative Face',
    tags: ['originality signal', 'editorial style', 'personal branding', 'visibility value', 'cultural value'],
    values: { Trust: 55, Employability: 62, Attention: 74, Authority: 48, Access: 46 },
  },
  livestream: {
    label: 'Livestream Face',
    tags: ['direct eye contact', 'brighter lighting', 'creator identity', 'attention value', 'engagement value'],
    values: { Trust: 61, Employability: 52, Attention: 91, Authority: 44, Access: 50 },
  },
  verified: {
    label: 'Verified Face',
    tags: ['official metadata', 'identity frame', 'access value', 'legitimacy value', 'institutional trust'],
    values: { Trust: 84, Employability: 70, Attention: 50, Authority: 78, Access: 92 },
  },
};

const state = {
  stage: 0,
  imageUrl: '',
  mode: '',
  values: {},
  hiddenCosts: [],
  stream: null,
};

function setStatus(message) {
  statusText.textContent = message;
}

function stopCamera() {
  if (!state.stream) return;
  state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  video.hidden = true;
  takePhotoButton.hidden = true;
}

function setStage(index) {
  state.stage = index;
  stages.forEach((stage, stageIndex) => {
    const active = stageIndex === index;
    stage.hidden = !active;
    stage.classList.toggle('is-active', active);
  });
  progressSteps.forEach((step, stepIndex) => {
    step.classList.toggle('is-complete', stepIndex < index);
    step.classList.toggle('is-current', stepIndex === index);
    if (stepIndex === index) {
      step.setAttribute('aria-current', 'step');
    } else {
      step.removeAttribute('aria-current');
    }
  });
  document.querySelector('.stage.is-active button, .stage.is-active input')?.focus({ preventScroll: true });
  setStatus(`CHECKPOINT ${String(index + 1).padStart(2, '0')} ACTIVE`);
  if (index !== 1) stopCamera();
  if (index === 3) renderValues();
  if (index === 5) renderResult();
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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
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
    const inputId = `value-${label.toLowerCase()}`;
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

function updateCosts() {
  state.hiddenCosts = Array.from(document.querySelectorAll('.cost-fieldset input:checked')).map((input) => input.value);
  costMessage.textContent = state.hiddenCosts.length ? 'HIDDEN COSTS REGISTERED' : 'AWAITING HIDDEN COST SELECTION';
  setStatus(costMessage.textContent);
}

function renderResult() {
  const average = Math.round(Object.values(state.values).reduce((sum, value) => sum + value, 0) / 5);
  const costs = state.hiddenCosts.length ? state.hiddenCosts : ['No hidden costs selected'];
  const rows = [
    ['Selected packaging mode', modeData[state.mode]?.label || 'Unselected'],
    ['Trust value', state.values.Trust],
    ['Employability value', state.values.Employability],
    ['Attention value', state.values.Attention],
    ['Authority value', state.values.Authority],
    ['Access value', state.values.Access],
    ['Average exchange value', average],
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
  setStatus('FACE VALUE EXCHANGED');
}

function resetExperience() {
  stopCamera();
  if (state.imageUrl.startsWith('blob:')) URL.revokeObjectURL(state.imageUrl);
  state.imageUrl = '';
  state.mode = '';
  state.values = {};
  state.hiddenCosts = [];
  uploadInput.value = '';
  facePreview.hidden = true;
  packagePreview.hidden = true;
  resultPreview.hidden = true;
  emptyPreview.hidden = false;
  captureNext.disabled = true;
  packageNext.disabled = true;
  metadataTags.replaceChildren();
  document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
    input.checked = false;
  });
  reflectionResponse.hidden = true;
  cameraMessage.textContent = 'Camera access is optional. Upload remains available if access is unavailable or denied.';
  costMessage.textContent = 'AWAITING HIDDEN COST SELECTION';
  setStage(0);
}

nextButtons.forEach((button) => {
  button.addEventListener('click', () => setStage(Math.min(state.stage + 1, stages.length - 1)));
});

startCameraButton.addEventListener('click', startCamera);
takePhotoButton.addEventListener('click', takePhoto);
uploadInput.addEventListener('change', uploadImage);
startAgainButton.addEventListener('click', resetExperience);
restartFinalButton.addEventListener('click', resetExperience);

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

setStage(0);
