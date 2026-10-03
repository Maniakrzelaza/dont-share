// Teksty interfejsu w obu językach. Wpis jest napisem albo funkcją, gdy wstawia liczby lub nazwy.
// Klucze muszą być w obu językach te same — pilnuje tego test w web/test/.

const LANGS = ['pl', 'en'];

const plPlural = (n, one, few, many) =>
  n === 1 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

const UI = {
  pl: {
    htmlTitle: 'Don’t Share — gra o fake newsach',
    langSwitch: 'English', langSwitchLabel: 'Switch to English',
    soundOn: '♪ Dźwięk wł.', soundOff: '♪ Dźwięk wył.', soundLabel: 'Dźwięk',
    tools: {
      zrodlo:   { name: 'Rejestr źródeł',       desc: 'Kto to opublikował i od kiedy działa' },
      data:     { name: 'Archiwum dat',         desc: 'Kiedy treść pojawiła się po raz pierwszy' },
      obraz:    { name: 'Wyszukiwanie obrazem', desc: 'Skąd naprawdę pochodzi zdjęcie' },
      dokument: { name: 'Dokument źródłowy',    desc: 'Pełny cytat, badanie albo raport' }
    },
    verdict: { prawda: 'Prawda', falsz: 'Fałsz', manipulacja: 'Manipulacja' },
    verdictKey: { prawda: 'p', falsz: 'f', manipulacja: 'm' },
    days: [
      { date: 'Poniedziałek, 5 października 2026', memo: 'Pierwszy dzień. Masz dwa narzędzia: rejestr źródeł i archiwum dat. Pięć zgłoszeń od czytelników czeka w kolejce.' },
      { date: 'Wtorek, 6 października 2026', memo: 'Dział IT podłączył wyszukiwarkę obrazów. Dziś dużo zgłoszeń ze zdjęciami. Zegar biegnie szybciej, bo dzień jest gorący.' },
      { date: 'Środa, 7 października 2026', memo: 'Dostajesz dostęp do bazy dokumentów: zapisów wywiadów, badań i raportów. Ostatni dzień okresu próbnego. Pokaż, co umiesz.' }
    ],
    cheat: [
      'Czytaj adres strony litera po literze. Podróbki różnią się końcówką albo myślnikiem.',
      'Sprawdzaj, kto stoi za kontem lub stroną i od kiedy działa.',
      'Patrz na datę publikacji, nie na datę udostępnienia.',
      'Wyszukaj zdjęcie obrazem. Stare fotografie często wracają w nowym kontekście.',
      'Szukaj błędów AI i fotomontażu w szczegółach: dłonie, odbicia, cienie.',
      'Czytaj pełny cytat i pracę źródłową, a nie tylko nagłówek. Pytaj: ile osób, z ilu, kto?',
      'Silne emocje, pośpiech i „udostępnij, zanim usuną” to sygnały ostrzegawcze.',
      'Dobra, nudna albo nietypowa wiadomość też może być prawdziwa. Weryfikuj, zanim odrzucisz.'
    ],

    introHdr: 'OD: Redaktor naczelna<br>DO: Nowa osoba w dziale weryfikacji<br>TEMAT: Twój okres próbny, 3 dni',
    introLead: 'Czytelnicy przysyłają nam podejrzane wiadomości. Twoja praca: sprawdzić każdą i przybić jedną z trzech pieczątek, zanim fałszywka obiegnie kraj.',
    verdictDef: {
      prawda: 'Informacja zgadza się z faktami i ma wiarygodne źródło.',
      falsz: 'Informacja zmyślona, satyra wzięta na serio albo oszustwo.',
      manipulacja: 'Prawdziwy materiał w fałszywym kontekście: stare zdjęcie, ucięty cytat, przekręcone badanie.'
    },
    rules: (cost, ptsV, ptsE) => [
      `Pracujesz od 8:00 do 16:00. Każde użycie narzędzia zajmuje ${cost} minut.`,
      'Wyniki narzędzi trafiają do teczki. Sam oceniasz, co znaczą, i wskazujesz kartkę, która przesądza sprawę.',
      `Trafny werdykt: +${ptsV} pkt. Trafnie wskazany kluczowy dowód: dodatkowe +${ptsE} pkt.`,
      'Błędny werdykt obniża zaufanie czytelników o 20, niesprawdzone zgłoszenie o 10. Przy zerze tracisz pracę.'
    ],
    shortcuts: (k) => `Skróty: ${k} wskazanie kartki.`,
    shortcutVerdict: (key, name) => `${key} ${name.toLowerCase()},`,
    introGo: 'Zaczynam pierwszy dzień',

    dayHdr: (n, of, date, queue, trust) => `DZIEŃ ${n} Z ${of} · ${date}<br>Zgłoszeń w kolejce: ${queue} · Zaufanie czytelników: ${trust}%`,
    dayGreetFirst: 'Witaj w redakcji.',
    dayGreet: 'Dzień dobry. Kawa stoi na biurku.',
    newTool: 'Nowe narzędzie',
    dayGo: 'Otwórz kolejkę',

    pressTitle: 'Przegląd prasy',
    pressEdition: date => `${date} · wydanie poranne`,
    pressFinalDate: 'Czwartek, 8 października 2026',
    pressOutlets: ['Gazeta Nadwiślańska', 'Echo Regionu', 'Radio Wschód', 'Łódź na Bieżąco'],
    pressTag: { passed: 'Przeszło z naszą pieczątką', missed: 'Nikt tego nie sprawdził', rejected: 'Odrzuciliśmy prawdę' },
    pressQuiet: 'Spokojny poranek. Żadna z wczorajszych spraw nie wróciła do nas rykoszetem.',
    chiefNote: n => n === 0 ? 'Czysto. Ani jedna wczorajsza decyzja nie wróciła w prasie.' : n <= 2 ? 'Wczorajsze błędy już krążą po sieci. Dziś uważniej.' : 'Telefon dzwoni od rana. Jeszcze jeden taki dzień i rozmawiamy o twoim etacie.',
    finalPressTitle: 'Ostatnie wydanie po twojej zmianie',

    brandDay: (n, date) => `Dzień ${n} · ${date}`,
    lblClock: 'Godzina', lblQueue: 'Kolejka', lblScore: 'Punkty', lblTrust: t => `Zaufanie ${t}%`,
    restart: 'Od nowa', restartConfirm: 'Na pewno?',
    lblCase: 'Zgłoszenie', from: who => `od: ${who}`,
    ticketNo: 'NR', received: time => `wpłynęło ${time}`,
    stampKey: k => `klawisz ${k}`,
    lblTools: 'Narzędzia', minutesLeft: m => `zostało ${m} min`,
    toolLocked: d => `od dnia ${d}`, toolDone: 'sprawdzone', toolCost: c => `−${c} min`,
    lblFolder: 'Teczka dowodów', evidenceCount: n => `${n} ${plPlural(n, 'dowód', 'dowody', 'dowodów')}`,
    pinHint: p => `Kliknij kartkę, która przesądza o werdykcie. Trafny wybór: +${p} pkt.`,
    folderEmpty: 'Teczka jest pusta. Użyj narzędzi, żeby zebrać dowody, zanim przybijesz pieczątkę.',
    pinned: '★ kluczowy dowód', pinMe: 'wskaż jako kluczowy',

    reachLbl: 'W obiegu', reachPeople: n => `${n} osób`,
    reachStopped: n => `Zatrzymane przy ${n} osobach.`,
    reachBoosted: n => `Z naszą pieczątką „prawda” dotrze do ok. ${n} osób.`,
    reachTrue: n => `Prawdziwa informacja idzie dalej: ${n} osób i rośnie.`,
    reachRejected: n => `Prawdziwa informacja zatrzymana przy ${n} osobach.`,
    reachClip: n => `Zasięg: ${n} osób`,
    tSpread: 'osób zobaczyło przepuszczone fałszywki',

    shareTitle: 'Twój wynik', shareIrony: 'Tę jedną rzecz możesz udostępnić bez sprawdzania.',
    shareCopy: 'Kopiuj wynik', shareCopied: 'Skopiowano', shareNative: 'Udostępnij',
    shareCopyFail: 'Zaznaczyłem wynik. Skopiuj go skrótem Ctrl+C.',
    shareHead: (ok, total, score) => `Don’t Share · ${ok}/${total} · ${score} pkt`,
    shareDay: n => `Dzień ${n}`,
    shareSpread: n => n ? `📣 Przepuszczone fałszywki zobaczyło ${n} osób` : '🛡️ Żadna fałszywka nie przeszła',

    coachWho: 'Naczelna',
    coachTools: 'Zacznij od narzędzi. Kliknij „Rejestr źródeł”, żeby sprawdzić, kto to opublikował. Licznik nad zgłoszeniem pokazuje, ilu ludzi już to widziało, i rośnie z każdą minutą. Zegar stoi, dopóki nie przybijesz pierwszej pieczątki.',
    coachRead: 'Wynik trafił do teczki. Przeczytaj go. Możesz sprawdzić jeszcze datę albo kliknąć kartkę, która twoim zdaniem przesądza sprawę.',
    coachStamp: 'Teraz pieczątka. Prawda, fałsz czy manipulacja? Po werdykcie zobaczysz, co przesądzało.',
    coachSkip: 'Pomiń samouczek',

    modeDaily: n => `Wyzwanie dnia #${n}`,
    modeDailySub: 'Wszyscy grają dziś te same zgłoszenia. Porównaj wynik ze znajomymi.',
    modeRandom: 'Losowa zmiana', modeRandomSub: 'Za każdym razem inne zgłoszenia.',
    dailyPlayed: p => `Twój dzisiejszy wynik: ${p} pkt. Możesz zagrać jeszcze raz.`,
    shareHeadDaily: (n, ok, total, score) => `Don’t Share #${n} · ${ok}/${total} · ${score} pkt`,

    zoomOpen: '⌕ Powiększ', zoomTitle: 'Lupa',
    zoomHelp: 'Wodź lupą po zdjęciu. Kliknij miejsce, które wydaje ci się podejrzane. Zegar tyka dalej.',
    zoomClose: 'Wróć do biurka', zoomFound: x => `Wypatrzone: ${x} Trafiło do teczki.`,
    zoomMiss: 'W tym miejscu nic nie budzi podejrzeń.', zoomAlready: 'To już jest w teczce.',
    eyeName: 'Twoje oko', clueLbl: 'Do wypatrzenia na zdjęciu:', clueFound: 'wypatrzone', clueMissed: 'przeoczone',

    profileTitle: 'Twój profil weryfikatora', profileWeak: 'Tu było najtrudniej', profileStrong: 'Tu nie dajesz się nabrać',
    profileClean: 'Żaden rodzaj fałszywki cię nie zmylił.', profileCount: (f, n) => `${f} z ${n}`,
    types: {
      impostor: { name: 'Podszywanie się i wyłudzenia', tip: 'Sprawdzaj adres i nazwę konta znak po znaku. Nikt uczciwy nie prosi o dane karty w poście.' },
      emotion: { name: 'Cudowne kuracje i sensacje', tip: 'Im mocniej tekst gra na emocjach, tym spokojniej go sprawdzaj. Szukaj autora i drugiego źródła.' },
      oldNews: { name: 'Stare wiadomości podane jako nowe', tip: 'Patrz na datę publikacji oryginału, nie na datę udostępnienia.' },
      photoContext: { name: 'Zdjęcia z innego miejsca i czasu', tip: 'Wyszukaj zdjęcie obrazem, zanim uwierzysz w podpis.' },
      fabricated: { name: 'Obrazy z AI, fotomontaże i fałszywe zrzuty', tip: 'Powiększaj i szukaj błędów: odbicia, cienie, dłonie, napisy. Sprawdź, czy materiał jest u samego źródła.' },
      satire: { name: 'Satyra wzięta na serio', tip: 'Zanim się oburzysz, sprawdź, czym jest strona źródłowa.' },
      quote: { name: 'Ucięte i zmyślone cytaty', tip: 'Szukaj pełnej wypowiedzi i sprawdź, czy autor cytatu w ogóle istnieje.' },
      stats: { name: 'Przekręcone badania i liczby', tip: 'Pytaj: ile osób, z ilu, kto badał. Procent z małej liczby niewiele znaczy.' },
      real: { name: 'Prawdziwe, choć zaskakujące wiadomości', tip: 'Nie każda dobra, nudna czy nietypowa wiadomość jest fałszywa. Weryfikuj, zanim odrzucisz.' }
    },
    photoCredit: 'FOT.:', shares: s => `↻ ${s} udostępnień`, reported: 'Zgłoszono jako podejrzane',

    resGood: 'Trafnie i z dowodem.', resVerdict: 'Trafny werdykt.', resBad: 'Błędny werdykt.',
    ptsGood: (p, t) => `+${p} pkt · zaufanie +${t}`,
    ptsBad: (t, v) => `0 pkt · zaufanie ${t} · poprawnie: ${v}`,
    pinWas: (tool, good) => `Twój kluczowy dowód: ${tool} — ${good ? '<b class="good">przesądzał</b>' : '<b class="bad">nie przesądzał</b>'}.`,
    pinNone: p => `Nie wskazano kluczowego dowodu. Do wzięcia było +${p} pkt.`,
    decisiveLbl: 'Dowody, które przesądzały:', laterTool: ' (dostępny później)',
    btnFired: 'Odbierz wypowiedzenie', btnCloseDay: 'Zamknij dzień', btnNext: 'Następne zgłoszenie',

    dayEndHdr: (n, date) => `KONIEC DNIA ${n} · ${date}`,
    dayEndClean: 'Czysta robota. Ani jedna fałszywka nie przeszła.',
    dayEndOk: 'Niezły dzień, ale kilka rzeczy umknęło.',
    dayEndBad: 'Ciężki dzień. Jutro sprawdzaj dokładniej.',
    tCorrect: 'trafne werdykty', tEvidence: 'trafnie wskazane dowody', tWrong: 'błędne werdykty', tMissed: 'niesprawdzone', tTrust: 'zaufanie czytelników',
    btnFinal: 'Zobacz ocenę okresu próbnego', btnHome: 'Idź do domu, wróć jutro',

    endHdr: 'OD: Redaktor naczelna<br>TEMAT: Ocena okresu próbnego',
    rank: { fired: 'Zwolnienie dyscyplinarne', senior: 'Starszy weryfikator', staff: 'Weryfikator na etacie', extended: 'Przedłużony okres próbny', retrain: 'Do ponownego szkolenia' },
    endFired: 'Czytelnicy przestali nam ufać. Zbyt wiele fałszywek przeszło z naszą pieczątką.',
    endSummary: (ok, total, ev, score) => `Rozpatrzone trafnie: ${ok} z ${total} zgłoszeń, w tym ${ev} z trafnie wskazanym dowodem. Wynik: ${score} pkt.`,
    eCorrect: 'trafne', eEvidence: 'z dowodem', eWrong: 'błędne', eMissed: 'niesprawdzone', eScore: 'punkty',
    cheatTitle: 'Ściąga weryfikatora', btnAgain: 'Zagraj od nowa', againHint: 'Każda rozgrywka losuje inne zgłoszenia.'
  },

  en: {
    htmlTitle: 'Don’t Share — a game about fake news',
    langSwitch: 'Polski', langSwitchLabel: 'Przełącz na polski',
    soundOn: '♪ Sound on', soundOff: '♪ Sound off', soundLabel: 'Sound',
    tools: {
      zrodlo:   { name: 'Source registry',      desc: 'Who published it and how long they have been around' },
      data:     { name: 'Date archive',         desc: 'When the content first appeared' },
      obraz:    { name: 'Reverse image search', desc: 'Where the photo really comes from' },
      dokument: { name: 'Source document',      desc: 'The full quote, study or report' }
    },
    verdict: { prawda: 'True', falsz: 'False', manipulacja: 'Misleading' },
    verdictKey: { prawda: 't', falsz: 'f', manipulacja: 'm' },
    days: [
      { date: 'Monday, 5 October 2026', memo: 'Day one. You have two tools: the source registry and the date archive. Five reports from readers are waiting in the queue.' },
      { date: 'Tuesday, 6 October 2026', memo: 'IT has hooked up a reverse image search. Lots of reports with photos today. The clock runs faster — it’s a busy day.' },
      { date: 'Wednesday, 7 October 2026', memo: 'You now have access to the document database: interview transcripts, studies and reports. Last day of your probation. Show us what you can do.' }
    ],
    cheat: [
      'Read the web address letter by letter. Fakes differ by an ending or a hyphen.',
      'Check who is behind an account or site, and how long it has existed.',
      'Look at the publication date, not the date it was shared.',
      'Run a reverse image search. Old photos often come back in a new context.',
      'Look for AI and photomontage errors in the details: hands, reflections, shadows.',
      'Read the full quote and the original study, not just the headline. Ask: how many people, out of how many, who?',
      'Strong emotions, urgency and “share before they delete it” are red flags.',
      'Good, boring or unusual news can be true too. Verify before you dismiss.'
    ],

    introHdr: 'FROM: Editor-in-chief<br>TO: New fact-checker<br>RE: Your probation, 3 days',
    introLead: 'Readers send us suspicious stories. Your job: check each one and bring down one of three stamps before a fake spreads across the country.',
    verdictDef: {
      prawda: 'The story matches the facts and has a reliable source.',
      falsz: 'Made up, satire taken seriously, or a scam.',
      manipulacja: 'Real material in a false context: an old photo, a cut quote, a twisted study.'
    },
    rules: (cost, ptsV, ptsE) => [
      `You work from 8:00 to 16:00. Each tool takes ${cost} minutes.`,
      'Tool results go into the evidence folder. You judge what they mean and mark the slip that decides the case.',
      `Correct verdict: +${ptsV} pts. Correct key evidence: an extra +${ptsE} pts.`,
      'A wrong verdict costs 20 points of reader trust, an unchecked report 10. At zero, you’re out.'
    ],
    shortcuts: (k) => `Shortcuts: ${k} to mark a slip.`,
    shortcutVerdict: (key, name) => `${key} ${name.toLowerCase()},`,
    introGo: 'Start day one',

    dayHdr: (n, of, date, queue, trust) => `DAY ${n} OF ${of} · ${date}<br>Reports in the queue: ${queue} · Reader trust: ${trust}%`,
    dayGreetFirst: 'Welcome to the newsroom.',
    dayGreet: 'Good morning. Your coffee is on the desk.',
    newTool: 'New tool',
    dayGo: 'Open the queue',

    pressTitle: 'Morning papers',
    pressEdition: date => `${date} · morning edition`,
    pressFinalDate: 'Thursday, 8 October 2026',
    pressOutlets: ['Gazeta Nadwiślańska', 'Echo Regionu', 'Radio Wschód', 'Łódź na Bieżąco'],
    pressTag: { passed: 'Went out with our stamp', missed: 'Nobody checked it', rejected: 'We rejected the truth' },
    pressQuiet: 'A quiet morning. None of yesterday’s cases came back to bite us.',
    chiefNote: n => n === 0 ? 'Clean. Not one of yesterday’s calls came back in the papers.' : n <= 2 ? 'Yesterday’s mistakes are already doing the rounds. Be more careful today.' : 'The phone hasn’t stopped ringing. One more day like that and we talk about your job.',
    finalPressTitle: 'The papers after your last shift',

    brandDay: (n, date) => `Day ${n} · ${date}`,
    lblClock: 'Time', lblQueue: 'Queue', lblScore: 'Score', lblTrust: t => `Trust ${t}%`,
    restart: 'Restart', restartConfirm: 'Sure?',
    lblCase: 'Report', from: who => `from: ${who}`,
    ticketNo: 'NO', received: time => `received ${time}`,
    stampKey: k => `key ${k}`,
    lblTools: 'Tools', minutesLeft: m => `${m} min left`,
    toolLocked: d => `from day ${d}`, toolDone: 'checked', toolCost: c => `−${c} min`,
    lblFolder: 'Evidence folder', evidenceCount: n => `${n} ${n === 1 ? 'slip' : 'slips'}`,
    pinHint: p => `Click the slip that decides the verdict. The right choice: +${p} pts.`,
    folderEmpty: 'The folder is empty. Use the tools to gather evidence before you stamp.',
    pinned: '★ key evidence', pinMe: 'mark as key',

    reachLbl: 'In circulation', reachPeople: n => `${n} people`,
    reachStopped: n => `Stopped after reaching ${n} people.`,
    reachBoosted: n => `With our “true” stamp it will reach about ${n} people.`,
    reachTrue: n => `The true story keeps going: ${n} people and counting.`,
    reachRejected: n => `A true story stopped at ${n} people.`,
    reachClip: n => `Reach: ${n} people`,
    tSpread: 'people saw fakes that got through',

    shareTitle: 'Your result', shareIrony: 'This is the one thing you can share without checking.',
    shareCopy: 'Copy result', shareCopied: 'Copied', shareNative: 'Share',
    shareCopyFail: 'The result is selected. Copy it with Ctrl+C.',
    shareHead: (ok, total, score) => `Don’t Share · ${ok}/${total} · ${score} pts`,
    shareDay: n => `Day ${n}`,
    shareSpread: n => n ? `📣 ${n} people saw fakes I let through` : '🛡️ Not a single fake got through',

    coachWho: 'Editor',
    coachTools: 'Start with the tools. Click “Source registry” to see who published this. The counter above the report shows how many people have seen it already — it grows every minute. The clock stays still until your first stamp.',
    coachRead: 'The result is in your folder. Read it. You can also check the date, or click the slip you think decides the case.',
    coachStamp: 'Now the stamp. True, false or misleading? After the verdict you’ll see what decided it.',
    coachSkip: 'Skip tutorial',

    modeDaily: n => `Daily challenge #${n}`,
    modeDailySub: 'Everyone plays the same reports today. Compare your score with friends.',
    modeRandom: 'Random shift', modeRandomSub: 'Different reports every time.',
    dailyPlayed: p => `Your score today: ${p} pts. You can play again.`,
    shareHeadDaily: (n, ok, total, score) => `Don’t Share #${n} · ${ok}/${total} · ${score} pts`,

    zoomOpen: '⌕ Zoom', zoomTitle: 'Magnifier',
    zoomHelp: 'Move the magnifier over the photo. Click anything that looks suspicious. The clock keeps running.',
    zoomClose: 'Back to the desk', zoomFound: x => `Spotted: ${x} Added to your folder.`,
    zoomMiss: 'Nothing suspicious here.', zoomAlready: 'That’s already in your folder.',
    eyeName: 'Your eye', clueLbl: 'To spot in the photo:', clueFound: 'spotted', clueMissed: 'missed',

    profileTitle: 'Your fact-checker profile', profileWeak: 'Where it was hardest', profileStrong: 'Where you don’t get fooled',
    profileClean: 'No kind of fake fooled you.', profileCount: (f, n) => `${f} of ${n}`,
    types: {
      impostor: { name: 'Impostors and scams', tip: 'Check the address and account name character by character. No honest sender asks for card details in a post.' },
      emotion: { name: 'Miracle cures and sensations', tip: 'The harder a story pulls at your emotions, the calmer you should check it. Look for an author and a second source.' },
      oldNews: { name: 'Old news passed off as new', tip: 'Look at the original publication date, not the date it was shared.' },
      photoContext: { name: 'Photos from another place and time', tip: 'Run a reverse image search before you believe the caption.' },
      fabricated: { name: 'AI images, photomontages and fake screenshots', tip: 'Zoom in and look for errors: reflections, shadows, hands, lettering. Check whether the source itself has the material.' },
      satire: { name: 'Satire taken seriously', tip: 'Before you get outraged, check what the source site is.' },
      quote: { name: 'Cut and invented quotes', tip: 'Find the full statement and check that the person quoted actually exists.' },
      stats: { name: 'Twisted studies and numbers', tip: 'Ask: how many people, out of how many, who did the study. A percentage of a small number means little.' },
      real: { name: 'True but surprising news', tip: 'Not every good, boring or unusual story is fake. Verify before you dismiss.' }
    },
    photoCredit: 'PHOTO:', shares: s => `↻ ${s} shares`, reported: 'Reported as suspicious',

    resGood: 'Correct, with evidence.', resVerdict: 'Correct verdict.', resBad: 'Wrong verdict.',
    ptsGood: (p, t) => `+${p} pts · trust +${t}`,
    ptsBad: (t, v) => `0 pts · trust ${t} · correct answer: ${v}`,
    pinWas: (tool, good) => `Your key evidence: ${tool} — ${good ? '<b class="good">decisive</b>' : '<b class="bad">not decisive</b>'}.`,
    pinNone: p => `No key evidence marked. +${p} pts were on the table.`,
    decisiveLbl: 'The evidence that decided it:', laterTool: ' (available later)',
    btnFired: 'Collect your notice', btnCloseDay: 'Close the day', btnNext: 'Next report',

    dayEndHdr: (n, date) => `END OF DAY ${n} · ${date}`,
    dayEndClean: 'Clean work. Not a single fake got through.',
    dayEndOk: 'A decent day, but a few things slipped past.',
    dayEndBad: 'A rough day. Check more carefully tomorrow.',
    tCorrect: 'correct verdicts', tEvidence: 'key evidence right', tWrong: 'wrong verdicts', tMissed: 'unchecked', tTrust: 'reader trust',
    btnFinal: 'See your probation review', btnHome: 'Go home, come back tomorrow',

    endHdr: 'FROM: Editor-in-chief<br>RE: Probation review',
    rank: { fired: 'Dismissed', senior: 'Senior fact-checker', staff: 'Staff fact-checker', extended: 'Probation extended', retrain: 'Back to training' },
    endFired: 'Readers stopped trusting us. Too many fakes went out with our stamp on them.',
    endSummary: (ok, total, ev, score) => `Correctly decided: ${ok} of ${total} reports, ${ev} of them with the right key evidence. Score: ${score} pts.`,
    eCorrect: 'correct', eEvidence: 'with evidence', eWrong: 'wrong', eMissed: 'unchecked', eScore: 'score',
    cheatTitle: 'Fact-checker’s cheat sheet', btnAgain: 'Play again', againHint: 'Every run draws different reports.'
  }
};

// Język: ?lang=en w adresie (do linkowania), potem ostatni wybór, potem język przeglądarki.
function initialLang() {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (LANGS.includes(q)) return q;
  } catch (e) { /* brak location poza przeglądarką */ }
  try {
    const saved = localStorage.getItem('ds-lang');
    if (LANGS.includes(saved)) return saved;
  } catch (e) { /* zablokowany storage */ }
  const nav = (typeof navigator !== 'undefined' && navigator.language) || 'pl';
  return nav.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

if (typeof module !== 'undefined') module.exports = { LANGS, UI };
