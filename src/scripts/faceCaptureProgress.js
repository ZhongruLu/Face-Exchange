// Session-only pose coverage. This is completion, never an identity/confidence score.
export const CAPTURE_DIRECTIONS = ['left', 'right', 'up', 'down'];

export function createCaptureCompletionGate() {
  let sent=false;
  return {
    reset(){sent=false;},
    take(state,{active,tracking,demo}) {
      if(sent||!active||!tracking||demo||!state.complete||state.percent!==100)return false;
      sent=true;return true;
    },
  };
}

export function createFaceCaptureProgress() {
  const holds = { center: 0, left: 0, right: 0, up: 0, down: 0 };
  const done = new Set();
  let baseline = null, calibrationTime = 0, yawSum = 0, pitchSum = 0;
  function reset() {
    Object.keys(holds).forEach(key => { holds[key] = 0; });
    done.clear(); baseline = null; calibrationTime = 0; yawSum = 0; pitchSum = 0;
  }
  function sample(yaw, pitch, delta, detected = true) {
    const dt = Math.min(Math.max(delta, 0), 0.12);
    if (!detected || !Number.isFinite(yaw) || !Number.isFinite(pitch)) {
      Object.keys(holds).forEach(key => { if (!done.has(key)) holds[key] = 0; });
      if (!baseline) { calibrationTime = 0; yawSum = 0; pitchSum = 0; }
      return;
    }
    if (!baseline) {
      calibrationTime += dt; yawSum += yaw * dt; pitchSum += pitch * dt;
      holds.center = Math.min(1, calibrationTime / 0.7);
      if (calibrationTime >= 0.7) {
        baseline = { yaw: yawSum / calibrationTime, pitch: pitchSum / calibrationTime };
        done.add('center');
      }
      return;
    }
    const y = yaw - baseline.yaw, p = pitch - baseline.pitch;
    // Landmarker camera coordinates: positive yaw faces the user's left.
    const matching = { left: y > 0.24, right: y < -0.24, up: p > 0.18, down: p < -0.18 };
    for (const key of CAPTURE_DIRECTIONS) {
      if (done.has(key)) continue;
      holds[key] = matching[key] ? Math.min(1, holds[key] + dt / 0.65) : 0;
      if (holds[key] >= 1) done.add(key);
    }
  }
  function snapshot() {
    const complete = done.size === 5;
    const value = Object.values(holds).reduce((sum, n) => sum + n, 0) * 20;
    return { percent: complete ? 100 : Math.min(99, Math.floor(value)), complete,
      calibrated: !!baseline, done: [...done], next: !baseline ? 'center' : CAPTURE_DIRECTIONS.find(key => !done.has(key)) || null };
  }
  return { reset, sample, snapshot };
}
