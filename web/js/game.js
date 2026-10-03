// Logika gry: stan, ekrany i zegar. Treść jest w cases.js / cases.en.js, teksty interfejsu
// w i18n.js, ilustracje w scenes.js.

const TOOL_COST = 20;
const DAY_MIN = 480; // 8:00 – 16:00
const PTS_VERDICT = 60;
const PTS_EVIDENCE = 40;

// Język nie należy do stanu rozgrywki: przełączenie go w połowie dnia tylko przerysowuje ekran,
// a „Od nowa” go nie resetuje.
let LANG = initialLang();
let S;
// caseStart: minuta dnia, w której bieżące zgłoszenie trafiło na biurko — od niej liczy się zasięg.
// tutorial: samouczek przy pierwszym zgłoszeniu, dopóki gracz raz go nie przejdzie albo nie pominie.
const fresh = () => ({
  screen: 'intro', run: drawRun(), day: 0, idx: 0, minutes: 0, caseStart: 0,
  used: [], pin: null, score: 0, trust: 100, log: [], last: null, tutorial: !tutorialDone()
});

function tutorialDone() {
  try { return localStorage.getItem('ds-tutorial') === 'done'; } catch (e) { return false; }
}

function finishTutorial() {
  S.tutorial = false;
  try { localStorage.setItem('ds-tutorial', 'done'); } catch (e) { /* zablokowany storage */ }
}

const T = () => UI[LANG];
const $app = document.getElementById('app');
const $layer = document.getElementById('layer');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clockText = m => { const t = 480 + Math.min(DAY_MIN, Math.floor(m)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const hueOf = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const dayCases = () => S.run[S.day];
const curCase = () => localizedCase(dayCases()[S.idx], LANG);
const totalCases = () => S.run.flat().length;
const toolName = k => T().tools[k].name;
const verdictName = v => T().verdict[v];
const fmt = n => n.toLocaleString(LANG === 'pl' ? 'pl-PL' : 'en-GB');
const currentReach = () => reachAt(dayCases()[S.idx], S.minutes - S.caseStart);
// Samouczek prowadzi tylko przez pierwsze zgłoszenie rozgrywki, a zegar wtedy stoi.
const coaching = () => S.tutorial && S.day === 0 && S.idx === 0;

function setLang(lang) {
  LANG = lang;
  try { localStorage.setItem('ds-lang', lang); } catch (e) { /* zablokowany storage */ }
  applyLang();
  render();
}

function applyLang() {
  document.documentElement.lang = LANG;
  document.title = T().htmlTitle;
}

function langButton() {
  return `<button class="lang" id="lang" aria-label="${T().langSwitchLabel}" lang="${LANG === 'pl' ? 'en' : 'pl'}">${T().langSwitch}</button>`;
}

function soundButton() {
  return `<button class="lang" id="sound" aria-label="${T().soundLabel}" aria-pressed="${Sound.enabled}">${Sound.enabled ? T().soundOn : T().soundOff}</button>`;
}

function bindLang() {
  const b = document.getElementById('lang');
  if (b) b.onclick = () => setLang(LANG === 'pl' ? 'en' : 'pl');
  const s = document.getElementById('sound');
  if (s) s.onclick = () => { Sound.toggle(); render(); };
}

function render() {
  $layer.innerHTML = '';
  if (S.screen === 'intro') renderIntro();
  else if (S.screen === 'dayIntro') renderDayIntro();
  else if (S.screen === 'dayEnd') renderDayEnd();
  else if (S.screen === 'end') renderEnd();
  else {
    renderDesk();
    if (S.screen === 'feedback') renderFeedback();
  }
  bindLang();
}

const memo = inner => `<div class="langbar">${soundButton()}${langButton()}</div><div class="memo">${inner}</div>`;

function renderIntro() {
  const t = T();
  const keys = VERDICTS.map(v => `<span class="kbd">${t.verdictKey[v].toUpperCase()}</span> ${t.verdict[v].toLowerCase()},`).join(' ');
  $app.innerHTML = memo(`
    <div class="hdr">${t.introHdr}</div>
    <h1>Don’t Share</h1>
    <p>${t.introLead}</p>
    <ul class="verdicts">
      ${VERDICTS.map(v => `<li><b class="s-${v}">${t.verdict[v]}</b><span>${t.verdictDef[v]}</span></li>`).join('')}
    </ul>
    <ul class="rules">
      ${t.rules(TOOL_COST, PTS_VERDICT, PTS_EVIDENCE).map(r => `<li>${r}</li>`).join('')}
      <li>${t.shortcuts(`${keys} <span class="kbd">1</span>–<span class="kbd">4</span>`)}</li>
    </ul>
    <button class="go" id="go">${t.introGo}</button>`);
  document.getElementById('go').onclick = () => { S.screen = 'dayIntro'; Sound.paper(); render(); };
}

// Skutki decyzji z danego dnia: zgłoszenia, które wróciły w prasie (hasFallout).
function falloutOf(day) {
  return S.log.filter(x => x.day === day && hasFallout(POOL[x.id], x.verdict)).map(x => ({
    c: localizedCase(x.id, LANG),
    kind: x.verdict === null ? 'missed' : POOL[x.id].truth === 'prawda' ? 'rejected' : 'passed',
    reach: harmfulReach(x)
  }));
}

function pressHTML(items, title, date) {
  const t = T();
  const clips = items.length
    ? items.map((f, i) => `<article class="clip ${f.kind}">
        <span class="src">${t.pressOutlets[i % t.pressOutlets.length]}</span>
        <h3>${esc(f.c.fallout.headline)}</h3>
        <p>${esc(f.c.fallout.body)}</p>
        <span class="tag">${t.pressTag[f.kind]}</span>${f.reach ? ` <span class="tag reach-tag">${t.reachClip(fmt(f.reach))}</span>` : ''}
      </article>`).join('')
    : `<p class="quiet">${t.pressQuiet}</p>`;
  return `<section class="press" aria-label="${title}">
    <div class="press-head"><b>${title}</b><span>${t.pressEdition(date)}</span></div>
    ${clips}
  </section>`;
}

function renderDayIntro() {
  const t = T(), d = DAYS[S.day], txt = t.days[S.day];
  const nt = d.newTool ? `<div class="newtool"><span class="t">${t.newTool}</span><b>${toolName(d.newTool)}</b>${t.tools[d.newTool].desc}.</div>` : '';
  const fallout = S.day > 0 ? falloutOf(S.day - 1) : [];
  $app.innerHTML = memo(`
    <div class="hdr">${t.dayHdr(S.day + 1, DAYS.length, txt.date, dayCases().length, S.trust)}</div>
    ${S.day > 0 ? pressHTML(fallout, t.pressTitle, txt.date) : ''}
    <h2>${S.day === 0 ? t.dayGreetFirst : t.chiefNote(fallout.length)}</h2>
    <p>${txt.memo}</p>
    ${nt}
    <button class="go" id="go">${t.dayGo}</button>`);
  document.getElementById('go').onclick = () => { Sound.click(); S.screen = 'desk'; S.idx = 0; S.minutes = 0; S.caseStart = 0; S.used = []; S.pin = null; render(); };
}

function photoHTML(p) {
  if (!p) return '';
  return `<div class="photo">${SCENES[p.scene](LANG)}<span>${T().photoCredit} ${esc(p.caption)}</span></div>`;
}

function docHTML(c) {
  const photo = photoHTML(c.photo);
  if (c.kind === 'article') {
    const a = c.article;
    return `<div class="browser"><span class="lock"></span><span class="url">https://${esc(a.url)}</span></div>
      <div class="mast">${esc(a.outlet)}</div>
      <h2>${esc(a.headline)}</h2>
      <p class="byline">${esc(a.author)} · ${esc(a.date)}</p>
      ${photo}
      <p class="lead">${esc(a.lead)}</p>`;
  }
  const p = c.post;
  const link = p.link ? `<div class="linkcard"><div class="o">${esc(p.link.outlet)}</div><div class="t">${esc(p.link.title)}</div><div class="u">${esc(p.link.url)}</div></div>` : '';
  return `<div class="post-head"><div class="avatar" style="background:hsl(${hueOf(p.handle)} 40% 38%)">${initials(p.name)}</div>
      <div><div class="post-name">${esc(p.name)}</div><div class="post-meta">${esc(p.handle)} · ${esc(p.time)}</div></div></div>
    <p class="post-text">${esc(p.text)}</p>
    ${link}${photo}
    <div class="post-foot"><span>${T().shares(esc(p.shares))}</span><span>${T().reported}</span></div>`;
}

function renderDesk() {
  const t = T(), d = DAYS[S.day], c = curCase();
  const late = S.minutes > DAY_MIN - 60;
  const open = S.screen === 'desk';
  const toolBtns = TOOL_ORDER.map(k => {
    const avail = d.tools.includes(k), done = S.used.includes(k);
    const tag = !avail ? t.toolLocked(DAYS.findIndex(x => x.tools.includes(k)) + 1) : done ? t.toolDone : t.toolCost(TOOL_COST);
    return `<button class="tool${done ? ' done' : ''}" data-tool="${k}" ${!avail || done || !open ? 'disabled' : ''}>
      <b>${toolName(k)}</b><span>${t.tools[k].desc}</span><em>${tag}</em></button>`;
  }).join('');
  const slips = S.used.length ? S.used.map((k, i) => {
    const pinned = S.pin === k;
    return `<button class="slip${pinned ? ' pinned' : ''}" data-pin="${k}" ${open ? '' : 'disabled'} aria-pressed="${pinned}">
      <span class="h"><span>${i + 1}. ${toolName(k)}</span><i>${pinned ? t.pinned : t.pinMe}</i></span>${esc(evidenceOf(c, k, LANG)[1])}</button>`;
  }).join('') : `<div class="empty">${t.folderEmpty}</div>`;
  const mark = S.screen === 'feedback' && S.last ? `<div class="mark s-${S.last.verdict}">${verdictName(S.last.verdict)}</div>` : '';
  const n = S.used.length;
  // Po pieczątce licznik zamiera na wartości z chwili decyzji.
  const reach = S.screen === 'feedback' && S.last ? S.last.reach : currentReach();
  const step = open && coaching() ? (n === 0 ? 'tools' : !S.pin ? 'read' : 'stamp') : null;
  const coach = (key, at) => step === at
    ? `<div class="coach" role="note"><b>${t.coachWho}:</b> ${t[key]}<button class="coach-skip" id="coach-skip">${t.coachSkip}</button></div>`
    : '';
  const target = at => step === at ? ' coach-target' : '';

  $app.innerHTML = `
  <header class="bar">
    <div class="brand">Don’t Share<small>${t.brandDay(S.day + 1, t.days[S.day].date)}</small></div>
    <div class="stat"><span class="lbl">${t.lblClock}</span><span class="clock${late ? ' late' : ''}" id="clock">${clockText(S.minutes)}</span></div>
    <div class="stat"><span class="lbl">${t.lblQueue}</span><span class="val">${S.idx + 1} / ${dayCases().length}</span></div>
    <div class="stat"><span class="lbl">${t.lblScore}</span><span class="val">${S.score}</span></div>
    <div class="stat"><span class="lbl">${t.lblTrust(S.trust)}</span><div class="meter${S.trust <= 40 ? ' low' : ''}"><i style="width:${S.trust}%"></i></div></div>
    <div class="bar-actions">${soundButton()}${langButton()}<button class="restart" id="restart">${t.restart}</button></div>
  </header>
  <main class="desk">
    <section>
      <p class="slot-label"><span>${t.lblCase}</span><span>${t.from(esc(c.reporter))}</span></p>
      <div class="reach${S.screen === 'feedback' ? ' frozen' : ''}"><span>${t.reachLbl}</span><b id="reach">${t.reachPeople(fmt(reach))}</b></div>
      <article class="doc">
        <div class="ticket"><span>${t.ticketNo} ${S.day + 1}-${String(S.idx + 1).padStart(3, '0')}</span><span>${t.received(clockText(Math.max(0, S.minutes - 35)))}</span></div>
        ${docHTML(c)}
        ${mark}
      </article>
      ${coach('coachStamp', 'stamp')}
      <div class="stamps${target('stamp')}">
        ${VERDICTS.map(v => `<button class="stamp s-${v}" data-v="${v}" ${open ? '' : 'disabled'}>${verdictName(v)}<small>${t.stampKey(t.verdictKey[v].toUpperCase())}</small></button>`).join('')}
      </div>
    </section>
    <aside>
      <p class="slot-label"><span>${t.lblTools}</span><span>${t.minutesLeft(Math.max(0, DAY_MIN - Math.floor(S.minutes)))}</span></p>
      ${coach('coachTools', 'tools')}
      <div class="tools${target('tools')}">${toolBtns}</div>
      <div class="folder">
        <p class="slot-label"><span>${t.lblFolder}</span><span>${t.evidenceCount(n)}</span></p>
        ${coach('coachRead', 'read')}
        ${n && step !== 'read' ? `<p class="hint">${t.pinHint(PTS_EVIDENCE)}</p>` : ''}
        <div class="slips${target('read')}">${slips}</div>
      </div>
    </aside>
  </main>`;

  $app.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => useTool(b.dataset.tool));
  $app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => stamp(b.dataset.v));
  $app.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => pin(b.dataset.pin));
  const $skip = document.getElementById('coach-skip');
  if ($skip) $skip.onclick = () => { finishTutorial(); render(); };

  // Dwa kliknięcia zamiast confirm(): przypadkowe kliknięcie nie kasuje całego dnia pracy.
  const $restart = document.getElementById('restart');
  $restart.onclick = () => {
    if ($restart.classList.contains('armed')) { S = fresh(); return render(); }
    $restart.classList.add('armed');
    $restart.textContent = t.restartConfirm;
    setTimeout(() => { $restart.classList.remove('armed'); $restart.textContent = T().restart; }, 3000);
  };
}

function useTool(k) {
  if (S.screen !== 'desk' || S.used.includes(k) || !DAYS[S.day].tools.includes(k)) return;
  S.used.push(k);
  S.minutes += TOOL_COST;
  Sound.teleprinter();
  if (S.minutes >= DAY_MIN) return endDay();
  render();
}

function pin(k) {
  if (S.screen !== 'desk' || !S.used.includes(k)) return;
  S.pin = S.pin === k ? null : k;
  Sound.pin();
  render();
}

function stamp(v) {
  if (S.screen !== 'desk') return;
  const c = curCase();
  const correct = v === c.truth;
  const pinGood = !!S.pin && decisiveTools(c).includes(S.pin);
  const pts = correct ? PTS_VERDICT + (pinGood ? PTS_EVIDENCE : 0) : 0;
  const dTrust = correct ? 5 : -20;
  const reach = currentReach();
  S.score += pts;
  S.trust = Math.max(0, Math.min(100, S.trust + dTrust));
  S.last = { verdict: v, correct, pin: S.pin, pinGood, pts, dTrust, reach };
  S.log.push({ day: S.day, id: dayCases()[S.idx], verdict: v, correct, missed: false, pinGood, reach });
  if (coaching()) finishTutorial();
  Sound.stamp();
  setTimeout(correct ? Sound.good : Sound.bad, 220);
  S.screen = 'feedback';
  render();
}

function renderFeedback() {
  const t = T(), c = curCase(), L = S.last;
  const head = L.correct ? (L.pinGood ? t.resGood : t.resVerdict) : t.resBad;
  const pts = L.correct ? t.ptsGood(L.pts, L.dTrust) : t.ptsBad(L.dTrust, verdictName(c.truth).toUpperCase());
  const pinLine = `<p class="pin">${L.pin ? t.pinWas(toolName(L.pin), L.pinGood) : t.pinNone(PTS_EVIDENCE)}</p>`;
  const isTrue = c.truth === 'prawda', stampedTrue = L.verdict === 'prawda';
  const reachText = isTrue
    ? (stampedTrue ? t.reachTrue(fmt(L.reach)) : t.reachRejected(fmt(L.reach)))
    : (stampedTrue ? t.reachBoosted(fmt(L.reach * SPREAD.stampBoost)) : t.reachStopped(fmt(L.reach)));
  const reachLine = `<p class="reach-line ${!isTrue && stampedTrue ? 'bad' : ''}">${reachText}</p>`;
  const tools = DAYS[S.day].tools;
  const decisive = decisiveTools(c).map(k => `<li><b>${toolName(k)}${tools.includes(k) ? '' : t.laterTool}</b>${esc(c.ev[k][1])}</li>`).join('');
  const lastOne = S.idx + 1 >= dayCases().length;
  $layer.innerHTML = `
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="rep-h">
    <div class="report">
      <p class="res ${L.correct ? 'good' : 'bad'}" id="rep-h">${head}</p>
      <div class="pts">${pts}</div>
      ${reachLine}
      ${pinLine}
      <p class="lesson">${esc(c.lesson)}</p>
      <p class="key">${t.decisiveLbl}</p>
      <ul class="decisive">${decisive}</ul>
      <button class="go" id="next">${S.trust <= 0 ? t.btnFired : lastOne ? t.btnCloseDay : t.btnNext}</button>
    </div>
  </div>`;
  const btn = document.getElementById('next');
  btn.focus();
  btn.onclick = next;
}

function next() {
  if (S.trust <= 0) { S.screen = 'end'; return render(); }
  S.idx++; S.used = []; S.pin = null; S.last = null; S.caseStart = S.minutes;
  if (S.idx >= dayCases().length) return endDay();
  S.screen = 'desk';
  render();
}

function endDay() {
  const missed = S.screen === 'desk' ? dayCases().slice(S.idx) : [];
  if (S.screen === 'desk') Sound.bell();
  missed.forEach(id => S.log.push({ day: S.day, id, verdict: null, correct: false, missed: true, pinGood: false, reach: 0 }));
  S.trust = Math.max(0, S.trust - missed.length * 10);
  S.last = null;
  S.screen = S.trust <= 0 ? 'end' : 'dayEnd';
  render();
}

function stats(day) {
  const l = S.log.filter(x => day === undefined || x.day === day);
  return {
    ok: l.filter(x => x.correct).length,
    bad: l.filter(x => !x.correct && !x.missed).length,
    missed: l.filter(x => x.missed).length,
    evidence: l.filter(x => x.correct && x.pinGood).length
  };
}

function renderDayEnd() {
  const t = T(), st = stats(S.day);
  const lastDay = S.day + 1 >= DAYS.length;
  $app.innerHTML = memo(`
    <div class="hdr">${t.dayEndHdr(S.day + 1, t.days[S.day].date)}</div>
    <h2>${st.bad + st.missed === 0 ? t.dayEndClean : st.ok >= 3 ? t.dayEndOk : t.dayEndBad}</h2>
    <div class="tally">
      <div><div class="n">${st.ok}</div><div class="l">${t.tCorrect}</div></div>
      <div><div class="n">${st.evidence}</div><div class="l">${t.tEvidence}</div></div>
      <div><div class="n">${st.bad}</div><div class="l">${t.tWrong}</div></div>
      <div><div class="n">${st.missed}</div><div class="l">${t.tMissed}</div></div>
      <div><div class="n">${S.trust}%</div><div class="l">${t.tTrust}</div></div>
    </div>
    <button class="go" id="go">${lastDay ? t.btnFinal : t.btnHome}</button>`);
  document.getElementById('go').onclick = () => {
    if (lastDay) S.screen = 'end';
    else {
      S.day++; S.screen = 'dayIntro';
      Sound.paper();
      if (falloutOf(S.day - 1).length >= 3) Sound.phone();
    }
    render();
  };
}

// Karta wyniku w stylu Wordle: jedna kratka na zgłoszenie, bez zdradzania treści zgłoszeń.
const SQUARE = x => x.missed ? '⬜' : !x.correct ? '🟥' : x.pinGood ? '🟩' : '🟨';

function shareText(st, spread) {
  const t = T();
  const days = DAYS.map((_, d) => S.log.filter(x => x.day === d)).filter(l => l.length)
    .map((l, d) => `${t.shareDay(d + 1)} ${l.map(SQUARE).join('')}`);
  const origin = /^https?:/.test(location.protocol) ? location.origin : 'https://vitrino.pl';
  return [t.shareHead(st.ok, totalCases(), S.score), ...days, t.shareSpread(spread ? fmt(spread) : 0),
    `${origin}/${LANG === 'en' ? '?lang=en' : ''}`].join('\n');
}

function bindShare(text) {
  const t = T(), $copy = document.getElementById('share-copy'), $card = document.getElementById('share-card');
  $copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      Sound.click();
      $copy.textContent = t.shareCopied;
      setTimeout(() => { $copy.textContent = T().shareCopy; }, 2000);
    } catch (e) {
      // Bez dostępu do schowka zaznaczamy kartę, żeby gracz skopiował ją sam.
      const range = document.createRange();
      range.selectNodeContents($card);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      document.getElementById('share-note').textContent = t.shareCopyFail;
    }
  };
  const $native = document.getElementById('share-native');
  if ($native) $native.onclick = () => navigator.share({ text }).catch(() => { /* gracz zamknął okno */ });
}

function renderEnd() {
  const t = T(), st = stats();
  const fired = S.trust <= 0;
  const rank = t.rank[fired ? 'fired' : st.ok >= 13 ? 'senior' : st.ok >= 9 ? 'staff' : st.ok >= 5 ? 'extended' : 'retrain'];
  const spread = S.log.reduce((sum, x) => sum + harmfulReach(x), 0);
  const card = shareText(st, spread);
  $app.innerHTML = memo(`
    <div class="hdr">${t.endHdr}</div>
    <h1>${rank}</h1>
    <p>${fired ? t.endFired : t.endSummary(st.ok, totalCases(), st.evidence, S.score)}</p>
    <div class="tally">
      <div><div class="n">${st.ok}</div><div class="l">${t.eCorrect}</div></div>
      <div><div class="n">${st.evidence}</div><div class="l">${t.eEvidence}</div></div>
      <div><div class="n">${st.bad}</div><div class="l">${t.eWrong}</div></div>
      <div><div class="n">${st.missed}</div><div class="l">${t.eMissed}</div></div>
      <div><div class="n">${S.score}</div><div class="l">${t.eScore}</div></div>
      <div><div class="n">${fmt(spread)}</div><div class="l">${t.tSpread}</div></div>
    </div>
    <section class="share">
      <div class="share-head"><b>${t.shareTitle}</b><span>${t.shareIrony}</span></div>
      <pre id="share-card">${esc(card)}</pre>
      <div class="share-actions">
        <button class="go" id="share-copy">${t.shareCopy}</button>
        ${navigator.share ? `<button class="go ghost" id="share-native">${t.shareNative}</button>` : ''}
      </div>
      <p class="again-hint" id="share-note" aria-live="polite"></p>
    </section>
    ${pressHTML(falloutOf(S.day), t.finalPressTitle, S.day + 1 < DAYS.length ? t.days[S.day + 1].date : t.pressFinalDate)}
    <h2>${t.cheatTitle}</h2>
    <ol class="cheat">${t.cheat.map(x => `<li>${x}</li>`).join('')}</ol>
    <button class="go" id="go">${t.btnAgain}</button>
    <p class="again-hint">${t.againHint}</p>`);
  document.getElementById('go').onclick = () => { S = fresh(); render(); };
  bindShare(card);
}

// zegar
let lastTick = performance.now(), lastSecond = 0;
setInterval(() => {
  const now = performance.now(), dt = (now - lastTick) / 1000; lastTick = now;
  if (S.screen !== 'desk' || coaching()) return;
  S.minutes += dt * DAYS[S.day].speed;
  if (S.minutes >= DAY_MIN) return endDay();
  // W ostatniej godzinie zegar tyka co sekundę.
  const second = Math.floor(now / 1000);
  if (S.minutes > DAY_MIN - 60 && second !== lastSecond) Sound.tick();
  lastSecond = second;
  const el = document.getElementById('clock');
  if (el) { el.textContent = clockText(S.minutes); el.classList.toggle('late', S.minutes > DAY_MIN - 60); }
  const $reach = document.getElementById('reach');
  if ($reach) $reach.textContent = T().reachPeople(fmt(currentReach()));
}, 250);

document.addEventListener('keydown', e => {
  if (S.screen !== 'desk' || e.ctrlKey || e.metaKey || e.altKey) return;
  const key = e.key.toLowerCase();
  const verdict = VERDICTS.find(v => T().verdictKey[v] === key);
  if (verdict) return stamp(verdict);
  const slip = S.used[Number(e.key) - 1];
  if (slip) pin(slip);
});

applyLang();
S = fresh();
render();
