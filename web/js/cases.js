// Treść gry: narzędzia, dni i pula zgłoszeń, z której każda rozgrywka losuje swój zestaw.
//
// Każde zgłoszenie ma poziom (tier) równy numerowi dnia, w którym gracz dostaje narzędzie
// potrzebne do jego rozstrzygnięcia: 1 — rejestr źródeł i archiwum dat, 2 — wyszukiwanie obrazem,
// 3 — dokument źródłowy. Dowody (ev) mają flagę: 'ok' potwierdza prawdę, 'red' zdradza fałszywkę
// lub manipulację, 'info' to tło bez rozstrzygnięcia. Flagi nie są pokazywane graczowi — służą do
// oceny, czy wskazany przez niego kluczowy dowód rzeczywiście przesądzał.

const TOOLS = {
  zrodlo:   { name: 'Rejestr źródeł',       desc: 'Kto to opublikował i od kiedy działa' },
  data:     { name: 'Archiwum dat',         desc: 'Kiedy treść pojawiła się po raz pierwszy' },
  obraz:    { name: 'Wyszukiwanie obrazem', desc: 'Skąd naprawdę pochodzi zdjęcie' },
  dokument: { name: 'Dokument źródłowy',    desc: 'Pełny cytat, badanie albo raport' }
};
const TOOL_ORDER = ['zrodlo', 'data', 'obraz', 'dokument'];
const VERDICTS = ['prawda', 'falsz', 'manipulacja'];
const VERDICT = { prawda: 'Prawda', falsz: 'Fałsz', manipulacja: 'Manipulacja' };
const CASES_PER_DAY = 5;

const DAYS = [
  { date: 'Poniedziałek, 5 października 2026', tools: ['zrodlo', 'data'], speed: 3,
    memo: 'Pierwszy dzień. Masz dwa narzędzia: rejestr źródeł i archiwum dat. Pięć zgłoszeń od czytelników czeka w kolejce.' },
  { date: 'Wtorek, 6 października 2026', tools: ['zrodlo', 'data', 'obraz'], speed: 4, newTool: 'obraz',
    memo: 'Dział IT podłączył wyszukiwarkę obrazów. Dziś dużo zgłoszeń ze zdjęciami. Zegar biegnie szybciej, bo dzień jest gorący.' },
  { date: 'Środa, 7 października 2026', tools: ['zrodlo', 'data', 'obraz', 'dokument'], speed: 5, newTool: 'dokument',
    memo: 'Dostajesz dostęp do bazy dokumentów: zapisów wywiadów, badań i raportów. Ostatni dzień okresu próbnego. Pokaż, co umiesz.' }
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
    lesson: 'Podrobiona domena. Czytaj adres litera po literze, bo fałszywe serwisy podszywają się pod znane tytuły. Apel „udostępnij, zanim usuną” to typowy wabik.' },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Kierowca z Sieradza',
    article: { url: 'gazetanadwislanska.pl/region/most-lipowa-remont', outlet: 'Gazeta Nadwiślańska',
      headline: 'Most na Lipowej w Sieradzu zamknięty od 14 października',
      author: 'Anna Wróbel', date: '5.10.2026, 7:40',
      lead: 'Zarząd Dróg Miejskich zapowiada trzytygodniowy remont. Objazd poprowadzi ulicami Kościuszki i Polną, a autobusy linii 3 i 7 zmienią trasy.' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r., w stopce redaktor naczelny i adres redakcji. Autorka podpisuje teksty od 6 lat.'],
          data: ['ok', 'Opublikowano dziś, 7:40. Ten sam komunikat jest na stronie Zarządu Dróg Miejskich z datą 2.10.2026.'] },
    lesson: 'Znane źródło, podpisana autorka, a informację potwierdza komunikat instytucji. Konkretne, nudne wiadomości zwykle są prawdziwe.' },

  { tier: 1, kind: 'post', truth: 'falsz', reporter: 'Zaniepokojony tata',
    post: { name: 'Zdrowie Bez Tajemnic', handle: '@zdrowie.bez.tajemnic', time: '3 godz.',
      text: 'Sok z cytryny z sodą oczyszczoną leczy grypę w 24 godziny! Koncerny farmaceutyczne nie chcą, żebyś to wiedział. Lekarze milczą!!!',
      shares: '42 tys.' },
    ev: { zrodlo: ['red', 'Strona bez autora i danych kontaktowych. Link w opisie profilu prowadzi do sklepu z suplementami.'],
          data: ['info', 'Ten sam tekst krąży w sieci od 2017 r. w kilku językach, za każdym razem jako „nowe odkrycie”.'] },
    lesson: 'Cudowne lekarstwo, wspólny wróg (koncerny, lekarze) i sklep w tle. Gdy ktoś zarabia na tym, w co uwierzysz, sprawdzaj podwójnie.' },

  { tier: 1, kind: 'post', truth: 'manipulacja', reporter: 'Studentka z Lublina',
    post: { name: 'Info Na Już', handle: '@InfoNaJuz', time: '25 min',
      text: 'Dzieje się TERAZ! Centrum Zamościa pod wodą. Gdzie są służby?!',
      shares: '9,1 tys.',
      link: { outlet: 'Radio Wschód', title: 'Ulewa zalała centrum Zamościa. Woda na Rynku Wielkim po kolana', url: 'radiowschod.pl/wiadomosci/ulewa-zamosc' } },
    ev: { zrodlo: ['info', 'Radio Wschód to regionalna rozgłośnia działająca od 1994 r. Konto @InfoNaJuz głównie udostępnia cudze treści z własnym komentarzem.'],
          data: ['red', 'Artykuł w archiwum radia ma datę 14.07.2019. Dziś w Zamościu bezchmurnie, brak opadów.'] },
    lesson: 'Prawdziwa informacja sprzed lat podana jako dzisiejsza. Sprawdzaj datę publikacji, a nie datę udostępnienia.' },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Uczeń z Sieradza',
    article: { url: 'mpk.sieradz.pl/aktualnosci/bilet-uczniowski', outlet: 'MPK Sieradz · komunikat',
      headline: 'Od 1 listopada miesięczny bilet dla uczniów za 1 zł',
      author: 'Dział obsługi pasażera', date: '5.10.2026, 9:00',
      lead: 'Rada Miasta przyjęła uchwałę o symbolicznej cenie biletu miesięcznego dla uczniów szkół podstawowych i średnich. Bilet będzie można kupić w aplikacji i w punktach obsługi.' },
    ev: { zrodlo: ['ok', 'Oficjalna strona miejskiego przewoźnika w domenie miasta. Te same dane kontaktowe od 2009 r.'],
          data: ['ok', 'Uchwała Rady Miasta z 24.09.2026 jest opublikowana w Biuletynie Informacji Publicznej.'] },
    lesson: 'Dobra wiadomość nie musi być fałszywa. Oficjalne źródło i dokument w Biuletynie Informacji Publicznej rozwiewają wątpliwości.' },

  { tier: 1, kind: 'post', truth: 'manipulacja', reporter: 'Mama dwójki uczniów',
    post: { name: 'Rodzice Mazowsza', handle: '@RodziceMazowsza', time: '50 min',
      text: 'Od jutra wszystkie szkoły w województwie przechodzą na nauczanie zdalne! Kuratorium potwierdza. Przekażcie dalej!',
      shares: '21 tys.',
      link: { outlet: 'Echo Regionu', title: 'Kuratorium: od jutra nauka zdalna we wszystkich szkołach w województwie', url: 'echoregionu.pl/edukacja/nauka-zdalna' } },
    ev: { zrodlo: ['info', 'Echo Regionu to portal działający od 2005 r. Grupa @RodziceMazowsza skupia 80 tys. osób i nie weryfikuje wpisów.'],
          data: ['red', 'Artykuł Echa Regionu ma datę 11.03.2020, z pierwszych dni pandemii. Kuratorium nie wydało dziś żadnego komunikatu.'] },
    lesson: 'Stary artykuł o prawdziwym wydarzeniu wrócił jako dzisiejszy. Link wygląda wiarygodnie, ale data publikacji mówi wszystko.' },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Wolontariuszka',
    article: { url: 'gazetanadwislanska.pl/region/bank-zywnosci-zbiorka', outlet: 'Gazeta Nadwiślańska',
      headline: 'W sobotę zbiórka Banku Żywności w 40 sklepach regionu',
      author: 'Marta Kowalczyk', date: '5.10.2026, 8:10',
      lead: 'Wolontariusze w żółtych kamizelkach będą zbierać produkty z długim terminem ważności. Dary trafią do jadłodajni i domów samotnej matki.' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r. Autorka od 4 lat pisze o sprawach społecznych.'],
          data: ['ok', 'Opublikowano dziś. Ten sam termin i listę sklepów podaje strona organizatora zbiórki.'] },
    lesson: 'Spokojny ton, konkretne miejsca i daty, potwierdzenie u organizatora. Tak wyglądają prawdziwe ogłoszenia.' },

  { tier: 1, kind: 'post', truth: 'falsz', reporter: 'Senior z Radomia',
    post: { name: 'Dodatek Energetyczny 2026', handle: '@dodatek.energetyczny.gov', time: '4 godz.',
      text: 'Rząd wypłaca 800 zł dodatku energetycznego każdemu gospodarstwu! Złóż wniosek do piątku: dodatek-energia-gov.pl.com. Potrzebny tylko login do banku.',
      shares: '12 tys.' },
    ev: { zrodlo: ['red', 'Domena dodatek-energia-gov.pl.com zarejestrowana 2 dni temu za granicą. Końcówka .pl.com nie ma nic wspólnego z rządowymi stronami, a profil mimo „gov” w nazwie nie jest oficjalny.'],
          data: ['info', 'Wpis z dziś. Podobne „dodatki” pojawiały się już w 2022 i 2024 r., zawsze z linkiem do innej domeny.'] },
    lesson: 'Phishing w przebraniu urzędu. Żadna instytucja nie prosi o login do banku przez formularz z posta. Sprawdź końcówkę adresu: .pl.com to nie .gov.pl.' },

  { tier: 1, kind: 'article', truth: 'falsz', reporter: 'Fanka seriali',
    article: { url: 'plotki-teraz24.xyz/gwiazdy/nie-zyje-aktor', outlet: 'Plotki Teraz 24',
      headline: 'Nie żyje Jan Wiatrowski. Gwiazdor serialu „Dom nad Wartą” miał 58 lat',
      author: 'Redakcja', date: '5.10.2026, 6:02',
      lead: 'Smutne wieści obiegły kraj. Rodzina prosi o uszanowanie prywatności. Szczegóły w galerii poniżej.' },
    ev: { zrodlo: ['red', 'Serwis założony miesiąc temu, bez stopki redakcyjnej. Na stronie 14 reklam i pięć przekierowań.'],
          data: ['red', 'Godzinę temu aktor opublikował na swoim profilu zdjęcie z planu z podpisem „Żyję i mam się dobrze, znowu”.'] },
    lesson: 'Fałszywa wiadomość o śmierci to klasyczna przynęta na kliknięcia. Zanim złożysz kondolencje, sprawdź oficjalne konta tej osoby i znane media.' },

  { tier: 1, kind: 'article', truth: 'prawda', reporter: 'Mieszkaniec osiedla Słonecznego',
    article: { url: 'siec-centrum.pl/komunikaty/wylaczenia-pradu', outlet: 'Sieć Energetyczna Centrum · komunikat',
      headline: 'Planowane wyłączenie prądu: osiedle Słoneczne, piątek 9 października, 8:00–14:00',
      author: 'Dział komunikacji', date: '5.10.2026, 7:30',
      lead: 'Powodem są prace modernizacyjne na stacji transformatorowej przy ul. Akacjowej. Prosimy o wcześniejsze naładowanie urządzeń.' },
    ev: { zrodlo: ['ok', 'Oficjalna strona operatora sieci. Ten sam adres i numer infolinii od 2011 r.'],
          data: ['ok', 'Opublikowano dziś, z wyprzedzeniem wymaganym przepisami. Komunikat powtarza też lokalna gazeta.'] },
    lesson: 'Suchy komunikat z oficjalnej strony, z konkretną datą, godziną i powodem. Nic tu nie gra na emocjach.' },

  // ---------- poziom 2: zdjęcia ----------
  { tier: 2, kind: 'post', truth: 'manipulacja', reporter: 'Emerytka z Kielc',
    post: { name: 'Kierowca Polska', handle: '@Kierowca_Polska', time: '1 godz.',
      text: 'Tak wyglądają DZIŚ stacje w całym kraju! Paliwa zaraz zabraknie, tankujcie, ile się da!!!',
      shares: '27 tys.' },
    photo: { scene: 'fuel', caption: 'kilometrowa kolejka aut do dystrybutorów' },
    ev: { zrodlo: ['info', 'Konto założone w 2023 r. Publikuje głównie alarmujące wpisy o cenach paliw.'],
          data: ['info', 'Wpis z dziś, 8:15. Stacje w okolicy nie zgłaszają braków.'],
          obraz: ['red', 'Zdjęcie po raz pierwszy opublikował zagraniczny serwis informacyjny 3.03.2022. Przedstawia stację w innym kraju — ceny na pylonie są w obcej walucie.'] },
    lesson: 'Prawdziwe zdjęcie w fałszywym kontekście. Wyszukiwanie obrazem w kilka sekund pokazuje, skąd fotografia pochodzi. Wezwanie do paniki („tankujcie!”) to sygnał ostrzegawczy.' },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Mama z Krakowa',
    post: { name: 'Kraków News 24', handle: '@KrakowNews_24', time: '40 min',
      text: 'UWAGA! Wilk na placu zabaw przy Plantach! Nie wypuszczajcie dzieci z domu!',
      shares: '15 tys.' },
    photo: { scene: 'wolf', caption: 'wilk na placu zabaw przy huśtawkach' },
    ev: { zrodlo: ['red', 'Konto założone 3 tygodnie temu, mimo nazwy nie należy do żadnej redakcji. 40 tys. obserwujących przybyło w jednym tygodniu.'],
          data: ['info', 'Wpis z dziś, 10:20. Straż miejska nie wydała żadnego komunikatu.'],
          obraz: ['red', 'Brak wcześniejszych wystąpień zdjęcia. Analiza wskazuje obraz wygenerowany przez AI: łańcuch huśtawki wrasta w drzewo, a wilk w odbiciu w kałuży ma pięć łap.'] },
    lesson: 'Obraz wygenerowany przez AI. Szukaj błędów w szczegółach (dłonie, napisy, odbicia) i sprawdź, czy ktokolwiek inny potwierdza zdarzenie.' },

  { tier: 2, kind: 'article', truth: 'prawda', reporter: 'Kierowca autobusu',
    article: { url: 'lublinteraz.pl/miasto/autobusy-elektryczne', outlet: 'Lublin Teraz',
      headline: 'Na ulice Lublina wyjechało 20 nowych autobusów elektrycznych',
      author: 'Piotr Szymczak', date: '6.10.2026, 10:02',
      lead: 'Pojazdy obsłużą na początek linie 18 i 25. Zakup w trzech czwartych sfinansowały fundusze unijne.' },
    photo: { scene: 'buses', caption: 'rząd nowych autobusów w zajezdni' },
    ev: { zrodlo: ['ok', 'Lokalny portal działający od 2011 r., redakcja i autorzy podani w stopce.'],
          data: ['ok', 'Opublikowano dziś, 10:02.'],
          obraz: ['ok', 'Zdjęcie pojawiło się dziś rano na stronie miejskiego przewoźnika, podpisane nazwiskiem fotografa.'] },
    lesson: 'Wszystko się zgadza: lokalne źródło, aktualna data i zdjęcie z oficjalnej strony przewoźnika.' },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Nauczyciel WOS-u',
    post: { name: 'Marek Patriota', handle: '@Marek.Patriota', time: '2 godz.',
      text: 'SKANDAL!!! Tego jeszcze nie było. Udostępniajcie, niech ludzie wiedzą!',
      shares: '6,3 tys.',
      link: { outlet: 'Szyderca', title: 'Sejm przyjął ustawę o likwidacji poniedziałków. Tydzień pracy zacznie się we wtorek', url: 'szyderca.pl/kraj/koniec-poniedzialkow' } },
    photo: { scene: 'sejm', caption: 'posłowie głosujący na sali plenarnej' },
    ev: { zrodlo: ['red', 'Szyderca.pl to serwis satyryczny. W stopce: „Wszystkie teksty są fikcją i żartem”.'],
          data: ['red', 'Tekst opublikowano 1.04.2026.'],
          obraz: ['info', 'Zdjęcie z sali obrad z 2024 r., użyte jako ilustracja.'] },
    lesson: 'Satyra wzięta na serio. Zanim się oburzysz, sprawdź, czym jest strona źródłowa i czy tekst nie pochodzi z 1 kwietnia.' },

  { tier: 2, kind: 'article', truth: 'prawda', reporter: 'Mieszkaniec Widzewa',
    article: { url: 'lodznabiezaco.pl/wydarzenia/pozar-hali-widzew', outlet: 'Łódź na Bieżąco',
      headline: 'Pożar hali magazynowej na Widzewie. Nikt nie został ranny',
      author: 'Karolina Mazur', date: '6.10.2026, 6:50 (akt. 9:10)',
      lead: 'Ogień pojawił się nad ranem. Na miejscu pracowało dwanaście zastępów straży. Mieszkańców proszono o zamknięcie okien.' },
    photo: { scene: 'smoke', caption: 'kłęby dymu nad halą magazynową' },
    ev: { zrodlo: ['ok', 'Portal działa od 2014 r. Autorka od lat relacjonuje wydarzenia z regionu.'],
          data: ['ok', 'Opublikowano dziś o 6:50, aktualizowano o 9:10.'],
          obraz: ['ok', 'Zdjęcie udostępniła dziś o 6:30 lokalna jednostka straży pożarnej na swoim profilu.'] },
    lesson: 'Szybka, ale rzetelna relacja: aktualizowany tekst, oficjalne zdjęcie służb i podpisana autorka.' },

  { tier: 2, kind: 'post', truth: 'manipulacja', reporter: 'Student z Wrocławia',
    post: { name: 'Głos Ludu', handle: '@GlosLudu_PL', time: '3 godz.',
      text: 'Wczoraj pół miliona ludzi na ulicach Warszawy! Media milczą, ale zdjęcia nie kłamią.',
      shares: '38 tys.' },
    photo: { scene: 'crowd', caption: 'tłum z flagami na szerokiej ulicy' },
    ev: { zrodlo: ['info', 'Konto istnieje od 2020 r. i publikuje treści polityczne z różnych źródeł.'],
          data: ['info', 'Wczoraj w Warszawie rzeczywiście odbyła się zgłoszona demonstracja. Policja szacuje udział na 3 tys. osób.'],
          obraz: ['red', 'Zdjęcie pochodzi z finału festiwalu muzycznego w innym mieście, opublikowane 28.06.2019 przez agencję fotograficzną.'] },
    lesson: 'Prawdziwe wydarzenie, cudze zdjęcie. Fotografia z innego miejsca i czasu ma pokazać skalę, której nie było.' },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Wędkarz spod Płocka',
    post: { name: 'Mazowsze Alarm', handle: '@MazowszeAlarm', time: '1 godz.',
      text: 'REKIN W WIŚLE pod Płockiem!!! Wędkarze uciekają z brzegu. Nikt nie mówi, skąd się wziął!',
      shares: '64 tys.' },
    photo: { scene: 'shark', caption: 'płetwa rekina wystająca z rzeki przy moście' },
    ev: { zrodlo: ['red', 'Konto założone tydzień temu. Wszystkie wpisy to sensacje bez źródeł.'],
          data: ['info', 'Wpis z dziś. Żadne służby ani lokalne media nie zgłaszają zdarzenia.'],
          obraz: ['red', 'Fotomontaż: płetwa pochodzi ze zdjęcia z Australii z 2015 r., most z bazy zdjęć Płocka. Cień płetwy pada w inną stronę niż cienie filarów mostu.'] },
    lesson: 'Fotomontaż. Wyszukiwanie obrazem znajduje oba źródła, a uważne oko widzi cienie padające w różne strony.' },

  { tier: 2, kind: 'article', truth: 'prawda', reporter: 'Turystka z Gdańska',
    article: { url: 'tatrytu.pl/pogoda/pierwszy-snieg', outlet: 'Tatry Tu',
      headline: 'Pierwszy śnieg w Zakopanem. Na Kasprowym 15 cm',
      author: 'Wojciech Gąsienica', date: '6.10.2026, 7:45',
      lead: 'W nocy temperatura spadła poniżej zera. Ratownicy górscy ostrzegają przed oblodzonymi szlakami powyżej 1500 m.' },
    photo: { scene: 'snow', caption: 'zaśnieżone dachy i szczyty o poranku' },
    ev: { zrodlo: ['ok', 'Regionalny portal działający od 2009 r., autor podpisany.'],
          data: ['ok', 'Opublikowano dziś, 7:45. Stacja meteo na Kasprowym notuje −3°C i opad śniegu.'],
          obraz: ['ok', 'Zdjęcie to kadr z dzisiejszego zapisu publicznej kamery internetowej w Zakopanem, godzina 7:12.'] },
    lesson: 'Śnieg w październiku brzmi dziwnie, ale w Tatrach to norma. Nietypowe nie znaczy fałszywe: dane pogodowe i kamera potwierdzają.' },

  { tier: 2, kind: 'post', truth: 'manipulacja', reporter: 'Radna osiedla',
    post: { name: 'Kraków Bez Ściemy', handle: '@KrakowBezSciemy', time: '2 godz.',
      text: 'Tak wygląda park po wczorajszym miejskim festiwalu. Za nasze podatki!',
      shares: '8,7 tys.' },
    photo: { scene: 'litter', caption: 'trawnik zasypany śmieciami i butelkami' },
    ev: { zrodlo: ['info', 'Konto lokalnych aktywistów, działa od 2021 r., często krytykuje władze miasta.'],
          data: ['info', 'Festiwal w parku rzeczywiście odbył się wczoraj. Służby porządkowe sprzątały teren do północy.'],
          obraz: ['red', 'Zdjęcie opublikował serwis z innego miasta 12.08.2021, po nielegalnej imprezie. Nie przedstawia tego parku.'] },
    lesson: 'Prawdziwe wydarzenie, ale zdjęcie z innej sytuacji. Nawet słuszna krytyka traci wiarygodność, gdy podpiera ją cudzą fotografią.' },

  { tier: 2, kind: 'post', truth: 'falsz', reporter: 'Kierowca taksówki',
    post: { name: 'Ostatnia Chwila', handle: '@ostatnia_chwila_pl', time: '35 min',
      text: 'Właśnie pokazali w telewizji! Od soboty godzina policyjna w całym kraju!!!',
      shares: '47 tys.' },
    photo: { scene: 'tvbar', caption: 'zrzut ekranu: pasek PILNE w serwisie informacyjnym' },
    ev: { zrodlo: ['red', 'Konto anonimowe, założone w tym miesiącu.'],
          data: ['info', 'Żadna stacja nie nadała dziś takiej informacji; nie ma jej w archiwach programów.'],
          obraz: ['red', 'Zrzutu nie ma w żadnym archiwum telewizji. Identyczny układ paska oferuje darmowy generator „fałszywych wiadomości” do memów.'] },
    lesson: 'Spreparowany zrzut ekranu. Pasek z napisem PILNE da się zrobić w minutę w generatorze memów. Szukaj materiału na stronie samej stacji.' },

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
    lesson: 'Cytat wyrwany z kontekstu: zdanie ucięto tak, by znaczyło odwrotnie. Grafika z cytatem to nie źródło. Szukaj pełnej wypowiedzi.' },

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
    lesson: 'Nagłówek przekręca prawdziwe badanie. Kogo badano, ile było osób, jaka dawka? Odpowiedzi są w pracy źródłowej, nie w tytule.' },

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
    lesson: 'Liczby w tekście zgadzają się z dokumentem źródłowym. Tak wygląda rzetelne dziennikarstwo.' },

  { tier: 3, kind: 'post', truth: 'falsz', reporter: 'Fan gier, 13 lat',
    post: { name: 'Kuba Gra', handle: '@kubagra_offical', time: '12 min',
      text: 'Rozdaję 500 smartfonów z okazji 5 mln subów!!! Kliknij link i podaj dane karty, żeby opłacić wysyłkę 9,99 zł. Tylko do północy!',
      shares: '51 tys.' },
    photo: { scene: 'phones', caption: 'stos nowych smartfonów w pudełkach' },
    ev: { zrodlo: ['red', 'Konto @kubagra_offical (literówka) założone 3 dni temu. Prawdziwy twórca ma konto @kubagra z odznaką weryfikacji.'],
          data: ['info', 'Wpis z dziś. Identyczne „rozdania” pojawiły się w tym miesiącu w imieniu czterech innych twórców.'],
          obraz: ['info', 'Zdjęcie telefonów pochodzi z banku zdjęć.'],
          dokument: ['red', 'Na prawdziwym kanale twórcy nie ma żadnej informacji o konkursie. Formularz zbiera dane kart płatniczych.'] },
    lesson: 'Oszustwo phishingowe. Literówka w nazwie konta, presja czasu i prośba o dane karty to trzy czerwone flagi naraz.' },

  { tier: 3, kind: 'article', truth: 'falsz', reporter: 'Dyrektorka szkoły',
    article: { url: 'gco-news.pl/edukacja/raport-czytanie', outlet: 'Gazeta Codzienna Online',
      headline: 'Raport: 70% polskich uczniów nie rozumie czytanego tekstu',
      author: 'brak podpisu', date: '7.10.2026, 7:05',
      lead: 'Według najnowszego raportu Instytutu Badań Edukacyjnych sytuacja jest dramatyczna. Eksperci biją na alarm.' },
    ev: { zrodlo: ['red', 'Serwis działa od roku, w stopce brak nazwisk redakcji.'],
          data: ['info', 'Tekst z dziś, w ciągu godziny przedrukowało go kilkanaście stron.'],
          dokument: ['red', 'Instytut nie publikował takiego raportu. W jego ostatnim badaniu odsetek uczniów z poważnymi trudnościami w czytaniu wyniósł 17%.'] },
    lesson: 'Zmyślona liczba podpięta pod poważnie brzmiącą instytucję. Jeśli tekst nie linkuje raportu, znajdź go sam.' },

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
    lesson: 'Mały efekt z jednego testu urósł w nagłówku do „20 punktów IQ”. Porównaj liczby z tytułu z liczbami z badania.' },

  { tier: 3, kind: 'article', truth: 'prawda', reporter: 'Pedagożka szkolna',
    article: { url: 'gazetanadwislanska.pl/kraj/raport-hejt-uczniowie', outlet: 'Gazeta Nadwiślańska',
      headline: 'Raport: co trzeci uczeń doświadczył hejtu w sieci',
      author: 'Ewa Domańska', date: '7.10.2026, 10:05',
      lead: 'Badanie objęło 4200 uczniów z 60 szkół. Najczęściej hejt dotyczył wyglądu i pochodzenia.' },
    ev: { zrodlo: ['ok', 'Serwis działa od 1998 r., autorka specjalizuje się w edukacji.'],
          data: ['ok', 'Opublikowano dziś, dzień po premierze raportu.'],
          dokument: ['ok', 'Raport rzecznika praw uczniowskich, s. 14: 34% badanych doświadczyło hejtu w ciągu roku. Próba i metoda opisane w aneksie.'] },
    lesson: 'Liczby z artykułu zgadzają się z raportem, a raport opisuje swoją metodę. Tak wygląda rzetelne powołanie się na badanie.' },

  { tier: 3, kind: 'post', truth: 'falsz', reporter: 'Licealista',
    post: { name: 'Mądre Cytaty', handle: '@madre.cytaty', time: '5 godz.',
      text: '„Kto czyta wiadomości tylko z internetu, ten wie mniej niż ten, kto nie czyta wcale.” — prof. Zbigniew Halicki, laureat Nagrody Nobla',
      shares: '19 tys.' },
    photo: { scene: 'quoteSage', caption: 'grafika: portret starszego profesora i cytat' },
    ev: { zrodlo: ['info', 'Profil z grafikami motywacyjnymi, 300 tys. obserwujących. Nie podaje źródeł cytatów.'],
          data: ['info', 'Grafika krąży od 2019 r., wcześniej podpisana innym nazwiskiem.'],
          obraz: ['red', 'Portret to zdjęcie stockowe modela, opisane w banku zdjęć jako „starszy mężczyzna w okularach”.'],
          dokument: ['red', 'W wykazie laureatów Nagrody Nobla nie ma nikogo o tym nazwisku. Cytat nie występuje w żadnej książce ani wywiadzie.'] },
    lesson: 'Zmyślony autorytet. Poważnie brzmiący tytuł i portret mają uwiarygodnić cytat. Sprawdź, czy ta osoba w ogóle istnieje.' },

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
    lesson: 'Procenty z małych liczb straszą najbardziej. Wzrost „o 100%” to tu dwa rowery więcej. Zawsze pytaj: 100% z ilu?' },

  { tier: 3, kind: 'post', truth: 'prawda', reporter: 'Nauczycielka historii',
    post: { name: 'Wydawnictwo Szkolne Atlas', handle: '@WydawnictwoAtlas', time: '1 godz.',
      text: 'Przepraszamy za błąd w podręczniku do historii dla klasy 7 (s. 112, zła data bitwy). Poprawiona wersja jest już w e-booku, a szkoły dostaną naklejki z erratą.',
      shares: '2,1 tys.' },
    ev: { zrodlo: ['ok', 'Oficjalny, zweryfikowany profil wydawnictwa, działa od 2012 r.'],
          data: ['info', 'Wpis z dziś.'],
          dokument: ['ok', 'Errata na stronie wydawnictwa potwierdza błąd i podaje poprawną datę. Ten sam komunikat dostały szkoły.'] },
    lesson: 'Sprostowanie to znak rzetelności, nie słabości. Źródło przyznało się do błędu i pokazało, jak go poprawia.' }
];

const CHEAT = [
  'Czytaj adres strony litera po literze. Podróbki różnią się końcówką albo myślnikiem.',
  'Sprawdzaj, kto stoi za kontem lub stroną i od kiedy działa.',
  'Patrz na datę publikacji, nie na datę udostępnienia.',
  'Wyszukaj zdjęcie obrazem. Stare fotografie często wracają w nowym kontekście.',
  'Szukaj błędów AI i fotomontażu w szczegółach: dłonie, odbicia, cienie.',
  'Czytaj pełny cytat i pracę źródłową, a nie tylko nagłówek. Pytaj: ile osób, z ilu, kto?',
  'Silne emocje, pośpiech i „udostępnij, zanim usuną” to sygnały ostrzegawcze.',
  'Dobra, nudna albo nietypowa wiadomość też może być prawdziwa. Weryfikuj, zanim odrzucisz.'
];

// Dowód, który pokazuje narzędzie. Zgłoszenie z niższego poziomu nie ma wpisów dla narzędzi z
// wyższych dni, więc trafia tu neutralna odpowiedź zamiast pustej kartki.
function evidenceOf(c, tool) {
  if (c.ev[tool]) return c.ev[tool];
  if (tool === 'obraz' && !c.photo) return ['info', 'W zgłoszeniu nie ma zdjęcia.'];
  if (tool === 'dokument') return ['info', 'Zgłoszenie nie powołuje się na żaden cytat, badanie ani raport.'];
  return ['info', 'Brak dodatkowych informacji.'];
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
  module.exports = { TOOLS, TOOL_ORDER, VERDICTS, DAYS, POOL, CASES_PER_DAY, evidenceOf, decisiveTools, drawRun };
}
