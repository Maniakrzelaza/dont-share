// Dźwięki gry syntezowane Web Audio API — bez plików, bez licencji na nagrania.
// Kontekst audio powstaje przy pierwszym dźwięku, a ten zawsze wynika z kliknięcia albo klawisza,
// więc przeglądarka nie blokuje go jako autoodtwarzania. Bez Web Audio gra działa po cichu.

const Sound = (() => {
  let ctx = null, noise = null;
  let enabled = true;
  try { enabled = localStorage.getItem('ds-sound') !== 'off'; } catch (e) { /* zablokowany storage */ }

  function audio() {
    if (!enabled) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      // Sekunda białego szumu, z której robione są stuknięcia, szelest i uderzenia.
      noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Obwiednia: szybkie wejście, wykładnicze wygaszenie.
  function env(a, at, peak, dur) {
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    g.connect(a.destination);
    return g;
  }

  function burst(a, at, dur, peak, type, freq, q = 1) {
    const src = a.createBufferSource();
    src.buffer = noise;
    const f = a.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    src.connect(f).connect(env(a, at, peak, dur));
    src.start(at, Math.random() * 0.5, dur + 0.05);
  }

  function tone(a, at, dur, peak, freq, type = 'sine', endFreq) {
    const o = a.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
    o.connect(env(a, at, peak, dur));
    o.start(at); o.stop(at + dur + 0.05);
  }

  const play = fn => () => { const a = audio(); if (a) fn(a, a.currentTime); };

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem('ds-sound', enabled ? 'on' : 'off'); } catch (e) { /* zablokowany storage */ }
      if (enabled) this.click();
      return enabled;
    },

    // Pieczątka: głuche uderzenie gumy o papier i trzask drewnianej rączki.
    stamp: play((a, t) => {
      tone(a, t, 0.18, 0.7, 120, 'sine', 45);
      burst(a, t, 0.12, 0.6, 'lowpass', 900);
      burst(a, t, 0.03, 0.25, 'highpass', 3000);
    }),

    good: play((a, t) => {
      tone(a, t, 0.25, 0.18, 659);
      tone(a, t + 0.11, 0.4, 0.18, 988);
    }),

    bad: play((a, t) => {
      tone(a, t, 0.35, 0.12, 110, 'square');
      tone(a, t, 0.35, 0.08, 116, 'square');
    }),

    // Dalekopis wybija wynik narzędzia: seria nierównych stuknięć.
    teleprinter: play((a, t) => {
      let at = t;
      for (let i = 0; i < 12; i++) {
        burst(a, at, 0.025, 0.22, 'bandpass', 2400 + Math.random() * 1600, 4);
        at += 0.035 + Math.random() * 0.035;
      }
      tone(a, at + 0.02, 0.06, 0.08, 1760);
    }),

    pin: play((a, t) => burst(a, t, 0.04, 0.3, 'bandpass', 1800, 3)),

    click: play((a, t) => burst(a, t, 0.02, 0.15, 'highpass', 2500)),

    tick: play((a, t) => burst(a, t, 0.015, 0.12, 'bandpass', 4200, 8)),

    bell: play((a, t) => {
      tone(a, t, 1.4, 0.2, 880);
      tone(a, t, 1.1, 0.08, 1760);
    }),

    // Szelest rozkładanej gazety.
    paper: play((a, t) => {
      burst(a, t, 0.25, 0.18, 'bandpass', 3200, 0.8);
      burst(a, t + 0.18, 0.3, 0.14, 'bandpass', 2400, 0.8);
    }),

    // Telefon w redakcji: dwa dzwonki, ton 440+480 Hz jak w starych aparatach.
    phone: play((a, t) => {
      [0, 0.6].forEach(off => {
        for (let i = 0; i < 8; i++) {
          const at = t + 0.35 + off + i * 0.05;
          tone(a, at, 0.04, 0.07, 440);
          tone(a, at, 0.04, 0.07, 480);
        }
      });
    })
  };
})();
