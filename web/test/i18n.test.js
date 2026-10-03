// Pilnuje, żeby wersja angielska była kompletna: każdy tekst interfejsu i każde zgłoszenie ma
// odpowiednik w obu językach. Brak tłumaczenia nie wywróci gry (zostaje polski tekst), więc bez
// tego testu luka przeszłaby niezauważona.
const test = require('node:test');
const assert = require('node:assert/strict');
const { UI, LANGS } = require('../js/i18n.js');
const { POOL_EN } = require('../js/cases.en.js');
global.POOL_EN = POOL_EN;
const { POOL, TOOL_ORDER, VERDICTS, DAYS, localizedCase } = require('../js/cases.js');
const { SCENES } = require('../js/scenes.js');

function shape(v) {
  if (Array.isArray(v)) return v.map(shape);
  if (typeof v === 'function') return 'fn';
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, shape(v[k])]));
  return typeof v;
}

test('both languages define the same interface texts', () => {
  assert.deepEqual(shape(UI.en), shape(UI.pl));
  LANGS.forEach(l => {
    TOOL_ORDER.forEach(k => assert.ok(UI[l].tools[k].name, `${l}: tool ${k}`));
    VERDICTS.forEach(v => assert.ok(UI[l].verdict[v], `${l}: verdict ${v}`));
    assert.equal(UI[l].days.length, DAYS.length, `${l}: day texts`);
  });
});

test('verdict shortcut keys are unique and not digits', () => {
  LANGS.forEach(l => {
    const keys = VERDICTS.map(v => UI[l].verdictKey[v]);
    assert.equal(new Set(keys).size, keys.length, `${l}: duplicate shortcut`);
    keys.forEach(k => assert.match(k, /^[a-z]$/, `${l}: shortcut ${k}`));
  });
});

// Teksty, które gracz czyta. Adresy, uchwyty i nazwy własne mogą zostać po polsku.
const TEXT_PATHS = {
  article: ['headline', 'date', 'lead'],
  post: ['time', 'text', 'shares']
};

test('every case has an English translation of every text the player reads', () => {
  assert.equal(POOL_EN.length, POOL.length, 'POOL_EN must have one entry per case, in the same order');
  POOL.forEach((c, i) => {
    const en = POOL_EN[i], where = `case ${i} (${c.reporter})`;
    assert.ok(en.reporter, `${where}: reporter`);
    assert.ok(en.lesson, `${where}: lesson`);
    const body = en[c.kind];
    assert.ok(body, `${where}: ${c.kind} text missing`);
    TEXT_PATHS[c.kind].forEach(k => assert.ok(body[k], `${where}: ${c.kind}.${k}`));
    if (c.post && c.post.link) assert.ok(body.link && body.link.title, `${where}: link title`);
    if (c.photo) assert.ok(en.photo && en.photo.caption, `${where}: photo caption`);
    Object.keys(c.ev).forEach(k => assert.ok(en.ev && en.ev[k], `${where}: evidence ${k}`));
    Object.keys(en.ev || {}).forEach(k => assert.ok(c.ev[k], `${where}: evidence ${k} has no Polish original`));
  });
});

test('localizing keeps the rules of the case', () => {
  POOL.forEach((c, i) => {
    const en = localizedCase(i, 'en');
    assert.equal(en.truth, c.truth);
    assert.equal(en.tier, c.tier);
    Object.keys(c.ev).forEach(k => assert.equal(en.ev[k][0], c.ev[k][0], `case ${i}: flag of ${k} changed`));
    assert.notEqual(en.lesson, c.lesson, `case ${i}: lesson not translated`);
  });
});

test('scenes render in both languages', () => {
  Object.entries(SCENES).forEach(([k, scene]) => LANGS.forEach(l => {
    const svg = scene(l);
    assert.match(svg, /^<svg[\s\S]*<\/svg>$/, `${k}/${l}`);
    assert.doesNotMatch(svg, /undefined|NaN/, `${k}/${l}`);
  }));
});
