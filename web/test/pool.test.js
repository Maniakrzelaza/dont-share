// Pilnuje, żeby każda wylosowana rozgrywka była grywalna: kompletne zgłoszenia, rozstrzygalne
// narzędziami dostępnymi danego dnia, i zestawy dni zgodne z zasadami losowania.
// Uruchamianie: node --test web/test/*.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { TOOL_ORDER, VERDICTS, DAYS, POOL, CASES_PER_DAY, decisiveTools, hasFallout, SPREAD, reachAt, harmfulReach, drawRun } = require('../js/cases.js');
const { SCENES } = require('../js/scenes.js');

test('every case is complete', () => {
  POOL.forEach((c, i) => {
    const where = `case ${i} (${c.reporter})`;
    assert.ok(VERDICTS.includes(c.truth), `${where}: unknown verdict`);
    assert.ok([1, 2, 3].includes(c.tier), `${where}: unknown tier`);
    assert.ok(c.kind === 'post' ? c.post : c.article, `${where}: body missing for kind ${c.kind}`);
    assert.ok(c.lesson, `${where}: lesson missing`);
    assert.ok(c.fallout && c.fallout.headline && c.fallout.body, `${where}: fallout missing`);
    Object.entries(c.ev).forEach(([k, [flag, text]]) => {
      assert.ok(TOOL_ORDER.includes(k), `${where}: unknown tool ${k}`);
      assert.ok(['ok', 'red', 'info'].includes(flag), `${where}: unknown flag ${flag}`);
      assert.ok(text, `${where}: empty evidence for ${k}`);
    });
    if (c.photo) assert.ok(SCENES[c.photo.scene], `${where}: no scene "${c.photo.scene}"`);
  });
});

test('every case can be decided with the tools of its own day', () => {
  POOL.forEach((c, i) => {
    const tools = DAYS[c.tier - 1].tools;
    const decisive = decisiveTools(c).filter(k => tools.includes(k));
    assert.ok(decisive.length > 0, `case ${i} (${c.reporter}) has no decisive evidence on day ${c.tier}`);
  });
});

test('higher-tier cases need the tool that arrives on their day', () => {
  POOL.filter(c => c.tier > 1).forEach(c => {
    const newTool = DAYS[c.tier - 1].newTool;
    assert.ok(c.ev[newTool], `${c.reporter}: tier ${c.tier} case has nothing from ${newTool}`);
  });
});

test('the pool is big enough for the drawing rules', () => {
  [1, 2, 3].forEach(t => assert.ok(POOL.filter(c => c.tier === t).length >= CASES_PER_DAY, `tier ${t} too small`));
});

test('every drawn run follows the rules', () => {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 2000; n++) {
    const run = drawRun(rand);
    assert.equal(run.length, DAYS.length);
    const all = run.flat();
    assert.equal(new Set(all).size, all.length, 'a case repeats within one run');
    run.forEach((day, d) => {
      assert.equal(day.length, CASES_PER_DAY);
      day.forEach(i => assert.ok(POOL[i].tier <= d + 1, `day ${d + 1} got a tier ${POOL[i].tier} case`));
      assert.ok(day.filter(i => POOL[i].tier === d + 1).length >= 3, `day ${d + 1} has too few new-tool cases`);
      VERDICTS.forEach(v => assert.ok(day.some(i => POOL[i].truth === v), `day ${d + 1} lacks ${v}`));
    });
  }
});

test('only consequential mistakes come back in the papers', () => {
  const fake = { truth: 'falsz' }, twisted = { truth: 'manipulacja' }, real = { truth: 'prawda' };
  // przepuszczone albo niesprawdzone fałszywki wracają
  assert.equal(hasFallout(fake, 'prawda'), true);
  assert.equal(hasFallout(twisted, 'prawda'), true);
  assert.equal(hasFallout(fake, null), true);
  // zatrzymane — nawet z pomylonym rodzajem — nie wracają
  assert.equal(hasFallout(fake, 'falsz'), false);
  assert.equal(hasFallout(fake, 'manipulacja'), false);
  assert.equal(hasFallout(twisted, 'falsz'), false);
  // odrzucona prawda wraca, niesprawdzona prawda nikomu nie szkodzi
  assert.equal(hasFallout(real, 'falsz'), true);
  assert.equal(hasFallout(real, 'manipulacja'), true);
  assert.equal(hasFallout(real, 'prawda'), false);
  assert.equal(hasFallout(real, null), false);
});

test('reach grows while a case sits on the desk', () => {
  POOL.forEach((_, i) => {
    assert.ok(reachAt(i, 0) > 0);
    assert.ok(reachAt(i, 20) > reachAt(i, 0), 'a tool use must let it spread further');
    assert.ok(Math.abs(reachAt(i, SPREAD.doublingMin) / reachAt(i, 0) - 2) < 0.01, 'doubles every doublingMin');
  });
});

test('only fakes that got out count towards harmful reach', () => {
  const fake = POOL.findIndex(c => c.truth === 'falsz');
  const real = POOL.findIndex(c => c.truth === 'prawda');
  assert.equal(harmfulReach({ id: fake, verdict: 'prawda', reach: 1000 }), 1000 * SPREAD.stampBoost);
  assert.equal(harmfulReach({ id: fake, verdict: 'falsz', reach: 1000 }), 0);
  assert.equal(harmfulReach({ id: fake, verdict: null, reach: 0 }), reachAt(fake, SPREAD.missedMin));
  assert.equal(harmfulReach({ id: real, verdict: 'falsz', reach: 1000 }), 0);
});
