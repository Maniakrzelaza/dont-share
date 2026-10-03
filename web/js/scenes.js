// Ilustracje zgłoszeń jako sceny SVG. Każda scena to funkcja (lang) zwracająca kod SVG 320×180.
//
// Niektóre sceny zawierają ślady, które opisuje wyszukiwanie obrazem — uważny gracz może je
// wypatrzyć sam, zanim użyje narzędzia:
//   wolf  — łańcuch huśtawki wrasta w drzewo, wilk w odbiciu ma pięć łap (obraz z AI),
//   shark — cień płetwy pada w lewo, cienie filarów w prawo (fotomontaż),
//   fuel  — ceny na pylonie są w euro (zdjęcie z innego kraju).

const SCENE_FONT = 'font-family="Archivo, Arial Narrow, Arial, sans-serif"';

// Napisy, które pojawiają się w samych scenach.
const SCENE_TEXT = {
  pl: { tv: { label: 'PILNE', labelSize: 12, headline: 'GODZINA POLICYJNA OD SOBOTY', ticker: 'CAŁY KRAJ • OD 20:00 DO 6:00 • SZCZEGÓŁY WKRÓTCE' } },
  en: { tv: { label: 'BREAKING', labelSize: 9.5, headline: 'NATIONWIDE CURFEW FROM SATURDAY', ticker: 'WHOLE COUNTRY • 20:00 TO 6:00 • DETAILS TO FOLLOW' } }
};

function svgScene(defs, body) {
  return `<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;
}

function grad(id, stops, horizontal) {
  const dir = horizontal ? 'x2="1" y2="0"' : 'x2="0" y2="1"';
  return `<linearGradient id="${id}" x1="0" y1="0" ${dir}>${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
}

// Deterministyczny los: ta sama scena wygląda zawsze tak samo.
function seeded(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function car(x, y, s, color) {
  const w = 46 * s, h = 13 * s;
  return `<g>
    <rect x="${x + w * 0.2}" y="${y - h * 0.85}" width="${w * 0.55}" height="${h * 0.9}" rx="${4 * s}" fill="${color}"/>
    <rect x="${x + w * 0.26}" y="${y - h * 0.7}" width="${w * 0.43}" height="${h * 0.45}" rx="${2 * s}" fill="#2a3138" opacity=".85"/>
    <rect x="${x}" y="${y - h * 0.15}" width="${w}" height="${h * 0.75}" rx="${4 * s}" fill="${color}"/>
    <circle cx="${x + w * 0.22}" cy="${y + h * 0.6}" r="${4.2 * s}" fill="#1c1f22"/>
    <circle cx="${x + w * 0.78}" cy="${y + h * 0.6}" r="${4.2 * s}" fill="#1c1f22"/>
    <rect x="${x + w - 4 * s}" y="${y}" width="${3 * s}" height="${2.5 * s}" fill="#f6d27a"/>
  </g>`;
}

const SCENES = {
  fuel() {
    const colors = ['#9a3b32', '#d9dcde', '#3c5a74', '#2f3336', '#7f8c5a', '#c9a24a', '#5b6670', '#a7aeb3', '#6d3f5a', '#e2e4e5'];
    let cars = '';
    for (let i = 9; i >= 0; i--) {
      const s = 1 - i * 0.075;
      cars += car(196 - i * 25 * (1 - i * 0.03), 150 - i * 3.2, s, colors[i]);
    }
    return svgScene(grad('fuelSky', [[0, '#55677a'], [0.7, '#d39a6a'], [1, '#e8b985']]),
      `<rect width="320" height="180" fill="url(#fuelSky)"/>
      <rect y="118" width="320" height="62" fill="#3a3f43"/>
      <rect y="118" width="320" height="3" fill="#2b2f33"/>
      <rect x="160" y="52" width="160" height="12" fill="#eceff1"/>
      <rect x="160" y="62" width="160" height="4" fill="#b8322c"/>
      <rect x="178" y="66" width="5" height="70" fill="#c9cdd0"/><rect x="298" y="66" width="5" height="70" fill="#c9cdd0"/>
      <rect x="226" y="104" width="13" height="30" fill="#d9dde0"/><rect x="228" y="108" width="9" height="6" fill="#2b3138"/>
      <rect x="268" y="104" width="13" height="30" fill="#d9dde0"/><rect x="270" y="108" width="9" height="6" fill="#2b3138"/>
      <rect x="118" y="112" width="4" height="24" fill="#2b3036"/>
      <rect x="104" y="40" width="32" height="74" rx="2" fill="#262b30"/>
      <rect x="107" y="44" width="26" height="10" fill="#b8322c"/>
      <g ${SCENE_FONT} font-size="7.5" font-weight="700" fill="#f2b43a">
        <text x="108" y="66">1,89 €</text><text x="108" y="80">1,79 €</text><text x="108" y="94">2,05 €</text><text x="108" y="108">0,99 €</text>
      </g>
      ${cars}`);
  },

  wolf() {
    return svgScene(
      grad('wolfSky', [[0, '#cfe4ec'], [1, '#f3f0e6']]) +
      `<clipPath id="wolfPuddle"><ellipse cx="96" cy="152" rx="42" ry="10"/></clipPath>`,
      `<rect width="320" height="180" fill="url(#wolfSky)"/>
      <ellipse cx="40" cy="112" rx="60" ry="22" fill="#a9c79a"/><ellipse cx="180" cy="114" rx="90" ry="20" fill="#b3cfa2"/>
      <rect y="112" width="320" height="68" fill="#93b874"/>
      <rect x="266" y="36" width="13" height="88" fill="#6c5238"/>
      <circle cx="272" cy="34" r="30" fill="#6f9a5c"/><circle cx="296" cy="52" r="22" fill="#78a463"/><circle cx="250" cy="52" r="20" fill="#78a463"/>
      <g stroke="#c0453c" stroke-width="4" stroke-linecap="round" fill="none">
        <path d="M150 42 L134 124 M150 42 L166 124"/>
        <path d="M150 42 L268 42"/>
      </g>
      <g stroke="#7d8790" stroke-width="1.5" fill="none">
        <path d="M188 43 L188 96 M204 43 L204 96"/>
        <path d="M226 43 C230 70 250 74 268 78"/>
      </g>
      <rect x="184" y="95" width="24" height="4" rx="1.5" fill="#3b4a57"/>
      <rect x="236" y="96" width="20" height="4" rx="1.5" fill="#3b4a57" opacity=".9"/>
      <path d="M20 122 L36 72 L46 72 L74 122 Z" fill="#f2c94c"/><rect x="34" y="72" width="4" height="50" fill="#d9a92e"/>
      <ellipse cx="96" cy="152" rx="42" ry="10" fill="#a8c8d6"/>
      <g clip-path="url(#wolfPuddle)" opacity=".55">
        <ellipse cx="96" cy="158" rx="26" ry="5" fill="#5e5a57"/>
        <g fill="#5e5a57"><rect x="76" y="144" width="3.5" height="10"/><rect x="85" y="144" width="3.5" height="10"/><rect x="94" y="144" width="3.5" height="10"/><rect x="104" y="144" width="3.5" height="10"/><rect x="113" y="144" width="3.5" height="10"/></g>
      </g>
      <path d="M70 108 C58 104 52 96 50 90" stroke="#6e6a66" stroke-width="5" stroke-linecap="round" fill="none"/>
      <g fill="#6e6a66">
        <rect x="76" y="112" width="4" height="26" rx="1.5"/><rect x="86" y="112" width="4" height="26" rx="1.5"/>
        <rect x="104" y="112" width="4" height="26" rx="1.5"/><rect x="113" y="112" width="4" height="26" rx="1.5"/>
      </g>
      <ellipse cx="96" cy="110" rx="28" ry="11" fill="#7a7672"/>
      <circle cx="124" cy="99" r="9.5" fill="#7a7672"/>
      <path d="M118 92 L120 82 L125 90 Z M126 91 L130 81 L132 92 Z" fill="#6e6a66"/>
      <path d="M131 100 L141 103 L131 106 Z" fill="#6e6a66"/>
      <circle cx="127" cy="97" r="1.4" fill="#1c1c1c"/>`);
  },

  buses() {
    const bus = (x, y, s, line) => `<g transform="translate(${x} ${y}) scale(${s})">
      <rect width="96" height="36" rx="5" fill="#f1f3f0"/>
      <rect x="4" y="5" width="88" height="12" rx="2" fill="#2c3e4a"/>
      <rect y="22" width="96" height="5" fill="#2f9a6f"/>
      <rect x="70" y="20" width="9" height="13" fill="#d9dedb"/>
      <rect x="6" y="-6" width="22" height="7" rx="1" fill="#1d2328"/>
      <text x="9" y="-0.5" ${SCENE_FONT} font-size="6" font-weight="700" fill="#f2b43a">${line}</text>
      <circle cx="18" cy="37" r="6" fill="#1c1f22"/><circle cx="78" cy="37" r="6" fill="#1c1f22"/>
      <path d="M44 28 L48 23 L47 27 L51 27 L47 33 L48 29 Z" fill="#ffffff"/>
    </g>`;
    return svgScene(grad('busSky', [[0, '#c6d5dc'], [1, '#eef1ee']]),
      `<rect width="320" height="180" fill="url(#busSky)"/>
      <rect x="0" y="38" width="320" height="72" fill="#b4bab6"/>
      <rect x="0" y="34" width="320" height="6" fill="#8d9590"/>
      <g fill="#8a918d"><rect x="18" y="58" width="58" height="52"/><rect x="96" y="58" width="58" height="52"/><rect x="174" y="58" width="58" height="52"/><rect x="252" y="58" width="58" height="52"/></g>
      <rect y="108" width="320" height="72" fill="#55595b"/>
      <g fill="#e9ecea"><rect x="10" y="168" width="30" height="3"/><rect x="70" y="168" width="30" height="3"/><rect x="130" y="168" width="30" height="3"/><rect x="190" y="168" width="30" height="3"/><rect x="250" y="168" width="30" height="3"/></g>
      ${bus(8, 104, 0.95, '18')}${bus(112, 110, 1, '25')}${bus(218, 104, 0.95, '18')}`);
  },

  sejm() {
    let rows = '';
    [150, 128, 106, 84, 62].forEach((r, ri) => {
      rows += `<path d="M${160 - r} 196 A ${r} ${r * 0.62} 0 0 1 ${160 + r} 196" stroke="#7d2e29" stroke-width="9" fill="none"/>`;
      const n = Math.round(r / 7.5);
      for (let i = 1; i < n; i++) {
        const t = Math.PI * (0.06 + 0.88 * i / n);
        const x = 160 - r * Math.cos(t), y = 196 - r * 0.62 * Math.sin(t) - 7;
        rows += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.3" fill="${(i + ri) % 4 ? '#3a322f' : '#8c7a6a'}"/>`;
        if ((i * 7 + ri) % 3 === 0) rows += `<path d="M${(x + 3).toFixed(1)} ${y.toFixed(1)} l2 -7" stroke="#d8c2a8" stroke-width="1.6" stroke-linecap="round"/>`;
      }
    });
    return svgScene(grad('sejmWall', [[0, '#d8cdbd'], [1, '#b6a389']]),
      `<rect width="320" height="180" fill="url(#sejmWall)"/>
      <g fill="#c8b9a3"><rect x="20" y="0" width="10" height="90"/><rect x="290" y="0" width="10" height="90"/></g>
      <rect x="120" y="22" width="80" height="44" fill="#6b4f35"/>
      <circle cx="160" cy="36" r="9" fill="#b8322c"/><circle cx="160" cy="36" r="5" fill="#eae4d9"/>
      <rect x="132" y="52" width="56" height="8" fill="#56402b"/>
      ${rows}`);
  },

  smoke() {
    const rand = seeded(11);
    let puffs = '';
    for (let i = 0; i < 26; i++) {
      const t = i / 25;
      const x = 140 + t * 130 + (rand() - 0.5) * 30;
      const y = 92 - t * 90 + (rand() - 0.5) * 16;
      puffs += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(10 + t * 30 + rand() * 8).toFixed(1)}" fill="${i % 3 ? '#5c6165' : '#6f7478'}" opacity="${(0.95 - t * 0.35).toFixed(2)}"/>`;
    }
    const truck = x => `<g><rect x="${x}" y="134" width="30" height="12" rx="2" fill="#b8322c"/><rect x="${x + 22}" y="128" width="9" height="8" rx="1" fill="#b8322c"/><rect x="${x + 2}" y="131" width="20" height="2" fill="#d6d9db"/><circle cx="${x + 6}" cy="147" r="3" fill="#1c1f22"/><circle cx="${x + 25}" cy="147" r="3" fill="#1c1f22"/></g>`;
    return svgScene(grad('smokeSky', [[0, '#9fb2bf'], [1, '#ddd5c6']]),
      `<rect width="320" height="180" fill="url(#smokeSky)"/>
      ${puffs}
      <ellipse cx="140" cy="100" rx="70" ry="16" fill="#f0883c" opacity=".55"/>
      <path d="M110 100 Q116 82 122 98 Q128 76 136 98 Q144 70 152 98 Q160 84 166 100 Z" fill="#f2a43a"/>
      <path d="M40 100 L60 88 L80 100 L100 88 L120 100 L140 88 L160 100 L180 88 L200 100 L220 88 L240 100 Z" fill="#7b8084"/>
      <rect x="40" y="100" width="200" height="46" fill="#8b9094"/>
      <g fill="#5d6266"><rect x="52" y="112" width="20" height="8"/><rect x="84" y="112" width="20" height="8"/><rect x="176" y="112" width="20" height="8"/><rect x="208" y="112" width="20" height="8"/></g>
      <rect x="120" y="118" width="40" height="28" fill="#3d3a37"/>
      <rect y="146" width="320" height="34" fill="#4a4f50"/>
      ${truck(250)}${truck(284)}`);
  },

  quoteRed() { return quoteCard('#b5322b', '#d45a4f', false); },
  quoteSage() { return quoteCard('#61806f', '#88a593', true); },

  coffee() {
    return svgScene(grad('coffeeWall', [[0, '#ece3d6'], [1, '#d9cbb8']]),
      `<rect width="320" height="180" fill="url(#coffeeWall)"/>
      <rect y="112" width="320" height="68" fill="#8a5a3b"/>
      <g stroke="#7a4e32" stroke-width="1.2"><path d="M0 128 H320 M0 146 H320 M0 164 H320"/></g>
      <ellipse cx="160" cy="138" rx="66" ry="13" fill="#e8e3dc"/>
      <ellipse cx="160" cy="135" rx="60" ry="11" fill="#f7f4ef"/>
      <path d="M118 84 L122 128 Q160 140 198 128 L202 84 Z" fill="#f4f1ec"/>
      <path d="M200 92 Q224 92 222 108 Q220 122 198 120" stroke="#f4f1ec" stroke-width="7" fill="none"/>
      <ellipse cx="160" cy="84" rx="42" ry="8" fill="#e6e1d9"/>
      <ellipse cx="160" cy="85" rx="37" ry="6" fill="#4b2c1c"/>
      <g stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".75">
        <path d="M146 72 C138 60 154 52 146 40"/><path d="M162 70 C154 56 172 50 162 34"/><path d="M178 72 C172 62 186 54 178 44"/>
      </g>`);
  },

  chart(lang) {
    let bars = '';
    const n = 38;
    for (let i = 0; i < n; i++) {
      const v = 12.4 + i * 0.09 + Math.sin(i * 1.7) * 0.9 + Math.cos(i * 0.6) * 0.5;
      const last = i === n - 1;
      const h = ((last ? 17.9 : v) - 11) * 15;
      bars += `<rect x="${(34 + i * 7.1).toFixed(1)}" y="${(150 - h).toFixed(1)}" width="5" height="${h.toFixed(1)}" fill="${last ? '#c22f2a' : '#6b7d8c'}"/>`;
    }
    return svgScene('',
      `<rect width="320" height="180" fill="#f4f4ef"/>
      <g stroke="#d6d8d2" stroke-width="1"><path d="M30 60 H310 M30 90 H310 M30 120 H310"/></g>
      ${bars}
      <path d="M30 20 V150 H310" stroke="#3b4248" stroke-width="1.5" fill="none"/>
      <g ${SCENE_FONT} font-size="8" fill="#3b4248">
        <text x="30" y="162">1951</text><text x="284" y="162">2026</text>
        <text x="6" y="64">18°</text><text x="6" y="124">14°</text>
        <text x="272" y="38" font-weight="700" fill="#c22f2a">${lang === 'en' ? '17.9°C' : '17,9°C'}</text>
      </g>`);
  },

  phones() {
    const box = (x, y) => `<g><rect x="${x}" y="${y}" width="40" height="26" rx="2" fill="#fbfbfa"/><rect x="${x}" y="${y + 22}" width="40" height="4" fill="#d9dce0"/>
      <rect x="${x + 12}" y="${y + 3}" width="16" height="18" rx="3" fill="#20242a"/><circle cx="${x + 24}" cy="${y + 7}" r="1.4" fill="#5e6670"/></g>`;
    let stack = '';
    [[0, 6], [1, 5], [2, 4], [3, 3]].forEach(([row, count]) => {
      for (let i = 0; i < count; i++) stack += box(160 - count * 21 + i * 42, 128 - row * 27);
    });
    return svgScene(grad('phoneBg', [[0, '#c9d0d9'], [1, '#e9ecf0']]),
      `<rect width="320" height="180" fill="url(#phoneBg)"/>
      <rect y="152" width="320" height="28" fill="#b8bec6"/>
      ${stack}`);
  },

  crowd() {
    const rand = seeded(5);
    let heads = '';
    for (let row = 0; row < 14; row++) {
      const y = 98 + row * row * 0.45 + row * 2;
      const r = 1.6 + row * 0.55;
      for (let x = -4; x < 324; x += r * 2.3) {
        const tone = ['#3a2f2a', '#5a463a', '#2b2b2b', '#7a5b45', '#c49b6c', '#a8a29a'][Math.floor(rand() * 6)];
        heads += `<circle cx="${(x + rand() * r).toFixed(1)}" cy="${(y + rand() * 2).toFixed(1)}" r="${r.toFixed(1)}" fill="${tone}"/>`;
      }
    }
    let flags = '';
    for (let i = 0; i < 9; i++) {
      const x = 20 + i * 34 + rand() * 10, y = 70 + rand() * 30;
      const c = ['#f2b43a', '#2059a8', '#f4f4f4', '#2f9a6f', '#c22f2a'][i % 5];
      flags += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} V${(y + 40).toFixed(1)}" stroke="#333" stroke-width="1.2"/><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="16" height="10" fill="${c}"/>`;
    }
    return svgScene(grad('crowdSky', [[0, '#c4cfd7'], [1, '#e7e8e2']]),
      `<rect width="320" height="180" fill="url(#crowdSky)"/>
      <path d="M0 10 L110 70 L110 112 L0 112 Z" fill="#9d9a92"/>
      <path d="M320 10 L210 70 L210 112 L320 112 Z" fill="#8f8c84"/>
      <g fill="#7c7a73" opacity=".7">
        <path d="M12 28 l20 11 v12 l-20 -11z M48 48 l18 10 v10 l-18 -10z M80 64 l14 8 v8 l-14 -8z"/>
        <path d="M308 28 l-20 11 v12 l20 -11z M272 48 l-18 10 v10 l18 -10z M240 64 l-14 8 v8 l14 -8z"/>
      </g>
      <rect x="110" y="70" width="100" height="42" fill="#b7b4ab"/>
      ${flags}${heads}`);
  },

  shark() {
    return svgScene(
      grad('sharkSky', [[0, '#b8c8d0'], [1, '#e6e4dc']]) + grad('sharkWater', [[0, '#738d92'], [1, '#4a6267']]),
      `<rect width="320" height="180" fill="url(#sharkSky)"/>
      <rect y="78" width="320" height="10" fill="#7f9a6c"/>
      <rect y="86" width="320" height="94" fill="url(#sharkWater)"/>
      <rect y="62" width="320" height="7" fill="#585c5f"/>
      <rect y="58" width="320" height="4" fill="#6c7073"/>
      <g fill="#6c7073"><rect x="40" y="69" width="10" height="40"/><rect x="120" y="69" width="10" height="40"/><rect x="200" y="69" width="10" height="40"/><rect x="280" y="69" width="10" height="40"/></g>
      <g fill="#24363a" opacity=".35">
        <path d="M40 109 L50 109 L86 124 L76 124 Z"/><path d="M120 109 L130 109 L166 124 L156 124 Z"/>
        <path d="M200 109 L210 109 L246 124 L236 124 Z"/><path d="M280 109 L290 109 L326 124 L316 124 Z"/>
      </g>
      <path d="M158 140 L122 150 L176 150 Z" fill="#24363a" opacity=".35"/>
      <path d="M156 140 C164 120 172 112 184 104 C182 120 186 132 192 140 Z" fill="#3c474c"/>
      <g stroke="#e8f0f0" stroke-width="1.4" fill="none" opacity=".7">
        <ellipse cx="174" cy="141" rx="30" ry="4"/><ellipse cx="174" cy="143" rx="44" ry="6" opacity=".6"/>
      </g>`);
  },

  snow() {
    const rand = seeded(3);
    let flakes = '';
    for (let i = 0; i < 70; i++) flakes += `<circle cx="${(rand() * 320).toFixed(1)}" cy="${(rand() * 150).toFixed(1)}" r="${(0.6 + rand() * 1.4).toFixed(1)}" fill="#ffffff" opacity=".9"/>`;
    const house = (x, w, h) => `<g><rect x="${x}" y="${150 - h}" width="${w}" height="${h}" fill="#7a5233"/>
      <path d="M${x - 6} ${150 - h} L${x + w / 2} ${150 - h - w * 0.55} L${x + w + 6} ${150 - h} Z" fill="#f7f8fa"/>
      <rect x="${x + w * 0.3}" y="${150 - h * 0.65}" width="${w * 0.18}" height="${h * 0.3}" fill="#f2c96b"/></g>`;
    return svgScene(grad('snowSky', [[0, '#c3cfdc'], [1, '#efe6dc']]),
      `<rect width="320" height="180" fill="url(#snowSky)"/>
      <path d="M0 110 L60 40 L100 80 L150 24 L210 86 L250 50 L320 104 V180 H0 Z" fill="#8f9cab"/>
      <path d="M48 54 L60 40 L74 56 L66 52 L60 58 Z M136 40 L150 24 L166 42 L156 38 L148 46 Z M240 60 L250 50 L262 62 L254 58 Z" fill="#ffffff"/>
      <path d="M0 130 L80 84 L140 118 L200 92 L320 132 V180 H0 Z" fill="#647281"/>
      <path d="M70 90 L80 84 L92 91 Z M190 98 L200 92 L212 99 Z" fill="#ffffff"/>
      <rect y="146" width="320" height="34" fill="#f4f6f8"/>
      ${house(30, 40, 26)}${house(96, 34, 22)}${house(160, 46, 30)}${house(236, 36, 24)}
      ${flakes}`);
  },

  litter() {
    const rand = seeded(9);
    let junk = '';
    for (let i = 0; i < 70; i++) {
      const y = 100 + Math.pow(rand(), 0.7) * 78, x = rand() * 320, a = Math.round(rand() * 180);
      const kind = rand();
      if (kind < 0.4) junk += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="3.5" height="11" rx="1.2" fill="${rand() < 0.5 ? '#3f7a4a' : '#7a4f2a'}" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      else if (kind < 0.7) junk += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="4" height="6" rx="1" fill="#c9ced2" transform="rotate(${a} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
      else junk += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(5 + rand() * 6).toFixed(1)}" ry="${(3 + rand() * 3).toFixed(1)}" fill="${rand() < 0.6 ? '#f2f2ee' : '#d94b3d'}"/>`;
    }
    return svgScene(grad('litterSky', [[0, '#c3d1c7'], [1, '#e5e8dc']]),
      `<rect width="320" height="180" fill="url(#litterSky)"/>
      <g fill="#5e4a36"><rect x="34" y="40" width="8" height="64"/><rect x="150" y="30" width="9" height="72"/><rect x="262" y="44" width="8" height="60"/></g>
      <g fill="#6c8d5c"><circle cx="38" cy="38" r="30"/><circle cx="154" cy="28" r="36"/><circle cx="266" cy="40" r="28"/></g>
      <rect y="98" width="320" height="82" fill="#8eac69"/>
      <rect x="210" y="96" width="18" height="24" rx="2" fill="#4c5a52"/>
      <ellipse cx="219" cy="95" rx="13" ry="6" fill="#f2f2ee"/>
      ${junk}`);
  },

  tvbar(lang) {
    const tx = SCENE_TEXT[lang === 'en' ? 'en' : 'pl'].tv;
    return svgScene(grad('tvBg', [[0, '#21405e'], [1, '#0f1b2b']]) +
      `<radialGradient id="tvBokeh"><stop offset="0" stop-color="#8fb3d9" stop-opacity=".55"/><stop offset="1" stop-color="#8fb3d9" stop-opacity="0"/></radialGradient>`,
      `<rect width="320" height="180" fill="url(#tvBg)"/>
      <circle cx="60" cy="50" r="40" fill="url(#tvBokeh)"/><circle cx="270" cy="40" r="30" fill="url(#tvBokeh)"/><circle cx="130" cy="30" r="22" fill="url(#tvBokeh)"/>
      <path d="M170 132 Q172 104 208 98 Q244 104 246 132 Z" fill="#141a22"/>
      <rect x="203" y="92" width="10" height="9" fill="#c99d82"/>
      <ellipse cx="208" cy="80" rx="15" ry="18" fill="#d6aa8c"/>
      <path d="M193 76 Q196 58 210 60 Q226 60 224 78 Q218 66 206 68 Q198 68 193 76 Z" fill="#3a2a22"/>
      <rect x="120" y="120" width="200" height="12" fill="#2c3e52"/>
      <rect x="14" y="12" width="50" height="16" rx="2" fill="#f4f4f4"/>
      <text x="19" y="24" ${SCENE_FONT} font-size="10" font-weight="900" fill="#0f1b2b">INFO 24</text>
      <rect y="132" width="320" height="24" fill="#c22f2a"/>
      <rect y="132" width="56" height="24" fill="#f2b43a"/>
      <text x="8" y="149" ${SCENE_FONT} font-size="${tx.labelSize}" font-weight="900" fill="#111">${tx.label}</text>
      <text x="62" y="148.5" ${SCENE_FONT} font-size="10.5" font-weight="800" fill="#ffffff">${tx.headline}</text>
      <rect y="156" width="320" height="14" fill="#0b1320"/>
      <text x="8" y="166" ${SCENE_FONT} font-size="7.5" fill="#9fb0c2">${tx.ticker}</text>
      <rect x="276" y="156" width="44" height="14" fill="#c22f2a"/>
      <text x="284" y="166" ${SCENE_FONT} font-size="8" font-weight="700" fill="#ffffff">12:41</text>`);
  },

  gamepad() {
    return svgScene(grad('padRoom', [[0, '#1d2230'], [1, '#2b2a2c']]) + grad('padScreen', [[0, '#3f8fc4'], [1, '#6e5bc4']], true),
      `<rect width="320" height="180" fill="url(#padRoom)"/>
      <rect x="60" y="10" width="200" height="94" rx="4" fill="#111"/>
      <rect x="66" y="16" width="188" height="82" fill="url(#padScreen)"/>
      <path d="M66 80 L110 54 L140 70 L180 40 L254 76 L254 98 L66 98 Z" fill="#2c2f5c" opacity=".7"/>
      <rect x="150" y="104" width="20" height="14" fill="#151515"/>
      <rect y="118" width="320" height="62" fill="#3b3531"/>
      <path d="M112 128 Q114 114 136 114 L184 114 Q206 114 208 128 L218 156 Q221 170 207 170 Q196 170 190 158 L130 158 Q124 170 113 170 Q99 170 102 156 Z" fill="#26292f"/>
      <path d="M128 128 h6 v-6 h6 v6 h6 v6 h-6 v6 h-6 v-6 h-6 Z" fill="#9097a1"/>
      <circle cx="186" cy="124" r="3.4" fill="#2f9a6f"/><circle cx="194" cy="131" r="3.4" fill="#c22f2a"/><circle cx="178" cy="131" r="3.4" fill="#2059a8"/><circle cx="186" cy="138" r="3.4" fill="#f2b43a"/>
      <circle cx="146" cy="146" r="7" fill="#15171b"/><circle cx="174" cy="146" r="7" fill="#15171b"/>`);
  },

  police() {
    const rand = seeded(17);
    let windows = '';
    for (let i = 0; i < 26; i++) windows += `<rect x="${(rand() * 300 + 8).toFixed(0)}" y="${(30 + rand() * 70).toFixed(0)}" width="5" height="6" fill="#e9c66a" opacity="${(0.4 + rand() * 0.6).toFixed(2)}"/>`;
    return svgScene(grad('policeSky', [[0, '#0d1523'], [1, '#1f2c40']]) +
      `<radialGradient id="policeBlue"><stop offset="0" stop-color="#4a8cff" stop-opacity=".75"/><stop offset="1" stop-color="#4a8cff" stop-opacity="0"/></radialGradient>
       <radialGradient id="policeLamp"><stop offset="0" stop-color="#f2d58a" stop-opacity=".45"/><stop offset="1" stop-color="#f2d58a" stop-opacity="0"/></radialGradient>`,
      `<rect width="320" height="180" fill="url(#policeSky)"/>
      <path d="M0 110 V40 H40 V60 H70 V24 H110 V70 H150 V44 H200 V64 H240 V30 H280 V58 H320 V110 Z" fill="#0a0f18"/>
      ${windows}
      <rect y="110" width="320" height="70" fill="#20262e"/>
      <path d="M54 32 L30 140 L90 140 Z" fill="#f2d58a" opacity=".12"/>
      <ellipse cx="60" cy="142" rx="44" ry="8" fill="url(#policeLamp)"/>
      <rect x="57" y="30" width="4" height="112" fill="#3a4049"/><rect x="50" y="28" width="16" height="5" rx="2" fill="#c8ccd1"/>
      <circle cx="200" cy="104" r="44" fill="url(#policeBlue)"/>
      <path d="M140 140 Q142 124 160 122 L180 110 Q196 104 222 106 Q244 108 254 122 Q270 124 272 140 Z" fill="#dfe3e8"/>
      <path d="M184 114 L196 108 L222 108 L240 120 L184 120 Z" fill="#26313d"/>
      <rect x="140" y="128" width="132" height="6" fill="#2059a8"/>
      <rect x="196" y="100" width="12" height="5" rx="1" fill="#4a8cff"/><rect x="208" y="100" width="12" height="5" rx="1" fill="#c22f2a"/>
      <circle cx="166" cy="142" r="9" fill="#111"/><circle cx="246" cy="142" r="9" fill="#111"/>
      <g stroke="#4a8cff" stroke-width="1.2" opacity=".35"><path d="M150 156 H270 M160 164 H260"/></g>`);
  }
};

function quoteCard(bg, ring, glasses) {
  return svgScene('',
    `<rect width="320" height="180" fill="${bg}"/>
    <circle cx="78" cy="92" r="56" fill="${ring}"/>
    <path d="M36 148 Q40 110 78 106 Q116 110 120 148 Z" fill="#2a2a2e"/>
    <rect x="71" y="96" width="14" height="14" fill="#d5a98c"/>
    <ellipse cx="78" cy="78" rx="21" ry="25" fill="#e0b597"/>
    <path d="M57 70 Q60 48 80 50 Q100 52 99 72 Q92 60 78 62 Q64 62 57 70 Z" fill="${glasses ? '#d9d9d6' : '#4a3a30'}"/>
    ${glasses ? '<g stroke="#2a2a2e" stroke-width="2" fill="none"><circle cx="70" cy="80" r="6"/><circle cx="87" cy="80" r="6"/><path d="M76 80 H81"/></g>' : ''}
    <text x="148" y="78" ${SCENE_FONT} font-size="64" font-weight="900" fill="#ffffff" opacity=".9">“</text>
    <g fill="#ffffff"><rect x="150" y="84" width="140" height="7" rx="2"/><rect x="150" y="98" width="124" height="7" rx="2"/><rect x="150" y="112" width="132" height="7" rx="2"/><rect x="150" y="126" width="84" height="7" rx="2"/></g>
    <rect x="150" y="144" width="70" height="4" rx="2" fill="#ffffff" opacity=".6"/>`);
}

if (typeof module !== 'undefined') module.exports = { SCENES };
