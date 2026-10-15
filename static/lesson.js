'use strict';
/* lesson.js — урок из шести шагов, тренажёр заданий, повторение и чат с ИИ */

let LV = null;   // открытый урок: {L, step, ...состояние шага}
let RUN = null;  // текущая серия заданий
const STEP = {};

const rich = s => esc(s).replace(/\{([^}]+)\}/g, '<b class="en">$1</b>');
const mkGap = s => { const p = s.split('|'); return {k:'gap', q:p[0], a:p[1]}; };
const mkMc = s => { const p = s.split('|'); return {k:'mc', q:p[0], a:p[1], o:shuffle(p.slice(1))}; };
const mkTr = t => ({k:'tr', q:t[0], a:t[1]});
const mkFix = f => ({k:'fix', q:f[0], a:f[1]});
const mkBuild = s => ({k:'build', a:s});
const practiceItems = L => [].concat(shuffle(L.gaps.map(mkGap)), shuffle(L.build.map(mkBuild)), shuffle(L.tr.map(mkTr)), shuffle(L.fix.map(mkFix)));

function vLesson(parts) {
  const L = lessonById(parts[0]);
  if (!L) return go('course');
  let step = parts[1];
  if (!STEPS.some(s => s.k === step)) step = nextStep(L.id) || 'theory';
  LV = {L, step};
  const u = unitOf(L.id), st = lpPeek(L.id).st;
  $('#view').innerHTML =
    '<a class="back" href="#course">← Все уроки</a>' +
    '<header class="l-head"><p class="eyebrow">Урок ' + lessonNo(L.id) + ' · ' + esc(u.t) + '</p><h1>' + esc(L.title) + '</h1><p class="lead">' + esc(L.goal) + '</p></header>' +
    '<nav class="steps" aria-label="Шаги урока">' + STEPS.map((s, i) =>
      '<a href="#lesson/' + L.id + '/' + s.k + '" class="stepb' + (s.k === step ? ' on' : '') + (st[s.k] ? ' done' : '') + '"><span class="n">' + (st[s.k] ? ICON.check : i + 1) + '</span><span class="t">' + s.t + '</span></a>').join('') + '</nav>' +
    '<div id="step" class="step"></div>';
  STEP[step](L, $('#step'));
}
function footer(step, note) {
  const nxt = STEPS[STEPS.findIndex(s => s.k === step) + 1];
  return '<div class="step-foot">' + (note ? '<p class="muted">' + note + '</p>' : '') +
    '<button class="btn lg" type="button" data-act="step-done">Готово. Дальше: ' + nxt.t.toLowerCase() + ICON.arrow + '</button></div>';
}
ACT['step-done'] = () => {
  if (!LV) return;
  const L = LV.L, step = LV.step;
  if (step === 'read') addLessonWords(L);
  completeStep(L.id, step);
  go('lesson/' + L.id + '/' + STEPS[STEPS.findIndex(s => s.k === step) + 1].k);
};
function addLessonWords(L) {
  const have = new Set(allWords().map(w => w.en.toLowerCase()));
  (L.read.words || []).forEach((w, i) => {
    if (have.has(w[0].toLowerCase())) return;
    S.custom.push({id:'l_' + L.id + '_' + i, en:w[0], ru:w[1], ex:'', pk:'Урок ' + lessonNo(L.id)});
  });
}

/* ---------- шаг 1: разбор темы ---------- */
const ASK_CHIPS = ['Объясни эту тему ещё проще, как будто мне 10 лет', 'Дай ещё 5 примеров с переводом', 'Какие ошибки здесь чаще всего делают русскоязычные?', 'Задай мне 3 вопроса по теме, по одному, и проверь ответы'];
STEP.theory = (L, box) => {
  box.innerHTML = L.theory.map((b, bi) => {
    let h = '<section class="tblock"><h2>' + esc(b.h) + '</h2>' + (b.p || []).map(p => '<p>' + rich(p) + '</p>').join('');
    if (b.t) h += '<div class="scroll"><table>' + (b.t.head ? '<tr>' + b.t.head.map(c => '<th>' + rich(c) + '</th>').join('') + '</tr>' : '') +
      b.t.rows.map(r => '<tr>' + r.map(c => '<td>' + rich(c) + '</td>').join('') + '</tr>').join('') + '</table></div>';
    if (b.ex) h += '<ul class="exs">' + b.ex.map(x => '<li>' + sayBtn(x[0]) + '<div><p class="en">' + esc(x[0]) + '</p><p class="ru">' + esc(x[1]) + '</p></div></li>').join('') + '</ul>';
    if (b.bad) h += '<div class="pit"><b>Частые ошибки</b><ul>' + b.bad.map(x => '<li><span class="en x">' + esc(x[0]) + '</span><span class="en v">' + esc(x[1]) + '</span>' + (x[2] ? '<span class="why">' + rich(x[2]) + '</span>' : '') + '</li>').join('') + '</ul></div>';
    if (b.q) { const p = b.q.split('|'); h += '<div class="mini" data-a="' + esc(p[1]) + '"><p class="kind">Проверь, что понял</p><p class="q en">' + esc(p[0]).replace('___', '<span class="blank"></span>') + '</p><div class="opts">' +
      shuffle(p.slice(1)).map(o => '<button class="opt" type="button" data-act="tq" data-o="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div></div>'; }
    return h + '</section>';
  }).join('') +
  '<section class="askai"><div><h2>Что-то осталось непонятным?</h2><p>Спроси ИИ. Он знает, какую тему ты сейчас проходишь, и объяснит другими словами.</p></div><div class="chips">' +
    ASK_CHIPS.map(c => '<button class="chip" type="button" data-act="ask" data-q="' + esc(c) + '">' + esc(c) + '</button>').join('') +
    '<button class="chip strong" type="button" data-act="ask">' + ICON.spark + ' Задать свой вопрос</button></div></section>' +
  footer('theory');
};
ACT.tq = a => {
  const m = a.closest('.mini'); if (!m || m.dataset.done) return;
  m.dataset.done = '1';
  $$('.opt', m).forEach(b => { b.disabled = true; if (b.dataset.o === m.dataset.a) b.classList.add('ok'); else if (b === a) b.classList.add('no'); });
};
ACT.ask = a => openAsk(a.dataset.q || '');

/* ---------- шаг 2: чтение и аудирование ---------- */
STEP.read = (L, box) => {
  const R = L.read;
  LV.r = {playing:false};
  box.innerHTML =
    '<section class="readbox"><div class="read-h"><h2>' + esc(R.title) + '</h2><div class="row">' +
      (canSpeak ? '<button class="btn ghost sm" type="button" data-act="r-play">' + ICON.spk + ' Слушать всё</button><button class="btn ghost sm" type="button" data-act="r-play" data-slow="1">' + ICON.slow + ' Медленно</button>' : '') +
      '<button class="btn ghost sm" type="button" data-act="r-ru" aria-pressed="false">Показать перевод</button></div></div>' +
    '<p class="muted small">Сначала послушай, не глядя в текст. Потом прочитай вслух вместе с диктором. Перевод открывай в последнюю очередь.</p>' +
    '<ol class="lines">' + R.lines.map(l => '<li>' + sayBtn(l[0]) + '<div><p class="en">' + esc(l[0]) + '</p><p class="ru" hidden>' + esc(l[1]) + '</p></div></li>').join('') + '</ol>' +
    (R.words && R.words.length ? '<div class="gloss"><b>Новые слова</b>' + R.words.map(w => '<span class="chip"><span class="en">' + esc(w[0]) + '</span> — ' + esc(w[1]) + '</span>').join('') + '</div><p class="muted small">Эти слова попадут в карточки, когда закончишь шаг.</p>' : '') + '</section>' +
    '<section class="tblock"><h2>Верно или неверно?</h2><p class="muted">Ответь по тексту выше.</p><ul class="tf">' +
      R.tf.map(q => '<li data-a="' + (q[1] ? 1 : 0) + '"><p class="en">' + esc(q[0]) + '</p><div class="row"><button class="opt" type="button" data-act="r-tf" data-v="1">Верно</button><button class="opt" type="button" data-act="r-tf" data-v="0">Неверно</button></div></li>').join('') + '</ul></section>' +
    '<section class="tblock"><h2>Диктант</h2><p class="muted">Послушай предложение и запиши его на слух. Слушать можно сколько угодно раз.</p><ol class="dict">' +
      R.dict.map(li => { const s = R.lines[li][0].replace(/^[A-Z][a-z]+:\s*/, ''); return '<li data-s="' + esc(s) + '"><div class="row">' + sayBtn(s) + sayBtn(s, 1) +
        '<input type="text" class="grow" lang="en" autocomplete="off" spellcheck="false" placeholder="Запиши, что слышишь"><button class="btn ghost sm" type="button" data-act="r-dict">Проверить</button></div><p class="fb" hidden></p></li>'; }).join('') + '</ol></section>' +
    footer('read');
};
ACT['r-play'] = async a => {
  if (!LV || !LV.r) return;
  const r = LV.r;
  if (r.playing) { r.playing = false; stopSpeak(); return; }
  r.playing = true;
  const slow = !!a.dataset.slow, lis = $$('.lines li'), lines = LV.L.read.lines;
  for (let i = 0; i < lines.length && r.playing && LV && LV.r === r; i++) {
    lis.forEach(x => x.classList.remove('now')); if (lis[i]) lis[i].classList.add('now');
    await speak(lines[i][0], slow);
  }
  lis.forEach(x => x.classList.remove('now')); r.playing = false;
};
ACT['r-ru'] = a => { const on = a.getAttribute('aria-pressed') !== 'true'; a.setAttribute('aria-pressed', String(on)); a.textContent = on ? 'Скрыть перевод' : 'Показать перевод'; $$('.lines .ru').forEach(p => { p.hidden = !on; }); };
ACT['r-tf'] = a => {
  const li = a.closest('li'); if (!li || li.dataset.done) return;
  li.dataset.done = '1';
  $$('.opt', li).forEach(b => { b.disabled = true; if (b.dataset.v === li.dataset.a) b.classList.add('ok'); else if (b === a) b.classList.add('no'); });
};
ACT['r-dict'] = a => {
  const li = a.closest('li'), inp = $('input', li), fb = $('.fb', li), got = inp.value.trim();
  if (!got) { inp.focus(); return; }
  const d = wordDiff(li.dataset.s, got);
  fb.hidden = false;
  if (matches(li.dataset.s, got)) { fb.className = 'fb ok'; fb.innerHTML = '<b>Верно.</b> ' + '<span class="en">' + esc(li.dataset.s) + '</span>'; inp.disabled = true; a.disabled = true; }
  else { fb.className = 'fb no'; fb.innerHTML = '<b>Есть расхождения.</b> Красным отмечены слова, которые ты не услышал или записал иначе:<br><span class="en diff">' + d.html + '</span>'; }
};

/* ---------- тренажёр заданий ---------- */
function startRunner(box, items, opt) {
  RUN = {box, items, opt, i:0, ok:0, total:items.length, wrongs:[], pass2:false, answered:false};
  rRun();
}
/* Правильный ответ целым предложением: пропуск заполнен, подсказка в скобках убрана. */
const answerText = it => {
  const a = variants(it.a)[0];
  if ((it.k !== 'gap' && it.k !== 'mc') || it.q.indexOf('___') < 0) return a;
  return (a[0] === '(' ? it.q.replace(/___\s*/, '') : it.q.replace('___', a)).replace(/\s*\([^)]*\)\s*$/, '');
};
function rRun() {
  const R = RUN, it = R.items[R.i];
  if (!it) return rRunEnd();
  let body = '';
  const input = v => '<input id="run-in" type="text" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(v || '') + '">';
  if (it.k === 'gap') body = '<p class="kind">Впиши пропущенное слово</p><p class="q en">' + esc(it.q).replace('___', '<span class="blank"></span>') + '</p>' + input();
  else if (it.k === 'tr') body = '<p class="kind">Переведи на английский</p><p class="q">' + esc(it.q) + '</p>' + input();
  else if (it.k === 'fix') body = '<p class="kind">В предложении есть ошибка. Исправь её</p><p class="q en bad">' + esc(it.q) + '</p>' + input(it.q);
  else if (it.k === 'build') {
    const words = it.a.split(' '); let pool = words.slice();
    for (let n = 0; n < 6 && words.length > 1 && pool.join(' ') === it.a; n++) shuffle(pool);
    R.pool = pool; R.pick = [];
    body = '<p class="kind">Собери предложение из слов</p><div class="built" id="built"></div><div class="tiles" id="tiles"></div>';
  } else body = '<p class="kind">Выбери правильный вариант</p><p class="q en">' + esc(it.q).replace('___', '<span class="blank"></span>') + '</p><div class="opts">' +
    it.o.map(o => '<button class="opt" type="button" data-act="run-mc" data-o="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div>';
  R.box.innerHTML = '<div class="run"><div class="run-h"><span>' + (R.pass2 ? 'Работа над ошибками · ' : '') + (R.i + 1) + ' из ' + R.items.length + '</span><div class="bar"><i style="width:' + (R.i / R.items.length * 100).toFixed(1) + '%"></i></div></div>' +
    '<div class="run-b">' + body + '</div><div id="run-fb" class="run-fb" hidden></div><div class="row">' +
    (it.k === 'mc' ? '' : '<button class="btn" type="button" data-act="run-check">Проверить</button>') + '<button class="btn" type="button" data-act="run-next" hidden>Дальше' + ICON.arrow + '</button></div></div>';
  R.answered = false; R.busy = false;
  if (it.k === 'build') rTiles();
  const inp = $('#run-in'); if (inp) { inp.focus(); if (it.k === 'fix') inp.select(); }
}
function rTiles() {
  const R = RUN;
  $('#built').innerHTML = R.pick.length ? R.pick.map((pi, i) => '<button class="tile on" type="button" data-act="run-untile" data-i="' + i + '">' + esc(R.pool[pi]) + '</button>').join('') : '<span class="muted">Нажимай на слова по порядку</span>';
  $('#tiles').innerHTML = R.pool.map((w, i) => '<button class="tile" type="button" data-act="run-tile" data-i="' + i + '"' + (R.pick.indexOf(i) >= 0 ? ' disabled' : '') + '>' + esc(w) + '</button>').join('');
}
ACT['run-tile'] = a => { const R = RUN; if (!R || R.answered) return; R.pick.push(+a.dataset.i); rTiles(); };
ACT['run-untile'] = a => { const R = RUN; if (!R || R.answered) return; R.pick.splice(+a.dataset.i, 1); rTiles(); };
ACT['run-mc'] = a => runCheck(a.dataset.o);
ACT['run-check'] = () => runCheck();
async function runCheck(given) {
  const R = RUN; if (!R || R.answered || R.busy) return;
  const it = R.items[R.i];
  const got = given != null ? given : it.k === 'build' ? R.pick.map(i => R.pool[i]).join(' ') : ($('#run-in').value || '').trim();
  if (!got) return;
  let ok = it.k === 'mc' ? got === it.a : matches(it.a, got), note = '', why = '', err = '';
  const fb = $('#run-fb');
  if (!ok && (it.k === 'tr' || it.k === 'fix') && aiReady()) {
    R.busy = true; fb.hidden = false; fb.className = 'run-fb wait'; fb.textContent = 'Ответ отличается от образца. ИИ смотрит, нет ли тут другого верного варианта…';
    try {
      const j = await aiJudge(it.k, it.q, it.a, got, R.opt.L);
      if (j.ok === true) { ok = true; note = 'Твой вариант тоже верный.'; } else if (typeof j.why === 'string') why = j.why;
    } catch (e) { err = aiCopy(e); }
    if (RUN !== R || R.items[R.i] !== it) return;
    R.busy = false;
  }
  R.answered = true; R.got = got;
  if (!R.pass2) { if (ok) R.ok++; else R.wrongs.push(it); }
  $$('#run-in, .run .opt, .run .tile').forEach(e => { e.disabled = true; });
  $$('.run .opt').forEach(b => { if (b.dataset.o === it.a) b.classList.add('ok'); else if (b.dataset.o === got) b.classList.add('no'); });
  const right = answerText(it);
  fb.hidden = false; fb.className = 'run-fb ' + (ok ? 'ok' : 'no');
  fb.innerHTML = ok
    ? '<b>Верно</b>' + (note ? ' <span>' + note + '</span>' : '') + '<p class="en">' + sayBtn(right) + esc(note ? got : right) + '</p>'
    : '<b>Пока неверно</b><p>Правильно: <span class="en">' + esc(right) + '</span> ' + sayBtn(right) + '</p>' + (why ? '<p>' + esc(cleanText(why)) + '</p>' : '') +
      (err ? '<p class="muted small">' + esc(err) + '</p>' : '') + (!why && aiReady() ? '<button class="link" type="button" data-act="run-why">' + ICON.spark + ' Почему так?</button>' : '');
  const c = $('[data-act="run-check"]'); if (c) c.hidden = true;
  const n = $('[data-act="run-next"]'); n.hidden = false; n.focus();
}
ACT['run-why'] = async a => {
  const R = RUN, it = R.items[R.i], p = document.createElement('p');
  a.replaceWith(p); p.className = 'muted'; p.textContent = 'ИИ объясняет…';
  const task = it.k === 'tr' ? 'перевести на английский: ' + it.q : it.k === 'fix' ? 'исправить ошибку: ' + it.q : it.k === 'build' ? 'собрать предложение из слов' : 'заполнить пропуск: ' + it.q;
  try { const t = await aiWhy(task, answerText(it), R.got, R.opt.L); p.className = ''; p.textContent = t; }
  catch (e) { p.textContent = aiCopy(e); }
};
ACT['run-next'] = () => { const R = RUN; if (!R || !R.answered) return; R.i++; rRun(); };
function rRunEnd() {
  const R = RUN;
  if (!R.pass2 && R.wrongs.length) {
    R.box.innerHTML = '<div class="run"><div class="result"><h2>' + R.ok + ' из ' + R.total + ' с первой попытки</h2><p>Ошибки — это нормально. Пройди их ещё раз, пока объяснение свежо в памяти.</p>' +
      '<div class="row"><button class="btn" type="button" data-act="run-retry">Разобрать ошибки (' + R.wrongs.length + ')</button><button class="btn ghost" type="button" data-act="run-finish">Пропустить</button></div></div></div>';
    return;
  }
  ACT['run-finish']();
}
ACT['run-retry'] = () => { const R = RUN; R.pass2 = true; R.items = R.wrongs.slice(); R.i = 0; rRun(); };
ACT['run-finish'] = () => { const R = RUN; RUN = null; R.opt.done(R.ok, R.total); };

/* ---------- шаг 3: практика ---------- */
STEP.practice = (L, box) => {
  box.innerHTML = '<p class="muted">Здесь ты сам пишешь ответы. Если твой перевод отличается от образца, ИИ проверит, верен ли он.</p><div id="runbox"></div>';
  startRunner($('#runbox'), practiceItems(L), {L, done:(ok, total) => {
    $('#step').innerHTML = '<div class="result"><h2>Практика пройдена: ' + ok + ' из ' + total + ' с первой попытки</h2><p>' +
      (ok / total >= 0.8 ? 'Тема усваивается хорошо.' : 'Если было трудно, вернись к разбору темы или спроси ИИ, а потом пройди практику ещё раз.') + '</p>' +
      '<div class="row"><button class="btn ghost" type="button" data-act="again">Пройти ещё раз</button></div></div>' + footer('practice');
  }});
};
ACT.again = () => route();

/* ---------- шаг 4: письмо ---------- */
const SCORE = ['', 'Задание пока не выполнено', 'Много ошибок', 'Понятно, но ошибки есть', 'Хорошо', 'Отлично'];
let draftTimer = null;
STEP.write = (L, box) => {
  const W = L.write, p = lpPeek(L.id);
  box.innerHTML = '<section class="tblock"><h2>Письменное задание</h2><p class="lead">' + esc(W.task) + '</p>' +
    (W.tips ? '<div class="gloss"><b>Пригодится</b>' + W.tips.map(t => '<button class="chip en" type="button" data-act="w-tip" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' : '') +
    '<textarea id="w-text" lang="en" spellcheck="false" placeholder="Пиши по-английски. Не бойся ошибок: на них и учатся.">' + esc(p.w || '') + '</textarea>' +
    '<div class="row"><button class="btn" type="button" data-act="w-check">' + ICON.spark + ' Проверить</button><button class="btn ghost" type="button" data-act="w-sample">Показать пример ответа</button></div><div id="w-fb"></div></section>' + footer('write');
  $('#w-text').addEventListener('input', e => { clearTimeout(draftTimer); const v = e.target.value, id = L.id; draftTimer = setTimeout(() => { lp(id).w = v.slice(0, 4000); save(); }, 800); });
};
ACT['w-tip'] = a => { const t = $('#w-text'); t.value = (t.value ? t.value.replace(/\s*$/, ' ') : '') + a.dataset.t + ' '; t.focus(); t.dispatchEvent(new Event('input')); };
ACT['w-sample'] = () => { const L = LV.L, fb = $('#w-fb'); fb.insertAdjacentHTML('beforeend', '<div class="note"><b>Пример ответа</b><p class="en">' + sayBtn(L.write.sample) + esc(L.write.sample) + '</p><p class="muted small">Это один из возможных вариантов. Твой текст должен быть про тебя.</p></div>'); $('[data-act="w-sample"]').disabled = true; };
ACT['w-check'] = async a => {
  const L = LV.L, text = $('#w-text').value.trim(), fb = $('#w-fb');
  if (text.split(/\s+/).length < 4) { fb.innerHTML = '<p class="fb no">Напиши хотя бы пару предложений, и я их проверю.</p>'; return; }
  if (!aiReady()) { fb.innerHTML = '<div class="note"><b>ИИ пока не подключён</b><p>Письмо проверяет ИИ. Подключение занимает две минуты. <a href="#settings">Открыть настройки</a></p><p class="muted small">А пока сравни свой текст с примером ответа.</p></div>'; return; }
  a.disabled = true; fb.innerHTML = '<p class="fb wait">ИИ читает твой текст…</p>';
  try {
    const j = await aiWriting(L.write.task, text, L);
    if (!LV || LV.L !== L || LV.step !== 'write') return;
    const sc = Math.max(1, Math.min(5, Math.round(+j.score) || 3)), ms = Array.isArray(j.mistakes) ? j.mistakes.filter(isObj).slice(0, 5) : [];
    fb.innerHTML = '<div class="note check"><div class="score s' + sc + '"><b>' + sc + ' из 5</b><span>' + SCORE[sc] + '</span></div>' +
      (j.corrected ? '<h3>Исправленный вариант</h3><p class="en">' + sayBtn(String(j.corrected)) + esc(String(j.corrected)) + '</p>' : '') +
      (ms.length ? '<h3>Ошибки</h3><ul class="mist">' + ms.map(m => '<li><span class="en x">' + esc(m.was || '') + '</span><span class="en v">' + esc(m.fix || '') + '</span><span class="why">' + esc(cleanText(m.why || '')) + '</span></li>').join('') + '</ul>' : '<p><b>Ошибок нет.</b></p>') +
      (j.good ? '<h3>Что получилось</h3><p>' + esc(cleanText(j.good)) + '</p>' : '') + (j.next ? '<h3>Попробуй ещё</h3><p>' + esc(cleanText(j.next)) + '</p>' : '') +
      '<p class="muted small">Поправь текст выше и проверь ещё раз, если хочешь довести его до пятёрки.</p></div>';
    lp(L.id).ws = sc; save();
  } catch (e) { fb.innerHTML = '<p class="fb no">' + esc(aiCopy(e)) + '</p>'; }
  a.disabled = false;
};

/* ---------- шаг 5: речь ---------- */
STEP.speak = (L, box) => {
  const Sp = L.speak;
  const mic = SR ? '' : '<div class="note"><b>Распознавание речи недоступно в этом окне</b><p>Читай вслух вслед за диктором, а ответы на вопросы впиши вручную.</p></div>';
  box.innerHTML = mic +
    '<section class="tblock"><h2>Прочитай вслух</h2><p class="muted">Послушай образец, нажми «Говорить» и повтори. Приложение покажет, какие слова оно расслышало.</p><ul class="sp">' +
      Sp.read.map(s => '<li data-kind="read" data-s="' + esc(s) + '"><div class="row">' + sayBtn(s) + sayBtn(s, 1) + '<p class="en grow">' + esc(s) + '</p>' +
        (SR ? '<button class="btn ghost mic" type="button" data-act="sp-rec">' + ICON.mic + '<span>Говорить</span></button>' : '') + '</div><p class="fb" hidden></p></li>').join('') + '</ul></section>' +
    '<section class="tblock"><h2>Ответь на вопрос</h2><p class="muted">Отвечай полным предложением и про себя. Распознанный текст можно поправить руками перед проверкой.</p><ul class="sp">' +
      Sp.ask.map(q => '<li data-kind="ask" data-q="' + esc(q[0]) + '" data-s="' + esc(q[1]) + '"><div class="row">' + sayBtn(q[0]) + '<p class="en grow">' + esc(q[0]) + '</p>' +
        (SR ? '<button class="btn ghost mic" type="button" data-act="sp-rec">' + ICON.mic + '<span>Ответить</span></button>' : '') + '</div>' +
        '<div class="row"><input type="text" class="grow" lang="en" autocomplete="off" spellcheck="false" placeholder="Твой ответ появится здесь. Можно и напечатать"><button class="btn ghost sm" type="button" data-act="sp-check">Проверить</button><button class="link" type="button" data-act="sp-sample">Пример ответа</button></div><p class="fb" hidden></p></li>').join('') + '</ul></section>' +
    footer('speak');
};
ACT['sp-rec'] = a => {
  const li = a.closest('li'), fb = $('.fb', li), label = $('span', a);
  if (a.classList.contains('rec')) { stopListen(); return; }
  const idle = li.dataset.kind === 'read' ? 'Говорить' : 'Ответить';
  let last = '', failed = false;
  listen(ev => {
    if (!document.body.contains(li)) return;
    if (ev.state === 'start') { a.classList.add('rec'); label.textContent = 'Слушаю… нажми, когда закончишь'; fb.hidden = false; fb.className = 'fb wait'; fb.textContent = 'Говори по-английски'; }
    else if (ev.state === 'text') { last = ev.text; if (li.dataset.kind === 'ask') $('input', li).value = ev.text; else { fb.className = 'fb wait'; fb.textContent = ev.text; } }
    else if (ev.state === 'error') { failed = true; const m = MIC_ERR[ev.error]; fb.hidden = false; fb.className = 'fb no'; fb.textContent = m === undefined ? 'Не получилось распознать речь. Попробуй ещё раз.' : m; if (m === '') fb.hidden = true; }
    else if (ev.state === 'end') {
      a.classList.remove('rec'); label.textContent = idle;
      const text = ev.text || last;
      if (failed) return;
      if (!text) { fb.className = 'fb no'; fb.textContent = MIC_ERR['no-speech']; return; }
      if (li.dataset.kind === 'read') {
        const d = wordDiff(li.dataset.s, text), pc = Math.round(d.ratio * 100);
        fb.className = 'fb ' + (pc >= 80 ? 'ok' : 'no');
        fb.innerHTML = '<b>' + (pc >= 80 ? 'Отлично' : pc >= 50 ? 'Почти' : 'Попробуй ещё раз') + ': расслышано ' + pc + '% слов.</b><br><span class="en diff">' + d.html + '</span><br><span class="muted small">Приложение услышало: ' + esc(text) + '</span>';
      } else { fb.className = 'fb wait'; fb.textContent = 'Проверь, что текст распознан верно, и нажми «Проверить».'; }
    }
  });
};
ACT['sp-check'] = async a => {
  const li = a.closest('li'), fb = $('.fb', li), got = $('input', li).value.trim();
  fb.hidden = false;
  if (!got) { fb.className = 'fb no'; fb.textContent = 'Сначала ответь голосом или напечатай ответ.'; return; }
  if (!aiReady()) { fb.className = 'fb wait'; fb.innerHTML = 'ИИ не подключён, поэтому сравни сам. Пример ответа: <span class="en">' + esc(li.dataset.s) + '</span> <a href="#settings">Подключить ИИ</a>'; return; }
  a.disabled = true; fb.className = 'fb wait'; fb.textContent = 'ИИ проверяет ответ…';
  try {
    const j = await aiSpeak(li.dataset.q, li.dataset.s, got, LV && LV.L);
    if (!document.body.contains(li)) return;
    fb.className = 'fb ' + (j.ok === true ? 'ok' : 'no');
    fb.innerHTML = '<b>' + (j.ok === true ? 'Хороший ответ.' : 'Можно лучше.') + '</b>' + (j.fix ? ' Так звучит естественно: <span class="en">' + esc(String(j.fix)) + '</span> ' + sayBtn(String(j.fix)) : '') + (j.why ? '<br>' + esc(cleanText(j.why)) : '');
  } catch (e) { fb.className = 'fb no'; fb.textContent = aiCopy(e); }
  a.disabled = false;
};
ACT['sp-sample'] = a => { const li = a.closest('li'), fb = $('.fb', li); fb.hidden = false; fb.className = 'fb wait'; fb.innerHTML = 'Пример ответа: <span class="en">' + esc(li.dataset.s) + '</span> ' + sayBtn(li.dataset.s); };

/* ---------- шаг 6: закрепление ---------- */
const sheet = L => '<section class="sheet"><h2>Шпаргалка урока</h2><ul>' + (L.sum || []).map(x => '<li>' + rich(x) + '</li>').join('') + '</ul></section>';
STEP.final = (L, box) => {
  const items = shuffle(L.quiz.map(mkMc)).concat(sample(L.tr, 2).map(mkTr), sample(L.fix, 2).map(mkFix));
  box.innerHTML = '<p class="muted">Итоговый тест: ' + items.length + ' заданий без подсказок. Урок засчитывается, если верно не меньше 80%.</p><div id="runbox"></div>';
  startRunner($('#runbox'), items, {L, done:(ok, total) => {
    const pass = ok / total >= 0.8, nxt = LESSONS[lessonNo(L.id)];
    if (pass) finishLesson(L.id, Math.round(ok / total * 100));
    $('#step').innerHTML = pass
      ? '<div class="result pass"><h2>Урок пройден: ' + ok + ' из ' + total + '</h2><p>Завтра приложение предложит короткое повторение этой темы, потом ещё раз через 3, 7 и 16 дней. Так она останется в памяти надолго.</p></div>' + sheet(L) +
        '<div class="row">' + (nxt ? '<a class="btn lg" href="#lesson/' + nxt.id + '/theory">Следующий урок' + ICON.arrow + '</a>' : '') + '<a class="btn ghost" href="#home">На главную</a></div>'
      : '<div class="result fail"><h2>' + ok + ' из ' + total + '. Нужно не меньше ' + Math.ceil(total * 0.8) + '</h2><p>Посмотри шпаргалку, при необходимости вернись к практике и пройди тест ещё раз.</p></div>' + sheet(L) +
        '<div class="row"><button class="btn" type="button" data-act="again">Пройти тест ещё раз</button><a class="btn ghost" href="#lesson/' + L.id + '/practice">Вернуться к практике</a></div>';
    renderSide();
  }});
};

/* ---------- повторение пройденного урока ---------- */
function vReview(parts) {
  const L = lessonById(parts[0]);
  if (!L) return go('home');
  LV = {L, step:'review'};
  $('#view').innerHTML = '<a class="back" href="#home">← На главную</a><header class="l-head"><p class="eyebrow">Повторение · урок ' + lessonNo(L.id) + '</p><h1>' + esc(L.title) + '</h1>' +
    '<p class="lead">Восемь заданий по пройденной теме. Занимает около пяти минут.</p></header><details class="fold"><summary>Подсмотреть шпаргалку</summary>' + sheet(L) + '</details><div id="step" class="step"><div id="runbox"></div></div>';
  startRunner($('#runbox'), sample(practiceItems(L), 8), {L, done:(ok, total) => {
    finishReview(L.id);
    const p = lpPeek(L.id), more = reviewsDue();
    $('#step').innerHTML = '<div class="result pass"><h2>Повторение сделано: ' + ok + ' из ' + total + '</h2><p>Следующее повторение этой темы — ' + ruDate(p.rd) + '.</p></div><div class="row">' +
      (more.length ? '<a class="btn" href="#review/' + more[0].id + '">Ещё одно повторение: урок ' + lessonNo(more[0].id) + '</a>' : '') + '<a class="btn ghost" href="#home">На главную</a></div>';
    renderSide();
  }});
}

/* ---------- чат с ИИ ---------- */
function createChat(root, cfg) {
  root.innerHTML = '<div class="chat" aria-live="polite"></div><div class="chat-in"><textarea rows="2" placeholder="' + esc(cfg.placeholder || 'Напиши сообщение…') + '"></textarea>' +
    '<div class="row"><button class="btn" type="button" data-c="send">Отправить</button><button class="btn ghost" type="button" data-c="stop" hidden>Остановить</button><span class="muted small">Enter отправляет, Shift+Enter переносит строку</span></div></div><p class="chat-note small"></p>';
  const C = {turns:[], busy:false, ctl:null};
  const log = $('.chat', root), box = $('textarea', root), note = $('.chat-note', root), sendB = $('[data-c="send"]', root), stopB = $('[data-c="stop"]', root);
  const bubble = (cls, t) => { const b = document.createElement('div'); b.className = 'bub ' + cls; b.textContent = t; log.appendChild(b); log.scrollTop = log.scrollHeight; return b; };
  const ui = () => { sendB.disabled = C.busy; stopB.hidden = !C.busy; };
  C.send = async given => {
    const text = String(given != null ? given : box.value).trim();
    if (!text || C.busy) return;
    if (!aiReady()) { note.innerHTML = 'ИИ пока не подключён. <a href="#settings">Подключить за две минуты</a>'; return; }
    C.busy = true; C.ctl = new AbortController(); if (given == null) box.value = '';
    const mine = bubble('me', text), b = bubble('ai wait', 'Думаю…');
    C.turns.push({role:'user', content:text}); note.textContent = ''; ui();
    try {
      const ctx = C.turns.slice(-11); while (ctx.length && ctx[0].role !== 'user') ctx.shift();
      const out = cleanText(await callAI(cfg.system(), ctx, {signal:C.ctl.signal}));
      b.classList.remove('wait'); b.textContent = out; C.turns.push({role:'assistant', content:out});
    } catch (e) {
      C.turns.pop(); b.remove();
      if (given == null) { mine.remove(); box.value = text; }  // текст вернулся в поле, пузырь не дублируем
      if (!e || e.code !== 'cancelled') note.textContent = aiCopy(e);
    }
    C.busy = false; ui(); log.scrollTop = log.scrollHeight;
  };
  C.reset = () => { if (C.ctl) C.ctl.abort(); C.turns = []; log.textContent = ''; note.textContent = ''; };
  C.focus = () => box.focus();
  sendB.addEventListener('click', () => C.send());
  stopB.addEventListener('click', () => { if (C.ctl) C.ctl.abort(); });
  box.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); C.send(); } });
  return C;
}
let ASK = null, askLesson = null;
function openAsk(question) {
  const L = LV && LV.L ? LV.L : null;
  $('#drawer').hidden = false;
  if (!ASK) ASK = createChat($('#dr-chat'), {placeholder:'Спроси по-русски…', system:() =>
    'Ты репетитор английского языка. ' + aiStudent() + topicLine(askLesson) + ' Ученик задаёт вопрос об английском. Отвечай до 120 слов и приводи 2–3 примера на английском с переводом. Если ученик просит задать ему вопросы, задавай по одному, жди ответа и коротко разбирай его. ' + AI_STYLE});
  if (askLesson !== L) { ASK.reset(); askLesson = L; }
  $('#dr-ctx').textContent = L ? 'Урок ' + lessonNo(L.id) + ': ' + L.title : 'Вопрос по английскому';
  if (question) ASK.send(question); else ASK.focus();
}
ACT['dr-open'] = () => openAsk('');
ACT['dr-close'] = () => { $('#drawer').hidden = true; };
