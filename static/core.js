'use strict';
/* core.js — общие помощники, структура курса, состояние и сохранение прогресса */

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const dn = k => { const a = String(k).split('-').map(Number); return Math.round(Date.UTC(a[0], a[1] - 1, a[2]) / 864e5); };
const keyFromDn = n => { const d = new Date(n * 864e5); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
const tk = () => keyOf(new Date());
const today = () => dn(tk());
const ruDate = (n, o) => new Date(n * 864e5).toLocaleDateString('ru-RU', Object.assign({timeZone:'UTC'}, o || {day:'numeric', month:'long'}));
const pl = (n, f) => { const a = Math.abs(n) % 100, b = a % 10; return f[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2]; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sample = (a, n) => shuffle(a.slice()).slice(0, n);
const isObj = x => !!x && typeof x === 'object' && !Array.isArray(x);

const svg = d => '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ICON = {
  check: svg('<path d="M5 12.5 10 17 19 7"/>'),
  spk: svg('<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  slow: svg('<path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>'),
  spark: svg('<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>')
};

/* ---------- текст: сравнение ответов ---------- */
const CONTR = [
  [/\bi'm\b/g, 'i am'], [/\b(you|we|they)'re\b/g, '$1 are'], [/\b(he|she|it|that|there|what|who|where|here)'s\b/g, '$1 is'],
  [/\bcan't\b/g, 'cannot'], [/\bcan not\b/g, 'cannot'], [/\bwon't\b/g, 'will not'],
  [/\b(is|are|was|were|do|does|did|have|has|would|should|could|must)n't\b/g, '$1 not'],
  [/\b(i|you|we|they)'ve\b/g, '$1 have'], [/\b(i|you|he|she|we|they)'ll\b/g, '$1 will'], [/\blet's\b/g, 'let us']
];
const NUM = {0:'zero',1:'one',2:'two',3:'three',4:'four',5:'five',6:'six',7:'seven',8:'eight',9:'nine',10:'ten',11:'eleven',12:'twelve'};
function norm(s) {
  let t = String(s || '').toLowerCase().replace(/[’‘`]/g, "'").replace(/[“”"]/g, '');
  CONTR.forEach(c => { t = t.replace(c[0], c[1]); });
  t = t.replace(/\b\d{1,2}\b/g, m => NUM[+m] || m);
  return t.replace(/[.,!?;:…—–()]/g, ' ').replace(/\s+/g, ' ').trim();
}
const variants = a => String(a).split(' / ').map(x => x.trim()).filter(Boolean);
const matches = (answer, got) => { const g = norm(got); return !!g && variants(answer).some(v => norm(v) === g); };
/* Сравнение по словам: какие слова образца прозвучали или были написаны. */
function wordDiff(expected, got) {
  const words = String(expected).split(/\s+/).filter(Boolean);
  const e = [], owner = [];
  words.forEach((w, i) => norm(w).split(' ').filter(Boolean).forEach(t => { e.push(t); owner.push(i); }));
  const g = norm(got).split(' ').filter(Boolean);
  const n = e.length, m = g.length, T = [];
  for (let i = 0; i <= n; i++) { T.push(new Array(m + 1).fill(0)); }
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) T[i][j] = e[i] === g[j] ? T[i + 1][j + 1] + 1 : Math.max(T[i + 1][j], T[i][j + 1]);
  const hit = new Array(n).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) { if (e[i] === g[j]) { hit[i] = true; i++; j++; } else if (T[i + 1][j] >= T[i][j + 1]) i++; else j++; }
  const okWord = words.map(() => true);
  hit.forEach((h, k) => { if (!h) okWord[owner[k]] = false; });
  return {
    ratio: n ? hit.filter(Boolean).length / n : 0,
    exact: n === m && hit.every(Boolean),
    html: words.map((w, k) => '<span class="' + (okWord[k] ? 'w-ok' : 'w-no') + '">' + esc(w) + '</span>').join(' ')
  };
}

/* ---------- слова ---------- */
const PACKS = [];
RAW_WORDS.trim().split('\n').forEach(line => {
  line = line.trim(); if (!line) return;
  if (line[0] === '#') { PACKS.push({t: line.slice(1).trim(), w: []}); return; }
  const p = line.split('|'), pk = PACKS[PACKS.length - 1];
  pk.w.push({id: p[0].toLowerCase().replace(/[^a-z]+/g, '_'), en: p[0], ru: p[1], ex: p[2] || '', pk: pk.t});
});
const BUILTIN = PACKS.reduce((a, p) => a.concat(p.w), []);

/* ---------- структура курса ---------- */
const UNITS = [
  {id:'u1', t:'Кто я', d:'Глагол to be: рассказать о себе и о других, спросить и возразить.', img:'unit1', lessons:['be1','be2']},
  {id:'u2', t:'Вещи и люди вокруг', d:'Артикли, множественное число, чьё это и что у кого есть.', img:'unit2', lessons:['art','plural','poss','have']},
  {id:'u3', t:'Мой обычный день', d:'Present Simple: привычки, отрицания, вопросы и порядок слов.', img:'unit3', lessons:['ps1','ps2','ps3','order']},
  {id:'u4', t:'Мир вокруг меня', d:'Что где находится, когда это происходит, что я умею и что делаю прямо сейчас.', img:'unit4', lessons:['there','prep','can','pc']}
];
const STEPS = [
  {k:'theory', t:'Разбор темы', s:'Читаешь объяснение и задаёшь вопросы ИИ'},
  {k:'read', t:'Чтение и аудирование', s:'Текст с озвучкой, вопросы и диктант'},
  {k:'practice', t:'Практика', s:'Вписываешь, собираешь, переводишь, исправляешь'},
  {k:'write', t:'Письмо', s:'Пишешь свой текст, ИИ разбирает ошибки'},
  {k:'speak', t:'Речь', s:'Читаешь вслух и отвечаешь на вопросы голосом'},
  {k:'final', t:'Закрепление', s:'Итоговый тест и шпаргалка'}
];
const REVIEW_GAPS = [1, 3, 7, 16, 35];
const PHASES = [
  {name:'Фундамент', from:'A0', to:'A1', end:.22, words:600, goal:'Читать и строить простые предложения, понимать медленную речь.', gram:'to be, артикли, Present Simple, there is и there are, can, Present Continuous'},
  {name:'Опора', from:'A1', to:'A2', end:.47, words:1300, goal:'Рассказывать о прошлом и планах, понимать учебные видео.', gram:'Past Simple, неправильные глаголы, будущее время, сравнения, модальные глаголы'},
  {name:'Самостоятельность', from:'A2', to:'B1', end:.77, words:2400, goal:'Смотреть сериалы с английскими субтитрами, писать связные тексты, говорить без подготовки.', gram:'Present Perfect, условные предложения, пассивный залог, косвенная речь'},
  {name:'Экзамен', from:'B1', to:'B2', end:1, words:3800, goal:'Академические тексты и лекции, эссе, задания экзамена на время.', gram:'сложные времена, связки для эссе, академическая лексика, пробный тест каждую неделю'}
];
const STATIONS = [['A0',0],['A1',.22],['A2',.47],['B1',.77],['B2',1]];
const MODES = {
  light:{name:'Лёгкий', h:'1 ч', nw:8,  min:{lesson:25, words:15, review:10, listen:10}},
  normal:{name:'Обычный', h:'2 ч', nw:12, min:{lesson:50, words:25, review:15, listen:30}},
  hard:{name:'Усиленный', h:'3 ч', nw:16, min:{lesson:70, words:35, review:20, listen:55}}
};
const HOURS_GOAL = 600;

/* ---------- состояние ---------- */
const LS = 'kurs-b2.v1';
const defaults = () => ({v:1, start:null, exam:'2027-07-15', mode:'normal', cards:{}, custom:[], lessons:{}, gram:null, days:{}, lp:{}, updatedAt:0, cardsAt:0});
let S = defaults();
function loadLocal() { try { const r = localStorage.getItem(LS); if (r) S = Object.assign(defaults(), JSON.parse(r)); } catch (e) {} }
function persistLocal() { try { localStorage.setItem(LS, JSON.stringify(S)); } catch (e) {} }
function sanitize() {
  if (!isObj(S.cards)) S.cards = {};
  if (!isObj(S.days)) S.days = {};
  if (!isObj(S.lp)) S.lp = {};
  if (!isObj(S.lessons)) S.lessons = {};
  if (!Array.isArray(S.custom)) S.custom = [];
  S.custom = S.custom.filter(c => isObj(c) && typeof c.id === 'string' && typeof c.en === 'string' && typeof c.ru === 'string');
  if (!MODES[S.mode]) S.mode = 'normal';
  if (!/^\d{4}-\d\d-\d\d$/.test(String(S.exam))) S.exam = defaults().exam;
}
function day() { const k = tk(); let d = S.days[k]; if (!d) d = S.days[k] = {t:{}, nw:0, rv:0}; if (!d.t) d.t = {}; return d; }
const allWords = () => {
  const mine = [], gen = [];
  S.custom.forEach(c => { (c.g ? gen : mine).push({id:c.id, en:c.en, ru:c.ru, ex:c.ex || '', pk:c.pk || (c.g ? 'Набор от ИИ' : 'Мои слова')}); });
  return mine.concat(BUILTIN, gen);
};

/* сохранение: файл на этом компьютере через локальное приложение, плюс копия в браузере */
let server = false, pushTimer = null, pushing = false, pushAgain = false;
const SAVED = 'Прогресс сохранён на компьютере', STOPPED = 'Приложение остановлено. Закрой окно и запусти его заново через ярлык.';
const api = (url, body) => fetch(url, body === undefined ? {cache:'no-store', headers:{'X-Kurs':'1'}} : {method:'POST', headers:{'Content-Type':'application/json', 'X-Kurs':'1'}, body:JSON.stringify(body)})
  .then(r => { if (!r.ok) throw new Error('http ' + r.status); return r.json(); });
function setSync(t, bad) { const e = $('#sync'); if (e) { e.textContent = t; e.classList.toggle('bad', !!bad); } }
async function pushState() {
  if (pushing) { pushAgain = true; return; }
  pushing = true;
  try { do { pushAgain = false; await api('/api/state', S); } while (pushAgain); setSync(SAVED); }
  catch (e) { setSync(STOPPED, true); }
  pushing = false;
}
function save() { S.updatedAt = Date.now(); persistLocal(); if (server) { clearTimeout(pushTimer); pushTimer = setTimeout(pushState, 400); } }

/* ---------- прогресс по времени и по урокам ---------- */
function prog() {
  const s = dn(S.start), e = Math.max(dn(S.exam), s + 28), t = Math.max(today(), s), total = e - s;
  const frac = Math.min(1, (t - s) / total);
  let pi = PHASES.findIndex(p => frac < p.end); if (pi < 0) pi = PHASES.length - 1;
  return {s, total, frac, pi, dayN: t - s + 1, week: Math.floor((t - s) / 7) + 1, weeks: Math.ceil(total / 7), left: dn(S.exam) - today()};
}
function streak() {
  const ok = n => { const d = S.days[keyFromDn(n)]; return !!(d && d.t && Object.keys(d.t).length >= 2); };
  let t = today(), n = 0; if (!ok(t)) t--; while (ok(t)) { n++; t--; } return n;
}
function hoursDone() { let m = 0; Object.keys(S.days).forEach(k => { const t = S.days[k].t || {}; Object.keys(t).forEach(x => { m += +t[x] || 0; }); }); return m / 60; }
function setTask(k, on) {
  const d = day();
  if (on && !(k in d.t)) d.t[k] = MODES[S.mode].min[k] || 15;
  else if (!on && (k in d.t)) delete d.t[k];
  else return;
  save();
}
const lessonById = id => LESSONS.find(l => l.id === id) || null;
const lessonNo = id => LESSONS.findIndex(l => l.id === id) + 1;
const unitOf = id => UNITS.find(u => u.lessons.indexOf(id) >= 0) || UNITS[0];
const lpPeek = id => { const p = S.lp[id]; return isObj(p) ? Object.assign({st:{}}, p, {st: isObj(p.st) ? p.st : {}}) : {st:{}}; };
function lp(id) { if (!isObj(S.lp[id])) S.lp[id] = {st:{}}; if (!isObj(S.lp[id].st)) S.lp[id].st = {}; return S.lp[id]; }
const stepsDone = id => { const st = lpPeek(id).st; return STEPS.filter(s => st[s.k]).length; };
const lessonDone = id => !!lpPeek(id).done;
const currentLesson = () => LESSONS.find(l => !lessonDone(l.id)) || null;
const nextStep = id => { const st = lpPeek(id).st, s = STEPS.find(x => !st[x.k]); return s ? s.k : null; };
function creditLessonTask(steps) {
  const d = day(); d.ls = (d.ls || 0) + steps;
  if (d.ls >= 2 && !('lesson' in d.t)) d.t.lesson = MODES[S.mode].min.lesson;
}
function completeStep(id, k) {
  const p = lp(id);
  if (!p.st[k]) { p.st[k] = tk(); creditLessonTask(1); }
  save();
}
function finishLesson(id, score) {
  const p = lp(id);
  if (!p.st.final) { p.st.final = tk(); creditLessonTask(2); }
  if (!p.done) { p.done = tk(); p.rn = 0; p.rd = today() + REVIEW_GAPS[0]; }
  p.best = Math.max(p.best || 0, score);
  save();
}
const reviewsDue = () => LESSONS.filter(l => { const p = lpPeek(l.id); return p.done && typeof p.rd === 'number' && p.rd <= today(); });
function finishReview(id) {
  const p = lp(id); p.rn = (p.rn || 0) + 1; p.rd = today() + (REVIEW_GAPS[p.rn] || 60);
  const d = day(); if (!('review' in d.t)) d.t.review = MODES[S.mode].min.review;
  save();
}

/* обработчики кликов: data-act="имя" вызывает ACT.имя(элемент, событие) */
const ACT = {};
