// Reconocimiento de gestos a partir de los 21 puntos de MediaPipe. Sin dependencias.

export const GESTURES = {
  fist: { emoji: '✊', label: 'Puño' },
  one: { emoji: '☝️', label: '1 dedo (índice)' },
  two: { emoji: '✌️', label: '2 dedos' },
  three: { emoji: '3️⃣', label: '3 dedos (índice, corazón, anular)' },
  four: { emoji: '4️⃣', label: '4 dedos (pulgar dentro)' },
  five: { emoji: '🖐️', label: 'Mano abierta' },
  shaka: { emoji: '🤙', label: 'Pulgar + meñique' },
  rock: { emoji: '🤘', label: 'Índice + meñique' },
  thumb: { emoji: '👍', label: 'Pulgar arriba' },
};

// Gestos asignables (el puño tiene función fija).
export const ASSIGNABLE = ['one', 'two', 'three', 'four', 'five', 'shaka', 'rock', 'thumb'];

// Un dedo está estirado si su punta está claramente más lejos de la muñeca que su articulación media.
const FINGER_EXTENDED_RATIO = 1.15;
// Pulgar fuera: la punta se aleja de la base del índice más de esta fracción del tamaño de la palma.
const THUMB_OUT_RATIO = 0.5;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

// Devuelve [pulgar, índice, corazón, anular, meñique] como booleanos.
// Usa preferiblemente worldLandmarks (en metros), que no dependen de la distancia a la cámara.
export function fingerStates(lm) {
  const wrist = lm[0];
  const palm = dist(wrist, lm[9]);
  const thumb = dist(lm[4], lm[9]) > dist(lm[3], lm[9]) && dist(lm[4], lm[5]) > THUMB_OUT_RATIO * palm;
  const others = [[6, 8], [10, 12], [14, 16], [18, 20]].map(
    ([pip, tip]) => dist(wrist, lm[tip]) > dist(wrist, lm[pip]) * FINGER_EXTENDED_RATIO
  );
  return [thumb, ...others];
}

// El pulgar solo cuenta donde hace falta para distinguir gestos (es el dedo menos fiable).
export function classify([t, i, m, r, p]) {
  if (!i && !m && !r && !p) return t ? 'thumb' : 'fist';
  if (!i && !m && !r && p) return t ? 'shaka' : null;
  if (i && !m && !r && p) return 'rock';
  if (i && !m && !r && !p) return 'one';
  if (i && m && !r && !p) return 'two';
  if (i && m && r && !p) return 'three';
  if (i && m && r && p) return t ? 'five' : 'four';
  return null;
}

// Evita parpadeos: un gesto solo se acepta tras verse `frames` veces seguidas.
export class Stabilizer {
  constructor(frames = 4) {
    this.frames = frames;
    this.candidate = null;
    this.count = 0;
    this.stable = null;
  }

  update(gesture) {
    if (gesture === this.candidate) this.count++;
    else {
      this.candidate = gesture;
      this.count = 1;
    }
    if (gesture && this.count >= this.frames) this.stable = gesture;
    return this.stable;
  }

  reset() {
    this.candidate = null;
    this.count = 0;
    this.stable = null;
  }
}

// Decide qué mano detectada es la izquierda y cuál la derecha del músico.
// mode 'screen': por posición en la imagen en espejo; 'model' / 'modelSwapped': por la etiqueta de MediaPipe.
export function assignHands(result, mode = 'screen') {
  const hands = result.landmarks.map((lm, i) => ({
    landmarks: lm,
    world: result.worldLandmarks?.[i] ?? lm,
    label: result.handedness?.[i]?.[0]?.categoryName,
  }));
  const out = { left: null, right: null };
  if (mode === 'screen') {
    // La imagen de la cámara no está en espejo: la mano izquierda del músico sale a la derecha (x mayor).
    if (hands.length >= 2) {
      const [a, b] = [...hands].sort((h1, h2) => h2.landmarks[0].x - h1.landmarks[0].x);
      out.left = a;
      out.right = b;
    } else if (hands.length === 1) {
      out[hands[0].landmarks[0].x > 0.5 ? 'left' : 'right'] = hands[0];
    }
    return out;
  }
  for (const h of hands) {
    let side = h.label === 'Left' ? 'left' : 'right';
    if (mode === 'modelSwapped') side = side === 'left' ? 'right' : 'left';
    if (!out[side]) out[side] = h;
  }
  return out;
}
