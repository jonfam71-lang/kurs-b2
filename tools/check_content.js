// Проверка уроков перед запуском: node tools/check_content.js
// Ловит опечатки в структуре: пропущенные поля, неверные номера строк, ответы, которые не проходят собственную проверку.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', 'static');
const ctx = vm.createContext({console, window:{}, document:{}, localStorage:{getItem(){ return null; }, setItem(){}}});
for (const f of ['content/base.js', 'core.js', 'content/lessons-1.js', 'content/lessons-2.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, {filename:f});
}
const {LESSONS, UNITS, BUILTIN, norm, matches, variants} = vm.runInContext('({LESSONS, UNITS, BUILTIN, norm, matches, variants})', ctx);
const errs = [];
const bad = (id, m) => errs.push(id + ': ' + m);
const ids = new Set();
for (const L of LESSONS) {
  const id = L.id;
  if (ids.has(id)) bad(id, 'duplicate id'); ids.add(id);
  for (const k of ['title', 'goal', 'theory', 'read', 'gaps', 'build', 'tr', 'fix', 'write', 'speak', 'quiz', 'sum']) if (!L[k]) bad(id, 'missing ' + k);
  L.theory.forEach((b, i) => {
    if (!b.h || !b.p || !b.p.length) bad(id, 'theory ' + i + ' needs h and p');
    if (b.q && b.q.split('|').length < 3) bad(id, 'theory ' + i + ' mini-check needs 2+ options');
    if (b.t) b.t.rows.forEach(r => { if (b.t.head && r.length !== b.t.head.length) bad(id, 'theory ' + i + ' table width'); });
    JSON.stringify(b).replace(/\{[^}]*$/, m => bad(id, 'unclosed brace near ' + m.slice(0, 30)));
  });
  const R = L.read;
  if (R.lines.length < 6) bad(id, 'reading too short');
  R.dict.forEach(i => { if (!R.lines[i]) bad(id, 'dict index ' + i); });
  R.tf.forEach(q => { if (q[1] !== 0 && q[1] !== 1) bad(id, 'tf answer must be 0 or 1'); });
  L.gaps.forEach(g => { const p = g.split('|'); if (p.length !== 2 || p[0].indexOf('___') < 0) bad(id, 'gap format: ' + g); });
  L.quiz.forEach(g => { const p = g.split('|'); if (p.length < 3) bad(id, 'quiz format: ' + g); if (new Set(p.slice(1)).size !== p.length - 1) bad(id, 'quiz duplicate options: ' + g); });
  L.tr.forEach(t => { if (!/[а-яё]/i.test(t[0])) bad(id, 'tr source not Russian: ' + t[0]); if (!matches(t[1], variants(t[1])[0])) bad(id, 'tr answer fails own check: ' + t[1]); });
  L.fix.forEach(f => { if (matches(f[1], f[0])) bad(id, 'fix: wrong sentence already counts as right: ' + f[0]); });
  L.build.forEach(s => { if (s.split(' ').length < 3) bad(id, 'build too short: ' + s); });
  if (!L.write.task || !L.write.sample) bad(id, 'write needs task and sample');
  if (L.speak.read.length < 3 || L.speak.ask.length < 2) bad(id, 'speak too short');
  if (L.quiz.length + 4 < 10) bad(id, 'final test would be shorter than 10');
}
UNITS.forEach(u => u.lessons.forEach(id => { if (!ids.has(id)) bad(u.id, 'unit lists unknown lesson ' + id); }));
LESSONS.forEach(L => { if (!UNITS.some(u => u.lessons.includes(L.id))) bad(L.id, 'lesson is in no unit'); });
const count = k => LESSONS.reduce((a, L) => a + L[k].length, 0);
console.log('lessons', LESSONS.length, '| words', BUILTIN.length, '| practice items', count('gaps') + count('build') + count('tr') + count('fix'), '| quiz', count('quiz'));
if (errs.length) { console.log('PROBLEMS:\n' + errs.join('\n')); process.exit(1); }
console.log('CONTENT_OK');
