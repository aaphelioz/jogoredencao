'use strict';

(() => {
  const STORAGE_KEY = 'redencao:volumes';
  const DEFAULT_VOLUMES = Object.freeze({ master: 0.7, ambient: 0.6 });
  const TOTAL_ACHIEVEMENTS = 12;

  const audio = window.RedencaoAudio;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normalizeVolume(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return clamp(number, 0, 1);
  }

  function loadVolumes() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return { ...DEFAULT_VOLUMES };
      }

      const parsed = JSON.parse(stored);

      return {
        master: normalizeVolume(parsed && parsed.master, DEFAULT_VOLUMES.master),
        ambient: normalizeVolume(parsed && parsed.ambient, DEFAULT_VOLUMES.ambient),
      };
    } catch {
      return { ...DEFAULT_VOLUMES };
    }
  }

  function saveVolumes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes));
    } catch {
      /* Preferências indisponíveis neste navegador. */
    }
  }

  const volumes = loadVolumes();

  if (audio) {
    audio.setVolumes(volumes);
  }

  const status = document.getElementById('menu-status');
  const menu = document.getElementById('main-menu');
  const masterInput = document.getElementById('master-volume');
  const ambientInput = document.getElementById('ambient-volume');
  const masterValue = document.getElementById('master-value');
  const ambientValue = document.getElementById('ambient-value');

  const panels = {
    options: document.getElementById('panel-options'),
    store: document.getElementById('panel-store'),
    achievements: document.getElementById('panel-achievements'),
    exit: document.getElementById('panel-exit'),
  };

  function openPanel(panel) {
    if (!panel || panel.open) {
      return;
    }

    if (typeof panel.showModal === 'function') {
      panel.showModal();
    } else {
      panel.setAttribute('open', '');
    }
  }

  function showStatus(message) {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.add('is-visible');
  }

  function updateVolume(channel, input, output) {
    const percent = clamp(Math.round(Number(input.value) || 0), 0, 100);
    volumes[channel] = percent / 100;
    output.textContent = `${percent}%`;

    if (audio) {
      audio.setVolumes(volumes);
    }

    saveVolumes();
  }

  function initializeVolumes() {
    if (!masterInput || !ambientInput || !masterValue || !ambientValue) {
      return;
    }

    masterInput.value = String(Math.round(volumes.master * 100));
    ambientInput.value = String(Math.round(volumes.ambient * 100));
    masterValue.textContent = `${masterInput.value}%`;
    ambientValue.textContent = `${ambientInput.value}%`;

    masterInput.addEventListener('input', () => {
      updateVolume('master', masterInput, masterValue);
    });

    ambientInput.addEventListener('input', () => {
      updateVolume('ambient', ambientInput, ambientValue);
    });
  }

  function buildAchievements() {
    const list = document.getElementById('medals');
    const counter = document.getElementById('achievements-count');

    if (!list) {
      return;
    }

    const fragment = document.createDocumentFragment();

    for (let index = 0; index < TOTAL_ACHIEVEMENTS; index += 1) {
      const item = document.createElement('li');
      item.className = 'medal';
      item.setAttribute('aria-label', `Conquista ${index + 1} bloqueada`);

      const disc = document.createElement('span');
      disc.className = 'medal__disc';
      disc.setAttribute('aria-hidden', 'true');

      item.append(disc);
      fragment.append(item);
    }

    list.replaceChildren(fragment);

    if (counter) {
      counter.textContent = `0 / ${TOTAL_ACHIEVEMENTS}`;
    }
  }

  if (menu) {
    menu.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');

      if (!button || !menu.contains(button)) {
        return;
      }

      switch (button.dataset.action) {
        case 'play':
          if (status) {
            status.textContent = '';
            status.classList.remove('is-visible');
          }

          if (window.RedencaoGame) {
            window.RedencaoGame.start();
          } else {
            showStatus('Caso em andamento...');
          }
          break;
        case 'options':
          openPanel(panels.options);
          break;
        case 'store':
          openPanel(panels.store);
          break;
        case 'achievements':
          openPanel(panels.achievements);
          break;
        case 'exit':
          try {
            window.close();
          } catch {
            /* O navegador pode bloquear o fechamento da aba. */
          }
          openPanel(panels.exit);
          break;
        default:
          break;
      }
    });
  }

  document.querySelectorAll('[data-close]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = button.closest('dialog');

      if (panel) {
        panel.close();
      }
    });
  });

  document.querySelectorAll('dialog.panel').forEach((panel) => {
    panel.addEventListener('click', (event) => {
      if (event.target !== panel) {
        return;
      }

      const rect = panel.getBoundingClientRect();
      const isInside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!isInside) {
        panel.close();
      }
    });
  });

  initializeVolumes();
  buildAchievements();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.getElementById('rain');
  const drawingContext = canvas ? canvas.getContext('2d') : null;

  if (canvas && drawingContext) {
    const WIND = 0.16;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    let drops = [];
    let frame = 0;
    let previousTime = 0;
    let resizeTimer = 0;

    function resetDrop(drop, spreadVertically) {
      drop.x = Math.random() * (width + 160) - 80;
      drop.y = spreadVertically
        ? Math.random() * height
        : -drop.length - Math.random() * height * 0.25;
      drop.length = 8 + Math.random() * 20;
      drop.speed = 320 + Math.random() * 460;
      drop.alpha = 0.05 + Math.random() * 0.17;
    }

    function createDrops() {
      const count = Math.round(clamp((width * height) / 11000, 60, 210));
      drops = Array.from({ length: count }, () => {
        const drop = {
          x: 0,
          y: 0,
          length: 12,
          speed: 400,
          alpha: 0.1,
        };

        resetDrop(drop, true);
        return drop;
      });
    }

    function draw() {
      drawingContext.clearRect(0, 0, width, height);
      drawingContext.lineCap = 'round';
      drawingContext.lineWidth = 0.8;

      for (const drop of drops) {
        drawingContext.strokeStyle = `rgba(154, 198, 228, ${drop.alpha})`;
        drawingContext.beginPath();
        drawingContext.moveTo(drop.x, drop.y);
        drawingContext.lineTo(drop.x + drop.length * WIND, drop.y + drop.length);
        drawingContext.stroke();
      }
    }

    function step(time) {
      if (!previousTime) {
        previousTime = time;
      }

      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;

      for (const drop of drops) {
        drop.y += drop.speed * delta;
        drop.x += drop.speed * delta * WIND;

        if (drop.y - drop.length > height || drop.x - drop.length > width) {
          resetDrop(drop, false);
        }
      }

      draw();
      frame = window.requestAnimationFrame(step);
    }

    function startRain() {
      if (reduceMotion.matches) {
        draw();
        return;
      }

      if (frame) {
        return;
      }

      previousTime = 0;
      frame = window.requestAnimationFrame(step);
    }

    function stopRain() {
      if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }

      draw();
    }

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      drawingContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      createDrops();
      draw();
    }

    resizeCanvas();
    startRain();

    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resizeCanvas, 120);
    });

    const handleMotionPreference = () => {
      if (reduceMotion.matches) {
        stopRain();
      } else {
        startRain();
      }
    };

    if (typeof reduceMotion.addEventListener === 'function') {
      reduceMotion.addEventListener('change', handleMotionPreference);
    } else if (typeof reduceMotion.addListener === 'function') {
      reduceMotion.addListener(handleMotionPreference);
    }
  }
})();
