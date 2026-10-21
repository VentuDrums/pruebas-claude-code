import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fingerStates, classify, Stabilizer, assignHands } from '../docs/js/gestures.js';

// Mano sintética con la palma hacia la cámara: muñeca abajo, dedos hacia arriba (y negativa = arriba).
// `up` = [pulgar, índice, corazón, anular, meñique] estirados o doblados.
function hand(up) {
  const p = (x, y) => ({ x, y, z: 0 });
  const lm = new Array(21);
  lm[0] = p(0, 0);
  // Pulgar: base hacia la izquierda; estirado sale hacia fuera, doblado cruza la palma.
  lm[1] = p(-0.02, -0.02);
  lm[2] = p(-0.035, -0.035);
  lm[3] = p(-0.045, -0.05);
  lm[4] = up[0] ? p(-0.06, -0.075) : p(0.005, -0.06);
  // Resto de dedos: MCP, PIP, DIP, TIP.
  const xs = [-0.02, 0, 0.02, 0.04];
  [5, 9, 13, 17].forEach((mcp, f) => {
    const x = xs[f];
    lm[mcp] = p(x, -0.08);
    if (up[f + 1]) {
      lm[mcp + 1] = p(x, -0.11);
      lm[mcp + 2] = p(x, -0.13);
      lm[mcp + 3] = p(x, -0.15);
    } else {
      lm[mcp + 1] = p(x, -0.1);
      lm[mcp + 2] = p(x, -0.08);
      lm[mcp + 3] = p(x, -0.065);
    }
  });
  return lm;
}

const cases = {
  fist: [0, 0, 0, 0, 0],
  thumb: [1, 0, 0, 0, 0],
  one: [0, 1, 0, 0, 0],
  two: [0, 1, 1, 0, 0],
  three: [0, 1, 1, 1, 0],
  four: [0, 1, 1, 1, 1],
  five: [1, 1, 1, 1, 1],
  shaka: [1, 0, 0, 0, 1],
  rock: [0, 1, 0, 0, 1],
};

for (const [gesture, up] of Object.entries(cases)) {
  test(`reconoce ${gesture}`, () => {
    const lm = hand(up.map(Boolean));
    assert.deepEqual(fingerStates(lm), up.map(Boolean));
    assert.equal(classify(fingerStates(lm)), gesture);
  });
}

test('el pulgar no cambia los gestos de contar 1-3', () => {
  assert.equal(classify([true, true, false, false, false]), 'one');
  assert.equal(classify([true, true, true, true, false]), 'three');
  assert.equal(classify([false, false, true, false, false]), null);
});

test('el estabilizador espera a que el gesto se repita', () => {
  const s = new Stabilizer(3);
  assert.equal(s.update('one'), null);
  assert.equal(s.update('one'), null);
  assert.equal(s.update('one'), 'one');
  assert.equal(s.update('two'), 'one');
  assert.equal(s.update(null), 'one');
  assert.equal(s.update('two'), 'one');
  assert.equal(s.update('two'), 'one');
  assert.equal(s.update('two'), 'two');
});

test('asigna las manos por posición en pantalla', () => {
  const at = (x) => [{ x, y: 0.5, z: 0 }];
  const two = assignHands({ landmarks: [at(0.2), at(0.8)], worldLandmarks: [], handedness: [] });
  assert.equal(two.left.landmarks[0].x, 0.8);
  assert.equal(two.right.landmarks[0].x, 0.2);
  const one = assignHands({ landmarks: [at(0.3)], worldLandmarks: [], handedness: [] });
  assert.equal(one.left, null);
  assert.equal(one.right.landmarks[0].x, 0.3);
  const byModel = assignHands(
    { landmarks: [at(0.2)], worldLandmarks: [], handedness: [[{ categoryName: 'Left' }]] }, 'model');
  assert.ok(byModel.left);
});
