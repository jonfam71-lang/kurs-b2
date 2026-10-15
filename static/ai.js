'use strict';
/* ai.js — бесплатный ИИ по собственному ключу ученика: подключение и проверки заданий */

const PROVIDERS = {
  gemini:{name:'Google Gemini', kind:'gemini', base:'https://generativelanguage.googleapis.com/v1beta', keyUrl:'https://aistudio.google.com/apikey', link:'Открыть Google AI Studio',
    hint:'Бесплатный ключ выдаёт Google AI Studio, нужен аккаунт Google. Работает не во всех странах.',
    ok:m => /^gemini-/.test(m) && !/tts|image|embedding|live|audio|computer|robotics/i.test(m),
    pick:l => geminiRank(l)[0] || l.find(m => /flash/.test(m)) || l[0]},
  groq:{name:'Groq', kind:'openai', base:'https://api.groq.com/openai/v1', keyUrl:'https://console.groq.com/keys', link:'Открыть консоль Groq',
    hint:'Бесплатный ключ в консоли Groq. Отвечает очень быстро.',
    ok:m => !/whisper|guard|tts|playai|orpheus/i.test(m),
    pick:l => l.find(m => /llama-3\.3-70b-versatile/.test(m)) || l.find(m => /70b/.test(m)) || l.find(m => /llama/.test(m)) || l[0]},
  openrouter:{name:'OpenRouter (бесплатные модели)', kind:'openai', base:'https://openrouter.ai/api/v1', keyUrl:'https://openrouter.ai/keys', link:'Открыть OpenRouter',
    hint:'Один ключ открывает много моделей. В списке останутся только бесплатные.',
    ok:m => /:free$/.test(m),
    pick:l => l.find(m => /llama.*70b|gemini.*flash|deepseek/i.test(m)) || l[0]},
  ollama:{name:'Ollama (на этом компьютере)', kind:'openai', base:'http://localhost:11434/v1', keyUrl:'https://ollama.com', link:'Сайт Ollama', nokey:true,
    hint:'Модель работает прямо на компьютере: без ключа, интернета и лимитов, но объясняет слабее. Нужно установить Ollama и скачать модель.',
    ok:() => true, pick:l => l[0]},
  custom:{name:'Другой сервис (совместимый с OpenAI API)', kind:'openai', base:'', hint:'Укажи адрес API, ключ и модель.', ok:() => true, pick:l => l[0]}
};
const AIKEY = 'kurs-b2.ai';
let AI = {p:'gemini', keys:{}, models:{}, base:''};
try { const r = localStorage.getItem(AIKEY); if (r) AI = Object.assign(AI, JSON.parse(r)); } catch (e) {}
function fixAI() {
  if (!isObj(AI.keys)) AI.keys = {};
  if (!isObj(AI.models)) AI.models = {};
  if (!isObj(AI.lists)) AI.lists = {};    // модели, которые сервис показал при подключении
  if (!isObj(AI.manual)) AI.manual = {};  // true, если модель выбрал сам ученик
  if (!PROVIDERS[AI.p]) AI.p = 'gemini';
}
/* Запасные модели Gemini по порядку: сначала облегчённые (отвечают за секунду), потом обычные.
   Новейшие обычные модели на бесплатном тарифе часто перегружены и отвечают ошибкой 503. */
const verOf = m => { const x = /(\d+)(?:\.(\d+))?/.exec(m) || []; return [+x[1] || 0, +x[2] || 0]; };
const byVerDesc = (a, b) => { const x = verOf(a), y = verOf(b); return y[0] - x[0] || y[1] - x[1]; };
function geminiRank(list) {
  const lite = list.filter(m => /^gemini-[\d.]+-flash-lite$/.test(m)).sort(byVerDesc);
  const flash = list.filter(m => /^gemini-[\d.]+-flash$/.test(m)).sort(byVerDesc);
  const has = m => list.indexOf(m) >= 0 ? [m] : [];
  return lite.slice(0, 2).concat(has('gemini-flash-lite-latest'), flash.slice(0, 2), has('gemini-flash-latest'));
}
function aiChain() {
  const cur = aiModel();
  if (PROVIDERS[AI.p].kind !== 'gemini') return [cur];
  const out = [cur];
  geminiRank(AI.lists[AI.p] || []).forEach(m => { if (out.indexOf(m) < 0) out.push(m); });
  return out.slice(0, 4);
}
fixAI();
const saveAI = () => { try { localStorage.setItem(AIKEY, JSON.stringify(AI)); } catch (e) {} if (server) api('/api/ai', AI).catch(() => {}); };
const aiKey = () => String(AI.keys[AI.p] || '').trim();
const aiModel = () => String(AI.models[AI.p] || '').trim();
const aiBase = () => String(AI.p === 'custom' ? (AI.base || '') : PROVIDERS[AI.p].base).trim().replace(/\/+$/, '');
const aiReady = () => !!(aiBase() && aiModel() && (PROVIDERS[AI.p].nokey || AI.p === 'custom' || aiKey()));

function aiCopy(e) {
  const c = e && e.code, m = String((e && e.message) || '');
  if (c === 'nokey') return 'Сначала вставь ключ API.';
  if (c === 'nomodel') return 'Не выбрана модель. Нажми «Подключить» ещё раз.';
  if (c === 'nobase') return 'Укажи адрес API.';
  if (c === 'network') return AI.p === 'ollama' ? 'Ollama не отвечает. Проверь, что программа установлена и запущена.' : 'Не удалось связаться с сервисом. Проверь интернет. Возможно, сервис недоступен в твоей стране: тогда выбери другой.';
  if (/location|region|country/i.test(m)) return 'Сервис недоступен в твоей стране. Выбери другой в настройках.';
  if (c === 401 || c === 403 || /api key/i.test(m)) return 'Сервис не принял ключ. Проверь, что он скопирован целиком.';
  if (c === 429) return 'Бесплатный лимит на сейчас исчерпан. Подожди минуту или выбери другую модель в настройках.';
  if (c === 404) return 'Модель не найдена. Открой настройки и нажми «Подключить» ещё раз.';
  if (c === 'empty' || c === 'badjson') return 'ИИ ответил непонятно. Попробуй ещё раз.';
  if (c === 503 || c === 500) return 'Модели сервиса сейчас перегружены. Попробуй через минуту или выбери другую модель в настройках.';
  if (c === 'slow') return 'ИИ отвечает слишком долго. Попробуй ещё раз или выбери другую модель в настройках.';
  return 'Ошибка сервиса' + (typeof c === 'number' ? ' (' + c + ')' : '') + (m ? ': ' + m.slice(0, 160) : '.');
}
async function aiFetch(url, init) {
  let res;
  try { res = await fetch(url, init); }
  catch (e) { throw {code: e && e.name === 'AbortError' ? 'cancelled' : 'network'}; }
  let raw = '', data = null;
  try { raw = await res.text(); data = JSON.parse(raw); } catch (e) {}
  if (!res.ok) {
    let m = data && data.error; if (m && typeof m === 'object') m = m.message;
    throw {code: res.status, message: typeof m === 'string' ? m : raw.slice(0, 200)};
  }
  return data || {};
}
function aiHeaders() {
  const h = {'Content-Type':'application/json'}, k = aiKey();
  if (PROVIDERS[AI.p].kind === 'gemini') h['x-goog-api-key'] = k; else if (k) h.Authorization = 'Bearer ' + k;
  return h;
}
/* Один запрос к одной модели, с ограничением по времени. */
async function callOnce(model, system, msgs, opt, timeout) {
  const P = PROVIDERS[AI.p], base = aiBase(), max = opt.max || 3000;
  const ctl = new AbortController(); let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctl.abort(); }, timeout);
  const stop = () => ctl.abort();
  if (opt.signal) { if (opt.signal.aborted) ctl.abort(); else opt.signal.addEventListener('abort', stop, {once:true}); }
  let text = '';
  try {
    if (P.kind === 'gemini') {
      const cfg = {temperature:0.3, maxOutputTokens:max};
      if (opt.json) cfg.responseMimeType = 'application/json';
      const d = await aiFetch(base + '/models/' + encodeURIComponent(model) + ':generateContent', {method:'POST', signal:ctl.signal, headers:aiHeaders(), body:JSON.stringify({
        systemInstruction:{parts:[{text:system}]},
        contents:msgs.map(t => ({role:t.role === 'assistant' ? 'model' : 'user', parts:[{text:t.content}]})),
        generationConfig:cfg
      })});
      const c = d.candidates && d.candidates[0];
      text = c && c.content && Array.isArray(c.content.parts) ? c.content.parts.map(p => p.text || '').join('') : '';
    } else {
      const d = await aiFetch(base + '/chat/completions', {method:'POST', signal:ctl.signal, headers:aiHeaders(), body:JSON.stringify({
        model, temperature:0.3, max_tokens:max, messages:[{role:'system', content:system}].concat(msgs)
      })});
      const c = d.choices && d.choices[0];
      text = c && c.message && typeof c.message.content === 'string' ? c.message.content : '';
    }
  } catch (e) {
    if (e && e.code === 'cancelled' && timedOut) throw {code:'slow'};
    throw e;
  } finally {
    clearTimeout(timer);
    if (opt.signal) opt.signal.removeEventListener('abort', stop);
  }
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  if (!text) throw {code:'empty'};
  return text;
}
/* Если модель перегружена, недоступна или молчит, пробуем следующую запасную и запоминаем ту, что ответила. */
const AI_RETRY = c => c === 503 || c === 500 || c === 429 || c === 404 || c === 'slow' || c === 'empty';
async function callAI(system, msgs, opt) {
  opt = opt || {};
  const P = PROVIDERS[AI.p];
  if (!aiBase()) throw {code:'nobase'};
  if (!P.nokey && AI.p !== 'custom' && !aiKey()) throw {code:'nokey'};
  if (!aiModel()) throw {code:'nomodel'};
  if (P.kind === 'gemini' && !(AI.lists[AI.p] || []).length) {
    try { AI.lists[AI.p] = await listModels(); saveAI(); } catch (e) {}
  }
  const chain = aiChain(), first = chain[0];
  let last = null;
  for (let i = 0; i < chain.length; i++) {
    const lastTry = i === chain.length - 1;
    try {
      const text = await callOnce(chain[i], system, msgs, opt, P.kind === 'gemini' ? (lastTry ? 45000 : 20000) : 120000);
      if (i > 0) { AI.models[AI.p] = chain[i]; AI.switched = {from:first, to:chain[i], at:Date.now()}; saveAI(); }
      return text;
    } catch (e) {
      last = e;
      if (!e || !AI_RETRY(e.code) || (opt.signal && opt.signal.aborted)) throw e;
    }
  }
  throw last;
}
async function listModels() {
  const P = PROVIDERS[AI.p], base = aiBase();
  if (!base) throw {code:'nobase'};
  if (!P.nokey && AI.p !== 'custom' && !aiKey()) throw {code:'nokey'};
  let list;
  if (P.kind === 'gemini') {
    const d = await aiFetch(base + '/models?pageSize=200', {headers:aiHeaders()});
    list = (d.models || []).filter(m => (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0).map(m => String(m.name || '').replace(/^models\//, ''));
  } else {
    const d = await aiFetch(base + '/models', {headers:aiHeaders()});
    list = (d.data || d.models || []).map(m => String(m.id || m.name || ''));
  }
  return list.filter(m => m && P.ok(m));
}
/* Один шаг для ученика: загрузить модели, выбрать подходящую, проверить ответом. */
async function aiConnect() {
  const list = await listModels();
  if (!list.length) throw {code:404};
  AI.lists[AI.p] = list;
  if (list.indexOf(aiModel()) < 0 || !AI.manual[AI.p]) AI.models[AI.p] = PROVIDERS[AI.p].pick(list);
  delete AI.switched;
  saveAI();
  const out = await callAI('Answer with one short friendly sentence in English.', [{role:'user', content:'Say hello to a student who is starting to learn English.'}], {max:600});
  return {list, model:aiModel(), hello:out};
}

/* ---------- проверки заданий ---------- */
const cleanText = s => String(s).replace(/\*\*|__/g, '').replace(/^#+\s*/gm, '').trim();
function parseJSON(text) {
  try { return JSON.parse(text); } catch (e) {}
  for (const pair of [['{', '}'], ['[', ']']]) {
    const a = text.indexOf(pair[0]), b = text.lastIndexOf(pair[1]);
    if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch (e) {} }
  }
  return null;
}
async function aiJSON(system, user, opt) {
  const o = parseJSON(await callAI(system, [{role:'user', content:user}], Object.assign({json:true}, opt || {})));
  if (!isObj(o) && !Array.isArray(o)) throw {code:'badjson'};
  return o;
}
function aiStudent() {
  const p = prog(), ph = PHASES[p.pi];
  const done = LESSONS.filter(l => lessonDone(l.id)).map(l => l.title).join('; ') || 'пока ничего';
  return 'Ученик — русскоязычный студент, учит английский с нуля. Сейчас уровень ' + ph.from + '–' + ph.to + ', идёт ' + p.week + '-я неделя занятий. Цель: уровень B2 и экзамен (IELTS или Duolingo English Test) для магистратуры в США. Полностью пройденные темы: ' + done + '.';
}
const AI_STYLE = 'Объясняй по-русски, коротко и простыми словами, без терминов, которых новичок не знает. Не ругай и не захваливай. Не используй Markdown, звёздочки и решётки.';
const topicLine = L => L ? ' Тема текущего урока: «' + L.title + '». Правило урока кратко: ' + (L.sum || []).join(' ') : '';

/* Второе мнение, когда ответ не совпал с образцом: может быть, ученик прав. */
function aiJudge(kind, prompt, expected, got, L) {
  const what = kind === 'fix' ? 'Ученик исправлял ошибку в английском предложении.' : 'Ученик переводил предложение с русского на английский.';
  return aiJSON('Ты проверяешь задание по английскому. ' + what + ' ' + aiStudent() + topicLine(L) +
    ' Верни только JSON вида {"ok":true или false,"fix":"правильный вариант целиком","why":"одно-два предложения по-русски о главной ошибке, либо пустая строка"}. Считай ответ верным, если он грамматически правилен и передаёт смысл, даже если отличается от образца. Регистр и знаки препинания не учитывай. ' + AI_STYLE,
    (kind === 'fix' ? 'Предложение с ошибкой: ' : 'Русское предложение: ') + prompt + '\nОбразец правильного ответа: ' + variants(expected)[0] + '\nОтвет ученика: ' + got, {max:1500});
}
function aiWhy(task, expected, got, L) {
  return callAI('Ты репетитор английского. ' + aiStudent() + topicLine(L) + ' Объясни ученику, почему его ответ неверен и почему правильный вариант именно такой. До 60 слов, с одним дополнительным примером. ' + AI_STYLE,
    [{role:'user', content:'Задание: ' + task + '\nПравильный ответ: ' + variants(expected)[0] + '\nМой ответ: ' + got}], {max:1500}).then(cleanText);
}
function aiWriting(task, text, L) {
  return aiJSON('Ты репетитор английского и проверяешь письменную работу. ' + aiStudent() + topicLine(L) +
    ' Верни только JSON вида {"score":число от 1 до 5,"corrected":"текст ученика целиком без ошибок, на английском","mistakes":[{"was":"как было","fix":"как правильно","why":"почему, по-русски"}],"good":"что получилось хорошо, одна фраза по-русски","next":"одно короткое задание на главную ошибку, по-русски"}. В mistakes не больше пяти самых важных ошибок. Оценка: 5 — ошибок нет, 4 — одна-две мелкие, 3 — понятно, но ошибок несколько, 2 — много ошибок, 1 — задание не выполнено или текст не на английском. ' + AI_STYLE,
    'Задание: ' + task + '\nТекст ученика:\n' + text, {max:3500});
}
function aiSpeak(question, sampleAnswer, got, L) {
  return aiJSON('Ты репетитор английского и проверяешь устный ответ ученика, распознанный с микрофона (возможны мелкие ошибки распознавания, не придирайся к ним). ' + aiStudent() + topicLine(L) +
    ' Верни только JSON вида {"ok":true или false,"fix":"как сказать правильно и естественно, на английском","why":"одно-два предложения по-русски: что поправить, либо пустая строка"}. ok равно true, если ответ понятен, подходит к вопросу и грамматически в целом верен. ' + AI_STYLE,
    'Вопрос: ' + question + '\nПример хорошего ответа: ' + sampleAnswer + '\nОтвет ученика: ' + got, {max:1500});
}
