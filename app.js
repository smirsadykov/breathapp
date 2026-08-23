// «Дыхание» / "Breathe" — простое приложение дыхательных практик (PWA)

const I18N = {
  ru: {
    title: 'Дыхание',
    doc_title: 'Дыхание — практика каждый день',
    days_row: 'дн. подряд',
    sessions: 'сессий',
    duration: 'Длительность',
    min: 'мин',
    sound: 'Звук',
    vibro: 'Вибрация',
    start: 'Начать',
    pause: 'Пауза',
    resume: 'Продолжить',
    paused: 'Пауза',
    get_ready: 'Приготовься',
    hint: 'Дыши вместе с кругом',
    done_title: 'Сессия завершена',
    total_label: 'Всего сессий',
    streak_fire: (n) => `🔥 ${n} дней подряд`,
    streak_first: 'Первый день серии — приходи завтра',
    again: 'Ещё раз',
    home: 'На главную',
    round: 'Раунд',
    breathe_in: 'Вдохнуть',
    holds: 'Задержки',
    sec: 'с',
    phase: { inhale: 'Вдох', inhale2: 'Ещё вдох', hold: 'Задержка', exhale: 'Выдох', retention: 'Задержка' },
  },
  en: {
    title: 'Breathe',
    doc_title: 'Breathe — a daily practice',
    days_row: 'day streak',
    sessions: 'sessions',
    duration: 'Duration',
    min: 'min',
    sound: 'Sound',
    vibro: 'Vibration',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    paused: 'Paused',
    get_ready: 'Get ready',
    hint: 'Breathe with the circle',
    done_title: 'Session complete',
    total_label: 'Total sessions',
    streak_fire: (n) => `🔥 ${n} days in a row`,
    streak_first: 'Day one of your streak — come back tomorrow',
    again: 'Again',
    home: 'Home',
    round: 'Round',
    breathe_in: 'Breathe in',
    holds: 'Holds',
    sec: 's',
    phase: { inhale: 'Inhale', inhale2: 'Inhale again', hold: 'Hold', exhale: 'Exhale', retention: 'Hold' },
  },
};

// «немой» разворот: круг замирает на ~0.4с без сигнала и смены надписи —
// вставляется там, где вдох и выдох стыкуются напрямую, без задержки
const TURN = (at) => ({ key: 'turn', dur: 0.4, to: at });

// раунд в стиле Вима Хофа: 30 глубоких дыханий → задержка на выдохе (без лимита,
// завершается кнопкой) → восстановление: вдох, задержка 15с, выдох
function buildWimhof(rounds = 3) {
  const ph = [];
  for (let r = 1; r <= rounds; r++) {
    for (let i = 1; i <= 30; i++) {
      ph.push({ key: 'inhale', dur: 1.5, to: 1, breath: i, round: r });
      ph.push({ key: 'exhale', dur: 1.5, to: 0.6, breath: i, round: r });
    }
    ph.push({ key: 'retention', dur: Infinity, to: 0.6, round: r });
    ph.push({ key: 'inhale', dur: 2, to: 1, round: r });
    ph.push({ key: 'hold', dur: 15, to: 1, round: r });
    ph.push({ key: 'exhale', dur: 3, to: 0.55, round: r });
  }
  return ph;
}

const TECHNIQUES = [
  {
    id: 'box',
    name: { ru: 'Квадратное дыхание', en: 'Box breathing' },
    pattern: '4-4-4-4',
    desc: {
      ru: 'Ровный квадрат: вдох, задержка, выдох, задержка. Снимает стресс, собирает фокус.',
      en: 'An even square: inhale, hold, exhale, hold. Relieves stress, sharpens focus.',
    },
    phases: [
      { key: 'inhale', dur: 4, to: 1 },
      { key: 'hold', dur: 4, to: 1 },
      { key: 'exhale', dur: 4, to: 0.55 },
      { key: 'hold', dur: 4, to: 0.55 },
    ],
  },
  {
    id: '478',
    name: { ru: 'Дыхание 4-7-8', en: '4-7-8 breathing' },
    pattern: '4-7-8',
    desc: {
      ru: 'Длинный выдох успокаивает нервную систему. Хорошо перед сном.',
      en: 'A long exhale calms the nervous system. Good before sleep.',
    },
    phases: [
      { key: 'inhale', dur: 4, to: 1 },
      { key: 'hold', dur: 7, to: 1 },
      { key: 'exhale', dur: 8, to: 0.55 },
      TURN(0.55),
    ],
  },
  {
    id: 'coherent',
    name: { ru: 'Когерентное дыхание', en: 'Coherent breathing' },
    pattern: '5.5-5.5',
    desc: {
      ru: 'Около 5–6 дыханий в минуту. Выравнивает пульс и давление, базовая практика на каждый день.',
      en: 'About 5–6 breaths per minute. Evens out heart rate and blood pressure — a solid daily practice.',
    },
    phases: [
      { key: 'inhale', dur: 5.5, to: 1 },
      TURN(1),
      { key: 'exhale', dur: 5.5, to: 0.55 },
      TURN(0.55),
    ],
  },
  {
    id: 'calm',
    name: { ru: 'Спокойствие 4-6', en: 'Calm 4-6' },
    pattern: '4-6',
    desc: {
      ru: 'Выдох длиннее вдоха — мягкое торможение. Подходит новичкам.',
      en: 'Exhale longer than inhale — a gentle slowdown. Good for beginners.',
    },
    phases: [
      { key: 'inhale', dur: 4, to: 1 },
      TURN(1),
      { key: 'exhale', dur: 6, to: 0.55 },
      TURN(0.55),
    ],
  },
  {
    id: 'triangle',
    name: { ru: 'Треугольное дыхание', en: 'Triangle breathing' },
    pattern: '4-4-4',
    desc: {
      ru: 'Как квадрат, но без задержки после выдоха. Проще для начала, тот же эффект собранности.',
      en: 'Like the box, but without the hold after exhaling. Easier to start with, same focusing effect.',
    },
    phases: [
      { key: 'inhale', dur: 4, to: 1 },
      { key: 'hold', dur: 4, to: 1 },
      { key: 'exhale', dur: 4, to: 0.55 },
      TURN(0.55),
    ],
  },
  {
    id: 'sigh',
    name: { ru: 'Двойной вдох', en: 'Double inhale' },
    pattern: '2-1-6',
    desc: {
      ru: 'Два вдоха подряд и длинный выдох. Быстрый сброс напряжения — заметно уже через пару циклов.',
      en: 'Two inhales in a row, then a long exhale. Quick tension release — you feel it within a couple of cycles.',
    },
    phases: [
      { key: 'inhale', dur: 2, to: 0.82 },
      { key: 'inhale2', dur: 1, to: 1 },
      TURN(1),
      { key: 'exhale', dur: 6, to: 0.55 },
      TURN(0.55),
    ],
  },
  {
    id: 'energize',
    name: { ru: 'Бодрость 6-2', en: 'Energize 6-2' },
    pattern: '6-2',
    desc: {
      ru: 'Длинный вдох и короткий выдох мягко бодрят. Утром или перед тренировкой.',
      en: 'A long inhale with a short exhale gently wakes you up. Mornings or before a workout.',
    },
    phases: [
      { key: 'inhale', dur: 6, to: 1 },
      TURN(1),
      { key: 'exhale', dur: 2, to: 0.55 },
      TURN(0.55),
    ],
  },
  {
    id: 'wimhof',
    mode: 'wimhof',
    name: { ru: 'Вим Хоф', en: 'Wim Hof style' },
    pattern: '3×30',
    desc: {
      ru: '3 раунда: 30 глубоких дыханий, задержка на выдохе сколько сможешь, восстановление. Только сидя или лёжа — не в воде и не за рулём.',
      en: '3 rounds: 30 deep breaths, hold on empty lungs as long as you can, then recover. Only seated or lying down — never in water or while driving.',
    },
    phases: buildWimhof(),
  },
];

const $ = (id) => document.getElementById(id);

const state = {
  techniqueId: localStorage.getItem('bd_technique') || 'box',
  minutes: Number(localStorage.getItem('bd_minutes')) || 3,
  sound: localStorage.getItem('bd_sound') !== '0',
  vibro: localStorage.getItem('bd_vibro') !== '0',
  lang: localStorage.getItem('bd_lang') ||
    ((navigator.language || 'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en'),
};

const t = (key) => I18N[state.lang][key];
const phaseName = (key) => I18N[state.lang].phase[key];

// ---------- Stats (streak) ----------
function loadStats() {
  try { return JSON.parse(localStorage.getItem('bd_stats')) || {}; } catch { return {}; }
}
function saveStats(s) { localStorage.setItem('bd_stats', JSON.stringify(s)); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
function recordSession(minutes) {
  const s = loadStats();
  const today = todayStr();
  s.total = (s.total || 0) + 1;
  s.minutes = (s.minutes || 0) + minutes;
  if (s.lastDay !== today) {
    if (s.lastDay && daysBetween(s.lastDay, today) === 1) s.streak = (s.streak || 0) + 1;
    else s.streak = 1;
    s.lastDay = today;
  }
  saveStats(s);
  return s;
}
function renderStats() {
  const s = loadStats();
  let streak = s.streak || 0;
  // стрик сгорает, если пропущено больше одного дня
  if (s.lastDay && daysBetween(s.lastDay, todayStr()) > 1) streak = 0;
  $('streak-days').textContent = streak;
  $('total-sessions').textContent = s.total || 0;
}

// ---------- Language ----------
function applyLang() {
  document.documentElement.lang = state.lang;
  document.title = t('doc_title');
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const b of $('duration-seg').querySelectorAll('button')) {
    b.textContent = `${b.dataset.min} ${t('min')}`;
  }
  $('lang-toggle').textContent = state.lang === 'ru' ? 'EN' : 'RU';
  if (session.running) {
    $('session-technique').textContent = session.technique.name[state.lang];
    const p = session.technique.phases[session.phaseIdx];
    const key = p ? (p.key === 'turn' ? session.lastMoveKey : p.key) : null;
    $('phase-name').textContent = session.paused ? t('paused') : (key ? phaseName(key) : t('get_ready'));
    const isRet = p && p.key === 'retention' && !session.paused;
    $('btn-pause').textContent = session.paused ? t('resume') : (isRet ? t('breathe_in') : t('pause'));
    if (session.technique.mode === 'wimhof' && p && p.round) $('time-left').textContent = `${t('round')} ${p.round}/3`;
  }
  renderTechniques();
}

// ---------- Home UI ----------
function renderTechniques() {
  const list = $('technique-list');
  list.innerHTML = '';
  for (const tech of TECHNIQUES) {
    const card = document.createElement('button');
    card.className = 'tech-card' + (tech.id === state.techniqueId ? ' on' : '');
    card.innerHTML = `
      <div class="tech-name"><span>${tech.name[state.lang]}</span><span class="tech-pattern">${tech.pattern}</span></div>
      <div class="tech-desc">${tech.desc[state.lang]}</div>`;
    card.addEventListener('click', () => {
      state.techniqueId = tech.id;
      localStorage.setItem('bd_technique', tech.id);
      renderTechniques();
    });
    list.appendChild(card);
  }
  // у Вима Хофа своя структура — выбор длительности не используется
  const wim = (TECHNIQUES.find((x) => x.id === state.techniqueId) || TECHNIQUES[0]).mode === 'wimhof';
  $('duration-row').style.display = wim ? 'none' : '';
}

function initOptions() {
  const seg = $('duration-seg');
  for (const b of seg.querySelectorAll('button')) {
    b.classList.toggle('on', Number(b.dataset.min) === state.minutes);
    b.addEventListener('click', () => {
      state.minutes = Number(b.dataset.min);
      localStorage.setItem('bd_minutes', state.minutes);
      for (const x of seg.querySelectorAll('button')) x.classList.toggle('on', x === b);
    });
  }
  const bindToggle = (id, key) => {
    const el = $(id);
    el.classList.toggle('on', state[key]);
    el.addEventListener('click', () => {
      state[key] = !state[key];
      localStorage.setItem('bd_' + key, state[key] ? '1' : '0');
      el.classList.toggle('on', state[key]);
      el.setAttribute('aria-pressed', state[key]);
    });
  };
  bindToggle('toggle-sound', 'sound');
  bindToggle('toggle-vibro', 'vibro');

  $('lang-toggle').addEventListener('click', () => {
    state.lang = state.lang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('bd_lang', state.lang);
    applyLang();
  });
}

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id);
}

// ---------- Sound ----------
let audioCtx = null;
// создаёт/будит аудиоконтекст без звука — вызывается из клика, чтобы iOS разрешил звук
function ensureAudio() {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* звук недоступен */ }
}
// мягкий длинный «вздох» тона вместо резкого гудка: долгая атака, тихий пик, плавный спад
function beep(freq, durMs = 700) {
  if (!state.sound) return;
  try {
    ensureAudio();
    if (!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const t0 = audioCtx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.07, t0 + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(t0 + durMs / 1000 + 0.05);
  } catch { /* звук недоступен — молча продолжаем */ }
}
const PHASE_FREQ = { inhale: 440, inhale2: 494, exhale: 294, hold: 370 };

function buzz() {
  if (state.vibro && navigator.vibrate) navigator.vibrate(60);
}

// ---------- Session engine ----------
const session = {
  running: false,
  paused: false,
  technique: null,
  endAt: 0,
  pausedLeft: 0,
  phaseIdx: -1,
  phaseEndAt: 0,
  fromScale: 0.55,
  curScale: 0.55,
  raf: 0,
};

function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function startSession() {
  cancelAnimationFrame(session.raf); // защита от двойного тапа — не плодим второй цикл
  session.technique = TECHNIQUES.find((x) => x.id === state.techniqueId) || TECHNIQUES[0];
  session.running = true;
  session.paused = false;
  session.startedAt = performance.now();
  session.endAt = session.technique.mode === 'wimhof' ? Infinity : performance.now() + state.minutes * 60000;
  session.phaseIdx = -1;
  session.phaseEndAt = performance.now(); // сразу перейдём к первой фазе
  session.fromScale = 0.55;
  session.curScale = 0.55;
  session.lastMoveKey = null;
  session.retentions = [];
  session.retEndedAt = 0;
  $('bubble').style.transform = 'scale(0.55)';
  $('session-technique').textContent = session.technique.name[state.lang];
  $('phase-name').textContent = t('get_ready');
  $('time-left').textContent = session.technique.mode === 'wimhof' ? `${t('round')} 1/3` : fmtTime(state.minutes * 60);
  $('phase-count').textContent = '';
  $('btn-pause').textContent = t('pause');
  showScreen('screen-session');
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then((l) => (session.lock = l)).catch(() => {});
  ensureAudio(); // разблокировать аудио по клику, без звука
  session.raf = requestAnimationFrame(tick);
}

// возвращает true, если фазы кончились и сессия завершена (только Вим Хоф — он не зациклен)
function nextPhase(now) {
  const phases = session.technique.phases;
  const prev = phases[session.phaseIdx];
  session.fromScale = prev ? prev.to : 0.55;
  session.phaseIdx += 1;
  if (session.phaseIdx >= phases.length) {
    if (session.technique.mode === 'wimhof') { finishSession(); return true; }
    session.phaseIdx = 0;
  }
  const p = phases[session.phaseIdx];
  session.phaseStartAt = now;
  session.phaseEndAt = now + p.dur * 1000;
  if (p.key !== 'turn') {
    session.lastMoveKey = p.key;
    $('phase-name').textContent = phaseName(p.key);
    if (p.key === 'retention') {
      beep(220, 900); // низкий длинный тон: начало задержки
      buzz();
      $('btn-pause').textContent = t('breathe_in');
    } else {
      beep(PHASE_FREQ[p.key] || 370, p.breath ? 250 : 700);
      if (!p.breath) buzz(); // в быстром дыхании не дёргаем вибрацией 60 раз
      if (prev && prev.key === 'retention') $('btn-pause').textContent = t('pause');
    }
  }
  if (p.round) $('time-left').textContent = `${t('round')} ${p.round}/3`;
  return false;
}

// синусоида — естественный профиль дыхания: без рывка в середине и «парковки» на стыках фаз
function easeInOut(t) { return (1 - Math.cos(Math.PI * t)) / 2; }

function tick(now) {
  if (!session.running) return;
  if (session.paused) return;

  if (now >= session.endAt) { finishSession(); return; }
  // phaseIdx < 0: первый кадр — rAF может отдать время чуть раньше старта сессии
  if (session.phaseIdx < 0 || now >= session.phaseEndAt) {
    if (nextPhase(now)) return;
  }

  const p = session.technique.phases[session.phaseIdx];
  const k = Math.min(1, (now - session.phaseStartAt) / (p.dur * 1000));
  const scale = session.fromScale + (p.to - session.fromScale) * easeInOut(k);
  session.curScale = scale;
  $('bubble').style.transform = `scale(${scale.toFixed(4)})`;

  if (p.key === 'retention') {
    $('phase-count').textContent = Math.floor((now - session.phaseStartAt) / 1000); // секундомер
  } else if (p.breath) {
    $('phase-count').textContent = p.breath; // номер дыхания 1..30
  } else if (p.key !== 'turn') {
    $('phase-count').textContent = Math.ceil((session.phaseEndAt - now) / 1000);
  }
  if (session.technique.mode !== 'wimhof') $('time-left').textContent = fmtTime((session.endAt - now) / 1000);

  session.raf = requestAnimationFrame(tick);
}

function togglePause() {
  if (!session.running || session.phaseIdx < 0) return; // до первой фазы паузить нечего
  const now = performance.now();
  if (!session.paused) {
    session.paused = true;
    session.pausedLeft = session.endAt - now;
    session.pausedPhaseLeft = session.phaseEndAt - now;
    session.pausedPhaseElapsed = now - session.phaseStartAt;
    $('btn-pause').textContent = t('resume');
    $('phase-name').textContent = t('paused');
  } else {
    session.paused = false;
    session.endAt = now + session.pausedLeft;
    session.phaseEndAt = now + session.pausedPhaseLeft;
    session.phaseStartAt = now - session.pausedPhaseElapsed;
    const cur = session.technique.phases[session.phaseIdx];
    $('phase-name').textContent = phaseName(cur.key === 'turn' ? session.lastMoveKey : cur.key);
    $('btn-pause').textContent = t('pause');
    session.raf = requestAnimationFrame(tick);
  }
}

function stopSession() {
  session.running = false;
  cancelAnimationFrame(session.raf);
  if (session.lock) { session.lock.release().catch(() => {}); session.lock = null; }
}

function finishSession() {
  stopSession();
  const wim = session.technique.mode === 'wimhof';
  const minutes = wim
    ? Math.max(1, Math.round((performance.now() - session.startedAt) / 60000))
    : state.minutes;
  const s = recordSession(minutes);
  const holds = wim && session.retentions.length
    ? ` ${t('holds')}: ${session.retentions.map((x) => `${x}${t('sec')}`).join(' · ')}.`
    : '';
  $('done-summary').textContent =
    `${session.technique.name[state.lang]} · ${minutes} ${t('min')}.${holds} ${t('total_label')}: ${s.total}.`;
  $('done-streak').textContent = s.streak > 1 ? t('streak_fire')(s.streak) : t('streak_first');
  if (state.vibro && navigator.vibrate) navigator.vibrate([80, 60, 80]);
  showScreen('screen-done');
  renderStats();
}

function quitSession() {
  stopSession();
  showScreen('screen-home');
  renderStats();
}

// возврат из фона: рабочая блокировка экрана слетает, фаза устаревает —
// заново берём wake lock и мягко перезапускаем текущую фазу с текущего размера круга
document.addEventListener('visibilitychange', () => {
  if (document.hidden || !session.running || session.paused) return;
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then((l) => (session.lock = l)).catch(() => {});
  const now = performance.now();
  if (now >= session.phaseEndAt && now < session.endAt) {
    const p = session.technique.phases[session.phaseIdx];
    if (p) {
      session.fromScale = session.curScale;
      session.phaseStartAt = now;
      session.phaseEndAt = now + p.dur * 1000;
    }
  }
});

// ---------- Wire up ----------
$('btn-start').addEventListener('click', startSession);
$('btn-again').addEventListener('click', startSession);
$('btn-pause').addEventListener('click', () => {
  const p = session.running && session.phaseIdx >= 0 && session.technique.phases[session.phaseIdx];
  if (p && p.key === 'retention' && !session.paused) {
    // конец задержки: записываем время и идём на восстановление
    session.retentions.push(Math.max(0, Math.round((performance.now() - session.phaseStartAt) / 1000)));
    session.retEndedAt = performance.now();
    nextPhase(performance.now());
    return;
  }
  if (performance.now() - session.retEndedAt < 400) return; // случайный двойной тап после задержки
  togglePause();
});
$('btn-close').addEventListener('click', quitSession);
$('btn-home').addEventListener('click', () => showScreen('screen-home'));

applyLang();
initOptions();
renderStats();

// ---------- PWA ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
