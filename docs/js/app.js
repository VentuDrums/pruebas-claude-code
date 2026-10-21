/* global Tone */
import {
  SCALES, QUALITIES, INVERSIONS, NOTE_NAMES,
  diatonicChord, romanNumeral, chordName, spellingForScale, voiceChord,
} from './music.js';
import { GESTURES, ASSIGNABLE, fingerStates, classify, Stabilizer, assignHands } from './gestures.js';
import { PATTERNS, notesForStep } from './patterns.js';
import { Audio, INSTRUMENTS } from './audio.js';

const MEDIAPIPE = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const HAND_MODEL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const STORAGE_KEY = 'acordes-manos-v1';

// Grado de la escala (0 = I) que toca cada gesto en el modo escala.
const SCALE_DEGREES = { one: 0, two: 1, three: 2, four: 3, five: 4, shaka: 5, rock: 6 };

const DEFAULTS = {
  leftMode: 'scale',
  tonic: 0,
  scale: 'major',
  sevenths: false,
  custom: {
    one: { root: 0, quality: 'maj' }, two: { root: 9, quality: 'min' }, three: { root: 5, quality: 'maj' },
    four: { root: 7, quality: 'maj' }, five: { root: 2, quality: 'min' }, shaka: { root: 4, quality: 'min' },
    rock: { root: 7, quality: '7' }, thumb: { root: 10, quality: 'maj' },
  },
  rightMode: 'inversion',
  invMap: {
    one: 'root', two: 'inv1', three: 'inv2', four: 'inv3',
    five: 'open', shaka: 'octDown', rock: 'octUp', thumb: 'root',
  },
  patMap: {
    one: 'pad', two: 'quarters', three: 'pop', four: 'arpUp',
    five: 'arpUpDown', shaka: 'waltz', rock: 'offbeat', thumb: 'bossa',
  },
  inversion: 'root',
  pattern: 'pop',
  bassFollows: true,
  bpm: 90,
  instrument: 'piano',
  volume: -6,
  notation: 'latin',
  handAssign: 'screen',
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return {
      ...structuredClone(DEFAULTS), ...saved,
      custom: { ...DEFAULTS.custom, ...saved.custom },
      invMap: { ...DEFAULTS.invMap, ...saved.invMap },
      patMap: { ...DEFAULTS.patMap, ...saved.patMap },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* sin almacenamiento: los ajustes duran lo que dure la página */ }
}

const state = loadState();
const live = {
  chord: null,        // { root, quality }
  label: '',          // grado en romanos o vacío
  silenced: false,
  active: { left: null, right: null },  // último gesto aplicado por cada mano
  seen: { left: null, right: null },    // gesto detectado ahora mismo (o null)
  fingers: { left: null, right: null },
  retrigger: false,
  step: 0,
  playing: false,
};

let audio = null;
let landmarker = null;
const stabilizers = { left: new Stabilizer(4), right: new Stabilizer(4) };
const lastStable = { left: null, right: null };

const $ = (sel) => document.querySelector(sel);

// ---------- Lógica musical ----------

function spelling() {
  return state.leftMode === 'scale' ? spellingForScale(state.tonic, state.scale) : 'mixed';
}

function name(chord) {
  return chordName(chord, state.notation, spelling());
}

function chordForGesture(g) {
  if (state.leftMode === 'scale') {
    const degree = SCALE_DEGREES[g];
    if (degree === undefined) return null;
    const chord = diatonicChord(state.tonic, state.scale, degree, state.sevenths);
    return { chord, label: romanNumeral(chord, degree) };
  }
  return { chord: state.custom[g], label: '' };
}

function applyLeft(g) {
  if (g === 'fist') {
    live.active.left = g;
    live.silenced = true;
    audio?.silence();
  } else {
    const result = chordForGesture(g);
    if (!result) return;
    live.active.left = g;
    live.chord = result.chord;
    live.label = result.label;
    live.silenced = false;
    live.retrigger = true;
  }
  renderAll();
}

function applyRight(g) {
  if (g === 'fist') return; // el puño de la derecha deja todo como está
  live.active.right = g;
  if (state.rightMode === 'inversion') state.inversion = state.invMap[g];
  else state.pattern = state.patMap[g];
  live.retrigger = true;
  saveState();
  renderAll();
}

function onStep(time) {
  const pattern = PATTERNS[state.pattern];
  const step = live.step % pattern.steps;
  live.step++;
  Tone.Draw.schedule(() => renderBeat(step, pattern.steps), time);
  if (!live.chord || live.silenced) return;

  const voicing = voiceChord(live.chord, state.inversion, state.bassFollows);
  if (pattern.sustain) {
    if (step !== 0 && !live.retrigger) return;
    audio.instrument.releaseAll(time);
  }
  live.retrigger = false;
  for (const ev of notesForStep(state.pattern, step, voicing)) {
    audio.play(ev.notes, ev.duration, time, ev.velocity);
  }
}

async function toggleSound() {
  await Tone.start();
  if (!audio) {
    audio = new Audio();
    audio.setInstrument(state.instrument);
    audio.setVolume(state.volume);
    Tone.Transport.bpm.value = state.bpm;
    Tone.Transport.scheduleRepeat(onStep, '16n');
  }
  live.playing = !live.playing;
  if (live.playing) {
    live.step = 0;
    live.retrigger = true;
    Tone.Transport.start('+0.05');
  } else {
    Tone.Transport.stop();
    audio.silence();
  }
  renderControls();
}

// ---------- Cámara y MediaPipe ----------

async function startCamera() {
  const btn = $('#camBtn');
  btn.disabled = true;
  setCamMsg('Cargando el modelo de manos…');
  try {
    const { FilesetResolver, HandLandmarker } = await import(`${MEDIAPIPE}/vision_bundle.mjs`);
    const vision = await FilesetResolver.forVisionTasks(`${MEDIAPIPE}/wasm`);
    const options = (delegate) => ({
      baseOptions: { modelAssetPath: HAND_MODEL, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    });
    try {
      landmarker = await HandLandmarker.createFromOptions(vision, options('GPU'));
    } catch {
      landmarker = await HandLandmarker.createFromOptions(vision, options('CPU'));
    }
    setCamMsg('Pidiendo permiso para usar la cámara…');
    const video = $('#cam');
    video.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
    });
    await video.play();
    setCamMsg('');
    btn.textContent = '📷 Cámara activa';
    requestAnimationFrame(trackLoop);
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    setCamMsg(`No se pudo activar la cámara: ${err.message}. Puedes seguir probando los acordes con los botones ▶.`);
  }
}

function setCamMsg(text) {
  $('#camMsg').textContent = text;
  $('#camMsg').hidden = !text;
}

let lastVideoTime = -1;
function trackLoop() {
  const video = $('#cam');
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const result = landmarker.detectForVideo(video, performance.now());
    const hands = assignHands(result, state.handAssign);
    for (const side of ['left', 'right']) {
      const hand = hands[side];
      if (!hand) {
        stabilizers[side].reset();
        live.seen[side] = null;
        live.fingers[side] = null;
        continue;
      }
      const fingers = fingerStates(hand.world);
      live.fingers[side] = fingers;
      live.seen[side] = classify(fingers);
      const stable = stabilizers[side].update(live.seen[side]);
      if (stable && stable !== lastStable[side]) {
        lastStable[side] = stable;
        (side === 'left' ? applyLeft : applyRight)(stable);
      }
    }
    drawFrame(video, hands);
    renderLiveHands();
  }
  requestAnimationFrame(trackLoop);
}

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];
const HAND_COLORS = { left: '#3ee6ff', right: '#ff5fd8' };

function drawFrame(video, hands) {
  const canvas = $('#view');
  const ctx = canvas.getContext('2d');
  const w = (canvas.width = video.videoWidth);
  const h = (canvas.height = video.videoHeight);
  ctx.save();
  ctx.translate(w, 0);
  ctx.scale(-1, 1); // espejo, como al mirarse
  ctx.drawImage(video, 0, 0, w, h);
  for (const side of ['left', 'right']) {
    const hand = hands[side];
    if (!hand) continue;
    const pts = hand.landmarks.map((p) => [p.x * w, p.y * h]);
    ctx.strokeStyle = HAND_COLORS[side];
    ctx.lineWidth = 4;
    for (const [a, b] of CONNECTIONS) {
      ctx.beginPath();
      ctx.moveTo(...pts[a]);
      ctx.lineTo(...pts[b]);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const side of ['left', 'right']) {
    const hand = hands[side];
    const g = live.seen[side];
    if (!hand || !g) continue;
    const wrist = hand.landmarks[0];
    ctx.fillText(GESTURES[g].emoji, (1 - wrist.x) * w, wrist.y * h + 70);
  }
}

// ---------- Interfaz ----------

function options(entries, selected) {
  return entries
    .map(([value, label]) => `<option value="${value}"${String(value) === String(selected) ? ' selected' : ''}>${label}</option>`)
    .join('');
}

function rootOptions(selected) {
  const n = NOTE_NAMES[state.notation];
  return options(
    n.sharp.map((s, pc) => [pc, s === n.flat[pc] ? s : `${s} / ${n.flat[pc]}`]),
    selected
  );
}

function gestureCell(g) {
  return `<td class="gesture"><span class="emoji">${GESTURES[g].emoji}</span><span>${GESTURES[g].label}</span></td>`;
}

function playButton(side, g) {
  return `<td><button class="try" data-side="${side}" data-gesture="${g}" aria-label="Probar ${GESTURES[g].label}">▶</button></td>`;
}

function renderLeftPanel() {
  $('#leftModeScale').setAttribute('aria-pressed', state.leftMode === 'scale');
  $('#leftModeCustom').setAttribute('aria-pressed', state.leftMode === 'custom');
  $('#customOpts').hidden = state.leftMode !== 'custom';
  $('#tonic').innerHTML = rootOptions(state.tonic);
  $('#scale').innerHTML = options(Object.entries(SCALES).map(([id, s]) => [id, s.name]), state.scale);
  $('#sevenths').checked = state.sevenths;

  const rows = [`<tr class="fixed${live.active.left === 'fist' ? ' active' : ''}">${gestureCell('fist')}<td colspan="2">Silencio</td>${playButton('left', 'fist')}</tr>`];
  for (const g of ASSIGNABLE) {
    const isActive = live.active.left === g ? ' active' : '';
    if (state.leftMode === 'scale') {
      const res = chordForGesture(g);
      rows.push(res
        ? `<tr class="${isActive}">${gestureCell(g)}<td class="degree">${res.label}</td><td class="chord-name">${name(res.chord)}</td>${playButton('left', g)}</tr>`
        : `<tr class="unused">${gestureCell(g)}<td colspan="3">Sin asignar en este modo</td></tr>`);
    } else {
      const c = state.custom[g];
      rows.push(`<tr class="${isActive}">${gestureCell(g)}
        <td><select data-custom-root="${g}" aria-label="Nota del acorde">${rootOptions(c.root)}</select>
            <select data-custom-quality="${g}" aria-label="Tipo de acorde">${options(Object.entries(QUALITIES).map(([id, q]) => [id, q.name]), c.quality)}</select></td>
        <td class="chord-name">${name(c)}</td>${playButton('left', g)}</tr>`);
    }
  }
  $('#leftHead').innerHTML = state.leftMode === 'scale'
    ? '<tr><th>Gesto</th><th>Grado</th><th>Acorde</th><th></th></tr>'
    : '<tr><th>Gesto</th><th>Acorde que toca</th><th>Nombre</th><th></th></tr>';
  $('#leftTable').innerHTML = rows.join('');
}

function renderRightPanel() {
  const inv = state.rightMode === 'inversion';
  $('#rightModeInv').setAttribute('aria-pressed', inv);
  $('#rightModePat').setAttribute('aria-pressed', !inv);
  $('#inversion').innerHTML = options(Object.entries(INVERSIONS).map(([id, i]) => [id, i.name]), state.inversion);
  $('#pattern').innerHTML = options(Object.entries(PATTERNS).map(([id, p]) => [id, p.name]), state.pattern);
  $('#bassFollows').checked = state.bassFollows;
  $('#rightHint').textContent = inv
    ? 'Cada gesto de la mano derecha cambia la inversión. El acompañamiento se queda como esté arriba.'
    : 'Cada gesto de la mano derecha cambia el ritmo de acompañamiento. La inversión se queda como esté arriba.';

  const map = inv ? state.invMap : state.patMap;
  const choices = inv
    ? Object.entries(INVERSIONS).map(([id, i]) => [id, i.name])
    : Object.entries(PATTERNS).map(([id, p]) => [id, p.name]);
  const rows = [`<tr class="fixed">${gestureCell('fist')}<td>Mantener (no cambia nada)</td><td></td></tr>`];
  for (const g of ASSIGNABLE) {
    const isActive = live.active.right === g ? ' active' : '';
    rows.push(`<tr class="${isActive}">${gestureCell(g)}
      <td><select data-right-map="${g}" aria-label="Qué hace ${GESTURES[g].label}">${options(choices, map[g])}</select></td>
      ${playButton('right', g)}</tr>`);
  }
  $('#rightHead').innerHTML = `<tr><th>Gesto</th><th>${inv ? 'Inversión' : 'Acompañamiento'}</th><th></th></tr>`;
  $('#rightTable').innerHTML = rows.join('');
}

function renderControls() {
  $('#soundBtn').textContent = live.playing ? '⏸ Parar' : '▶ Tocar';
  $('#soundBtn').setAttribute('aria-pressed', live.playing);
  $('#bpm').value = state.bpm;
  $('#bpmValue').textContent = state.bpm;
  $('#volume').value = state.volume;
  $('#instrument').innerHTML = options(Object.entries(INSTRUMENTS).map(([id, i]) => [id, i.name]), state.instrument);
  $('#notation').value = state.notation;
  $('#handAssign').value = state.handAssign;
}

function renderHud() {
  $('#chordName').textContent = live.silenced ? '✊ silencio' : name(live.chord);
  $('#chordDegree').textContent = live.silenced ? '' : live.label;
  if (live.chord && !live.silenced) {
    const v = voiceChord(live.chord, state.inversion, state.bassFollows);
    const n = NOTE_NAMES[state.notation][spelling()];
    $('#chordNotes').textContent = `Bajo ${n[v.bass % 12]} · ${v.notes.map((m) => n[m % 12]).join(' – ')}`;
  } else {
    $('#chordNotes').textContent = '';
  }
  $('#hudInversion').textContent = INVERSIONS[state.inversion].name;
  $('#hudPattern').textContent = PATTERNS[state.pattern].name;
  $('#hudLeftMode').textContent = state.leftMode === 'scale'
    ? `Escala: ${NOTE_NAMES[state.notation][spelling()][state.tonic]} ${SCALES[state.scale].name.toLowerCase()}`
    : 'Acordes personalizados';
  $('#hudRightMode').textContent = state.rightMode === 'inversion' ? 'Modo inversión' : 'Modo ritmo';
}

function renderLiveHands() {
  for (const side of ['left', 'right']) {
    const g = live.seen[side];
    const f = live.fingers[side];
    $(`#${side}Seen`).textContent = f ? (g ? `${GESTURES[g].emoji} ${GESTURES[g].label}` : '¿? gesto no reconocido') : 'No la veo';
    $(`#${side}Fingers`).textContent = f ? f.map((on) => (on ? '●' : '○')).join('') : '';
  }
}

function renderBeat(step, steps) {
  const beatLen = 4;
  const beats = steps / beatLen;
  const dots = $('#beat');
  if (dots.children.length !== beats) dots.innerHTML = '<span></span>'.repeat(beats);
  [...dots.children].forEach((d, i) => d.classList.toggle('on', i === Math.floor(step / beatLen)));
}

function renderAll() {
  renderLeftPanel();
  renderRightPanel();
  renderHud();
}

// ---------- Eventos ----------

function bind() {
  $('#soundBtn').addEventListener('click', toggleSound);
  $('#camBtn').addEventListener('click', startCamera);

  $('#bpm').addEventListener('input', (e) => {
    state.bpm = Number(e.target.value);
    $('#bpmValue').textContent = state.bpm;
    if (audio) Tone.Transport.bpm.rampTo(state.bpm, 0.1);
    saveState();
  });
  $('#volume').addEventListener('input', (e) => {
    state.volume = Number(e.target.value);
    audio?.setVolume(state.volume);
    saveState();
  });
  $('#instrument').addEventListener('change', (e) => {
    state.instrument = e.target.value;
    audio?.setInstrument(state.instrument);
    live.retrigger = true;
    saveState();
  });
  $('#notation').addEventListener('change', (e) => {
    state.notation = e.target.value;
    saveState();
    renderAll();
  });
  $('#handAssign').addEventListener('change', (e) => {
    state.handAssign = e.target.value;
    saveState();
  });

  const setLeftMode = (mode) => {
    state.leftMode = mode;
    // Al cambiar de modo, el gesto activo pasa a tocar el acorde del nuevo modo.
    if (live.active.left && live.active.left !== 'fist') applyLeft(live.active.left);
    saveState();
    renderAll();
  };
  $('#leftModeScale').addEventListener('click', () => setLeftMode('scale'));
  $('#leftModeCustom').addEventListener('click', () => setLeftMode('custom'));

  const setRightMode = (mode) => {
    state.rightMode = mode;
    live.active.right = null;
    saveState();
    renderAll();
  };
  $('#rightModeInv').addEventListener('click', () => setRightMode('inversion'));
  $('#rightModePat').addEventListener('click', () => setRightMode('pattern'));

  const refreshLeft = () => {
    if (live.active.left && live.active.left !== 'fist') applyLeft(live.active.left);
    saveState();
    renderAll();
  };
  $('#tonic').addEventListener('change', (e) => { state.tonic = Number(e.target.value); refreshLeft(); });
  $('#scale').addEventListener('change', (e) => { state.scale = e.target.value; refreshLeft(); });
  $('#sevenths').addEventListener('change', (e) => { state.sevenths = e.target.checked; refreshLeft(); });
  $('#copyFromScale').addEventListener('click', () => {
    for (const [g, degree] of Object.entries(SCALE_DEGREES)) {
      state.custom[g] = diatonicChord(state.tonic, state.scale, degree, state.sevenths);
    }
    refreshLeft();
  });

  $('#inversion').addEventListener('change', (e) => { state.inversion = e.target.value; live.retrigger = true; saveState(); renderHud(); });
  $('#pattern').addEventListener('change', (e) => { state.pattern = e.target.value; live.retrigger = true; saveState(); renderHud(); });
  $('#bassFollows').addEventListener('change', (e) => { state.bassFollows = e.target.checked; saveState(); renderHud(); });

  $('#leftTable').addEventListener('change', (e) => {
    const { customRoot, customQuality } = e.target.dataset;
    if (customRoot) state.custom[customRoot] = { ...state.custom[customRoot], root: Number(e.target.value) };
    if (customQuality) state.custom[customQuality] = { ...state.custom[customQuality], quality: e.target.value };
    refreshLeft();
  });
  $('#rightTable').addEventListener('change', (e) => {
    const g = e.target.dataset.rightMap;
    if (!g) return;
    (state.rightMode === 'inversion' ? state.invMap : state.patMap)[g] = e.target.value;
    if (live.active.right === g) applyRight(g);
    saveState();
  });

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button.try');
    if (!btn) return;
    if (!live.playing) await toggleSound();
    (btn.dataset.side === 'left' ? applyLeft : applyRight)(btn.dataset.gesture);
  });
}

bind();
renderControls();
renderAll();
