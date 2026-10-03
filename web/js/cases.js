// Treść gry: narzędzia, dni i pula zgłoszeń, z której każda rozgrywka losuje swój zestaw.
//
// Każde zgłoszenie ma poziom (tier) równy numerowi dnia, w którym gracz dostaje narzędzie
// potrzebne do jego rozstrzygnięcia: 1 — rejestr źródeł i archiwum dat, 2 — wyszukiwanie obrazem,
// 3 — dokument źródłowy. Dowody (ev) mają flagę: 'ok' potwierdza prawdę, 'red' zdradza fałszywkę
// lub manipulację, 'info' to tło bez rozstrzygnięcia. Flagi nie są pokazywane graczowi — służą do
// oceny, czy wskazany przez niego kluczowy dowód rzeczywiście przesądzał. fallout to nagłówek z prasy
// następnego dnia, gdy gracz przepuści fałszywkę albo odrzuci prawdę (patrz hasFallout).
//
// Treść zgłoszeń jest tu po polsku; angielska wersja tekstów jest w cases.en.js, a nazwy narzędzi,
// werdyktów i dni — w i18n.js. Klucze (zrodlo, prawda…) są wspólne dla obu języków.

const TOOL_ORDER = ['zrodlo', 'data', 'obraz', 'dokument'];
const VERDICTS = ['prawda', 'falsz', 'manipulacja'];
const CASES_PER_DAY = 5;

const DAYS = [
  { tools: ['zrodlo', 'data'], speed: 3 },
  { tools: ['zrodlo', 'data', 'obraz'], speed: 4, newTool: 'obraz' },
  { tools: ['zrodlo', 'data', 'obraz', 'dokument'], speed: 5, newTool: 'dokument' }
];

const POOL = [
  // ---------- poziom 1: źródło i data ----------
  { tier: 1, kind: 'article', truth: 'falsz', reporter: 'Czytelniczka z Torunia',
    article: { url: 'gazeta-nadwislanska.info/pilne/zakaz-aut', outlet: 'Gazeta Nadwiślańska',
      headline: 'PILNE: Od poniedziałku zakaz wjazdu aut spalinowych do miast powyżej 50 tys. mieszkańców',
      author: 'Redakcja', date: '5.10.2026, 0:14',
      lead: 'Rząd po cichu przyjął rozporządzenie. Mandat wyniesie 5000 zł. Udostępnij, zanim to usuną!' },
    ev: { zrodlo: ['red', 'Domena gazeta-nadwislanska.info zarejestrowana 9 dni temu, właściciel ukryty. Prawdziwa Gazeta Nadwiślańska działa pod adresem gazetanadwislanska.pl od 1998 r. i nie opublikowała tego tekstu.'],
          data: ['info', 'Pierwsze wystąpienie: 4.10.2026, 23:58. Żaden dziennik urzędowy nie zawiera takiego rozporządzenia.'] },
    lesson: 'Podrobiona domena. Czytaj adres litera po literze, bo fałszywe serwisy podszywają się pod znane tytuły. Apel „udostępnij, zanim usuną” to typowy wabik.',
    fallout: { headline: 'Panika w salonach samochodowych po fałszywym „zakazie aut”',
      body: 'Tekst z podrobionej domeny udostępniono 200 tys. razy. Ministerstwo musiało wydać dementi.' } },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Kierowca z Sieradza',
    article: { url: 'gazetanadwislanska.pl/region/most-lipowa-remont', outlet: 'Gazeta Nadwiślańska',
      headline: 'Most na Lipowej w Sieradzu zamknięty od 14 października',
      author: 'Anna Wróbel', date: '5.10.2026, 7:40',
      lead: 'Zarząd Dróg Miejskich zapowiada trzytygodniowy remont. Objazd poprowadzi ulicami Kościuszki i Polną, a autobusy linii 3 i 7 zmienią trasy.' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r., w stopce redaktor naczelny i adres redakcji. Autorka podpisuje teksty od 6 lat.'],
          data: ['ok', 'Opublikowano dziś, 7:40. Ten sam komunikat jest na stronie Zarządu Dróg Miejskich z datą 2.10.2026.'] },
    lesson: 'Znane źródło, podpisana autorka, a informację potwierdza komunikat instytucji. Konkretne, nudne wiadomości zwykle są prawdziwe.',
    fallout: { headline: 'Kierowcy zaskoczeni zamknięciem mostu na Lipowej',
      body: 'Oznaczyliśmy prawdziwy komunikat jako fałszywy. Rano na objeździe stanęły korki, a zarząd dróg pyta, czemu podważamy jego ogłoszenia.' } },

  { tier: 1, kind: 'post', truth: 'falsz', reporter: 'Zaniepokojony tata',
    post: { name: 'Zdrowie Bez Tajemnic', handle: '@zdrowie.bez.tajemnic', time: '3 godz.',
      text: 'Sok z cytryny z sodą oczyszczoną leczy grypę w 24 godziny! Koncerny farmaceutyczne nie chcą, żebyś to wiedział. Lekarze milczą!!!',
      shares: '42 tys.' },
    ev: { zrodlo: ['red', 'Strona bez autora i danych kontaktowych. Link w opisie profilu prowadzi do sklepu z suplementami.'],
          data: ['info', 'Ten sam tekst krąży w sieci od 2017 r. w kilku językach, za każdym razem jako „nowe odkrycie”.'] },
    lesson: 'Cudowne lekarstwo, wspólny wróg (koncerny, lekarze) i sklep w tle. Gdy ktoś zarabia na tym, w co uwierzysz, sprawdzaj podwójnie.',
    fallout: { headline: 'Lekarze: chorzy na grypę leczą się sodą zamiast iść do przychodni',
      body: 'Przychodnie zgłaszają pacjentów, którzy uwierzyli w „cudowną kurację”. Sklep z suplementami podwoił sprzedaż.' } },

  { tier: 1, kind: 'post', truth: 'manipulacja', reporter: 'Studentka z Lublina',
    post: { name: 'Info Na Już', handle: '@InfoNaJuz', time: '25 min',
      text: 'Dzieje się TERAZ! Centrum Zamościa pod wodą. Gdzie są służby?!',
      shares: '9,1 tys.',
      link: { outlet: 'Radio Wschód', title: 'Ulewa zalała centrum Zamościa. Woda na Rynku Wielkim po kolana', url: 'radiowschod.pl/wiadomosci/ulewa-zamosc' } },
    ev: { zrodlo: ['info', 'Radio Wschód to regionalna rozgłośnia działająca od 1994 r. Konto @InfoNaJuz głównie udostępnia cudze treści z własnym komentarzem.'],
          data: ['red', 'Artykuł w archiwum radia ma datę 14.07.2019. Dziś w Zamościu bezchmurnie, brak opadów.'] },
    lesson: 'Prawdziwa informacja sprzed lat podana jako dzisiejsza. Sprawdzaj datę publikacji, a nie datę udostępnienia.',
    fallout: { headline: 'Straż pożarna w Zamościu: dziesiątki zgłoszeń o powodzi, której nie ma',
      body: 'Stary artykuł o ulewie z 2019 r. zablokował linię alarmową na pół dnia.' } },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Uczeń z Sieradza',
    article: { url: 'mpk.sieradz.pl/aktualnosci/bilet-uczniowski', outlet: 'MPK Sieradz · komunikat',
      headline: 'Od 1 listopada miesięczny bilet dla uczniów za 1 zł',
      author: 'Dział obsługi pasażera', date: '5.10.2026, 9:00',
      lead: 'Rada Miasta przyjęła uchwałę o symbolicznej cenie biletu miesięcznego dla uczniów szkół podstawowych i średnich. Bilet będzie można kupić w aplikacji i w punktach obsługi.' },
    ev: { zrodlo: ['ok', 'Oficjalna strona miejskiego przewoźnika w domenie miasta. Te same dane kontaktowe od 2009 r.'],
          data: ['ok', 'Uchwała Rady Miasta z 24.09.2026 jest opublikowana w Biuletynie Informacji Publicznej.'] },
    lesson: 'Dobra wiadomość nie musi być fałszywa. Oficjalne źródło i dokument w Biuletynie Informacji Publicznej rozwiewają wątpliwości.',
    fallout: { headline: 'Uczniowie przegapili zapisy na bilet za 1 zł',
      body: 'Uznaliśmy komunikat przewoźnika za oszustwo. Rodzice piszą z pretensjami, a MPK prosi o sprostowanie.' } },

  { tier: 1, kind: 'post', truth: 'manipulacja', reporter: 'Mama dwójki uczniów',
    post: { name: 'Rodzice Mazowsza', handle: '@RodziceMazowsza', time: '50 min',
      text: 'Od jutra wszystkie szkoły w województwie przechodzą na nauczanie zdalne! Kuratorium potwierdza. Przekażcie dalej!',
      shares: '21 tys.',
      link: { outlet: 'Echo Regionu', title: 'Kuratorium: od jutra nauka zdalna we wszystkich szkołach w województwie', url: 'echoregionu.pl/edukacja/nauka-zdalna' } },
    ev: { zrodlo: ['info', 'Echo Regionu to portal działający od 2005 r. Grupa @RodziceMazowsza skupia 80 tys. osób i nie weryfikuje wpisów.'],
          data: ['red', 'Artykuł Echa Regionu ma datę 11.03.2020, z pierwszych dni pandemii. Kuratorium nie wydało dziś żadnego komunikatu.'] },
    lesson: 'Stary artykuł o prawdziwym wydarzeniu wrócił jako dzisiejszy. Link wygląda wiarygodnie, ale data publikacji mówi wszystko.',
    fallout: { headline: 'Rodzice zostali w domu z dziećmi przez stary artykuł',
      body: 'Tysiące uczniów nie przyszło do szkół po udostępnieniu tekstu sprzed sześciu lat. Kuratorium dementuje.' } },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Wolontariuszka',
    article: { url: 'gazetanadwislanska.pl/region/bank-zywnosci-zbiorka', outlet: 'Gazeta Nadwiślańska',
      headline: 'W sobotę zbiórka Banku Żywności w 40 sklepach regionu',
      author: 'Marta Kowalczyk', date: '5.10.2026, 8:10',
      lead: 'Wolontariusze w żółtych kamizelkach będą zbierać produkty z długim terminem ważności. Dary trafią do jadłodajni i domów samotnej matki.' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r. Autorka od 4 lat pisze o sprawach społecznych.'],
          data: ['ok', 'Opublikowano dziś. Ten sam termin i listę sklepów podaje strona organizatora zbiórki.'] },
    lesson: 'Spokojny ton, konkretne miejsca i daty, potwierdzenie u organizatora. Tak wyglądają prawdziwe ogłoszenia.',
    fallout: { headline: 'Zbiórka Banku Żywności zebrała połowę zakładanych darów',
      body: 'Nasza pieczątka „fałsz” krążyła w sieci. Część darczyńców uznała zbiórkę za oszustwo.' } },

  { tier: 1, kind: 'post', truth: 'falsz', reporter: 'Senior z Radomia',
    post: { name: 'Dodatek Energetyczny 2026', handle: '@dodatek.energetyczny.gov', time: '4 godz.',
      text: 'Rząd wypłaca 800 zł dodatku energetycznego każdemu gospodarstwu! Złóż wniosek do piątku: dodatek-energia-gov.pl.com. Potrzebny tylko login do banku.',
      shares: '12 tys.' },
    ev: { zrodlo: ['red', 'Domena dodatek-energia-gov.pl.com zarejestrowana 2 dni temu za granicą. Końcówka .pl.com nie ma nic wspólnego z rządowymi stronami, a profil mimo „gov” w nazwie nie jest oficjalny.'],
          data: ['info', 'Wpis z dziś. Podobne „dodatki” pojawiały się już w 2022 i 2024 r., zawsze z linkiem do innej domeny.'] },
    lesson: 'Phishing w przebraniu urzędu. Żadna instytucja nie prosi o login do banku przez formularz z posta. Sprawdź końcówkę adresu: .pl.com to nie .gov.pl.',
    fallout: { headline: 'Seniorzy stracili oszczędności przez fałszywy „dodatek energetyczny”',
      body: 'Policja przyjęła 40 zgłoszeń wyłudzeń. Poszkodowani mówią, że nikt nie ostrzegł ich przed formularzem.' } },

  { tier: 1, kind: 'article', truth: 'falsz', reporter: 'Fanka seriali',
    article: { url: 'plotki-teraz24.xyz/gwiazdy/nie-zyje-aktor', outlet: 'Plotki Teraz 24',
      headline: 'Nie żyje Jan Wiatrowski. Gwiazdor serialu „Dom nad Wartą” miał 58 lat',
      author: 'Redakcja', date: '5.10.2026, 6:02',
      lead: 'Smutne wieści obiegły kraj. Rodzina prosi o uszanowanie prywatności. Szczegóły w galerii poniżej.' },
    ev: { zrodlo: ['red', 'Serwis założony miesiąc temu, bez stopki redakcyjnej. Na stronie 14 reklam i pięć przekierowań.'],
          data: ['red', 'Godzinę temu aktor opublikował na swoim profilu zdjęcie z planu z podpisem „Żyję i mam się dobrze, znowu”.'] },
    lesson: 'Fałszywa wiadomość o śmierci to klasyczna przynęta na kliknięcia. Zanim złożysz kondolencje, sprawdź oficjalne konta tej osoby i znane media.',
    fallout: { headline: 'Jan Wiatrowski: „Uśmierciliście mnie po raz trzeci”',
      body: 'Aktor nagrał ironiczne wideo o fałszywym nekrologu. W komentarzach pytania, czemu nikt tego nie sprawdził.' } },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Mieszkaniec osiedla Słonecznego',
    article: { url: 'siec-centrum.pl/komunikaty/wylaczenia-pradu', outlet: 'Sieć Energetyczna Centrum · komunikat',
      headline: 'Planowane wyłączenie prądu: osiedle Słoneczne, piątek 9 października, 8:00–14:00',
      author: 'Dział komunikacji', date: '5.10.2026, 7:30',
      lead: 'Powodem są prace modernizacyjne na stacji transformatorowej przy ul. Akacjowej. Prosimy o wcześniejsze naładowanie urządzeń.' },
    ev: { zrodlo: ['ok', 'Oficjalna strona operatora sieci. Ten sam adres i numer infolinii od 2011 r.'],
          data: ['ok', 'Opublikowano dziś, z wyprzedzeniem wymaganym przepisami. Komunikat powtarza też lokalna gazeta.'] },
    lesson: 'Suchy komunikat z oficjalnej strony, z konkretną datą, godziną i powodem. Nic tu nie gra na emocjach.',
    fallout: { headline: 'Osiedle Słoneczne bez prądu i bez ostrzeżenia',
      body: 'Uznaliśmy komunikat operatora za fałszywkę. Mieszkańcy nie przygotowali się na wyłączenie, a lodówki stały ciepłe sześć godzin.' } },

  // ---------- poziom 2: zdjęcia ----------
  { tier: 2, kind: 'post', truth: 'manipulacja', reporter: 'Emerytka z Kielc',
    post: { name: 'Kierowca Polska', handle: '@Kierowca_Polska', time: '1 godz.',
      text: 'Tak wyglądają DZIŚ stacje w całym kraju! Paliwa zaraz zabraknie, tankujcie, ile się da!!!',
      shares: '27 tys.' },
    photo: { scene: 'fuel', caption: 'kilometrowa kolejka aut do dystrybutorów' },
    ev: { zrodlo: ['info', 'Konto założone w 2023 r. Publikuje głównie alarmujące wpisy o cenach paliw.'],
          data: ['info', 'Wpis z dziś, 8:15. Stacje w okolicy nie zgłaszają braków.'],
          obraz: ['red', 'Zdjęcie po raz pierwszy opublikował zagraniczny serwis informacyjny 3.03.2022. Przedstawia stację w innym kraju — ceny na pylonie są w obcej walucie.'] },
    lesson: 'Prawdziwe zdjęcie w fałszywym kontekście. Wyszukiwanie obrazem w kilka sekund pokazuje, skąd fotografia pochodzi. Wezwanie do paniki („tankujcie!”) to sygnał ostrzegawczy.',
    fallout: { headline: 'Kolejki na stacjach po fałszywym zdjęciu',
      body: 'Kierowcy tankowali na zapas po wpisie ze zdjęciem z 2022 r. Na dwóch stacjach w Kielcach naprawdę zabrakło paliwa.' } },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Mama z Krakowa',
    post: { name: 'Kraków News 24', handle: '@KrakowNews_24', time: '40 min',
      text: 'UWAGA! Wilk na placu zabaw przy Plantach! Nie wypuszczajcie dzieci z domu!',
      shares: '15 tys.' },
    photo: { scene: 'wolf', caption: 'wilk na placu zabaw przy huśtawkach' },
    ev: { zrodlo: ['red', 'Konto założone 3 tygodnie temu, mimo nazwy nie należy do żadnej redakcji. 40 tys. obserwujących przybyło w jednym tygodniu.'],
          data: ['info', 'Wpis z dziś, 10:20. Straż miejska nie wydała żadnego komunikatu.'],
          obraz: ['red', 'Brak wcześniejszych wystąpień zdjęcia. Analiza wskazuje obraz wygenerowany przez AI: łańcuch huśtawki wrasta w drzewo, a wilk w odbiciu w kałuży ma pięć łap.'] },
    lesson: 'Obraz wygenerowany przez AI. Szukaj błędów w szczegółach (dłonie, napisy, odbicia) i sprawdź, czy ktokolwiek inny potwierdza zdarzenie.',
    fallout: { headline: 'Szkoły przy Plantach zamknęły place zabaw przez wilka z AI',
      body: 'Straż miejska przeszukała park. Wilka nie było, był tylko obraz z generatora.' } },

  { tier: 2, kind: 'article', truth: 'prawda', reporter: 'Kierowca autobusu',
    article: { url: 'lublinteraz.pl/miasto/autobusy-elektryczne', outlet: 'Lublin Teraz',
      headline: 'Na ulice Lublina wyjechało 20 nowych autobusów elektrycznych',
      author: 'Piotr Szymczak', date: '6.10.2026, 10:02',
      lead: 'Pojazdy obsłużą na początek linie 18 i 25. Zakup w trzech czwartych sfinansowały fundusze unijne.' },
    photo: { scene: 'buses', caption: 'rząd nowych autobusów w zajezdni' },
    ev: { zrodlo: ['ok', 'Lokalny portal działający od 2011 r., redakcja i autorzy podani w stopce.'],
          data: ['ok', 'Opublikowano dziś, 10:02.'],
          obraz: ['ok', 'Zdjęcie pojawiło się dziś rano na stronie miejskiego przewoźnika, podpisane nazwiskiem fotografa.'] },
    lesson: 'Wszystko się zgadza: lokalne źródło, aktualna data i zdjęcie z oficjalnej strony przewoźnika.',
    fallout: { headline: 'Przewoźnik z Lublina: nasze autobusy istnieją',
      body: 'Nazwaliśmy prawdziwe zdjęcie fałszywym. Przewoźnik opublikował wideo z zajezdni i prosi o sprostowanie.' } },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Nauczyciel WOS-u',
    post: { name: 'Marek Patriota', handle: '@Marek.Patriota', time: '2 godz.',
      text: 'SKANDAL!!! Tego jeszcze nie było. Udostępniajcie, niech ludzie wiedzą!',
      shares: '6,3 tys.',
      link: { outlet: 'Szyderca', title: 'Sejm przyjął ustawę o likwidacji poniedziałków. Tydzień pracy zacznie się we wtorek', url: 'szyderca.pl/kraj/koniec-poniedzialkow' } },
    photo: { scene: 'sejm', caption: 'posłowie głosujący na sali plenarnej' },
    ev: { zrodlo: ['red', 'Szyderca.pl to serwis satyryczny. W stopce: „Wszystkie teksty są fikcją i żartem”.'],
          data: ['red', 'Tekst opublikowano 1.04.2026.'],
          obraz: ['info', 'Zdjęcie z sali obrad z 2024 r., użyte jako ilustracja.'] },
    lesson: 'Satyra wzięta na serio. Zanim się oburzysz, sprawdź, czym jest strona źródłowa i czy tekst nie pochodzi z 1 kwietnia.',
    fallout: { headline: 'Szyderca.pl dziękuje za reklamę',
      body: 'Serwis satyryczny chwali się rekordem odsłon, odkąd tekst o „likwidacji poniedziałków” uznano za prawdziwy.' } },

  { tier: 2, kind: 'article', truth: 'prawda', reporter: 'Mieszkaniec Widzewa',
    article: { url: 'lodznabiezaco.pl/wydarzenia/pozar-hali-widzew', outlet: 'Łódź na Bieżąco',
      headline: 'Pożar hali magazynowej na Widzewie. Nikt nie został ranny',
      author: 'Karolina Mazur', date: '6.10.2026, 6:50 (akt. 9:10)',
      lead: 'Ogień pojawił się nad ranem. Na miejscu pracowało dwanaście zastępów straży. Mieszkańców proszono o zamknięcie okien.' },
    photo: { scene: 'smoke', caption: 'kłęby dymu nad halą magazynową' },
    ev: { zrodlo: ['ok', 'Portal działa od 2014 r. Autorka od lat relacjonuje wydarzenia z regionu.'],
          data: ['ok', 'Opublikowano dziś o 6:50, aktualizowano o 9:10.'],
          obraz: ['ok', 'Zdjęcie udostępniła dziś o 6:30 lokalna jednostka straży pożarnej na swoim profilu.'] },
    lesson: 'Szybka, ale rzetelna relacja: aktualizowany tekst, oficjalne zdjęcie służb i podpisana autorka.',
    fallout: { headline: 'Mieszkańcy Widzewa nie zamknęli okien',
      body: 'Ostrzeżenie o dymie uznaliśmy za fałszywe. Dwie osoby trafiły do szpitala z podrażnieniem dróg oddechowych.' } },

  { tier: 2, kind: 'post', truth: 'manipulacja', reporter: 'Student z Wrocławia',
    post: { name: 'Głos Ludu', handle: '@GlosLudu_PL', time: '3 godz.',
      text: 'Wczoraj pół miliona ludzi na ulicach Warszawy! Media milczą, ale zdjęcia nie kłamią.',
      shares: '38 tys.' },
    photo: { scene: 'crowd', caption: 'tłum z flagami na szerokiej ulicy' },
    ev: { zrodlo: ['info', 'Konto istnieje od 2020 r. i publikuje treści polityczne z różnych źródeł.'],
          data: ['info', 'Wczoraj w Warszawie rzeczywiście odbyła się zgłoszona demonstracja. Policja szacuje udział na 3 tys. osób.'],
          obraz: ['red', 'Zdjęcie pochodzi z finału festiwalu muzycznego w innym mieście, opublikowane 28.06.2019 przez agencję fotograficzną.'] },
    lesson: 'Prawdziwe wydarzenie, cudze zdjęcie. Fotografia z innego miejsca i czasu ma pokazać skalę, której nie było.',
    fallout: { headline: 'Spór o liczby po fałszywym zdjęciu tłumu',
      body: 'Zdjęcie z festiwalu krążyło jako dowód „pół miliona ludzi”. Zaufanie do relacji z demonstracji spadło po obu stronach.' } },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Wędkarz spod Płocka',
    post: { name: 'Mazowsze Alarm', handle: '@MazowszeAlarm', time: '1 godz.',
      text: 'REKIN W WIŚLE pod Płockiem!!! Wędkarze uciekają z brzegu. Nikt nie mówi, skąd się wziął!',
      shares: '64 tys.' },
    photo: { scene: 'shark', caption: 'płetwa rekina wystająca z rzeki przy moście' },
    ev: { zrodlo: ['red', 'Konto założone tydzień temu. Wszystkie wpisy to sensacje bez źródeł.'],
          data: ['info', 'Wpis z dziś. Żadne służby ani lokalne media nie zgłaszają zdarzenia.'],
          obraz: ['red', 'Fotomontaż: płetwa pochodzi ze zdjęcia z Australii z 2015 r., most z bazy zdjęć Płocka. Cień płetwy pada w inną stronę niż cienie filarów mostu.'] },
    lesson: 'Fotomontaż. Wyszukiwanie obrazem znajduje oba źródła, a uważne oko widzi cienie padające w różne strony.',
    fallout: { headline: 'Wędkarze omijają Wisłę przez fotomontaż rekina',
      body: 'Ośrodek sportów wodnych w Płocku odwołał zajęcia. Biolodzy przypominają, że rekiny nie żyją w słodkiej wodzie.' } },

  { tier: 2, kind: 'article', truth: 'prawda', reporter: 'Turystka z Gdańska',
    article: { url: 'tatrytu.pl/pogoda/pierwszy-snieg', outlet: 'Tatry Tu',
      headline: 'Pierwszy śnieg w Zakopanem. Na Kasprowym 15 cm',
      author: 'Wojciech Gąsienica', date: '6.10.2026, 7:45',
      lead: 'W nocy temperatura spadła poniżej zera. Ratownicy górscy ostrzegają przed oblodzonymi szlakami powyżej 1500 m.' },
    photo: { scene: 'snow', caption: 'zaśnieżone dachy i szczyty o poranku' },
    ev: { zrodlo: ['ok', 'Regionalny portal działający od 2009 r., autor podpisany.'],
          data: ['ok', 'Opublikowano dziś, 7:45. Stacja meteo na Kasprowym notuje −3°C i opad śniegu.'],
          obraz: ['ok', 'Zdjęcie to kadr z dzisiejszego zapisu publicznej kamery internetowej w Zakopanem, godzina 7:12.'] },
    lesson: 'Śnieg w październiku brzmi dziwnie, ale w Tatrach to norma. Nietypowe nie znaczy fałszywe: dane pogodowe i kamera potwierdzają.',
    fallout: { headline: 'Turyści ruszyli w Tatry w trampkach',
      body: 'Uznaliśmy informację o śniegu za fałsz. Ratownicy sprowadzili ze szlaków kilkanaście osób bez zimowego sprzętu.' } },

  { tier: 2, kind: 'post', truth: 'manipulacja', reporter: 'Radna osiedla',
    post: { name: 'Kraków Bez Ściemy', handle: '@KrakowBezSciemy', time: '2 godz.',
      text: 'Tak wygląda park po wczorajszym miejskim festiwalu. Za nasze podatki!',
      shares: '8,7 tys.' },
    photo: { scene: 'litter', caption: 'trawnik zasypany śmieciami i butelkami' },
    ev: { zrodlo: ['info', 'Konto lokalnych aktywistów, działa od 2021 r., często krytykuje władze miasta.'],
          data: ['info', 'Festiwal w parku rzeczywiście odbył się wczoraj. Służby porządkowe sprzątały teren do północy.'],
          obraz: ['red', 'Zdjęcie opublikował serwis z innego miasta 12.08.2021, po nielegalnej imprezie. Nie przedstawia tego parku.'] },
    lesson: 'Prawdziwe wydarzenie, ale zdjęcie z innej sytuacji. Nawet słuszna krytyka traci wiarygodność, gdy podpiera ją cudzą fotografią.',
    fallout: { headline: 'Organizatorzy festiwalu żądają przeprosin',
      body: 'Zdjęcie śmieci z innego miasta przypięto do miejskiego festiwalu. Sprzątający pokazali zdjęcia czystego parku z rana.' } },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Kierowca taksówki',
    post: { name: 'Ostatnia Chwila', handle: '@ostatnia_chwila_pl', time: '35 min',
      text: 'Właśnie pokazali w telewizji! Od soboty godzina policyjna w całym kraju!!!',
      shares: '47 tys.' },
    photo: { scene: 'tvbar', caption: 'zrzut ekranu: pasek PILNE w serwisie informacyjnym' },
    ev: { zrodlo: ['red', 'Konto anonimowe, założone w tym miesiącu.'],
          data: ['info', 'Żadna stacja nie nadała dziś takiej informacji; nie ma jej w archiwach programów.'],
          obraz: ['red', 'Zrzutu nie ma w żadnym archiwum telewizji. Identyczny układ paska oferuje darmowy generator „fałszywych wiadomości” do memów.'] },
    lesson: 'Spreparowany zrzut ekranu. Pasek z napisem PILNE da się zrobić w minutę w generatorze memów. Szukaj materiału na stronie samej stacji.',
    fallout: { headline: 'Sklepy oblężone przed „godziną policyjną”',
      body: 'Spreparowany zrzut paska z telewizji wywołał zakupy na zapas. Stacja zapowiada pozew przeciw autorom fałszywki.' } },

  // ---------- poziom 3: dokumenty ----------
  { tier: 3, kind: 'post', truth: 'manipulacja', reporter: 'Pielęgniarka z Gdańska',
    post: { name: 'Polityka Bez Cenzury', handle: '@PolitykaBezCenzury', time: '1 godz.',
      text: 'Minister zdrowia: „Szczepienia dzieci nie mają sensu”. Sami to przyznali!',
      shares: '33 tys.' },
    photo: { scene: 'quoteRed', caption: 'grafika: zdjęcie ministra i cytat na czerwonym tle' },
    ev: { zrodlo: ['red', 'Konto anonimowe. Publikuje grafiki z cytatami bez linków do źródeł.'],
          data: ['info', 'Grafika z dziś. Wywiad, z którego pochodzi cytat, odbył się 2.10.2026 w radiu.'],
          obraz: ['info', 'Zdjęcie ministra pochodzi z oficjalnej galerii resortu.'],
          dokument: ['red', 'Pełny zapis wywiadu: „Mówienie, że szczepienia dzieci nie mają sensu, to szkodliwy mit, z którym walczymy”.'] },
    lesson: 'Cytat wyrwany z kontekstu: zdanie ucięto tak, by znaczyło odwrotnie. Grafika z cytatem to nie źródło. Szukaj pełnej wypowiedzi.',
    fallout: { headline: 'Mniej zapisów na szczepienia dzieci',
      body: 'Ucięty cytat ministra krążył jako „przyznanie się”. Przychodnie notują odwołane wizyty.' } },

  { tier: 3, kind: 'article', truth: 'manipulacja', reporter: 'Kawiarz z Poznania',
    article: { url: 'zdrowiedzis.pl/nauka/kawa-zawal', outlet: 'Zdrowie Dziś',
      headline: 'Naukowcy alarmują: kawa podwaja ryzyko zawału!',
      author: 'Redakcja', date: '7.10.2026, 8:30',
      lead: 'Nowe badanie nie pozostawia złudzeń. Jeśli pijesz kawę codziennie, lepiej przeczytaj to od razu.' },
    photo: { scene: 'coffee', caption: 'filiżanka kawy na stole' },
    ev: { zrodlo: ['info', 'Portal istnieje od 2015 r. i utrzymuje się z reklam. Nagłówki często w stylu „naukowcy alarmują”.'],
          data: ['info', 'Badanie opublikowano w czasopiśmie naukowym tydzień temu.'],
          obraz: ['info', 'Zdjęcie z banku zdjęć.'],
          dokument: ['red', 'Badanie przeprowadzono na 24 myszach, którym podawano kofeinę w dawce odpowiadającej około 60 filiżankom dziennie u człowieka. Autorzy piszą: „wyników nie należy przenosić na ludzi”.'] },
    lesson: 'Nagłówek przekręca prawdziwe badanie. Kogo badano, ile było osób, jaka dawka? Odpowiedzi są w pracy źródłowej, nie w tytule.',
    fallout: { headline: 'Kawiarnie: klienci pytają, czy kawa ich zabije',
      body: 'Tekst o badaniu na myszach udostępniono 90 tys. razy. Kardiolodzy tłumaczą w telewizji, że nie ma powodów do paniki.' } },

  { tier: 3, kind: 'article', truth: 'prawda', reporter: 'Rolnik spod Płocka',
    article: { url: 'gazetanadwislanska.pl/kraj/wrzesien-rekord-temperatury', outlet: 'Gazeta Nadwiślańska',
      headline: 'Wrzesień 2026 najcieplejszy w historii pomiarów w Polsce',
      author: 'Tomasz Lis-Kowalczyk', date: '7.10.2026, 11:15',
      lead: 'Średnia temperatura miesiąca wyniosła 17,9°C. To najwięcej od początku regularnych pomiarów w 1951 roku.' },
    photo: { scene: 'chart', caption: 'wykres średnich temperatur września 1951–2026' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r. Autor specjalizuje się w tematach klimatycznych.'],
          data: ['ok', 'Opublikowano dziś, 11:15.'],
          obraz: ['ok', 'Wykres pochodzi z miesięcznego raportu państwowej służby meteorologicznej.'],
          dokument: ['ok', 'Raport miesięczny: średnia temperatura września 17,9°C, najwyższa od 1951 r. Liczby w artykule zgadzają się z raportem.'] },
    lesson: 'Liczby w tekście zgadzają się z dokumentem źródłowym. Tak wygląda rzetelne dziennikarstwo.',
    fallout: { headline: 'Służba meteorologiczna prostuje nasze „sprostowanie”',
      body: 'Oznaczyliśmy dane o rekordowym wrześniu jako nieprawdziwe. Nasza pieczątka trafiła na profile, które zaprzeczają zmianom klimatu.' } },

  { tier: 3, kind: 'post', truth: 'falsz', reporter: 'Fan gier, 13 lat',
    post: { name: 'Kuba Gra', handle: '@kubagra_offical', time: '12 min',
      text: 'Rozdaję 500 smartfonów z okazji 5 mln subów!!! Kliknij link i podaj dane karty, żeby opłacić wysyłkę 9,99 zł. Tylko do północy!',
      shares: '51 tys.' },
    photo: { scene: 'phones', caption: 'stos nowych smartfonów w pudełkach' },
    ev: { zrodlo: ['red', 'Konto @kubagra_offical (literówka) założone 3 dni temu. Prawdziwy twórca ma konto @kubagra z odznaką weryfikacji.'],
          data: ['info', 'Wpis z dziś. Identyczne „rozdania” pojawiły się w tym miesiącu w imieniu czterech innych twórców.'],
          obraz: ['info', 'Zdjęcie telefonów pochodzi z banku zdjęć.'],
          dokument: ['red', 'Na prawdziwym kanale twórcy nie ma żadnej informacji o konkursie. Formularz zbiera dane kart płatniczych.'] },
    lesson: 'Oszustwo phishingowe. Literówka w nazwie konta, presja czasu i prośba o dane karty to trzy czerwone flagi naraz.',
    fallout: { headline: 'Dzieci podały dane kart rodziców w fałszywym konkursie',
      body: 'Bank blokuje setki kart po „rozdaniu smartfonów”. Prawdziwy Kuba Gra ostrzega widzów na swoim kanale.' } },

  { tier: 3, kind: 'article', truth: 'falsz', reporter: 'Dyrektorka szkoły',
    article: { url: 'gco-news.pl/edukacja/raport-czytanie', outlet: 'Gazeta Codzienna Online',
      headline: 'Raport: 70% polskich uczniów nie rozumie czytanego tekstu',
      author: 'brak podpisu', date: '7.10.2026, 7:05',
      lead: 'Według najnowszego raportu Instytutu Badań Edukacyjnych sytuacja jest dramatyczna. Eksperci biją na alarm.' },
    ev: { zrodlo: ['red', 'Serwis działa od roku, w stopce brak nazwisk redakcji.'],
          data: ['info', 'Tekst z dziś, w ciągu godziny przedrukowało go kilkanaście stron.'],
          dokument: ['red', 'Instytut nie publikował takiego raportu. W jego ostatnim badaniu odsetek uczniów z poważnymi trudnościami w czytaniu wyniósł 17%.'] },
    lesson: 'Zmyślona liczba podpięta pod poważnie brzmiącą instytucję. Jeśli tekst nie linkuje raportu, znajdź go sam.',
    fallout: { headline: 'Instytut: nie publikowaliśmy raportu o 70%',
      body: 'Zmyślona liczba trafiła do debaty w radzie miasta. Instytut zapowiada skargę.' } },

  { tier: 3, kind: 'article', truth: 'manipulacja', reporter: 'Rodzic nastolatka',
    article: { url: 'gamingnews.pl/nauka/gry-iq', outlet: 'Gaming News',
      headline: 'Naukowcy potwierdzają: gry komputerowe podnoszą IQ o 20 punktów',
      author: 'Bartek Nowicki', date: '7.10.2026, 9:20',
      lead: 'Codzienne granie to trening dla mózgu. Wyniki badania zaskoczyły nawet samych autorów.' },
    photo: { scene: 'gamepad', caption: 'pad do gier przed ekranem' },
    ev: { zrodlo: ['info', 'Portal o grach działający od 2017 r., utrzymuje się z reklam wydawców gier.'],
          data: ['info', 'Badanie opublikowano 3 dni temu w czasopiśmie naukowym.'],
          obraz: ['info', 'Zdjęcie z banku zdjęć.'],
          dokument: ['red', 'Badanie objęło 40 dorosłych. Po 6 tygodniach grania wynik w jednym teście pamięci roboczej poprawił się o 4%. O IQ nie ma w pracy ani słowa.'] },
    lesson: 'Mały efekt z jednego testu urósł w nagłówku do „20 punktów IQ”. Porównaj liczby z tytułu z liczbami z badania.',
    fallout: { headline: 'Rodzice kupują gry „na inteligencję”',
      body: 'Nagłówek o 20 punktach IQ trafił do reklam sklepów z grami. Autorzy badania prostują w mediach.' } },

  { tier: 3, kind: 'article', truth: 'prawda', reporter: 'Pedagożka szkolna',
    article: { url: 'gazetanadwislanska.pl/kraj/raport-hejt-uczniowie', outlet: 'Gazeta Nadwiślańska',
      headline: 'Raport: co trzeci uczeń doświadczył hejtu w sieci',
      author: 'Ewa Domańska', date: '7.10.2026, 10:05',
      lead: 'Badanie objęło 4200 uczniów z 60 szkół. Najczęściej hejt dotyczył wyglądu i pochodzenia.' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r., autorka specjalizuje się w edukacji.'],
          data: ['ok', 'Opublikowano dziś, dzień po premierze raportu.'],
          dokument: ['ok', 'Raport rzecznika praw uczniowskich, s. 14: 34% badanych doświadczyło hejtu w ciągu roku. Próba i metoda opisane w aneksie.'] },
    lesson: 'Liczby z artykułu zgadzają się z raportem, a raport opisuje swoją metodę. Tak wygląda rzetelne powołanie się na badanie.',
    fallout: { headline: 'Rzecznik praw uczniowskich: podważanie raportu szkodzi ofiarom hejtu',
      body: 'Uznaliśmy rzetelny raport za niewiarygodny. Szkoły wstrzymały program przeciw hejtowi „do wyjaśnienia sprawy”.' } },

  { tier: 3, kind: 'post', truth: 'falsz', reporter: 'Licealista',
    post: { name: 'Mądre Cytaty', handle: '@madre.cytaty', time: '5 godz.',
      text: '„Kto czyta wiadomości tylko z internetu, ten wie mniej niż ten, kto nie czyta wcale.” — prof. Zbigniew Halicki, laureat Nagrody Nobla',
      shares: '19 tys.' },
    photo: { scene: 'quoteSage', caption: 'grafika: portret starszego profesora i cytat' },
    ev: { zrodlo: ['info', 'Profil z grafikami motywacyjnymi, 300 tys. obserwujących. Nie podaje źródeł cytatów.'],
          data: ['info', 'Grafika krąży od 2019 r., wcześniej podpisana innym nazwiskiem.'],
          obraz: ['red', 'Portret to zdjęcie stockowe modela, opisane w banku zdjęć jako „starszy mężczyzna w okularach”.'],
          dokument: ['red', 'W wykazie laureatów Nagrody Nobla nie ma nikogo o tym nazwisku. Cytat nie występuje w żadnej książce ani wywiadzie.'] },
    lesson: 'Zmyślony autorytet. Poważnie brzmiący tytuł i portret mają uwiarygodnić cytat. Sprawdź, czy ta osoba w ogóle istnieje.',
    fallout: { headline: 'Nieistniejący noblista cytowany na sesji rady miasta',
      body: 'Cytat „prof. Halickiego” padł w przemówieniu radnego. Nagranie stało się memem.' } },

  { tier: 3, kind: 'article', truth: 'manipulacja', reporter: 'Mieszkanka Zielonej Doliny',
    article: { url: 'gmina-info24.pl/bezpieczenstwo/przestepczosc', outlet: 'Gmina Info 24',
      headline: 'Przestępczość w Zielonej Dolinie wzrosła o 100%! Mieszkańcy boją się wychodzić z domu',
      author: 'Redakcja', date: '7.10.2026, 6:40',
      lead: 'Najnowsze dane policji nie pozostawiają złudzeń. Czy nasza gmina jest jeszcze bezpieczna?' },
    photo: { scene: 'police', caption: 'radiowóz nocą na pustej ulicy' },
    ev: { zrodlo: ['info', 'Portal lokalny działający od 2 lat, bez nazwisk w stopce.'],
          data: ['info', 'Dane policji za trzeci kwartał opublikowano wczoraj.'],
          obraz: ['info', 'Zdjęcie z banku zdjęć, nie z tej gminy.'],
          dokument: ['red', 'Raport policji: w trzecim kwartale zgłoszono 4 kradzieże rowerów wobec 2 rok wcześniej. Innych przestępstw nie odnotowano. Gmina ma 900 mieszkańców.'] },
    lesson: 'Procenty z małych liczb straszą najbardziej. Wzrost „o 100%” to tu dwa rowery więcej. Zawsze pytaj: 100% z ilu?',
    fallout: { headline: 'Mieszkańcy Zielonej Doliny chcą prywatnej ochrony',
      body: 'Po tekście o „wzroście przestępczości o 100%” gmina dostała petycję. Chodziło o dwa rowery.' } },

  { tier: 3, kind: 'post', truth: 'prawda', reporter: 'Nauczycielka historii',
    post: { name: 'Wydawnictwo Szkolne Atlas', handle: '@WydawnictwoAtlas', time: '1 godz.',
      text: 'Przepraszamy za błąd w podręczniku do historii dla klasy 7 (s. 112, zła data bitwy). Poprawiona wersja jest już w e-booku, a szkoły dostaną naklejki z erratą.',
      shares: '2,1 tys.' },
    ev: { zrodlo: ['ok', 'Oficjalny, zweryfikowany profil wydawnictwa, działa od 2012 r.'],
          data: ['info', 'Wpis z dziś.'],
          dokument: ['ok', 'Errata na stronie wydawnictwa potwierdza błąd i podaje poprawną datę. Ten sam komunikat dostały szkoły.'] },
    lesson: 'Sprostowanie to znak rzetelności, nie słabości. Źródło przyznało się do błędu i pokazało, jak go poprawia.',
    fallout: { headline: 'Wydawnictwo pyta, czemu jego przeprosiny to „fałsz”',
      body: 'Oznaczyliśmy sprostowanie jako nieprawdziwe. Nauczyciele nie dowiedzieli się o błędzie w podręczniku.' } }
];

const FALLBACK_EVIDENCE = {
  pl: { noPhoto: 'W zgłoszeniu nie ma zdjęcia.', noDocument: 'Zgłoszenie nie powołuje się na żaden cytat, badanie ani raport.', nothing: 'Brak dodatkowych informacji.' },
  en: { noPhoto: 'The report contains no photo.', noDocument: 'The report cites no quote, study or report.', nothing: 'No further information.' }
};

// Zgłoszenie w wybranym języku: polska baza z nałożonymi tekstami z POOL_EN. Flagi dowodów
// zostają z bazy, podmieniany jest tylko tekst.
function overlay(base, text) {
  if (!text) return base;
  const out = { ...base };
  Object.keys(text).forEach(k => {
    out[k] = typeof text[k] === 'object' && base[k] && typeof base[k] === 'object' ? overlay(base[k], text[k]) : text[k];
  });
  return out;
}

function localizedCase(i, lang) {
  const c = POOL[i];
  if (lang === 'pl' || typeof POOL_EN === 'undefined') return c;
  const t = POOL_EN[i];
  const { ev, ...rest } = t;
  const out = overlay(c, rest);
  out.ev = {};
  Object.keys(c.ev).forEach(k => { out.ev[k] = [c.ev[k][0], (ev && ev[k]) || c.ev[k][1]]; });
  return out;
}

// Dowód, który pokazuje narzędzie. Zgłoszenie z niższego poziomu nie ma wpisów dla narzędzi z
// wyższych dni, więc trafia tu neutralna odpowiedź zamiast pustej kartki.
function evidenceOf(c, tool, lang = 'pl') {
  const f = FALLBACK_EVIDENCE[lang];
  if (c.ev[tool]) return c.ev[tool];
  if (tool === 'obraz' && !c.photo) return ['info', f.noPhoto];
  if (tool === 'dokument') return ['info', f.noDocument];
  return ['info', f.nothing];
}

// Zasięg: ile osób widziało zgłoszenie. Rośnie, dopóki leży na biurku — podwaja się co
// doublingMin minut czasu gry — więc każde narzędzie kosztuje nie tylko czas, ale i ludzi, do
// których zdąży dotrzeć. Tempo jest jednakowe dla prawdy i fałszu, żeby licznik nie zdradzał
// odpowiedzi. Pieczątka „prawda” na fałszywce mnoży zasięg (stampBoost), a niesprawdzona fałszywka
// rozchodzi się tak, jakby leżała missedMin minut.
const SPREAD = { doublingMin: 45, stampBoost: 4, missedMin: 240 };

function initialReach(i) {
  return 600 + ((i + 1) * 7919) % 5400;
}

function reachAt(i, minutesOpen) {
  return Math.round(initialReach(i) * Math.pow(2, Math.max(0, minutesOpen) / SPREAD.doublingMin));
}

// Ostateczny zasięg fałszywki, która przeszła albo nie została sprawdzona; 0, gdy nikomu nie
// zaszkodziła.
function harmfulReach(entry) {
  if (POOL[entry.id].truth === 'prawda') return 0;
  if (entry.verdict === null) return reachAt(entry.id, SPREAD.missedMin);
  return entry.verdict === 'prawda' ? entry.reach * SPREAD.stampBoost : 0;
}

// Czy decyzja gracza wraca następnego dnia w prasie (fallout zgłoszenia). verdict === null znaczy,
// że zgłoszenie zostało niesprawdzone. Fałszywka lub manipulacja wraca, gdy przeszła jako prawda
// albo nikt jej nie zatrzymał; prawda — gdy została odrzucona. Pomylenie fałszu z manipulacją nie
// ma skutków: fałszywka i tak nie poszła w świat.
function hasFallout(c, verdict) {
  if (c.truth === 'prawda') return verdict !== null && verdict !== 'prawda';
  return verdict === null || verdict === 'prawda';
}

// Narzędzia, których wynik przesądza o werdykcie: potwierdzenie przy prawdzie, sygnał
// ostrzegawczy przy fałszu i manipulacji.
function decisiveTools(c) {
  const flag = c.truth === 'prawda' ? 'ok' : 'red';
  return TOOL_ORDER.filter(k => c.ev[k] && c.ev[k][0] === flag);
}

function shuffle(list, rand) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Zestaw na całą rozgrywkę: dzień 1 bierze zgłoszenia poziomu 1, a każdy kolejny co najmniej trzy
// zgłoszenia wymagające nowego narzędzia i dwa ze starszych poziomów. Każdego dnia pojawia się
// każdy werdykt, żeby gracz nie mógł wygrać, stawiając wszędzie tę samą pieczątkę.
function drawRun(rand = Math.random) {
  const ids = POOL.map((_, i) => i);
  let run;
  for (let attempt = 0; attempt < 500; attempt++) {
    const taken = new Set();
    run = DAYS.map((_, d) => {
      const tier = d + 1;
      const fresh = shuffle(ids.filter(i => POOL[i].tier === tier && !taken.has(i)), rand);
      const older = shuffle(ids.filter(i => POOL[i].tier < tier && !taken.has(i)), rand);
      const pick = tier === 1 ? fresh.slice(0, CASES_PER_DAY) : fresh.slice(0, 3).concat(older.slice(0, CASES_PER_DAY - 3));
      pick.forEach(i => taken.add(i));
      return shuffle(pick, rand);
    });
    if (run.every(day => VERDICTS.every(v => day.some(i => POOL[i].truth === v)))) return run;
  }
  return run;
}

if (typeof module !== 'undefined') {
  module.exports = { TOOL_ORDER, VERDICTS, DAYS, POOL, CASES_PER_DAY, SPREAD, localizedCase, evidenceOf, decisiveTools, hasFallout, reachAt, harmfulReach, drawRun };
}
