// Patrones de acompañamiento en una rejilla de semicorcheas (16 pasos = compás de 4/4, 12 = 3/4).
// Cada evento: [qué, duración, intensidad]. 'C' = acorde, 'B' = bajo, 'F' = quinta en el bajo,
// número = nota del arpegio (0 = la más grave del acorde; si pasa del número de notas sube de octava).

export const PATTERNS = {
  pad: {
    name: 'Bloque sostenido',
    steps: 16,
    sustain: true,
    events: { 0: [['B', '1m', 0.6], ['C', '1m', 0.6]] },
  },
  quarters: {
    name: 'Negras',
    steps: 16,
    events: {
      0: [['B', '4n', 0.8], ['C', '8n', 0.75]],
      4: [['C', '8n', 0.55]],
      8: [['B', '4n', 0.7], ['C', '8n', 0.65]],
      12: [['C', '8n', 0.55]],
    },
  },
  pop: {
    name: 'Rasgueo pop (corcheas)',
    steps: 16,
    events: {
      0: [['B', '2n', 0.8], ['C', '8n', 0.8]],
      2: [['C', '16n', 0.4]],
      4: [['C', '8n', 0.6]],
      6: [['C', '8n', 0.55]],
      8: [['B', '2n', 0.7], ['C', '16n', 0.45]],
      10: [['C', '8n', 0.7]],
      12: [['C', '8n', 0.6]],
      14: [['C', '16n', 0.45]],
    },
  },
  arpUp: {
    name: 'Arpegio ascendente',
    steps: 16,
    events: {
      0: [['B', '2n', 0.7], [0, '8n', 0.7]], 2: [[1, '8n', 0.55]], 4: [[2, '8n', 0.55]], 6: [[3, '8n', 0.6]],
      8: [[0, '8n', 0.6]], 10: [[1, '8n', 0.55]], 12: [[2, '8n', 0.55]], 14: [[3, '8n', 0.6]],
    },
  },
  arpUpDown: {
    name: 'Arpegio sube y baja',
    steps: 16,
    events: {
      0: [['B', '2n', 0.7], [0, '8n', 0.7]], 2: [[1, '8n', 0.55]], 4: [[2, '8n', 0.55]], 6: [[3, '8n', 0.65]],
      8: [[4, '8n', 0.6]], 10: [[3, '8n', 0.55]], 12: [[2, '8n', 0.55]], 14: [[1, '8n', 0.5]],
    },
  },
  alberti: {
    name: 'Bajo Alberti',
    steps: 16,
    events: {
      0: [[0, '8n', 0.7]], 2: [[2, '8n', 0.5]], 4: [[1, '8n', 0.55]], 6: [[2, '8n', 0.5]],
      8: [[0, '8n', 0.65]], 10: [[2, '8n', 0.5]], 12: [[1, '8n', 0.55]], 14: [[2, '8n', 0.5]],
    },
  },
  waltz: {
    name: 'Vals (3/4)',
    steps: 12,
    events: {
      0: [['B', '4n', 0.8]],
      4: [['C', '8n', 0.5]],
      8: [['C', '8n', 0.5]],
    },
  },
  offbeat: {
    name: 'Contratiempo (ska / reggae)',
    steps: 16,
    events: {
      0: [['B', '4n', 0.75]],
      2: [['C', '16n', 0.65]],
      6: [['C', '16n', 0.65]],
      8: [['F', '4n', 0.65]],
      10: [['C', '16n', 0.65]],
      14: [['C', '16n', 0.65]],
    },
  },
  bossa: {
    name: 'Bossa nova',
    steps: 16,
    events: {
      0: [['B', '8n.', 0.75], ['C', '16n', 0.55]],
      3: [['C', '16n', 0.5]],
      6: [['F', '8n', 0.6], ['C', '16n', 0.55]],
      8: [['B', '8n.', 0.7]],
      10: [['C', '16n', 0.55]],
      13: [['C', '16n', 0.5]],
      14: [['F', '8n', 0.6]],
    },
  },
};

// Convierte un paso del patrón en notas MIDI concretas.
export function notesForStep(pattern, step, voicing) {
  const events = PATTERNS[pattern].events[step % PATTERNS[pattern].steps] ?? [];
  return events.map(([what, duration, velocity]) => {
    let notes;
    if (what === 'C') notes = voicing.notes;
    else if (what === 'B') notes = [voicing.bass];
    else if (what === 'F') notes = [voicing.fifth];
    else {
      const len = voicing.notes.length;
      notes = [voicing.notes[what % len] + 12 * Math.floor(what / len)];
    }
    return { notes, duration, velocity };
  });
}
