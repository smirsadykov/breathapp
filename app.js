// «Дыхание» — простое приложение дыхательных практик (PWA)

const TECHNIQUES = [
  {
    id: 'box',
    name: 'Квадратное дыхание',
    pattern: '4-4-4-4',
    desc: 'Ровный квадрат: вдох, задержка, выдох, задержка. Снимает стресс, собирает фокус.',
    phases: [
      { name: 'Вдох', dur: 4, to: 1 },
      { name: 'Задержка', dur: 4, to: 1 },
      { name: 'Выдох', dur: 4, to: 0.55 },
      { name: 'Задержка', dur: 4, to: 0.55 },
    ],
  },
  {
    id: '478',
    name: 'Дыхание 4-7-8',
    pattern: '4-7-8',
    desc: 'Длинный выдох успокаивает нервную систему. Хорошо перед сном.',
    phases: [
      { name: 'Вдох', dur: 4, to: 1 },
      { name: 'Задержка', dur: 7, to: 1 },
      { name: 'Выдох', dur: 8, to: 0.55 },
    ],
  },
  {
    id: 'coherent',
    name: 'Когерентное дыхание',
    pattern: '5.5-5.5',
    desc: 'Около 5–6 дыханий в минуту. Выравнивает пульс и давление, базовая практика на каждый день.',
    phases: [
      { name: 'Вдох', dur: 5.5, to: 1 },
      { name: 'Выдох', dur: 5.5, to: 0.55 },
    ],
  },
  {
    id: 'calm',
    name: 'Спокойствие 4-6',
    pattern: '4-6',
    desc: 'Выдох длиннее вдоха — мягкое торможение. Подходит новичкам.',
    phases: [
      { name: 'Вдох', dur: 4, to: 1 },
      { name: 'Выдох', dur: 6, to: 0.55 },
    ],
  },
];

const $ = (id) => document.getElementById(id);

const state = {
  techniqueId: localStorage.getItem('bd_technique') || 'box',
  minutes: Number(localStorage.getItem('bd_minutes')) || 3,
  sound: localStorage.getItem('bd_sound') !== '0',
  vibro: localStorage.getItem('bd_vibro') !== '0',
};

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

// ---------- Home UI ----------
function renderTechniques() {
  const list = $('technique-list');
  list.innerHTML = '';
  for (const t of TECHNIQUES) {
    const card = document.createElement('button');
    card.className = 'tech-card' + (t.id === state.techniqueId ? ' on' : '');
    card.innerHTML = `
      <div class="tech-name"><span>${t.name}</span><span class="tech-pattern">${t.pattern}</span></div>
      <div class="tech-desc">${t.desc}</div>`;
    card.addEventListener('click', () => {
      state.techniqueId = t.id;
      localStorage.setItem('bd_technique', t.id);
      renderTechniques();
    });
    list.appendChild(card);
  }
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
}

function showScreen(id) {
  for (const s of document.querySelectorAll('.screen')) s.classList.toggle('active', s.id === id);
}

// ---------- Sound ----------
let audioCtx = null;
function beep(freq, durMs = 350) {
  if (!state.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, audioCtx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + durMs / 1000);
    o.connect(g).connect(audioCtx.destination);
    o.start();
    o.stop(audioCtx.currentTime + durMs / 1000 + 0.05);
  } catch { /* звук недоступен — молча продолжаем */ }
}
const PHASE_FREQ = { 'Вдох': 440, 'Выдох': 294, 'Задержка': 370 };

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
  raf: 0,
};

function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

function startSession() {
  session.technique = TECHNIQUES.find((t) => t.id === state.techniqueId) || TECHNIQUES[0];
  session.running = true;
  session.paused = false;
  session.endAt = performance.now() + state.minutes * 60000;
  session.phaseIdx = -1;
  session.phaseEndAt = performance.now(); // сразу перейдём к первой фазе
  session.fromScale = 0.55;
  $('session-technique').textContent = session.technique.name;
  $('btn-pause').textContent = 'Пауза';
  showScreen('screen-session');
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then((l) => (session.lock = l)).catch(() => {});
  beep(PHASE_FREQ['Вдох']); // разблокировать аудио по клику
  session.raf = requestAnimationFrame(tick);
}

function nextPhase(now) {
  const phases = session.technique.phases;
  const prev = phases[session.phaseIdx];
  session.fromScale = prev ? prev.to : 0.55;
  session.phaseIdx = (session.phaseIdx + 1) % phases.length;
  const p = phases[session.phaseIdx];
  session.phaseStartAt = now;
  session.phaseEndAt = now + p.dur * 1000;
  $('phase-name').textContent = p.name;
  beep(PHASE_FREQ[p.name] || 370);
  buzz();
}

function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

function tick(now) {
  if (!session.running) return;
  if (session.paused) return;

  if (now >= session.endAt) { finishSession(); return; }
  if (now >= session.phaseEndAt) nextPhase(now);

  const p = session.technique.phases[session.phaseIdx];
  const t = Math.min(1, (now - session.phaseStartAt) / (p.dur * 1000));
  const scale = session.fromScale + (p.to - session.fromScale) * easeInOut(t);
  $('bubble').style.transform = `scale(${scale.toFixed(4)})`;

  const phaseLeft = (session.phaseEndAt - now) / 1000;
  $('phase-count').textContent = Math.ceil(phaseLeft);
  $('time-left').textContent = fmtTime((session.endAt - now) / 1000);

  session.raf = requestAnimationFrame(tick);
}

function togglePause() {
  if (!session.running) return;
  const now = performance.now();
  if (!session.paused) {
    session.paused = true;
    session.pausedLeft = session.endAt - now;
    session.pausedPhaseLeft = session.phaseEndAt - now;
    session.pausedPhaseElapsed = now - session.phaseStartAt;
    $('btn-pause').textContent = 'Продолжить';
    $('phase-name').textContent = 'Пауза';
  } else {
    session.paused = false;
    session.endAt = now + session.pausedLeft;
    session.phaseEndAt = now + session.pausedPhaseLeft;
    session.phaseStartAt = now - session.pausedPhaseElapsed;
    $('phase-name').textContent = session.technique.phases[session.phaseIdx].name;
    $('btn-pause').textContent = 'Пауза';
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
  const s = recordSession(state.minutes);
  $('done-summary').textContent =
    `${session.technique.name} · ${state.minutes} мин. Всего сессий: ${s.total}.`;
  $('done-streak').textContent = s.streak > 1
    ? `🔥 ${s.streak} дней подряд`
    : 'Первый день серии — приходи завтра';
  if (state.vibro && navigator.vibrate) navigator.vibrate([80, 60, 80]);
  showScreen('screen-done');
  renderStats();
}

function quitSession() {
  stopSession();
  showScreen('screen-home');
  renderStats();
}

// ---------- Wire up ----------
$('btn-start').addEventListener('click', startSession);
$('btn-again').addEventListener('click', startSession);
$('btn-pause').addEventListener('click', togglePause);
$('btn-close').addEventListener('click', quitSession);
$('btn-home').addEventListener('click', () => showScreen('screen-home'));

renderTechniques();
initOptions();
renderStats();

// ---------- PWA ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
