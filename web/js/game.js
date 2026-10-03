// Logika gry: stan, ekrany i zegar. Treść jest w cases.js, ilustracje w scenes.js.

const TOOL_COST = 20;
const DAY_MIN = 480; // 8:00 – 16:00
const PTS_VERDICT = 60;
const PTS_EVIDENCE = 40;

let S;
const fresh = () => ({
  screen: 'intro', run: drawRun(), day: 0, idx: 0, minutes: 0,
  used: [], pin: null, score: 0, trust: 100, log: [], last: null
});

const $app = document.getElementById('app');
const $layer = document.getElementById('layer');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clockText = m => { const t = 480 + Math.min(DAY_MIN, Math.floor(m)); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const hueOf = s => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
const dayCases = () => S.run[S.day];
const curCase = () => POOL[dayCases()[S.idx]];
const totalCases = () => S.run.flat().length;
const plural = (n, one, few, many) => n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

function render() {
  $layer.innerHTML = '';
  if (S.screen === 'intro') return renderIntro();
  if (S.screen === 'dayIntro') return renderDayIntro();
  if (S.screen === 'dayEnd') return renderDayEnd();
  if (S.screen === 'end') return renderEnd();
  renderDesk();
  if (S.screen === 'feedback') renderFeedback();
}

function renderIntro() {
  $app.innerHTML = `
  <div class="memo">
    <div class="hdr">OD: Redaktor naczelna<br>DO: Nowa osoba w dziale weryfikacji<br>TEMAT: Twój okres próbny, 3 dni</div>
    <h1>Don’t Share</h1>
    <p>Czytelnicy przysyłają nam podejrzane wiadomości. Twoja praca: sprawdzić każdą i przybić jedną z trzech pieczątek, zanim fałszywka obiegnie kraj.</p>
    <ul class="verdicts">
      <li><b class="s-prawda">Prawda</b><span>Informacja zgadza się z faktami i ma wiarygodne źródło.</span></li>
      <li><b class="s-falsz">Fałsz</b><span>Informacja zmyślona, satyra wzięta na serio albo oszustwo.</span></li>
      <li><b class="s-manipulacja">Manipulacja</b><span>Prawdziwy materiał w fałszywym kontekście: stare zdjęcie, ucięty cytat, przekręcone badanie.</span></li>
    </ul>
    <ul class="rules">
      <li>Pracujesz od 8:00 do 16:00. Każde użycie narzędzia zajmuje ${TOOL_COST} minut.</li>
      <li>Wyniki narzędzi trafiają do teczki. Sam oceniasz, co znaczą, i wskazujesz kartkę, która przesądza sprawę.</li>
      <li>Trafny werdykt: +${PTS_VERDICT} pkt. Trafnie wskazany kluczowy dowód: dodatkowe +${PTS_EVIDENCE} pkt.</li>
      <li>Błędny werdykt obniża zaufanie czytelników o 20, niesprawdzone zgłoszenie o 10. Przy zerze tracisz pracę.</li>
      <li>Skróty: <span class="kbd">P</span> prawda, <span class="kbd">F</span> fałsz, <span class="kbd">M</span> manipulacja, <span class="kbd">1</span>–<span class="kbd">4</span> wskazanie kartki.</li>
    </ul>
    <button class="go" id="go">Zaczynam pierwszy dzień</button>
  </div>`;
  document.getElementById('go').onclick = () => { S.screen = 'dayIntro'; render(); };
}

function renderDayIntro() {
  const d = DAYS[S.day];
  const nt = d.newTool ? `<div class="newtool"><span class="t">Nowe narzędzie</span><b>${TOOLS[d.newTool].name}</b>${TOOLS[d.newTool].desc}.</div>` : '';
  $app.innerHTML = `
  <div class="memo">
    <div class="hdr">DZIEŃ ${S.day + 1} Z ${DAYS.length} · ${d.date}<br>Zgłoszeń w kolejce: ${dayCases().length} · Zaufanie czytelników: ${S.trust}%</div>
    <h2>${S.day === 0 ? 'Witaj w redakcji.' : 'Dzień dobry. Kawa stoi na biurku.'}</h2>
    <p>${d.memo}</p>
    ${nt}
    <button class="go" id="go">Otwórz kolejkę</button>
  </div>`;
  document.getElementById('go').onclick = () => { S.screen = 'desk'; S.idx = 0; S.minutes = 0; S.used = []; S.pin = null; render(); };
}

function photoHTML(p) {
  if (!p) return '';
  return `<div class="photo">${SCENES[p.scene]()}<span>FOT.: ${esc(p.caption)}</span></div>`;
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
    <div class="post-foot"><span>↻ ${esc(p.shares)} udostępnień</span><span>Zgłoszono jako podejrzane</span></div>`;
}

function renderDesk() {
  const d = DAYS[S.day], c = curCase();
  const late = S.minutes > DAY_MIN - 60;
  const open = S.screen === 'desk';
  const toolBtns = TOOL_ORDER.map(k => {
    const avail = d.tools.includes(k), done = S.used.includes(k);
    const tag = !avail ? `od dnia ${DAYS.findIndex(x => x.tools.includes(k)) + 1}` : done ? 'sprawdzone' : `−${TOOL_COST} min`;
    return `<button class="tool${done ? ' done' : ''}" data-tool="${k}" ${!avail || done || !open ? 'disabled' : ''}>
      <b>${TOOLS[k].name}</b><span>${TOOLS[k].desc}</span><em>${tag}</em></button>`;
  }).join('');
  const slips = S.used.length ? S.used.map((k, i) => {
    const pinned = S.pin === k;
    return `<button class="slip${pinned ? ' pinned' : ''}" data-pin="${k}" ${open ? '' : 'disabled'} aria-pressed="${pinned}">
      <span class="h"><span>${i + 1}. ${TOOLS[k].name}</span><i>${pinned ? '★ kluczowy dowód' : 'wskaż jako kluczowy'}</i></span>${esc(evidenceOf(c, k)[1])}</button>`;
  }).join('') : `<div class="empty">Teczka jest pusta. Użyj narzędzi, żeby zebrać dowody, zanim przybijesz pieczątkę.</div>`;
  const mark = S.screen === 'feedback' && S.last ? `<div class="mark s-${S.last.verdict}">${VERDICT[S.last.verdict]}</div>` : '';
  const n = S.used.length;

  $app.innerHTML = `
  <header class="bar">
    <div class="brand">Don’t Share<small>Dzień ${S.day + 1} · ${d.date}</small></div>
    <div class="stat"><span class="lbl">Godzina</span><span class="clock${late ? ' late' : ''}" id="clock">${clockText(S.minutes)}</span></div>
    <div class="stat"><span class="lbl">Kolejka</span><span class="val">${S.idx + 1} / ${dayCases().length}</span></div>
    <div class="stat"><span class="lbl">Punkty</span><span class="val">${S.score}</span></div>
    <div class="stat"><span class="lbl">Zaufanie ${S.trust}%</span><div class="meter${S.trust <= 40 ? ' low' : ''}"><i style="width:${S.trust}%"></i></div></div>
    <button class="restart" id="restart">Od nowa</button>
  </header>
  <main class="desk">
    <section>
      <p class="slot-label"><span>Zgłoszenie</span><span>od: ${esc(c.reporter)}</span></p>
      <article class="doc">
        <div class="ticket"><span>NR ${S.day + 1}-${String(S.idx + 1).padStart(3, '0')}</span><span>wpłynęło ${clockText(Math.max(0, S.minutes - 35))}</span></div>
        ${docHTML(c)}
        ${mark}
      </article>
      <div class="stamps">
        ${VERDICTS.map(v => `<button class="stamp s-${v}" data-v="${v}" ${open ? '' : 'disabled'}>${VERDICT[v]}<small>klawisz ${v[0].toUpperCase()}</small></button>`).join('')}
      </div>
    </section>
    <aside>
      <p class="slot-label"><span>Narzędzia</span><span>zostało ${Math.max(0, DAY_MIN - Math.floor(S.minutes))} min</span></p>
      <div class="tools">${toolBtns}</div>
      <div class="folder">
        <p class="slot-label"><span>Teczka dowodów</span><span>${n} ${plural(n, 'dowód', 'dowody', 'dowodów')}</span></p>
        ${n ? `<p class="hint">Kliknij kartkę, która przesądza o werdykcie. Trafny wybór: +${PTS_EVIDENCE} pkt.</p>` : ''}
        <div class="slips">${slips}</div>
      </div>
    </aside>
  </main>`;

  $app.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => useTool(b.dataset.tool));
  $app.querySelectorAll('[data-v]').forEach(b => b.onclick = () => stamp(b.dataset.v));
  $app.querySelectorAll('[data-pin]').forEach(b => b.onclick = () => pin(b.dataset.pin));

  // Dwa kliknięcia zamiast confirm(): przypadkowe kliknięcie nie kasuje całego dnia pracy.
  const $restart = document.getElementById('restart');
  $restart.onclick = () => {
    if ($restart.classList.contains('armed')) { S = fresh(); return render(); }
    $restart.classList.add('armed');
    $restart.textContent = 'Na pewno?';
    setTimeout(() => { $restart.classList.remove('armed'); $restart.textContent = 'Od nowa'; }, 3000);
  };
}

function useTool(k) {
  if (S.screen !== 'desk' || S.used.includes(k) || !DAYS[S.day].tools.includes(k)) return;
  S.used.push(k);
  S.minutes += TOOL_COST;
  if (S.minutes >= DAY_MIN) return endDay();
  render();
}

function pin(k) {
  if (S.screen !== 'desk' || !S.used.includes(k)) return;
  S.pin = S.pin === k ? null : k;
  render();
}

function stamp(v) {
  if (S.screen !== 'desk') return;
  const c = curCase();
  const correct = v === c.truth;
  const pinGood = !!S.pin && decisiveTools(c).includes(S.pin);
  const pts = correct ? PTS_VERDICT + (pinGood ? PTS_EVIDENCE : 0) : 0;
  const dTrust = correct ? 5 : -20;
  S.score += pts;
  S.trust = Math.max(0, Math.min(100, S.trust + dTrust));
  S.last = { verdict: v, correct, pin: S.pin, pinGood, pts, dTrust };
  S.log.push({ day: S.day, correct, missed: false, pinGood });
  S.screen = 'feedback';
  render();
}

function renderFeedback() {
  const c = curCase(), L = S.last;
  const head = L.correct ? (L.pinGood ? 'Trafnie i z dowodem.' : 'Trafny werdykt.') : 'Błędny werdykt.';
  const pts = L.correct
    ? `+${L.pts} pkt · zaufanie +${L.dTrust}`
    : `0 pkt · zaufanie ${L.dTrust} · poprawnie: ${VERDICT[c.truth].toUpperCase()}`;
  const pinLine = L.pin
    ? `<p class="pin">Twój kluczowy dowód: ${TOOLS[L.pin].name} — ${L.pinGood ? '<b class="good">przesądzał</b>' : '<b class="bad">nie przesądzał</b>'}.</p>`
    : `<p class="pin">Nie wskazano kluczowego dowodu. Do wzięcia było +${PTS_EVIDENCE} pkt.</p>`;
  const tools = DAYS[S.day].tools;
  const decisive = decisiveTools(c).map(k => `<li><b>${TOOLS[k].name}${tools.includes(k) ? '' : ' (dostępny później)'}</b>${esc(c.ev[k][1])}</li>`).join('');
  const lastOne = S.idx + 1 >= dayCases().length;
  $layer.innerHTML = `
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="rep-h">
    <div class="report">
      <p class="res ${L.correct ? 'good' : 'bad'}" id="rep-h">${head}</p>
      <div class="pts">${pts}</div>
      ${pinLine}
      <p class="lesson">${esc(c.lesson)}</p>
      <p class="key">Dowody, które przesądzały:</p>
      <ul class="decisive">${decisive}</ul>
      <button class="go" id="next">${S.trust <= 0 ? 'Odbierz wypowiedzenie' : lastOne ? 'Zamknij dzień' : 'Następne zgłoszenie'}</button>
    </div>
  </div>`;
  const btn = document.getElementById('next');
  btn.focus();
  btn.onclick = next;
}

function next() {
  if (S.trust <= 0) { S.screen = 'end'; return render(); }
  S.idx++; S.used = []; S.pin = null; S.last = null;
  if (S.idx >= dayCases().length) return endDay();
  S.screen = 'desk';
  render();
}

function endDay() {
  const missed = S.screen === 'desk' ? dayCases().length - S.idx : 0;
  for (let i = 0; i < missed; i++) S.log.push({ day: S.day, correct: false, missed: true, pinGood: false });
  S.trust = Math.max(0, S.trust - missed * 10);
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
  const st = stats(S.day);
  const lastDay = S.day + 1 >= DAYS.length;
  $app.innerHTML = `
  <div class="memo">
    <div class="hdr">KONIEC DNIA ${S.day + 1} · ${DAYS[S.day].date}</div>
    <h2>${st.bad + st.missed === 0 ? 'Czysta robota. Ani jedna fałszywka nie przeszła.' : st.ok >= 3 ? 'Niezły dzień, ale kilka rzeczy umknęło.' : 'Ciężki dzień. Jutro sprawdzaj dokładniej.'}</h2>
    <div class="tally">
      <div><div class="n">${st.ok}</div><div class="l">trafne werdykty</div></div>
      <div><div class="n">${st.evidence}</div><div class="l">trafnie wskazane dowody</div></div>
      <div><div class="n">${st.bad}</div><div class="l">błędne werdykty</div></div>
      <div><div class="n">${st.missed}</div><div class="l">niesprawdzone</div></div>
      <div><div class="n">${S.trust}%</div><div class="l">zaufanie czytelników</div></div>
    </div>
    <button class="go" id="go">${lastDay ? 'Zobacz ocenę okresu próbnego' : 'Idź do domu, wróć jutro'}</button>
  </div>`;
  document.getElementById('go').onclick = () => {
    if (lastDay) S.screen = 'end'; else { S.day++; S.screen = 'dayIntro'; }
    render();
  };
}

function renderEnd() {
  const st = stats();
  const total = totalCases();
  const fired = S.trust <= 0;
  const rank = fired ? 'Zwolnienie dyscyplinarne' : st.ok >= 13 ? 'Starszy weryfikator' : st.ok >= 9 ? 'Weryfikator na etacie' : st.ok >= 5 ? 'Przedłużony okres próbny' : 'Do ponownego szkolenia';
  $app.innerHTML = `
  <div class="memo">
    <div class="hdr">OD: Redaktor naczelna<br>TEMAT: Ocena okresu próbnego</div>
    <h1>${rank}</h1>
    <p>${fired ? 'Czytelnicy przestali nam ufać. Zbyt wiele fałszywek przeszło z naszą pieczątką.' : `Rozpatrzone trafnie: ${st.ok} z ${total} zgłoszeń, w tym ${st.evidence} z trafnie wskazanym dowodem. Wynik: ${S.score} pkt.`}</p>
    <div class="tally">
      <div><div class="n">${st.ok}</div><div class="l">trafne</div></div>
      <div><div class="n">${st.evidence}</div><div class="l">z dowodem</div></div>
      <div><div class="n">${st.bad}</div><div class="l">błędne</div></div>
      <div><div class="n">${st.missed}</div><div class="l">niesprawdzone</div></div>
      <div><div class="n">${S.score}</div><div class="l">punkty</div></div>
    </div>
    <h2>Ściąga weryfikatora</h2>
    <ol class="cheat">${CHEAT.map(x => `<li>${x}</li>`).join('')}</ol>
    <button class="go" id="go">Zagraj od nowa</button>
    <p class="hint" style="color:var(--ink-muted);margin-top:12px">Każda rozgrywka losuje inne zgłoszenia.</p>
  </div>`;
  document.getElementById('go').onclick = () => { S = fresh(); render(); };
}

// zegar
let lastTick = performance.now();
setInterval(() => {
  const now = performance.now(), dt = (now - lastTick) / 1000; lastTick = now;
  if (S.screen !== 'desk') return;
  S.minutes += dt * DAYS[S.day].speed;
  if (S.minutes >= DAY_MIN) return endDay();
  const el = document.getElementById('clock');
  if (el) { el.textContent = clockText(S.minutes); el.classList.toggle('late', S.minutes > DAY_MIN - 60); }
}, 250);

document.addEventListener('keydown', e => {
  if (S.screen !== 'desk' || e.ctrlKey || e.metaKey || e.altKey) return;
  const verdict = { p: 'prawda', f: 'falsz', m: 'manipulacja' }[e.key.toLowerCase()];
  if (verdict) return stamp(verdict);
  const slip = S.used[Number(e.key) - 1];
  if (slip) pin(slip);
});

S = fresh();
render();
