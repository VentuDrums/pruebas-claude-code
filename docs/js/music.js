// Teoría musical: escalas, acordes, nombres y voicings. Sin dependencias (se puede testear con node).

export const NOTE_NAMES = {
  english: {
    sharp: ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
    flat: ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'],
    mixed: ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'],
  },
  latin: {
    sharp: ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'],
    flat: ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'],
    mixed: ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Fa♯', 'Sol', 'La♭', 'La', 'Si♭', 'Si'],
  },
};

export const SCALES = {
  major: { name: 'Mayor (jónica)', steps: [0, 2, 4, 5, 7, 9, 11] },
  minor: { name: 'Menor natural (eólica)', steps: [0, 2, 3, 5, 7, 8, 10] },
  harmonicMinor: { name: 'Menor armónica', steps: [0, 2, 3, 5, 7, 8, 11] },
  melodicMinor: { name: 'Menor melódica', steps: [0, 2, 3, 5, 7, 9, 11] },
  dorian: { name: 'Dórica', steps: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { name: 'Frigia', steps: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { name: 'Lidia', steps: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { name: 'Mixolidia', steps: [0, 2, 4, 5, 7, 9, 10] },
  locrian: { name: 'Locria', steps: [0, 1, 3, 5, 6, 8, 10] },
};

export const QUALITIES = {
  maj: { name: 'Mayor', suffix: '', intervals: [0, 4, 7] },
  min: { name: 'Menor', suffix: 'm', intervals: [0, 3, 7] },
  dim: { name: 'Disminuido', suffix: '°', intervals: [0, 3, 6] },
  aug: { name: 'Aumentado', suffix: '+', intervals: [0, 4, 8] },
  sus2: { name: 'Sus2', suffix: 'sus2', intervals: [0, 2, 7] },
  sus4: { name: 'Sus4', suffix: 'sus4', intervals: [0, 5, 7] },
  '6': { name: 'Sexta', suffix: '6', intervals: [0, 4, 7, 9] },
  m6: { name: 'Menor sexta', suffix: 'm6', intervals: [0, 3, 7, 9] },
  '7': { name: 'Séptima (dominante)', suffix: '7', intervals: [0, 4, 7, 10] },
  maj7: { name: 'Séptima mayor', suffix: 'maj7', intervals: [0, 4, 7, 11] },
  m7: { name: 'Menor séptima', suffix: 'm7', intervals: [0, 3, 7, 10] },
  mMaj7: { name: 'Menor con 7ª mayor', suffix: 'm(maj7)', intervals: [0, 3, 7, 11] },
  m7b5: { name: 'Semidisminuido', suffix: 'm7♭5', intervals: [0, 3, 6, 10] },
  dim7: { name: 'Disminuido 7ª', suffix: '°7', intervals: [0, 3, 6, 9] },
  maj7s5: { name: 'Séptima mayor aumentado', suffix: 'maj7♯5', intervals: [0, 4, 8, 11] },
  add9: { name: 'Add9', suffix: 'add9', intervals: [0, 4, 7, 14] },
  madd9: { name: 'Menor add9', suffix: 'm(add9)', intervals: [0, 3, 7, 14] },
  '9': { name: 'Novena', suffix: '9', intervals: [0, 4, 7, 10, 14] },
  maj9: { name: 'Novena mayor', suffix: 'maj9', intervals: [0, 4, 7, 11, 14] },
  m9: { name: 'Menor novena', suffix: 'm9', intervals: [0, 3, 7, 10, 14] },
  '5': { name: 'Quinta (power chord)', suffix: '5', intervals: [0, 7] },
};

export const INVERSIONS = {
  root: { name: 'Estado fundamental' },
  inv1: { name: '1ª inversión' },
  inv2: { name: '2ª inversión' },
  inv3: { name: '3ª inversión' },
  open: { name: 'Abierto (posición abierta)' },
  octDown: { name: 'Octava grave' },
  octUp: { name: 'Octava aguda' },
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Tonalidades que suelen escribirse con bemoles.
const FLAT_MAJOR_TONICS = [1, 3, 5, 8, 10];
const FLAT_MINOR_TONICS = [0, 2, 3, 5, 7, 10];

const mod12 = (n) => ((n % 12) + 12) % 12;

export function spellingForScale(tonic, scaleId) {
  const majorThird = SCALES[scaleId].steps[2] === 4;
  const flats = majorThird ? FLAT_MAJOR_TONICS : FLAT_MINOR_TONICS;
  return flats.includes(tonic) ? 'flat' : 'sharp';
}

export function noteName(pc, notation = 'english', spelling = 'mixed') {
  return NOTE_NAMES[notation][spelling][mod12(pc)];
}

export function chordName(chord, notation = 'english', spelling = 'mixed') {
  if (!chord) return '—';
  return noteName(chord.root, notation, spelling) + QUALITIES[chord.quality].suffix;
}

function qualityFromIntervals(intervals) {
  const key = intervals.join(',');
  return Object.keys(QUALITIES).find((q) => QUALITIES[q].intervals.join(',') === key) ?? null;
}

// Acorde diatónico sobre el grado `degree` (0-6) apilando terceras de la escala.
export function diatonicChord(tonic, scaleId, degree, sevenths = false) {
  const steps = SCALES[scaleId].steps;
  const count = sevenths ? 4 : 3;
  const rootStep = steps[degree];
  const intervals = [];
  for (let i = 0; i < count; i++) {
    const idx = degree + i * 2;
    const step = steps[idx % 7] + 12 * Math.floor(idx / 7);
    intervals.push(step - rootStep);
  }
  return { root: mod12(tonic + rootStep), quality: qualityFromIntervals(intervals) };
}

export function romanNumeral(chord, degree) {
  const q = QUALITIES[chord.quality];
  const minorThird = q.intervals[1] === 3;
  let numeral = minorThird ? ROMAN[degree].toLowerCase() : ROMAN[degree];
  if (chord.quality === 'dim') numeral += '°';
  else if (chord.quality === 'aug') numeral += '+';
  else if (chord.quality === 'm7b5') numeral += 'ø7';
  else if (chord.quality === 'dim7') numeral += '°7';
  else if (chord.quality === 'maj7s5') numeral += '+maj7';
  else if (q.intervals.length === 4) numeral += chord.quality === 'maj7' || chord.quality === 'mMaj7' ? 'maj7' : '7';
  return numeral;
}

// Devuelve las notas MIDI del acorde (agudas) y la nota del bajo.
export function voiceChord(chord, inversion = 'root', bassFollows = true) {
  const q = QUALITIES[chord.quality];
  const base = 48 + chord.root; // Do3–Si3
  let notes = q.intervals.map((i) => base + i);
  let bassPc = chord.root;

  const rotations = { inv1: 1, inv2: 2, inv3: 3 }[inversion] ?? 0;
  if (rotations) {
    const k = rotations % notes.length;
    notes = [...notes.slice(k), ...notes.slice(0, k).map((n) => n + 12)];
    if (bassFollows) bassPc = mod12(notes[0]);
  }
  if (inversion === 'open' && notes.length >= 3) {
    // Sube la segunda nota más grave una octava: Do-Mi-Sol pasa a Do-Sol-Mi.
    const sorted = [...notes].sort((a, b) => a - b);
    sorted[1] += 12;
    notes = sorted;
  }
  notes.sort((a, b) => a - b);
  while (notes[0] >= 60) notes = notes.map((n) => n - 12);
  if (inversion === 'octDown') notes = notes.map((n) => n - 12);
  if (inversion === 'octUp') notes = notes.map((n) => n + 12);

  const bass = 36 + mod12(bassPc); // Do2–Si2
  const fifth = 36 + mod12(chord.root + (q.intervals.includes(7) ? 7 : q.intervals[2] ?? 7));
  return { notes, bass, fifth };
}
