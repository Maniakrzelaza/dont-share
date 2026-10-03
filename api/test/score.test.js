// Serwer musi liczyć wynik dokładnie tak jak gra, inaczej ranking pokaże co innego niż ekran
// końcowy. Uruchamianie: node --test api/test/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { scoreRun, Invalid } = require('../score.js');
const { POOL, DAYS, decisiveTools, drawRun, seededRandom } = require('../../web/js/cases.js');
const { SCENE_CLUES } = require('../../web/js/scenes.js');

const DATE = '2026-10-05';
const run = drawRun(seededRandom(DATE));

// Idealna gra: trafny werdykt i przesądzający dowód dostępny danego dnia.
const perfect = run.map((day, d) => day.map(i => {
  const c = POOL[i];
  const pin = decisiveTools(c).find(k => DAYS[d].tools.includes(k));
  return { v: c.truth, p: pin };
}));

test('a perfect run scores 100 per report', () => {
  assert.deepEqual(scoreRun(DATE, perfect), { score: 1500, ok: 15, total: 15 });
});

test('a correct verdict without key evidence scores 60', () => {
  const noPins = perfect.map(day => day.map(x => ({ v: x.v, p: null })));
  assert.equal(scoreRun(DATE, noPins).score, 900);
});

test('a tool the player did not have that day earns no evidence bonus', () => {
  const firstDay = run[0].map(i => ({ v: POOL[i].truth, p: 'dokument' }));
  assert.equal(scoreRun(DATE, [firstDay]).score, 5 * 60);
});

test('the magnifier slip counts only on photos with planted flaws', () => {
  const withClues = run.flat().some(i => POOL[i].photo && SCENE_CLUES[POOL[i].photo.scene]);
  const eye = perfect.map((day, d) => day.map((x, j) => ({ v: x.v, p: 'oko' })));
  const expected = run.flat().reduce((s, i) => s + 60 + (POOL[i].photo && SCENE_CLUES[POOL[i].photo.scene] ? 40 : 0), 0);
  assert.equal(scoreRun(DATE, eye).score, expected);
  assert.ok(withClues || expected === 900);
});

test('wrong and unchecked reports score nothing', () => {
  const day = run[0].map((i, j) => j < 3 ? { v: POOL[i].truth === 'prawda' ? 'falsz' : 'prawda', p: null } : { v: null, p: null });
  assert.deepEqual(scoreRun(DATE, [day]), { score: 0, ok: 0, total: 5 });
});

test('a different date is a different set of reports', () => {
  const other = scoreRun('2026-10-06', perfect);
  assert.ok(other.score < 1500, 'answers for one day must not be perfect on another');
});

test('malformed decisions are rejected', () => {
  const bad = [
    null, [], [[], [], [], []],
    [perfect[0].slice(0, 3), perfect[1]],                    // skrócony dzień, a po nim kolejny
    [[{ v: null, p: null }, { v: 'prawda', p: null }]],      // pieczątka po niesprawdzonym
    [[{ v: 'może', p: null }]],
    [[{ v: 'prawda', p: 'wróżka' }]],
    [perfect[0].concat(perfect[0][0])]
  ];
  bad.forEach(x => assert.throws(() => scoreRun(DATE, x), Invalid, JSON.stringify(x)));
});
