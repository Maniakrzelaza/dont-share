// Liczenie wyniku po stronie serwera. Gra wysyła tylko decyzje gracza — pieczątkę i wskazany
// dowód przy każdym zgłoszeniu — a serwer odtwarza zestaw dnia z tego samego ziarna i liczy punkty
// tymi samymi regułami co gra (web/js/cases.js). Wysłanie samego „wyniku” niczego nie daje.

const { POOL, DAYS, VERDICTS, TOOL_ORDER, CASES_PER_DAY, decisiveTools, drawRun, seededRandom } = require('../web/js/cases.js');
const { SCENE_CLUES } = require('../web/js/scenes.js');

const PTS_VERDICT = 60;
const PTS_EVIDENCE = 40;

class Invalid extends Error {}

// decisions: tablica dni, każdy dzień to tablica { v, p } w kolejności kolejki:
//   v — 'prawda' | 'falsz' | 'manipulacja' albo null, gdy zgłoszenie zostało niesprawdzone,
//   p — wskazany kluczowy dowód: klucz narzędzia, 'oko' (ślad wypatrzony lupą) albo null.
// Krótszy ostatni dzień oznacza zwolnienie w trakcie gry.
function scoreRun(date, decisions) {
  if (!Array.isArray(decisions) || decisions.length < 1 || decisions.length > DAYS.length) throw new Invalid('days');
  const run = drawRun(seededRandom(date));
  let score = 0, ok = 0;
  decisions.forEach((day, d) => {
    if (!Array.isArray(day) || day.length > CASES_PER_DAY) throw new Invalid('day length');
    if (day.length < CASES_PER_DAY && d !== decisions.length - 1) throw new Invalid('only the last day may be cut short');
    let missedFrom = -1;
    day.forEach((x, j) => {
      if (!x || typeof x !== 'object') throw new Invalid('decision');
      if (x.v === null) { if (missedFrom < 0) missedFrom = j; return; }
      // Niesprawdzone zgłoszenia zostają tylko na końcu dnia, gdy minie 16:00.
      if (missedFrom >= 0) throw new Invalid('stamp after an unchecked report');
      if (!VERDICTS.includes(x.v)) throw new Invalid('verdict');
      if (x.p !== null && x.p !== 'oko' && !TOOL_ORDER.includes(x.p)) throw new Invalid('pin');
      const c = POOL[run[d][j]];
      if (x.v !== c.truth) return;
      const pinGood = x.p === 'oko'
        ? !!(c.photo && SCENE_CLUES[c.photo.scene])
        : !!x.p && DAYS[d].tools.includes(x.p) && decisiveTools(c).includes(x.p);
      ok++;
      score += PTS_VERDICT + (pinGood ? PTS_EVIDENCE : 0);
    });
  });
  return { score, ok, total: decisions.reduce((n, day) => n + day.length, 0) };
}

module.exports = { scoreRun, Invalid };
