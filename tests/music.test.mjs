import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCALES, diatonicChord, romanNumeral, chordName, voiceChord, spellingForScale } from '../docs/js/music.js';
import { PATTERNS, notesForStep } from '../docs/js/patterns.js';

const names = (tonic, scale, sevenths) =>
  [0, 1, 2, 3, 4, 5, 6].map((d) =>
    chordName(diatonicChord(tonic, scale, d, sevenths), 'english', spellingForScale(tonic, scale)));

test('acordes diatónicos de Do mayor', () => {
  assert.deepEqual(names(0, 'major', false), ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  assert.deepEqual(names(0, 'major', true), ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7♭5']);
});

test('menor armónica y tonalidades con bemoles', () => {
  assert.deepEqual(names(9, 'harmonicMinor', false), ['Am', 'B°', 'C+', 'Dm', 'E', 'F', 'G♯°']);
  assert.deepEqual(names(5, 'major', false), ['F', 'Gm', 'Am', 'B♭', 'C', 'Dm', 'E°']);
});

test('todas las escalas dan acordes reconocibles', () => {
  for (const scale of Object.keys(SCALES)) {
    for (const sevenths of [false, true]) {
      for (let d = 0; d < 7; d++) {
        const c = diatonicChord(2, scale, d, sevenths);
        assert.ok(c.quality, `${scale} grado ${d + 1} séptima=${sevenths}`);
        assert.ok(romanNumeral(c, d));
      }
    }
  }
});

test('números romanos', () => {
  assert.equal(romanNumeral(diatonicChord(0, 'major', 1), 1), 'ii');
  assert.equal(romanNumeral(diatonicChord(0, 'major', 4, true), 4), 'V7');
  assert.equal(romanNumeral(diatonicChord(0, 'major', 6), 6), 'vii°');
});

test('inversiones de Do mayor', () => {
  const C = { root: 0, quality: 'maj' };
  assert.deepEqual(voiceChord(C, 'root').notes, [48, 52, 55]);
  assert.deepEqual(voiceChord(C, 'inv1').notes, [52, 55, 60]);
  assert.equal(voiceChord(C, 'inv1').bass % 12, 4); // Do/Mi
  assert.equal(voiceChord(C, 'inv1', false).bass % 12, 0);
  assert.deepEqual(voiceChord(C, 'inv2').notes, [55, 60, 64]);
  assert.deepEqual(voiceChord(C, 'inv3').notes, [48, 52, 55]); // tríada: vuelve a la fundamental
  assert.deepEqual(voiceChord({ root: 0, quality: 'maj7' }, 'inv3').notes, [59, 60, 64, 67]);
  assert.deepEqual(voiceChord(C, 'open').notes, [48, 55, 64]);
  assert.deepEqual(voiceChord(C, 'octUp').notes, [60, 64, 67]);
});

test('los patrones solo usan pasos válidos y producen notas', () => {
  const v = voiceChord({ root: 7, quality: '7' });
  for (const [id, p] of Object.entries(PATTERNS)) {
    for (const step of Object.keys(p.events)) assert.ok(Number(step) < p.steps, `${id} paso ${step}`);
    const all = Array.from({ length: p.steps }, (_, s) => notesForStep(id, s, v)).flat();
    assert.ok(all.length > 0, id);
    for (const ev of all) for (const n of ev.notes) assert.ok(Number.isInteger(n) && n > 20 && n < 100, `${id} ${n}`);
  }
});
