'use strict';
/* views.js — экраны приложения, навигация и запуск */

const VIEWS = {};
let CUR = {name:'home', parts:[]};
const V = () => $('#view');
function go(h) { if (location.hash === '#' + h) route(); else location.hash = '#' + h; }
function route() {
  const parts = (location.hash || '#home').slice(1).split('/');
  const name = VIEWS[parts[0]] ? parts[0] : 'home';
  stopSpeak(); stopListen(); RUN = null; LV = null;
  CUR = {name, parts};
  const navName = name === 'lesson' || name === 'review' ? 'course' : name;
  $$('#nav a').forEach(a => a.classList.toggle('on', a.dataset.r === navName));
  VIEWS[name](parts.slice(1));
  window.scrollTo(0, 0);
  renderSide();
}
VIEWS.lesson = vLesson;
VIEWS.review = vReview;

const img = (name, cls) => '<img class="' + (cls || '') + '" src="/static/img/' + name + '.jpg" alt="" onerror="this.remove()">';
function routeHTML(p) {
  return '<div class="rt"><div class="rt-line"></div><div class="rt-fill" style="width:' + (p.frac * 100).toFixed(1) + '%"></div>' +
    STATIONS.map(s => '<div class="rt-st' + (p.frac >= s[1] ? ' on' : '') + '" style="left:' + s[1] * 100 + '%"><i></i><b>' + s[0] + '</b></div>').join('') +
    '<div class="rt-me" style="left:' + (p.frac * 100).toFixed(1) + '%"></div></div>';
}
function renderSide() {
  const h = hoursDone(), st = streak(), mem = Object.keys(S.cards).filter(k => S.cards[k].n > 0).length;
  $('#side-stats').innerHTML =
    '<div><b>' + st + '</b><span>' + pl(st, ['день','дня','дней']) + ' подряд</span></div>' +
    '<div><b>' + (h < 10 ? h.toFixed(1) : Math.round(h)) + '</b><span>ч из ' + HOURS_GOAL + '</span></div>' +
    '<div><b>' + mem + '</b><span>' + pl(mem, ['слово','слова','слов']) + '</span></div>';
  $('#fab').hidden = CUR.name === 'tutor' || CUR.name === 'settings';
}

/* ---------- главная ---------- */
function todayTasks() {
  const p = prog(), d = day(), L = currentLesson(), due = reviewsDue(), T = [];
  const ns = L ? STEPS.find(s => s.k === nextStep(L.id)) : null;
  T.push({k:'lesson', t:'Урок: два шага', s:L ? 'Урок ' + lessonNo(L.id) + ' «' + L.title + '». Дальше: ' + (ns ? ns.t.toLowerCase() : 'закрепление') + '. Сегодня пройдено шагов: ' + Math.min(d.ls || 0, 9) : 'Все уроки блока пройдены. Повторяй пройденное.', to:L ? 'lesson/' + L.id : 'course', b:'К уроку'});
  const dc = dueCount(), nl = newLeft();
  T.push({k:'words', t:'Слова', s:(dc + nl) ? dc + ' к повторению, ' + nl + ' ' + pl(nl, ['новое','новых','новых']) : 'На сегодня всё повторено', to:'words', b:'Учить'});
  if (due.length || 'review' in d.t) T.push({k:'review', t:'Повторение пройденного', s:due.length ? due.map(x => 'урок ' + lessonNo(x.id) + ' «' + x.title + '»').join(', ') : 'Сделано', to:due.length ? 'review/' + due[0].id : 'course', b:'Повторить'});
  const it = STAGES[p.pi].items, lis = it[(p.dayN - 1) % it.length];
  T.push({k:'listen', t:'Аудирование', s:lis[1] + ': ' + lis[0] + '. Отметь сам, когда посмотришь.', to:'video', b:'Как смотреть'});
  return T;
}
VIEWS.home = () => {
  const p = prog(), d = day(), m = MODES[S.mode], L = currentLesson(), T = todayTasks();
  const dt = new Date().toLocaleDateString('ru-RU', {weekday:'long', day:'numeric', month:'long'});
  let hero;
  if (L) {
    const sd = stepsDone(L.id), ns = STEPS.find(s => s.k === nextStep(L.id)) || STEPS[5], started = sd > 0;
    hero = '<p class="eyebrow">Урок ' + lessonNo(L.id) + ' из ' + LESSONS.length + ' · ' + esc(unitOf(L.id).t) + '</p><h2>' + esc(L.title) + '</h2><p>' + esc(L.goal) + '</p>' +
      '<div class="dots big">' + STEPS.map(s => '<i class="' + (lpPeek(L.id).st[s.k] ? 'on' : s.k === ns.k ? 'now' : '') + '" title="' + s.t + '"></i>').join('') + '<span>шаг ' + Math.min(sd + 1, 6) + ' из 6: ' + ns.t.toLowerCase() + '</span></div>' +
      '<a class="btn lg" href="#lesson/' + L.id + '/' + ns.k + '">' + (started ? 'Продолжить урок' : 'Начать урок') + ICON.arrow + '</a>';
  } else hero = '<p class="eyebrow">Первый блок пройден</p><h2>Ты закончил все 14 уроков</h2><p>Повторяй темы по расписанию и учи слова. Следующий блок уроков добавит Claude: напиши ему в чате.</p><a class="btn lg" href="#course">Открыть курс</a>';
  let doneN = 0, doneM = 0, allM = 0;
  T.forEach(x => { allM += m.min[x.k]; if (x.k in d.t) { doneN++; doneM += +d.t[x.k] || 0; } });
  const totalSteps = LESSONS.reduce((a, l) => a + stepsDone(l.id), 0);
  let cal = ''; const t0 = today();
  for (let i = 27; i >= 0; i--) { const dd = S.days[keyFromDn(t0 - i)], l = dd && dd.t ? Math.min(4, Object.keys(dd.t).length) : 0; cal += '<i data-l="' + l + '"' + (i === 0 ? ' class="now"' : '') + ' title="' + ruDate(t0 - i) + '"></i>'; }
  V().innerHTML =
    '<header class="page-h"><div><p class="eyebrow">' + dt + ' · день ' + p.dayN + ' · неделя ' + p.week + ' из ' + p.weeks + '</p><h1>Сегодня</h1></div>' +
      '<div class="seg" role="group" aria-label="Режим дня">' + Object.keys(MODES).map(k => '<button type="button" data-act="mode" data-m="' + k + '" aria-pressed="' + (S.mode === k) + '">' + MODES[k].name + ' · ' + MODES[k].h + '</button>').join('') + '</div></header>' +
    (aiReady() ? '' : '<a class="banner" href="#settings">' + ICON.spark + '<span><b>Подключи ИИ-репетитора</b> — без него некому проверять письмо, переводы и речь. Это бесплатно и занимает две минуты.</span><span class="btn sm">Подключить</span></a>') +
    '<section class="hero"><div class="hero-t">' + hero + '</div><div class="hero-i">' + img('hero') + '</div></section>' +
    (totalSteps === 0 ? '<section class="how"><div><b>1. Урок</b><span>Каждый день два шага урока: сначала разбираешь тему, потом читаешь, слушаешь, пишешь и говоришь.</span></div><div><b>2. Слова</b><span>Карточки сами возвращаются тогда, когда ты начинаешь забывать слово.</span></div><div><b>3. Повторение</b><span>Пройденный урок приложение напомнит через 1, 3, 7 и 16 дней.</span></div></section>' : '') +
    '<section class="block"><div class="block-h"><h2>План на день</h2><span class="muted">сделано ' + doneN + ' из ' + T.length + ' · ' + doneM + ' из ' + allM + ' мин</span></div><ul class="tasks">' +
      T.map(x => { const on = x.k in d.t; return '<li class="task' + (on ? ' done' : '') + '"><button class="chk" type="button" data-act="toggle" data-k="' + x.k + '" aria-pressed="' + on + '" aria-label="Отметить: ' + esc(x.t) + '">' + ICON.check + '</button>' +
        '<div class="task-b"><b>' + esc(x.t) + '<small>' + m.min[x.k] + ' мин</small></b><span>' + esc(x.s) + '</span></div><a class="btn ghost sm" href="#' + x.to + '">' + x.b + '</a></li>'; }).join('') + '</ul>' +
      '<p class="muted small">Один день в неделю делай лёгким. Пропущенный день не отрабатывай двойной нагрузкой: просто продолжай.</p></section>' +
    '<section class="block two"><div><h2>Путь до экзамена</h2><p class="muted small">Этап «' + PHASES[p.pi].name + '» · ' + (p.left >= 0 ? 'до экзамена ' + p.left + ' ' + pl(p.left, ['день','дня','дней']) : 'дата экзамена прошла') + '</p><div class="route">' + routeHTML(p) + '</div></div>' +
      '<div><h2>Последние 4 недели</h2><p class="muted small">Чем темнее клетка, тем больше сделано за день</p><div class="cal">' + cal + '</div></div></section>';
};
ACT.toggle = a => { const k = a.dataset.k; setTask(k, !(k in day().t)); route(); };
ACT.mode = a => { if (!MODES[a.dataset.m]) return; S.mode = a.dataset.m; save(); queue = null; route(); };

/* ---------- курс ---------- */
VIEWS.course = () => {
  const cur = currentLesson();
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">Первый блок · уровень A0 → A1</p><h1>Курс</h1><p class="lead">' + LESSONS.length + ' уроков в четырёх темах. Каждый урок состоит из шести шагов: разбор темы, чтение и аудирование, практика, письмо, речь, закрепление.</p></div></header>' +
    UNITS.map((u, ui) => {
      const ls = u.lessons.map(lessonById).filter(Boolean);
      return '<section class="unit"><div class="unit-i c' + (ui + 1) + '">' + img(u.img) + '</div><div class="unit-b"><p class="eyebrow">Тема ' + (ui + 1) + '</p><h2>' + esc(u.t) + '</h2><p class="muted">' + esc(u.d) + '</p><ul class="lrows">' +
        ls.map(l => { const p = lpPeek(l.id), sd = stepsDone(l.id);
          return '<li><a class="lrow' + (cur && cur.id === l.id ? ' cur' : '') + '" href="#lesson/' + l.id + '"><span class="n">' + pad(lessonNo(l.id)) + '</span><span class="t">' + esc(l.title) + '<small>' + esc(l.goal) + '</small></span>' +
            '<span class="dots">' + STEPS.map(s => '<i class="' + (p.st[s.k] ? 'on' : '') + '" title="' + s.t + '"></i>').join('') + '</span>' +
            '<span class="s' + (p.done ? ' ok' : '') + '">' + (p.done ? 'Пройден · ' + (p.best || 0) + '%' : sd ? sd + ' из 6 шагов' : cur && cur.id === l.id ? 'Следующий' : '') + '</span></a></li>'; }).join('') + '</ul></div></section>';
    }).join('') +
    '<p class="muted">Дальше по плану: Past Simple, будущее время, сравнения. Этот блок добавит Claude, когда ты пройдёшь текущий.</p>';
};

/* ---------- слова: интервальное повторение ---------- */
let queue = null, qDay = '', shown = false;
const newAllowance = () => { const d = day(); return Math.max(0, MODES[S.mode].nw + (d.x || 0) - (d.nw || 0)); };
const dueCount = () => { const t = today(); return allWords().filter(w => S.cards[w.id] && S.cards[w.id].d <= t).length; };
const newLeft = () => Math.min(newAllowance(), allWords().filter(w => !S.cards[w.id]).length);
function buildQueue() {
  const t = today(), all = allWords();
  const due = shuffle(all.filter(w => S.cards[w.id] && S.cards[w.id].d <= t));
  const fresh = all.filter(w => !S.cards[w.id]).slice(0, newAllowance());
  queue = due.map(w => ({w, kind: S.cards[w.id].n === 0 ? 'learn' : 'rev'})).concat(fresh.map(w => ({w, kind:'new'})));
  qDay = tk(); shown = false;
}
function grade(g) {
  if (!queue || !queue.length) return;
  const it = queue.shift(), t = today(), d = day();
  let c = Object.assign({i:0, e:2.5, n:0, d:t}, S.cards[it.w.id] || {});
  if (it.kind === 'new') {
    d.nw = (d.nw || 0) + 1;
    if (g === 'know') c = {i:4, e:2.6, n:2, d:t + 4};
    else { c = {i:0, e:2.5, n:0, d:t}; queue.push({w:it.w, kind:'learn'}); }
  } else {
    d.rv = (d.rv || 0) + 1;
    if (g === 'again') { c.n = 0; c.i = 0; c.e = Math.max(1.3, c.e - 0.2); c.d = t; queue.push({w:it.w, kind:'learn'}); }
    else if (g === 'hard') { c.i = Math.max(1, Math.round(c.i * 1.2)); c.e = Math.max(1.3, c.e - 0.15); c.n++; c.d = t + c.i; }
    else if (g === 'easy') { c.i = c.n === 0 ? 3 : Math.round(Math.max(c.i, 1) * c.e * 1.3); c.e = c.e + 0.15; c.n++; c.d = t + c.i; }
    else { c.i = c.n === 0 ? 1 : c.n === 1 ? 3 : Math.max(c.i + 1, Math.round(c.i * c.e)); c.n++; c.d = t + c.i; }
    c.e = Math.round(c.e * 100) / 100;
  }
  S.cards[it.w.id] = c; shown = false;
  if (!queue.length && !('words' in d.t)) d.t.words = MODES[S.mode].min.words;
  save(); renderCard(); renderSide();
}
const wordsTabs = cur => '<div class="seg" role="group" aria-label="Раздел слов">' +
  [['words', 'Карточки'], ['words/dict', 'Словарь']].map(x => '<a href="#' + x[0] + '" aria-pressed="' + (cur === x[0]) + '">' + x[1] + '</a>').join('') + '</div>';
VIEWS.words = parts => {
  if (parts[0] === 'dict') return vDict();
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">Интервальное повторение</p><h1>Слова</h1><p class="lead">Слово возвращается ровно тогда, когда ты начинаешь его забывать. Отвечай честно: от оценки зависит, когда карточка придёт снова.</p></div>' + wordsTabs('words') + '</header>' +
    '<div class="two-col"><div><p class="muted small" id="w-stat"></p><div id="card"></div><p class="muted small" id="w-keys">С клавиатуры: пробел показывает ответ, цифры 1–4 ставят оценку.</p></div>' +
    '<aside class="block panel"><h2>Свои слова и фразы</h2><p class="muted small">Записывай сюда фразы из аниме, сериалов и игр. Они придут в повторения первыми.</p>' +
      '<input type="text" id="cw-en" placeholder="По-английски" autocomplete="off" lang="en"><input type="text" id="cw-ru" placeholder="Перевод" autocomplete="off"><input type="text" id="cw-ex" placeholder="Пример или откуда фраза" autocomplete="off">' +
      '<button class="btn ghost" data-act="addword" type="button">Добавить в колоду</button>' +
      '<button class="btn ghost" data-act="genwords" id="gen-btn" type="button">' + ICON.spark + ' Попросить ИИ подобрать 20 слов</button><p class="small" id="cw-msg" role="status"></p>' +
      '<p class="muted small">ИИ подбирает слова под твой уровень и ставит их в конец колоды. В переводе он может ошибиться: сомневаешься — проверь в словаре.</p></aside></div>';
  renderCard();
};

/* ---------- словарь: все слова колоды и их состояние ---------- */
let dq = '', dfilter = 'known', dsort = 'abc', dDel = '';
const DFILTERS = [['known', 'В памяти'], ['learn', 'Учу сейчас'], ['new', 'Не начато'], ['mine', 'Добавленные'], ['all', 'Все']];
function wordState(w) {
  const c = S.cards[w.id], t = today();
  if (!c) return {k:'new', t:'Не начато', when:'', due:false};
  const due = c.d <= t, when = due ? 'повтор сегодня' : 'повтор ' + ruDate(c.d);
  if (!c.n) return {k:'learn', t:'Учу', when, due};
  return {k:'known', t:c.i >= 21 ? 'Знаю крепко' : 'В памяти', strong:c.i >= 21, when, due};
}
function vDict() {
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">Все слова колоды</p><h1>Словарь</h1><p class="lead" id="d-lead"></p></div>' + wordsTabs('words/dict') + '</header>' +
    '<section class="block"><div class="dict-bar"><input type="search" id="d-q" placeholder="Найти слово или перевод" autocomplete="off" value="' + esc(dq) + '">' +
      '<div class="seg" role="group" aria-label="Порядок"><button type="button" data-act="d-sort" data-s="abc">По алфавиту</button><button type="button" data-act="d-sort" data-s="topic">По темам</button></div></div>' +
    '<div class="chips" id="d-filters"></div><div id="d-list"></div></section>';
  $('#d-q').addEventListener('input', e => { dq = e.target.value; renderDict(); });
  renderDict();
}
function renderDict() {
  const all = allWords(), mine = new Set(S.custom.map(c => c.id)), cnt = {known:0, learn:0, new:0, mine:0, all:all.length};
  const rows = all.map(w => { const st = wordState(w); cnt[st.k]++; if (mine.has(w.id)) cnt.mine++; return {w, st}; });
  $('#d-lead').textContent = 'В памяти ' + cnt.known + ' из ' + cnt.all + ' ' + pl(cnt.all, ['слова','слов','слов']) + '. Здесь видно каждое слово колоды, его перевод и день, когда приложение покажет его снова.';
  $('#d-filters').innerHTML = DFILTERS.map(f => '<button class="chip' + (dfilter === f[0] ? ' strong' : '') + '" type="button" data-act="d-filter" data-f="' + f[0] + '">' + f[1] + ' · ' + cnt[f[0]] + '</button>').join('');
  $$('[data-act="d-sort"]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.s === dsort)));
  const q = dq.trim().toLowerCase();
  let list = rows.filter(r => (dfilter === 'all' || (dfilter === 'mine' ? mine.has(r.w.id) : r.st.k === dfilter)) && (!q || r.w.en.toLowerCase().indexOf(q) >= 0 || r.w.ru.toLowerCase().indexOf(q) >= 0));
  if (dsort === 'abc') list = list.slice().sort((a, b) => a.w.en.toLowerCase().localeCompare(b.w.en.toLowerCase()));
  const box = $('#d-list');
  if (!list.length) {
    box.innerHTML = '<p class="muted">' + (q ? 'Ничего не найдено. Проверь написание или выбери «Все».' : dfilter === 'known' ? 'Пока нет слов в памяти. Они появятся после первой сессии карточек.' : 'В этом разделе пока пусто.') + '</p>';
    return;
  }
  const row = r => {
    const w = r.w, st = r.st, own = mine.has(w.id);
    return '<li class="drow">' + sayBtn(w.en) + '<div class="dw"><b class="en" lang="en">' + esc(w.en) + '</b><span>' + esc(w.ru) + '</span>' + (w.ex ? '<small class="en" lang="en">' + esc(w.ex) + '</small>' : '') + '</div>' +
      '<span class="tag plain">' + esc(w.pk) + '</span><div class="ds"><b class="st ' + st.k + (st.strong ? ' strong' : '') + '">' + st.t + '</b>' + (st.when ? '<small>' + st.when + '</small>' : '') + '</div><div class="da">' +
      (st.k !== 'new' && !st.due ? '<button class="link" type="button" data-act="d-again" data-id="' + esc(w.id) + '">Повторить сегодня</button>' : '') +
      (own ? (dDel === w.id ? '<button class="link bad" type="button" data-act="d-del-yes" data-id="' + esc(w.id) + '">Точно убрать</button><button class="link" type="button" data-act="d-del-no">Оставить</button>'
                            : '<button class="link" type="button" data-act="d-del" data-id="' + esc(w.id) + '">Убрать</button>') : '') + '</div></li>';
  };
  if (dsort === 'abc') { box.innerHTML = '<ul class="drows">' + list.map(row).join('') + '</ul>'; return; }
  let h = '', pk = null;
  list.forEach(r => { if (r.w.pk !== pk) { h += (pk === null ? '' : '</ul>') + '<h3 class="dgroup">' + esc(r.w.pk) + '</h3><ul class="drows">'; pk = r.w.pk; } h += row(r); });
  box.innerHTML = h + '</ul>';
}
ACT['d-filter'] = a => { dfilter = a.dataset.f; dDel = ''; renderDict(); };
ACT['d-sort'] = a => { dsort = a.dataset.s; renderDict(); };
ACT['d-again'] = a => { const c = S.cards[a.dataset.id]; if (!c) return; c.d = today(); save(); queue = null; renderDict(); };
ACT['d-del'] = a => { dDel = a.dataset.id; renderDict(); };
ACT['d-del-no'] = () => { dDel = ''; renderDict(); };
ACT['d-del-yes'] = a => { const id = a.dataset.id; S.custom = S.custom.filter(c => c.id !== id); delete S.cards[id]; dDel = ''; save(); queue = null; renderDict(); renderSide(); };
function renderCard() {
  if (!queue || qDay !== tk()) buildQueue();
  const box = $('#card'); if (!box) return;
  const it = queue[0], mem = Object.keys(S.cards).filter(k => S.cards[k].n > 0).length;
  $('#w-stat').textContent = 'В сессии осталось: ' + queue.length + ' · в памяти: ' + mem + ' · в колоде: ' + allWords().length;
  $('#w-keys').hidden = !it;
  if (!it) {
    const unseen = allWords().filter(w => !S.cards[w.id]).length;
    box.innerHTML = '<div class="fc"><h2>На сегодня слова закончились</h2>' +
      (unseen ? '<p class="muted">Возвращайся завтра. Если остались силы, возьми ещё немного.</p><div class="fc-btns"><button class="btn ghost" type="button" data-act="more">Ещё 5 новых слов</button></div>'
              : '<p class="muted">Ты прошёл всю колоду. Попроси ИИ подобрать новые слова или добавляй свои фразы из видео.</p>') + '</div>';
    return;
  }
  const w = it.w, c = S.cards[w.id] || {n:0};
  const ex = w.ex ? '<div class="fc-ex"><span>' + esc(w.ex) + '</span>' + sayBtn(w.ex) + '</div>' : '';
  const word = '<div class="fc-word"><span class="hl" lang="en">' + esc(w.en) + '</span>' + sayBtn(w.en) + '</div>';
  let h = '<div class="fc"><div class="tags"><span class="tag' + (it.kind === 'new' ? '' : ' plain') + '">' + (it.kind === 'new' ? 'Новое слово' : it.kind === 'learn' ? 'Закрепление' : 'Повторение') + '</span><span class="tag plain">' + esc(w.pk) + '</span></div>';
  if (it.kind === 'new') {
    h += word + '<div class="fc-ru">' + esc(w.ru) + '</div>' + ex +
      '<div class="fc-btns"><button class="btn" type="button" data-act="grade" data-g="learn">Учу</button><button class="btn ghost" type="button" data-act="grade" data-g="know">Уже знаю</button></div>';
  } else {
    const back = it.kind === 'rev' && c.n >= 3 && c.n % 2 === 1;
    if (!shown) h += (back ? '<div class="fc-ask">' + esc(w.ru) + '</div><p class="muted">Вспомни, как это по-английски, и скажи вслух.</p>' : word + '<p class="muted">Вспомни перевод.</p>') +
      '<div class="fc-btns"><button class="btn" type="button" data-act="show">Показать ответ</button></div>';
    else h += word + '<div class="fc-ru">' + esc(w.ru) + '</div>' + ex +
      '<div class="fc-btns"><button class="btn again" type="button" data-act="grade" data-g="again">Не помню</button><button class="btn ghost" type="button" data-act="grade" data-g="hard">С трудом</button><button class="btn" type="button" data-act="grade" data-g="good">Помню</button><button class="btn easy" type="button" data-act="grade" data-g="easy">Легко</button></div>';
  }
  box.innerHTML = h + '</div>';
}
ACT.show = () => { shown = true; renderCard(); };
ACT.grade = a => grade(a.dataset.g);
ACT.more = () => { const d = day(); d.x = (d.x || 0) + 5; save(); queue = null; renderCard(); };
ACT.addword = () => {
  const en = $('#cw-en').value.trim(), ru = $('#cw-ru').value.trim(), ex = $('#cw-ex').value.trim(), msg = $('#cw-msg');
  if (!en || !ru) { msg.textContent = 'Заполни английский вариант и перевод.'; return; }
  S.custom.unshift({id:'c_' + Date.now().toString(36), en:en.slice(0, 120), ru:ru.slice(0, 120), ex:ex.slice(0, 200)});
  $('#cw-en').value = ''; $('#cw-ru').value = ''; $('#cw-ex').value = '';
  msg.textContent = 'Добавлено: ' + en + '.';
  save(); queue = null; renderCard();
};
ACT.genwords = async a => {
  const msg = $('#cw-msg');
  if (a.disabled) return;
  if (!aiReady()) { msg.innerHTML = 'Сначала подключи ИИ в <a href="#settings">настройках</a>.'; return; }
  a.disabled = true; msg.textContent = 'ИИ подбирает слова…';
  const ph = PHASES[prog().pi], known = allWords().map(w => w.en.toLowerCase());
  try {
    const arr = await aiJSON('Ты составляешь учебный словарь для русскоязычного студента. Его уровень английского сейчас ' + ph.from + '–' + ph.to + '. Верни только JSON-массив из 20 объектов вида {"en":"...","ru":"...","ex":"..."}. en — частотное английское слово или короткое устойчивое выражение, полезное на этом уровне. ru — краткий точный перевод на русский. ex — короткое предложение-пример на английском из простых слов. Не используй имена собственные и слова, которые ученик уже знает.',
      'Слова, которые ученик уже знает: ' + known.slice(-1200).join(', '), {max:4000});
    const seen = new Set(known); let n = 0;
    (Array.isArray(arr) ? arr : Array.isArray(arr.words) ? arr.words : []).forEach((x, i) => {
      if (!x || typeof x.en !== 'string' || typeof x.ru !== 'string') return;
      const en = x.en.trim(), ru = x.ru.trim(), k = en.toLowerCase();
      if (!en || !ru || seen.has(k)) return;
      seen.add(k); n++;
      S.custom.push({id:'g_' + Date.now().toString(36) + '_' + i, en:en.slice(0, 120), ru:ru.slice(0, 120), ex:typeof x.ex === 'string' ? x.ex.trim().slice(0, 200) : '', g:1});
    });
    if (n) { save(); queue = null; renderCard(); msg.textContent = 'Добавлено слов: ' + n + '. Они стоят в конце колоды.'; }
    else msg.textContent = 'ИИ не вернул подходящих слов. Попробуй ещё раз.';
  } catch (e) { msg.textContent = aiCopy(e); }
  a.disabled = false;
};

/* ---------- тьютор: свободный разговор с ИИ ---------- */
let TUTOR = null, tmode = 'talk';
const TMODES = {
  talk:{t:'Диалог', hint:'Напиши любую фразу на английском, например: Hello! My name is … ИИ ответит, задаст вопрос и поправит ошибки.', ph:'Write in English…',
    sys:'Веди с учеником диалог на английском на его уровне: короткие простые предложения, самые частые слова. Каждый твой ответ состоит из двух частей. Сначала реплика на английском, которая заканчивается вопросом к ученику; редкие слова переводи в скобках. Затем с новой строки «Правка:» и по-русски одно или два исправления ошибок из последней реплики ученика, либо «ошибок нет».'},
  check:{t:'Проверка текста', hint:'Напиши несколько предложений на любую тему: как прошёл день, что ты смотрел, какие планы. ИИ исправит и объяснит ошибки.', ph:'Write in English…',
    sys:'Ученик присылает свой текст на английском. Ответь в таком порядке. «Исправленный вариант:» — его текст целиком без ошибок. «Ошибки:» — до трёх главных ошибок, для каждой: что было, как правильно и почему. «Хорошо получилось:» — одна фраза. «Попробуй:» — одно короткое упражнение на главную ошибку.'},
  ask:{t:'Вопрос по языку', hint:'Задай вопрос по-русски. Например: почему здесь the? Чем отличается say от tell?', ph:'Спроси по-русски…',
    sys:'Ученик задаёт вопрос об английском языке. Объясни по-русски и приведи 2–3 примера на английском с переводом.'}
};
VIEWS.tutor = () => {
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">Свободная практика</p><h1>Тьютор</h1></div><div class="seg" role="group" aria-label="Режим">' +
    Object.keys(TMODES).map(k => '<button type="button" data-act="tmode" data-m="' + k + '" aria-pressed="' + (k === tmode) + '">' + TMODES[k].t + '</button>').join('') + '</div></header>' +
    '<p class="lead" id="tu-hint">' + TMODES[tmode].hint + '</p><div id="tu-chat" class="chatbox"></div>';
  TUTOR = createChat($('#tu-chat'), {placeholder:TMODES[tmode].ph, system:() => 'Ты репетитор английского языка. ' + aiStudent() + ' Будь кратким: до 150 слов. ' + AI_STYLE + '\n\n' + TMODES[tmode].sys});
  TUTOR.focus();
};
ACT.tmode = a => { if (TUTOR && TUTOR.busy) return; tmode = a.dataset.m; route(); };

/* ---------- видео ---------- */
VIEWS.video = () => {
  const p = prog();
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">Аудирование</p><h1>Что смотреть и слушать</h1><p class="lead">Полчаса английского на слух каждый день дают больше, чем три часа раз в неделю.</p></div></header>' +
    '<section class="block"><h2>Как смотреть, чтобы язык рос</h2><ol class="numbered"><li>Выбери отрывок на 10–20 минут. Короткий и понятый лучше, чем двухчасовой фоном.</li><li>Первый просмотр — с английскими субтитрами. Русские включай, только если потерял сюжет.</li><li>Выпиши 5–8 фраз целиком, а не отдельных слов, и добавь их в <a href="#words">карточки</a>.</li><li>Пересмотри 2–3 минуты и повторяй за героями вслух, копируя ритм и интонацию.</li><li>На следующий день пересмотри тот же отрывок без субтитров.</li></ol>' +
    '<p class="muted small">С русскими субтитрами мозг читает по-русски и перестаёт слушать. Поэтому они только как страховка.</p></section>' +
    STAGES.map((s, i) => { const ph = PHASES[i];
      return '<section class="block stage' + (i === p.pi ? ' cur' : '') + '"><div class="block-h"><h2>' + ph.from + ' → ' + ph.to + ' · ' + ph.name + '</h2>' + (i === p.pi ? '<span class="tag">ты здесь</span>' : '') + '</div><p class="muted">' + esc(s.note) + '</p><ul class="items">' +
        s.items.map(x => '<li><span class="k">' + esc(x[1]) + '</span><span><b lang="en">' + esc(x[0]) + '</b> — ' + esc(x[2]) + (x[3] ? ' <a href="https://www.youtube.com/results?search_query=' + encodeURIComponent(x[3]) + '" target="_blank" rel="noopener">Найти на YouTube</a>' : '') + '</span></li>').join('') + '</ul></section>'; }).join('');
};

/* ---------- план ---------- */
VIEWS.plan = () => {
  const p = prog(); let prev = 0;
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">От нуля до экзамена</p><h1>План</h1><p class="lead">С нуля до B2 нужно около 600 часов занятий. По два часа в день ты наберёшь их как раз к экзамену. Запаса почти нет, поэтому регулярность важнее рывков.</p></div></header>' +
    '<section class="block"><div class="route wide">' + routeHTML(p) + '</div>' + PHASES.map((ph, i) => {
      const a = p.s + Math.round(p.total * prev), b = p.s + Math.round(p.total * ph.end); prev = ph.end;
      return '<div class="phase' + (i === p.pi ? ' cur' : '') + '"><div class="lv">' + ph.from + ' → ' + ph.to + '<small>' + ruDate(a) + ' – ' + ruDate(b) + '</small></div><div class="b"><b>' + esc(ph.name) + (i === p.pi ? ' · ты здесь' : '') + '</b><span>' + esc(ph.goal) + '</span><span class="muted small">Грамматика: ' + esc(ph.gram) + '</span><span class="muted small">Словарь к концу этапа: около ' + ph.words + ' слов</span></div></div>'; }).join('') + '</section>' +
    '<section class="block"><h2>Какой экзамен сдавать</h2><div class="scroll"><table><tr><th></th><th>Duolingo English Test</th><th>IELTS Academic</th></tr>' +
      '<tr><th>Формат</th><td>Онлайн из дома, около часа</td><td>В экзаменационном центре, около 2 ч 45 мин</td></tr><tr><th>Шкала</th><td>10–160</td><td>0–9</td></tr>' +
      '<tr><th>Обычно просят магистратуры США</th><td>115–130</td><td>6.5–7.0</td></tr><tr><th>Цена</th><td>В несколько раз дешевле</td><td>Дороже</td></tr><tr><th>Где принимают</th><td>Многие вузы, но не все</td><td>Почти везде</td></tr></table></div>' +
      '<p class="muted small">Сначала выбери 5–8 программ и выпиши их требования: от этого зависят и экзамен, и целевой балл. Многие вузы США также принимают TOEFL iBT. Цены, шкалы и доступность экзаменов в твоей стране меняются, проверяй на официальных сайтах.</p></section>';
};

/* ---------- настройки ---------- */
VIEWS.settings = () => {
  V().innerHTML = '<header class="page-h"><div><p class="eyebrow">Приложение</p><h1>Настройки</h1></div></header>' +
    '<section class="block"><div class="block-h"><h2>ИИ-репетитор</h2><span class="tag" id="ai-state"></span></div>' +
      '<p class="muted">ИИ проверяет письмо, переводы и устные ответы и объясняет ошибки. Он работает через бесплатный сервис по твоему собственному ключу. Ключ хранится только на этом компьютере и уходит только выбранному сервису.</p>' +
      '<p class="fb wait" id="ai-note" hidden></p><ol class="numbered" id="ai-steps"></ol>' +
      '<div class="form"><label>Сервис<select id="ai-p"></select></label><label id="ai-key-l">Ключ API<input type="password" id="ai-key" autocomplete="off" spellcheck="false" placeholder="Вставь ключ сюда"></label>' +
        '<label id="ai-base-l">Адрес API<input type="url" id="ai-base" placeholder="https://…/v1" autocomplete="off" spellcheck="false"></label><label>Модель<select id="ai-model"></select></label></div>' +
      '<p class="muted small">Облегчённые модели (в названии есть lite) отвечают за секунду, и их хватает для проверки заданий. Обычные Flash умнее, но на бесплатном тарифе часто перегружены. Если выбранная модель не отвечает, приложение само перейдёт на запасную.</p>' +
      '<div class="row"><button class="btn" type="button" data-act="ai-connect">Подключить</button></div><p class="fb" id="ai-msg" role="status" hidden></p></section>' +
    '<section class="block"><h2>Микрофон</h2><p class="muted">Нужен для шага «Речь». Нажми кнопку и скажи по-английски: Hello, my name is … При первом запуске окно спросит разрешение на микрофон.</p>' +
      '<div class="row">' + (SR ? '<button class="btn ghost mic" type="button" data-act="mic-test">' + ICON.mic + '<span>Проверить микрофон</span></button>' : '<span class="muted">В этом окне нет распознавания речи.</span>') + '</div><p class="fb" id="mic-msg" hidden></p></section>' +
    '<section class="block"><h2>Даты</h2><div class="form"><label>Дата экзамена<input type="date" id="set-exam" value="' + esc(S.exam) + '"></label><label>Дата начала занятий<input type="date" id="set-start" value="' + esc(S.start) + '"></label></div></section>' +
    '<section class="block"><h2>Прогресс</h2><p class="muted">Прогресс хранится в папке приложения на этом компьютере, резервная копия делается автоматически каждый день. Файл прогресса нужен, чтобы перенести занятия на другой компьютер.</p>' +
      '<div class="row"><button class="btn ghost" data-act="export" type="button">Сохранить файл прогресса</button><button class="btn ghost" data-act="import" type="button">Загрузить файл прогресса</button><input type="file" id="imp" accept=".json,application/json" hidden></div><p class="small" id="io-msg" role="status"></p>' +
      '<div class="row" id="reset-row"><button class="btn ghost sm" data-act="reset" type="button">Сбросить весь прогресс</button></div></section>';
  $('#ai-p').innerHTML = Object.keys(PROVIDERS).map(k => '<option value="' + k + '">' + esc(PROVIDERS[k].name) + '</option>').join('');
  $('#ai-p').addEventListener('change', e => { if (!PROVIDERS[e.target.value]) return; AI.p = e.target.value; saveAI(); aiUI(); });
  $('#ai-key').addEventListener('input', e => { AI.keys[AI.p] = e.target.value.trim(); saveAI(); aiUI(true); });
  $('#ai-base').addEventListener('input', e => { AI.base = e.target.value.trim(); saveAI(); aiUI(true); });
  $('#ai-model').addEventListener('change', e => { AI.models[AI.p] = e.target.value; AI.manual[AI.p] = true; delete AI.switched; saveAI(); aiUI(true); });
  $('#imp').addEventListener('change', e => { importPicked(e.target.files && e.target.files[0]); e.target.value = ''; });
  $('#set-exam').addEventListener('change', e => { if (/^\d{4}-\d\d-\d\d$/.test(e.target.value)) { S.exam = e.target.value; save(); } });
  $('#set-start').addEventListener('change', e => { if (/^\d{4}-\d\d-\d\d$/.test(e.target.value) && dn(e.target.value) <= today()) { S.start = e.target.value; save(); } else e.target.value = S.start; });
  aiUI();
};
function aiUI(keepInputs) {
  if (!$('#ai-p')) return;
  const P = PROVIDERS[AI.p], ready = aiReady(), st = $('#ai-state');
  $('#ai-p').value = AI.p;
  st.textContent = ready ? 'Подключён: ' + aiModel() : 'Не подключён'; st.classList.toggle('plain', !ready);
  const sw = AI.switched, note = $('#ai-note');
  note.hidden = !(ready && sw && sw.to === aiModel());
  if (!note.hidden) note.textContent = 'Модель ' + sw.from + ' была перегружена, поэтому приложение само перешло на ' + sw.to + '.';
  $('#ai-base-l').hidden = AI.p !== 'custom'; $('#ai-key-l').hidden = !!P.nokey;
  $('#ai-steps').innerHTML = P.nokey
    ? '<li>Установи программу с <a href="' + P.keyUrl + '" target="_blank" rel="noopener">сайта Ollama</a> и скачай в ней небольшую модель.</li><li>Нажми «Подключить».</li>'
    : AI.p === 'custom' ? '<li>Укажи адрес API и ключ сервиса.</li><li>Нажми «Подключить».</li>'
    : '<li><a href="' + P.keyUrl + '" target="_blank" rel="noopener">' + P.link + '</a> и войди в аккаунт. ' + esc(P.hint) + '</li><li>Создай там ключ (кнопка Create API key) и скопируй его.</li><li>Вставь ключ в поле ниже и нажми «Подключить».</li>';
  if (!keepInputs) { $('#ai-key').value = AI.keys[AI.p] || ''; $('#ai-base').value = AI.base || ''; }
  const list = AI.lists[AI.p] || [], cur = aiModel(), all = cur && list.indexOf(cur) < 0 ? [cur].concat(list) : list;
  $('#ai-model').innerHTML = all.length ? all.map(m => '<option value="' + esc(m) + '"' + (m === cur ? ' selected' : '') + '>' + esc(m) + '</option>').join('') : '<option value="">Определится при подключении</option>';
}
ACT['ai-connect'] = async a => {
  const msg = $('#ai-msg'); msg.hidden = false; msg.className = 'fb wait'; msg.textContent = 'Подключаюсь и проверяю ответ модели…'; a.disabled = true;
  try {
    const r = await aiConnect();
    msg.className = 'fb ok'; msg.textContent = 'Работает. Модель ' + r.model + ' ответила: ' + r.hello.slice(0, 160);
  } catch (e) { msg.className = 'fb no'; msg.textContent = aiCopy(e); }
  a.disabled = false; if ($('#ai-p')) aiUI(true);
};
ACT['mic-test'] = a => {
  const fb = $('#mic-msg'), label = $('span', a);
  if (a.classList.contains('rec')) { stopListen(); return; }
  let failed = false, last = '';
  listen(ev => {
    if (!document.body.contains(a)) return;
    fb.hidden = false;
    if (ev.state === 'start') { a.classList.add('rec'); label.textContent = 'Слушаю… нажми, чтобы закончить'; fb.className = 'fb wait'; fb.textContent = 'Говори по-английски'; }
    else if (ev.state === 'text') { last = ev.text; fb.textContent = ev.text; }
    else if (ev.state === 'error') { failed = true; fb.className = 'fb no'; fb.textContent = MIC_ERR[ev.error] || 'Не получилось распознать речь. Попробуй ещё раз.'; }
    else if (ev.state === 'end') { a.classList.remove('rec'); label.textContent = 'Проверить микрофон'; if (failed) return; const t = ev.text || last; fb.className = 'fb ' + (t ? 'ok' : 'no'); fb.textContent = t ? 'Микрофон работает. Приложение услышало: ' + t : MIC_ERR['no-speech']; }
  });
};
function exportData() {
  const msg = $('#io-msg');
  try {
    const url = URL.createObjectURL(new Blob([JSON.stringify(S)], {type:'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'kurs-b2-progress-' + tk() + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    msg.textContent = 'Файл прогресса сохранён в папку загрузок.';
  } catch (e) { msg.textContent = 'Не получилось сохранить файл.'; }
}
let pendingImport = null;
function importPicked(file) {
  const msg = $('#io-msg'); if (!file) return;
  const r = new FileReader();
  r.onerror = () => { msg.textContent = 'Не получилось прочитать файл.'; };
  r.onload = () => {
    let d = null; try { d = JSON.parse(String(r.result)); } catch (e) {}
    if (!isObj(d) || d.v !== 1 || !isObj(d.cards) || !isObj(d.days) || !/^\d{4}-\d\d-\d\d$/.test(String(d.start))) { msg.textContent = 'Это не файл прогресса «Курса на B2».'; return; }
    pendingImport = d;
    msg.innerHTML = 'В файле: старт ' + esc(d.start) + ', карточек: ' + Object.keys(d.cards).length + '. Заменить текущий прогресс? <button class="btn sm" type="button" data-act="import-yes">Заменить</button> <button class="btn ghost sm" type="button" data-act="import-no">Отмена</button>';
  };
  r.readAsText(file);
}
ACT.export = exportData;
ACT.import = () => $('#imp').click();
ACT['import-no'] = () => { pendingImport = null; $('#io-msg').textContent = ''; };
ACT['import-yes'] = () => { const d = pendingImport; pendingImport = null; if (!d) return; S = Object.assign(defaults(), d); sanitize(); save(); queue = null; route(); $('#io-msg').textContent = 'Прогресс загружен из файла.'; };
ACT.reset = () => { $('#reset-row').innerHTML = '<span>Стереть слова, уроки и статистику? Вернуть будет нельзя.</span><button class="btn again sm" type="button" data-act="reset-yes">Да, стереть</button><button class="btn ghost sm" type="button" data-act="reset-no">Отмена</button>'; };
ACT['reset-no'] = () => route();
ACT['reset-yes'] = () => { S = defaults(); S.start = tk(); save(); queue = null; go('home'); };

/* ---------- события ---------- */
document.addEventListener('click', e => {
  const s = e.target.closest('[data-say]');
  if (s) { speak(s.dataset.say, !!s.dataset.slow); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const f = ACT[a.dataset.act]; if (f) f(a, e);
});
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target.tagName;
  if (e.key === 'Escape' && !$('#drawer').hidden) { $('#drawer').hidden = true; return; }
  if (RUN && e.key === 'Enter' && tag !== 'TEXTAREA' && tag !== 'BUTTON' && tag !== 'A' && !e.target.closest('#drawer')) {
    e.preventDefault(); if (RUN.answered) ACT['run-next'](); else runCheck(); return;
  }
  if (CUR.name !== 'words' || CUR.parts[1] === 'dict' || /^(INPUT|TEXTAREA|BUTTON|A|SELECT)$/.test(tag)) return;
  const it = queue && queue[0]; if (!it) return;
  if (it.kind === 'new') { if (e.key === '1') grade('learn'); else if (e.key === '2') grade('know'); return; }
  if (!shown) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); shown = true; renderCard(); } return; }
  const g = {'1':'again','2':'hard','3':'good','4':'easy'}[e.key]; if (g) grade(g);
});
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (CUR.name === 'home' || CUR.name === 'course') ) route(); });

/* ---------- запуск ---------- */
async function boot() {
  loadLocal();
  let needPush = false;
  try {
    const d = await api('/api/state');
    server = true;
    if (isObj(d.state) && d.state.v === 1 && (d.state.updatedAt || 0) >= (S.updatedAt || 0)) { S = Object.assign(defaults(), d.state); persistLocal(); }
    else if (S.updatedAt) needPush = true;
    if (isObj(d.ai) && isObj(d.ai.keys)) { AI = Object.assign({p:'gemini', keys:{}, models:{}, base:''}, d.ai); fixAI(); try { localStorage.setItem(AIKEY, JSON.stringify(AI)); } catch (e) {} }
    else if (Object.keys(AI.keys).length || Object.keys(AI.models).length) saveAI();
    setSync(SAVED);
    let down = false;
    setInterval(() => { api('/api/ping').then(() => { if (down) { down = false; setSync(SAVED); } }, () => { down = true; setSync(STOPPED, true); }); }, 15000);
    window.addEventListener('pagehide', () => { try { navigator.sendBeacon('/api/bye'); } catch (e) {} });
  } catch (e) { server = false; setSync('Прогресс хранится в этом браузере'); }
  sanitize();
  if (!S.start) { S.start = tk(); if (server) save(); else persistLocal(); }
  else if (needPush) pushState();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
  route();
}
boot();
