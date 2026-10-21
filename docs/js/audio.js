// Sonido con Tone.js (cargado como script global en index.html).
/* global Tone */

const SALAMANDER = 'https://tonejs.github.io/audio/salamander/';

function pianoUrls() {
  const urls = { A0: 'A0.mp3', C8: 'C8.mp3' };
  for (let o = 1; o <= 7; o++) {
    urls[`C${o}`] = `C${o}.mp3`;
    urls[`D#${o}`] = `Ds${o}.mp3`;
    urls[`F#${o}`] = `Fs${o}.mp3`;
    urls[`A${o}`] = `A${o}.mp3`;
  }
  return urls;
}

export const INSTRUMENTS = {
  piano: {
    name: 'Piano',
    create: () => new Tone.Sampler({ urls: pianoUrls(), baseUrl: SALAMANDER, release: 1 }),
  },
  epiano: {
    name: 'Piano eléctrico',
    create: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 4,
        oscillator: { type: 'sine' },
        modulation: { type: 'sine' },
        envelope: { attack: 0.005, decay: 1.2, sustain: 0.2, release: 1.2 },
        modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0.1, release: 0.5 },
        volume: -8,
      }),
  },
  pad: {
    name: 'Pad de sinte',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'fatsawtooth', count: 3, spread: 25 },
        envelope: { attack: 0.35, decay: 0.3, sustain: 0.8, release: 1.6 },
        volume: -18,
      }),
    filter: 1600,
  },
  organ: {
    name: 'Órgano',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'custom', partials: [1, 0.6, 0.35, 0.25, 0, 0.15] },
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.9, release: 0.15 },
        volume: -14,
      }),
  },
  pluck: {
    name: 'Cuerda pulsada',
    create: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle8' },
        envelope: { attack: 0.002, decay: 0.6, sustain: 0.05, release: 0.6 },
        volume: -8,
      }),
  },
};

export class Audio {
  constructor() {
    this.reverb = new Tone.Reverb({ decay: 2.4, wet: 0.22 });
    this.out = new Tone.Volume(-6);
    this.filter = new Tone.Filter(20000, 'lowpass');
    this.filter.chain(this.reverb, this.out, Tone.Destination);
    this.instrument = null;
    this.setInstrument('piano');
  }

  setInstrument(id) {
    const def = INSTRUMENTS[id] ?? INSTRUMENTS.piano;
    if (this.instrument) {
      this.instrument.releaseAll();
      this.instrument.dispose();
    }
    this.instrument = def.create();
    this.instrument.connect(this.filter);
    this.filter.frequency.value = def.filter ?? 20000;
  }

  setVolume(db) {
    this.out.volume.rampTo(db, 0.05);
  }

  play(midiNotes, duration, time, velocity = 0.7) {
    const notes = midiNotes.map((m) => Tone.Frequency(m, 'midi').toNote());
    this.instrument.triggerAttackRelease(notes, duration, time, velocity);
  }

  silence() {
    this.instrument.releaseAll();
  }
}
