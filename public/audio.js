'use strict';

(() => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const DEFAULT_VOLUMES = Object.freeze({ master: 0.7, ambient: 0.6 });

  let context = null;
  let masterGain = null;
  let ambientGain = null;
  let started = false;
  let volumes = { ...DEFAULT_VOLUMES };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const toGain = (value) => value * value;

  function applyGains(immediate = false) {
    if (!context || !masterGain || !ambientGain) {
      return;
    }

    const now = context.currentTime;
    const master = toGain(volumes.master);
    const ambient = toGain(volumes.ambient);

    if (immediate) {
      masterGain.gain.cancelScheduledValues(now);
      ambientGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(master, now);
      ambientGain.gain.setValueAtTime(ambient, now);
      return;
    }

    masterGain.gain.setTargetAtTime(master, now, 0.08);
    ambientGain.gain.setTargetAtTime(ambient, now, 0.11);
  }

  function createNoiseBuffer(seconds) {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function addNoiseLayer(buffer, { type, frequency, q = 0.7, gain, offset = 0 }) {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;

    const level = context.createGain();
    level.gain.value = gain;

    source.connect(filter);
    filter.connect(level);
    level.connect(ambientGain);
    source.start(0, offset % buffer.duration);

    return { source, filter, level };
  }

  function start() {
    if (!AudioContextClass) {
      return;
    }

    if (started) {
      if (context && context.state === 'suspended') {
        context.resume().catch(() => {});
      }
      return;
    }

    try {
      context = new AudioContextClass();
    } catch {
      return;
    }

    masterGain = context.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(context.destination);

    ambientGain = context.createGain();
    ambientGain.gain.value = 0;
    ambientGain.connect(masterGain);

    const buffer = createNoiseBuffer(6);

    addNoiseLayer(buffer, {
      type: 'lowpass',
      frequency: 420,
      q: 0.45,
      gain: 0.34,
      offset: 0.4,
    });

    const hiss = addNoiseLayer(buffer, {
      type: 'highpass',
      frequency: 780,
      q: 0.5,
      gain: 0.4,
      offset: 1.8,
    });

    addNoiseLayer(buffer, {
      type: 'bandpass',
      frequency: 2400,
      q: 0.55,
      gain: 0.17,
      offset: 3.6,
    });

    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 0.09;
    lfo.connect(lfoDepth);
    lfoDepth.connect(hiss.level.gain);
    lfo.start();

    started = true;
    applyGains();

    if (context.state === 'suspended') {
      context.resume().catch(() => {});
    }
  }

  function attachUnlockListener() {
    const unlock = () => {
      start();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
  }

  window.RedencaoAudio = {
    start,

    setVolumes(next) {
      if (!next) {
        return;
      }

      volumes = {
        master: clamp(Number(next.master) || 0, 0, 1),
        ambient: clamp(Number(next.ambient) || 0, 0, 1),
      };

      applyGains();
    },
  };

  attachUnlockListener();
})();
