'use strict';

(() => {
  const story = window.REDENCAO_STORY;
  const gameSection = document.getElementById('game');
  const stage = document.getElementById('game-stage');
  const menu = document.getElementById('main-menu');
  const progressLabel = document.getElementById('game-progress');
  const menuButton = document.querySelector('[data-game-menu]');

  if (!story || !gameSection || !stage) {
    return;
  }

  const LETTER_STORAGE_KEY = 'redencao:letter-room';
  const TOTAL_INTERACTIONS = story.roomOrder.reduce(
    (total, roomId) => total + story.rooms[roomId].interactions.length,
    0,
  );

  let state = createInitialState();

  function createInitialState() {
    return {
      active: false,
      over: false,
      scene: 'intro',
      introIndex: 0,
      currentRoom: null,
      currentInteraction: null,
      examined: new Set(),
      flags: {
        hasKey: false,
        safeOpen: false,
        shedOpen: false,
        letterFound: false,
      },
      letterRoom: null,
      letterHost: null,
      combat: null,
      ending: null,
    };
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text !== undefined && text !== null) {
      node.textContent = text;
    }

    return node;
  }

  function pickLetterRoom() {
    const rooms = Object.keys(story.letterHosts);
    let previous = null;

    try {
      previous = localStorage.getItem(LETTER_STORAGE_KEY);
    } catch {
      previous = null;
    }

    const candidates = rooms.filter((roomId) => roomId !== previous);
    const pool = candidates.length > 0 ? candidates : rooms;
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    try {
      localStorage.setItem(LETTER_STORAGE_KEY, chosen);
    } catch {
      /* Sem armazenamento local: o sorteio continua funcionando. */
    }

    return chosen;
  }

  function resetGame() {
    state = createInitialState();
    state.active = true;
    state.letterRoom = pickLetterRoom();
    state.letterHost = story.letterHosts[state.letterRoom];
    state.scene = 'intro';
    state.introIndex = 0;
  }

  function showGame() {
    if (menu) {
      menu.hidden = true;
    }

    gameSection.hidden = false;
    document.body.classList.add('is-playing');
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  function returnToMenu() {
    gameSection.hidden = true;
    document.body.classList.remove('is-playing');

    if (menu) {
      menu.hidden = false;
      const playButton = menu.querySelector('[data-action="play"]');

      if (playButton) {
        playButton.focus({ preventScroll: true });
      }
    }
  }

  function start() {
    if (!state.active || state.over) {
      resetGame();
    }

    showGame();
    renderCurrentScene();
  }

  function startNewGame() {
    resetGame();
    showGame();
    renderCurrentScene();
  }

  function updateHeader() {
    if (!progressLabel) {
      return;
    }

    const parts = [`Pistas ${state.examined.size} / ${TOTAL_INTERACTIONS}`];

    if (state.flags.letterFound) {
      parts.push('Carta encontrada');
    }

    progressLabel.textContent = parts.join(' · ');
  }

  function createActionButton(action) {
    const variant = action.variant ? ` btn--${action.variant}` : '';
    const button = el('button', `btn scene__button${variant}`);
    button.type = 'button';

    if (action.data) {
      Object.entries(action.data).forEach(([key, value]) => {
        button.dataset[key] = value;
      });
    }

    button.append(el('span', 'scene__button-label', action.label));

    if (action.hint) {
      button.append(el('span', 'scene__button-hint', action.hint));
    }

    if (typeof action.onClick === 'function') {
      button.addEventListener('click', action.onClick);
    }

    return button;
  }

  function renderScene({
    eyebrow,
    title,
    subtitle,
    paragraphs = [],
    content = null,
    clue,
    actions = [],
    variant = '',
    focus = 'title',
  }) {
    const scene = el('article', `scene${variant ? ` ${variant}` : ''}`);

    if (eyebrow) {
      scene.append(el('p', 'scene__eyebrow', eyebrow));
    }

    const heading = el('h2', 'scene__title', title);
    heading.tabIndex = -1;
    scene.append(heading);

    if (subtitle) {
      scene.append(el('p', 'scene__subtitle', subtitle));
    }

    if (paragraphs.length > 0) {
      const text = el('div', 'scene__text');

      paragraphs.forEach((paragraph) => {
        text.append(el('p', '', paragraph));
      });

      scene.append(text);
    }

    if (content) {
      scene.append(content);
    }

    if (clue) {
      scene.append(el('p', 'scene__clue', `Pista: ${clue}`));
    }

    let firstAction = null;

    if (actions.length > 0) {
      const actionWrap = el('div', 'scene__actions');

      actions.forEach((action) => {
        const button = createActionButton(action);

        if (!firstAction) {
          firstAction = button;
        }

        actionWrap.append(button);
      });

      scene.append(actionWrap);
    }

    stage.replaceChildren(scene);
    updateHeader();

    if (focus === 'title') {
      window.requestAnimationFrame(() => heading.focus({ preventScroll: true }));
    } else if (focus === 'first-action' && firstAction) {
      window.requestAnimationFrame(() => firstAction.focus({ preventScroll: true }));
    }
  }

  function renderCurrentScene() {
    switch (state.scene) {
      case 'intro':
        renderIntro();
        break;
      case 'hub':
        renderHub();
        break;
      case 'room':
        renderRoom();
        break;
      case 'interaction':
        renderInteraction();
        break;
      case 'safe':
        renderSafe();
        break;
      case 'well':
        renderWell();
        break;
      case 'combat-intro':
        renderCombatIntro();
        break;
      case 'combat':
        renderCombat();
        break;
      case 'ending':
        renderEnding();
        break;
      default:
        renderIntro();
        break;
    }
  }

  function renderIntro() {
    const beat = story.intro[state.introIndex];
    const isLast = state.introIndex === story.intro.length - 1;

    renderScene({
      eyebrow: `Prólogo — ${state.introIndex + 1} / ${story.intro.length}`,
      title: beat.title,
      paragraphs: beat.text,
      actions: [
        {
          label: beat.action || (isLast ? 'Entrar na mansão' : 'Continuar'),
          hint: isLast ? 'A investigação começa' : 'Enter, Espaço ou W',
          variant: 'primary',
          data: { gameAction: 'intro-next' },
          onClick: advanceIntro,
        },
      ],
    });
  }

  function advanceIntro() {
    if (!state.active || state.scene !== 'intro') {
      return;
    }

    if (state.introIndex < story.intro.length - 1) {
      state.introIndex += 1;
      renderIntro();
      return;
    }

    state.scene = 'hub';
    state.currentRoom = null;
    renderHub();
  }

  function getRoomStats(roomId) {
    const room = story.rooms[roomId];
    const total = room.interactions.length;
    const examined = room.interactions.reduce(
      (count, interaction) => count + (state.examined.has(interaction.id) ? 1 : 0),
      0,
    );

    return { total, examined };
  }

  function renderHub() {
    const allDone = story.roomOrder.every((roomId) => {
      const stats = getRoomStats(roomId);
      return stats.examined === stats.total;
    });

    const actions = story.roomOrder.map((roomId) => {
      const room = story.rooms[roomId];
      const stats = getRoomStats(roomId);
      const done = stats.examined === stats.total;

      return {
        label: room.name,
        hint: done ? 'concluído' : `${stats.examined} / ${stats.total} pistas`,
        data: { room: roomId },
        onClick: () => openRoom(roomId),
      };
    });

    const paragraphs = [story.hub.description];

    if (allDone) {
      paragraphs.push(story.hub.allRooms);
    }

    renderScene({
      eyebrow: story.hub.eyebrow,
      title: story.hub.title,
      subtitle: state.flags.letterFound ? story.hub.letterFound : story.hub.prompt,
      paragraphs,
      actions,
    });
  }

  function openRoom(roomId) {
    state.currentRoom = roomId;
    state.scene = 'room';
    renderRoom();
  }

  function renderRoom() {
    const room = story.rooms[state.currentRoom];
    const stats = getRoomStats(state.currentRoom);

    const actions = room.interactions.map((interaction) => {
      const examined = state.examined.has(interaction.id);
      const locked = interaction.requires && !state.flags[interaction.requires];

      return {
        label: interaction.label,
        hint: locked ? 'trancado' : examined ? 'examinado' : '',
        variant: examined ? 'ghost' : '',
        data: { interaction: interaction.id },
        onClick: () => openInteraction(interaction.id),
      };
    });

    if (state.currentRoom === 'jardim') {
      actions.push({
        label: 'Aproximar-se do poço',
        hint: 'decisão final',
        variant: 'danger',
        data: { gameAction: 'well' },
        onClick: openWell,
      });
    }

    actions.push({
      label: 'Voltar aos locais',
      variant: 'ghost',
      data: { gameAction: 'back-hub' },
      onClick: () => {
        state.scene = 'hub';
        state.currentRoom = null;
        renderHub();
      },
    });

    renderScene({
      eyebrow: `Investigação — ${stats.examined} / ${stats.total}`,
      title: room.name,
      paragraphs: [room.description],
      actions,
    });
  }

  function findInteraction(roomId, interactionId) {
    const room = story.rooms[roomId];

    if (!room) {
      return null;
    }

    return room.interactions.find((interaction) => interaction.id === interactionId) || null;
  }

  function openInteraction(interactionId) {
    const interaction = findInteraction(state.currentRoom, interactionId);

    if (!interaction) {
      return;
    }

    state.currentInteraction = interactionId;

    if (interaction.requires && !state.flags[interaction.requires]) {
      state.scene = 'interaction';
      renderInteraction(true);
      return;
    }

    if (interaction.id === 'sala-cofre' && !state.flags.safeOpen) {
      state.scene = 'safe';
      renderSafe();
      return;
    }

    state.examined.add(interaction.id);

    if (interaction.effect) {
      state.flags[interaction.effect] = true;
    }

    if (interaction.id === state.letterHost && !state.flags.letterFound) {
      state.flags.letterFound = true;
    }

    state.scene = 'interaction';
    renderInteraction(false);
  }

  function buildLetter() {
    const letter = el('section', 'letter');
    letter.append(el('p', 'letter__kicker', 'Documento encontrado'));
    letter.append(el('h3', 'letter__title', story.letter.title));
    letter.append(el('p', 'letter__hint', story.letterHint));

    const body = el('div', 'letter__body');

    story.letter.paragraphs.forEach((paragraph) => {
      body.append(el('p', '', paragraph));
    });

    letter.append(body);
    return letter;
  }

  function renderInteraction(locked = false) {
    const interaction = findInteraction(state.currentRoom, state.currentInteraction);

    if (!interaction) {
      state.scene = 'room';
      renderRoom();
      return;
    }

    const room = story.rooms[state.currentRoom];
    const isLetterHost = interaction.id === state.letterHost;
    let paragraphs;

    if (locked) {
      paragraphs = interaction.lockedText || interaction.text;
    } else if (interaction.id === 'sala-cofre' && state.flags.safeOpen) {
      paragraphs = interaction.openedText || interaction.text;
    } else if (isLetterHost && state.flags.letterFound) {
      paragraphs = interaction.text;
    } else {
      paragraphs = interaction.emptyText || interaction.text;
    }

    const content =
      !locked && isLetterHost && state.flags.letterFound ? buildLetter() : null;

    renderScene({
      eyebrow: `Investigação — ${room.name}`,
      title: room.name,
      subtitle: interaction.label,
      paragraphs,
      content,
      clue: locked ? null : interaction.clue,
      actions: [
        {
          label: 'Voltar ao cômodo',
          variant: 'ghost',
          data: { gameAction: 'back-room' },
          onClick: () => {
            state.scene = 'room';
            renderRoom();
          },
        },
      ],
    });
  }

  function renderSafe(message = '') {
    const interaction = findInteraction('sala', 'sala-cofre');
    const form = el('form', 'safe');
    form.noValidate = true;
    form.dataset.safeForm = 'true';

    const label = el('label', 'safe__label', 'Digite a senha');
    label.htmlFor = 'safe-password';

    const input = el('input', 'safe__input');
    input.id = 'safe-password';
    input.name = 'password';
    input.type = 'text';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.maxLength = 30;
    input.setAttribute('aria-describedby', 'safe-hint safe-error');

    const hint = el('p', 'safe__hint', interaction.passwordHint);
    hint.id = 'safe-hint';

    const error = el('p', 'safe__error', message);
    error.id = 'safe-error';
    error.setAttribute('role', 'alert');

    const actions = el('div', 'safe__actions');
    const submit = el('button', 'btn btn--primary', 'Abrir o cofre');
    submit.type = 'submit';

    const back = el('button', 'btn btn--ghost', 'Voltar ao cômodo');
    back.type = 'button';
    back.addEventListener('click', () => {
      state.scene = 'room';
      renderRoom();
    });

    actions.append(submit, back);
    form.append(label, input, hint, error, actions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (input.value.trim().toLowerCase() === 'helena') {
        state.flags.safeOpen = true;
        state.examined.add('sala-cofre');
        state.scene = 'interaction';
        state.currentInteraction = 'sala-cofre';
        renderInteraction(false);
        return;
      }

      input.value = '';
      error.textContent = 'Senha incorreta. O cofre permanece fechado.';
      input.focus();
    });

    renderScene({
      eyebrow: 'Investigação — Sala de estar',
      title: 'O cofre',
      subtitle: 'Atrás do quadro antigo',
      paragraphs: [interaction.text[0], interaction.text[1]],
      content: form,
      focus: 'none',
    });

    window.requestAnimationFrame(() => input.focus({ preventScroll: true }));
  }

  function openWell() {
    state.scene = 'well';
    renderWell();
  }

  function renderWell() {
    const paragraphs = [...story.well.text];

    if (!state.flags.safeOpen && !state.flags.letterFound) {
      paragraphs.push(
        'Douglas ainda não entendeu o que aconteceu nesta casa. Mas a casa entendeu que ele chegou.',
      );
    }

    paragraphs.push(story.well.warning);

    renderScene({
      eyebrow: 'Jardim — decisão final',
      title: 'O poço',
      paragraphs,
      actions: [
        {
          label: 'Descer até o poço',
          hint: 'O combate começa aqui',
          variant: 'danger',
          data: { gameAction: 'well-confirm' },
          onClick: startCombatIntro,
        },
        {
          label: 'Voltar ao jardim',
          variant: 'ghost',
          data: { gameAction: 'back-room' },
          onClick: () => {
            state.scene = 'room';
            renderRoom();
          },
        },
      ],
    });
  }

  function startCombatIntro() {
    state.scene = 'combat-intro';
    renderCombatIntro();
  }

  function renderCombatIntro() {
    renderScene({
      eyebrow: 'O poço — combate final',
      title: 'Helena',
      paragraphs: story.combat.intro,
      actions: [
        {
          label: 'Lutar',
          hint: 'Atirar ou esquivar a cada turno',
          variant: 'danger',
          data: { gameAction: 'combat-start' },
          onClick: beginCombat,
        },
        {
          label: 'Recuar',
          variant: 'ghost',
          data: { gameAction: 'back-well' },
          onClick: () => {
            state.scene = 'well';
            renderWell();
          },
        },
      ],
    });
  }

  function beginCombat() {
    state.combat = {
      player: 0,
      enemy: 0,
      turn: 1,
      phase: 'action',
      last: null,
      outcome: null,
    };
    state.scene = 'combat';
    renderCombat();
  }

  function buildMeter(label, value, variant) {
    const meter = el('div', `meter meter--${variant}`);
    const top = el('div', 'meter__top');
    top.append(el('span', 'meter__label', label));
    top.append(el('span', 'meter__value', `${value} / 5`));

    const track = el('div', 'meter__track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', label);
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '5');
    track.setAttribute('aria-valuenow', String(value));

    const fill = el('span', 'meter__fill');
    fill.style.width = `${(value / 5) * 100}%`;
    track.append(fill);
    meter.append(top, track);

    return meter;
  }

  function renderCombat() {
    const combat = state.combat;

    if (!combat) {
      state.scene = 'well';
      renderWell();
      return;
    }

    const panel = el('div', 'combat');
    const hud = el('div', 'combat__hud');
    hud.append(buildMeter('Douglas', combat.player, 'player'));
    hud.append(buildMeter('Helena', combat.enemy, 'enemy'));

    const log = el('div', 'combat__log');
    log.append(el('p', 'combat__turn', `Turno ${combat.turn}`));

    if (combat.last) {
      combat.last.lines.forEach((line) => log.append(el('p', '', line)));
    } else {
      log.append(el('p', '', story.combat.emptyLog));
    }

    panel.append(hud, log);

    let actions = [];

    if (combat.phase === 'action') {
      actions = [
        {
          label: 'Atirar',
          hint: 'Tentar acertar Helena',
          data: { combatAction: 'shoot' },
          onClick: () => resolveCombat('shoot'),
        },
        {
          label: 'Esquivar',
          hint: 'Tentar evitar o ataque',
          data: { combatAction: 'dodge' },
          onClick: () => resolveCombat('dodge'),
        },
      ];
    } else if (combat.phase === 'resolved') {
      actions = [
        {
          label: 'Continuar',
          hint: 'Próximo turno',
          variant: 'primary',
          data: { gameAction: 'combat-next' },
          onClick: nextCombatTurn,
        },
      ];
    } else if (combat.phase === 'over') {
      actions = [
        {
          label: 'Ver o fim',
          variant: 'primary',
          data: { gameAction: 'ending' },
          onClick: showEnding,
        },
      ];
    }

    renderScene({
      eyebrow: `Combate — turno ${combat.turn}`,
      title: 'Helena',
      subtitle:
        combat.phase === 'over'
          ? combat.outcome === 'victory'
            ? 'O ódio se apaga.'
            : 'A casa venceu.'
          : 'A criatura do poço',
      content: panel,
      actions,
      focus: 'first-action',
    });
  }

  function resolveCombat(action) {
    const combat = state.combat;

    if (!combat || combat.phase !== 'action') {
      return;
    }

    const roll = Math.floor(Math.random() * 20) + 1;
    const success = action === 'shoot' ? roll > 10 : roll > 8;
    const result = story.combat[action][success ? 'success' : 'failure'];

    if (success) {
      if (action === 'shoot') {
        combat.player += 1;
      }
    } else {
      combat.enemy += 1;
    }

    combat.last = { lines: result, success, action };

    if (combat.player >= 5) {
      combat.outcome = 'victory';
      combat.phase = 'over';
    } else if (combat.enemy >= 5) {
      combat.outcome = 'defeat';
      combat.phase = 'over';
    } else {
      combat.phase = 'resolved';
    }

    renderCombat();
  }

  function nextCombatTurn() {
    const combat = state.combat;

    if (!combat || combat.phase !== 'resolved') {
      return;
    }

    combat.turn += 1;
    combat.phase = 'action';
    renderCombat();
  }

  function showEnding() {
    if (!state.combat || !state.combat.outcome) {
      return;
    }

    state.ending = state.combat.outcome;
    state.over = true;
    state.scene = 'ending';
    renderEnding();
  }

  function renderEnding() {
    const isVictory = state.ending === 'victory';
    const paragraphs = [
      ...(isVictory ? story.combat.victory : story.combat.defeat),
    ];

    if (state.flags.letterFound) {
      paragraphs.push(
        isVictory ? story.combat.letterEpilogue : story.combat.defeatLetterEpilogue,
      );
    }

    paragraphs.push(story.ending.final);

    renderScene({
      eyebrow: isVictory ? story.ending.victoryEyebrow : story.ending.defeatEyebrow,
      title: isVictory ? story.ending.victoryTitle : story.ending.defeatTitle,
      paragraphs,
      variant: isVictory ? 'scene--victory' : 'scene--defeat',
      actions: [
        {
          label: 'Jogar novamente',
          hint: 'A carta muda de cômodo',
          variant: 'primary',
          data: { gameAction: 'restart' },
          onClick: startNewGame,
        },
        {
          label: 'Voltar ao menu',
          variant: 'ghost',
          data: { gameAction: 'menu' },
          onClick: returnToMenu,
        },
      ],
    });
  }

  if (menuButton) {
    menuButton.addEventListener('click', returnToMenu);
  }

  document.addEventListener('keydown', (event) => {
    if (gameSection.hidden || event.defaultPrevented) {
      return;
    }

    const target = event.target;
    const tagName = target instanceof Element ? target.tagName : '';
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);

    if (isTyping) {
      return;
    }

    const isW = event.key === 'w' || event.key === 'W';
    const isAdvance = event.key === 'Enter' || event.key === ' ';
    const onButton = target instanceof Element && Boolean(target.closest('button, a'));

    if (state.scene === 'intro' && (isW || (isAdvance && !onButton))) {
      event.preventDefault();
      advanceIntro();
    }
  });

  window.RedencaoGame = {
    start,
    returnToMenu,
  };
})();
