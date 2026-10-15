'use strict';
/* speech.js — озвучка английского текста и распознавание речи с микрофона */

const canSpeak = typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
let VOICE = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices() || [], us = vs.filter(v => /^en[-_]US/i.test(v.lang));
  VOICE = us.find(v => /Natural/i.test(v.name)) || us.find(v => /Aria|Jenny|Guy|Google US/i.test(v.name)) || us[0] || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (canSpeak) { pickVoice(); speechSynthesis.addEventListener('voiceschanged', pickVoice); }
function stopSpeak() { if (canSpeak) { try { speechSynthesis.cancel(); } catch (e) {} } }
/* Возвращает обещание, которое выполняется, когда фраза договорена. */
function speak(text, slow) {
  return new Promise(done => {
    if (!canSpeak || !text) return done();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US'; u.rate = slow ? 0.68 : 0.92;
      if (VOICE) u.voice = VOICE;
      u.onend = u.onerror = () => done();
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { done(); }
  });
}
const sayBtn = (t, slow) => canSpeak
  ? '<button class="say" type="button" data-say="' + esc(t) + '"' + (slow ? ' data-slow="1"' : '') + ' aria-label="' + (slow ? 'Произнести медленно' : 'Произнести') + '">' + (slow ? ICON.slow : ICON.spk) + '</button>'
  : '';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
let REC = null;
const MIC_ERR = {
  'not-allowed':'Нет доступа к микрофону. Разреши его в значке замка рядом с адресом или в настройках Windows.',
  'service-not-allowed':'Распознавание речи запрещено настройками браузера.',
  'audio-capture':'Микрофон не найден. Подключи его и попробуй снова.',
  'no-speech':'Ничего не слышно. Говори ближе к микрофону.',
  'network':'Распознаванию речи нужен интернет. Проверь соединение.',
  'aborted':'',
  'unsupported':'В этом окне нет распознавания речи. Впиши то, что сказал, вручную.'
};
/* cb получает {state:'start'|'text'|'end'|'error', text, error} */
function listen(cb) {
  if (!SR) { cb({state:'error', error:'unsupported'}); return null; }
  stopListen(); stopSpeak();
  const r = new SR();
  r.lang = 'en-US'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  let text = '';
  r.onstart = () => cb({state:'start'});
  r.onresult = e => { text = ''; for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + ' '; cb({state:'text', text:text.trim()}); };
  r.onerror = e => cb({state:'error', error:e.error || 'unknown'});
  r.onend = () => { if (REC === r) REC = null; cb({state:'end', text:text.trim()}); };
  REC = r;
  try { r.start(); } catch (e) { REC = null; cb({state:'error', error:'unknown'}); }
  return r;
}
function stopListen() { if (REC) { try { REC.stop(); } catch (e) {} } }
