import type { Card, Drill, Lesson } from '../types';

/**
 * Curriculum for learners who already know the basics and have family in Croatia.
 * Each lesson is a stop on a journey along Croatia; it has ~12 cards (with example
 * sentences) and a few gap-fill grammar drills.
 */

type CardTuple = [hr: string, de: string, exampleHr: string, exampleDe: string, alt?: string[]];
type DrillTuple = [sentence: string, hint: string, de: string, options: string[], answer: string];

function lesson(
  meta: Omit<Lesson, 'cards' | 'drills'>,
  cards: CardTuple[],
  drills: DrillTuple[],
): Lesson {
  return {
    ...meta,
    cards: cards.map(
      ([hr, de, exampleHr, exampleDe, alt], i): Card => ({
        id: `${meta.id}-${String(i + 1).padStart(2, '0')}`,
        hr,
        de,
        exampleHr,
        exampleDe,
        alt,
        lessonId: meta.id,
      }),
    ),
    drills: drills.map(
      ([sentence, hint, de, options, answer], i): Drill => ({
        id: `${meta.id}-d${i + 1}`,
        sentence,
        hint,
        de,
        options,
        answer,
      }),
    ),
  };
}

export const LESSONS: Lesson[] = [
  lesson(
    {
      id: 'l1',
      title: 'Obitelj',
      subtitle: 'Die Familie',
      place: 'Zagreb',
      placeFact: 'Zagreb ist die Hauptstadt – die blaue Straßenbahn heißt hier „tramvaj“.',
      emoji: '👨‍👩‍👧',
      grammarTitle: 'mein / dein',
      grammar:
        'Possessivpronomen richten sich nach dem Geschlecht des Besitzes: moj djed (m), moja baka (f), moje selo (n). Mehrzahl: moji roditelji. Genauso: tvoj / tvoja / tvoje / tvoji.',
    },
    [
      ['baka', 'die Oma', 'Moja baka živi u Splitu.', 'Meine Oma lebt in Split.'],
      ['djed', 'der Opa', 'Djed svako jutro pije kavu.', 'Opa trinkt jeden Morgen Kaffee.'],
      ['ujak', 'der Onkel (Bruder der Mutter)', 'Moj ujak ima brod.', 'Mein Onkel hat ein Boot.'],
      ['stric', 'der Onkel (Bruder des Vaters)', 'Stric dolazi u nedjelju.', 'Der Onkel kommt am Sonntag.'],
      ['tetka', 'die Tante', 'Tetka peče najbolje kolače.', 'Die Tante backt die besten Kuchen.'],
      ['rođak', 'der Cousin', 'Moj rođak radi u Zagrebu.', 'Mein Cousin arbeitet in Zagreb.', ['bratić']],
      ['rođakinja', 'die Cousine', 'Rođakinja se udaje ovog ljeta.', 'Die Cousine heiratet diesen Sommer.', ['sestrična']],
      ['unuk', 'der Enkel', 'Baka ima pet unuka.', 'Oma hat fünf Enkel.'],
      ['nećak', 'der Neffe', 'Moj nećak ima sedam godina.', 'Mein Neffe ist sieben Jahre alt.'],
      ['roditelji', 'die Eltern', 'Moji roditelji su iz Dalmacije.', 'Meine Eltern sind aus Dalmatien.'],
      ['obitelj', 'die Familie', 'Cijela obitelj je bila tamo.', 'Die ganze Familie war da.'],
      ['rodbina', 'die Verwandtschaft', 'Imamo puno rodbine u Hrvatskoj.', 'Wir haben viel Verwandtschaft in Kroatien.'],
    ],
    [
      ['Ovo je ___ baka.', 'meine', 'Das ist meine Oma.', ['moj', 'moja', 'moje'], 'moja'],
      ['___ djed ima osamdeset godina.', 'mein', 'Mein Opa ist achtzig.', ['Moj', 'Moja', 'Moje'], 'Moj'],
      ['Ovo je ___ selo.', 'mein', 'Das ist mein Dorf.', ['moj', 'moja', 'moje'], 'moje'],
      ['Gdje su ___ roditelji?', 'deine', 'Wo sind deine Eltern?', ['tvoj', 'tvoja', 'tvoji'], 'tvoji'],
    ],
  ),
  lesson(
    {
      id: 'l2',
      title: 'Kod bake na ručku',
      subtitle: 'Mittagessen bei Oma',
      place: 'Plitvice',
      placeFact: 'Die Plitvicer Seen bestehen aus 16 Seen, die über Wasserfälle verbunden sind.',
      emoji: '🍲',
      grammarTitle: 'Akkusativ (wen/was?)',
      grammar:
        'Weibliche Wörter auf -a enden im Akkusativ auf -u: juha → Baka kuha juhu. kava → Pijem kavu. Männliche Sachen bleiben gleich (Želiš li kruh?), männliche Personen bekommen -a (Vidim brata).',
    },
    [
      ['ručak', 'das Mittagessen', 'Ručak je u dva sata.', 'Das Mittagessen ist um zwei Uhr.'],
      ['Dobar tek!', 'Guten Appetit!', 'Sjednite, dobar tek!', 'Setzt euch, guten Appetit!'],
      ['Izvoli!', 'Bitte schön! (Hier, nimm!)', 'Izvoli, uzmi još kruha.', 'Bitte, nimm noch Brot.', ['Izvolite!']],
      ['Još malo?', 'Noch ein bisschen?', 'Hoćeš li još malo juhe?', 'Möchtest du noch ein bisschen Suppe?'],
      ['Sit sam.', 'Ich bin satt.', 'Hvala, stvarno sam sit.', 'Danke, ich bin wirklich satt.', ['Sita sam.']],
      ['fino', 'lecker', 'Ovo je jako fino!', 'Das ist sehr lecker!'],
      ['juha', 'die Suppe', 'Baka kuha juhu.', 'Oma kocht Suppe.'],
      ['kruh', 'das Brot', 'Možeš li mi dodati kruh?', 'Kannst du mir das Brot reichen?'],
      ['Živjeli!', 'Prost!', 'Živjeli, za obitelj!', 'Prost, auf die Familie!'],
      ['kuhati', 'kochen', 'Mama voli kuhati za sve.', 'Mama kocht gern für alle.'],
      ['Mogu li pomoći?', 'Kann ich helfen?', 'Bako, mogu li pomoći u kuhinji?', 'Oma, kann ich in der Küche helfen?'],
      ['Bilo je odlično.', 'Es war ausgezeichnet.', 'Hvala, bilo je odlično!', 'Danke, es war ausgezeichnet!'],
    ],
    [
      ['Baka kuha ___.', 'juha', 'Oma kocht Suppe.', ['juha', 'juhu', 'juhe'], 'juhu'],
      ['Pijem ___.', 'kava', 'Ich trinke Kaffee.', ['kava', 'kavu', 'kavi'], 'kavu'],
      ['Želiš li ___?', 'kruh', 'Möchtest du Brot?', ['kruh', 'kruhu', 'kruhom'], 'kruh'],
      ['Vidim ___ u kuhinji.', 'baka', 'Ich sehe Oma in der Küche.', ['baka', 'baku', 'bake'], 'baku'],
    ],
  ),
  lesson(
    {
      id: 'l3',
      title: 'Razgovor',
      subtitle: 'Smalltalk mit der Verwandtschaft',
      place: 'Zadar',
      placeFact: 'In Zadar spielt die „Morske orgulje“ (Meeresorgel) Musik mit den Wellen.',
      emoji: '💬',
      grammarTitle: 'Fragen mit „li“',
      grammar:
        'Ja/Nein-Fragen: Verb an den Anfang, dann „li“: Imaš li vremena? (Hast du Zeit?) Možeš li ponoviti? (Kannst du wiederholen?). Umgangssprachlich auch: Da li imaš …?',
    },
    [
      ['Što ima novo?', "Was gibt's Neues?", 'Bok, što ima novo kod tebe?', "Hallo, was gibt's Neues bei dir?"],
      ['Kako ide posao?', 'Wie läuft die Arbeit?', 'Kako ide posao u Njemačkoj?', 'Wie läuft die Arbeit in Deutschland?'],
      ['Sve je u redu.', 'Alles ist in Ordnung.', 'Ne brini, sve je u redu.', 'Mach dir keine Sorgen, alles ist in Ordnung.'],
      ['Imaš li vremena?', 'Hast du Zeit?', 'Imaš li vremena za kavu?', 'Hast du Zeit für einen Kaffee?'],
      ['nažalost', 'leider', 'Nažalost, moram ići.', 'Leider muss ich gehen.'],
      ['naravno', 'natürlich', 'Naravno da ću doći!', 'Natürlich komme ich!'],
      ['Stvarno?', 'Wirklich?', 'Stvarno? Nisam to znao.', 'Wirklich? Das wusste ich nicht.'],
      ['Možeš li ponoviti?', 'Kannst du das wiederholen?', 'Možeš li ponoviti, molim te?', 'Kannst du das bitte wiederholen?'],
      ['polako', 'langsam', 'Govori polako, molim te.', 'Sprich bitte langsam.'],
      ['Kako se kaže …?', 'Wie sagt man …?', 'Kako se kaže „Gabel“ na hrvatskom?', 'Wie sagt man „Gabel“ auf Kroatisch?', ['Kako se kaže?']],
      ['Vidimo se!', 'Wir sehen uns!', 'Vidimo se sutra!', 'Wir sehen uns morgen!'],
      ['Pozdravi …!', 'Grüß …!', 'Pozdravi mamu!', 'Grüß Mama!', ['Pozdravi!']],
    ],
    [
      ['___ li vremena?', 'du hast', 'Hast du Zeit?', ['Imaš', 'Imam', 'Ima'], 'Imaš'],
      ['Možeš ___ ponoviti?', 'Fragewort', 'Kannst du das wiederholen?', ['li', 'se', 'je'], 'li'],
      ['Kako se ___ „Gabel“?', 'sagt man', 'Wie sagt man „Gabel“?', ['kaže', 'kažem', 'kažeš'], 'kaže'],
      ['Pozdravi ___!', 'mama', 'Grüß Mama!', ['mama', 'mamu', 'mami'], 'mamu'],
    ],
  ),
  lesson(
    {
      id: 'l4',
      title: 'Na moru',
      subtitle: 'Am Meer',
      place: 'Šibenik',
      placeFact: 'Die Kathedrale des hl. Jakob in Šibenik wurde komplett aus Stein ohne Mörtel gebaut.',
      emoji: '🏖️',
      grammarTitle: 'Lokativ (wo?)',
      grammar:
        'Auf die Frage „wo?“ nach u/na: Zagreb → u Zagrebu, more → na moru, selo → u selu, kuća → u kući, otok → na otoku. Männlich/sächlich meist -u, weiblich -i (luka → u luci: k wird zu c).',
    },
    [
      ['more', 'das Meer', 'Ljeti smo uvijek na moru.', 'Im Sommer sind wir immer am Meer.'],
      ['otok', 'die Insel', 'Djed je rođen na otoku.', 'Opa ist auf der Insel geboren.'],
      ['selo', 'das Dorf', 'Baka živi u malom selu.', 'Oma lebt in einem kleinen Dorf.'],
      ['plaža', 'der Strand', 'Idemo na plažu!', 'Wir gehen an den Strand!'],
      ['kupati se', 'baden', 'Djeca se kupaju cijeli dan.', 'Die Kinder baden den ganzen Tag.'],
      ['vruće', 'heiß', 'Danas je jako vruće.', 'Heute ist es sehr heiß.'],
      ['trajekt', 'die Fähre', 'Trajekt kasni pola sata.', 'Die Fähre hat eine halbe Stunde Verspätung.'],
      ['luka', 'der Hafen', 'Brod je u luci.', 'Das Boot ist im Hafen.'],
      ['sunce', 'die Sonne', 'Ne sjedi cijeli dan na suncu!', 'Sitz nicht den ganzen Tag in der Sonne!'],
      ['hlad', 'der Schatten', 'Sjednimo u hlad.', 'Setzen wir uns in den Schatten.'],
      ['kuća', 'das Haus', 'Svi su u kući.', 'Alle sind im Haus.'],
      ['odmor', 'der Urlaub', 'Na odmoru smo dva tjedna.', 'Wir sind zwei Wochen im Urlaub.'],
    ],
    [
      ['Živim u ___.', 'Zagreb', 'Ich wohne in Zagreb.', ['Zagreb', 'Zagreba', 'Zagrebu'], 'Zagrebu'],
      ['Ljeti smo na ___.', 'more', 'Im Sommer sind wir am Meer.', ['more', 'moru', 'mora'], 'moru'],
      ['Baka živi u ___.', 'selo', 'Oma lebt im Dorf.', ['selo', 'selu', 'sela'], 'selu'],
      ['Brod je u ___.', 'luka', 'Das Boot ist im Hafen.', ['luka', 'luku', 'luci'], 'luci'],
      ['Djed je rođen na ___.', 'otok', 'Opa ist auf der Insel geboren.', ['otok', 'otoka', 'otoku'], 'otoku'],
    ],
  ),
  lesson(
    {
      id: 'l5',
      title: 'Prošlo ljeto',
      subtitle: 'Vom Urlaub erzählen (Perfekt)',
      place: 'Split',
      placeFact: 'Die Altstadt von Split liegt mitten im Palast des römischen Kaisers Diokletian.',
      emoji: '📸',
      grammarTitle: 'Perfekt',
      grammar:
        'Perfekt = sam/si/je/smo/ste/su + l-Form: bio (m) / bila (f) / bili (Mz.). „sam“ steht an zweiter Stelle: Bio sam u Splitu. – Jučer sam bio u Splitu. Aspekt: pisati (dauernd) ↔ napisati (abgeschlossen).',
    },
    [
      ['bio sam', 'ich war', 'Prošle godine sam bio u Splitu.', 'Letztes Jahr war ich in Split.', ['bila sam', 'sam bio', 'sam bila']],
      ['išao sam', 'ich bin gegangen', 'Jučer sam išao kod bake.', 'Gestern bin ich zu Oma gegangen.', ['išla sam', 'sam išao', 'sam išla']],
      ['jučer', 'gestern', 'Jučer je padala kiša.', 'Gestern hat es geregnet.'],
      ['prošle godine', 'letztes Jahr', 'Prošle godine smo bili u Dubrovniku.', 'Letztes Jahr waren wir in Dubrovnik.'],
      ['vidio sam', 'ich habe gesehen', 'Vidio sam tvog brata.', 'Ich habe deinen Bruder gesehen.', ['vidjela sam', 'sam vidio', 'sam vidjela']],
      ['rekao je', 'er hat gesagt', 'Djed je rekao da će doći.', 'Opa hat gesagt, dass er kommt.', ['je rekao']],
      ['zaboravio sam', 'ich habe vergessen', 'Zaboravio sam ključeve.', 'Ich habe die Schlüssel vergessen.', ['zaboravila sam', 'sam zaboravio', 'sam zaboravila']],
      ['napisati', 'schreiben (fertig, vollendet)', 'Napisala sam pismo baki.', 'Ich habe Oma einen Brief geschrieben.'],
      ['pisati', 'schreiben (andauernd)', 'Pisao sam cijelo popodne.', 'Ich habe den ganzen Nachmittag geschrieben.'],
      ['upoznati', 'kennenlernen', 'Upoznali smo se na moru.', 'Wir haben uns am Meer kennengelernt.'],
      ['Što se dogodilo?', 'Was ist passiert?', 'Što se dogodilo? Zašto plačeš?', 'Was ist passiert? Warum weinst du?'],
      ['prije dva dana', 'vor zwei Tagen', 'Stigli smo prije dva dana.', 'Wir sind vor zwei Tagen angekommen.'],
    ],
    [
      ['Jučer ___ bio kod bake.', 'ich', 'Gestern war ich bei Oma.', ['sam', 'si', 'je'], 'sam'],
      ['Mi ___ bili u Splitu.', 'wir', 'Wir waren in Split.', ['smo', 'ste', 'su'], 'smo'],
      ['Ana je ___ na more.', 'gehen', 'Ana ist ans Meer gefahren.', ['išao', 'išla', 'išli'], 'išla'],
      ['Oni ___ došli jučer.', 'sie (Mz.)', 'Sie sind gestern gekommen.', ['su', 'smo', 'je'], 'su'],
    ],
  ),
  lesson(
    {
      id: 'l6',
      title: 'Planovi',
      subtitle: 'Pläne & der nächste Besuch (Futur)',
      place: 'Hvar',
      placeFact: 'Hvar gilt als eine der sonnigsten Inseln Europas – mit über 2.700 Sonnenstunden im Jahr.',
      emoji: '🗓️',
      grammarTitle: 'Futur I',
      grammar:
        'Futur = Infinitiv + ću/ćeš/će/ćemo/ćete/će: Ja ću doći. Steht das Verb vorne, verschmilzt es: doći ću, vidjet ćemo (Infinitive auf -ti verlieren das -i: vidjeti → vidjet ću).',
    },
    [
      ['doći ću', 'ich werde kommen', 'Doći ću u kolovozu.', 'Ich komme im August.', ['ja ću doći']],
      ['vidjet ćemo', 'mal sehen / wir werden sehen', 'Ne znam još, vidjet ćemo.', 'Ich weiß es noch nicht, mal sehen.'],
      ['sutra', 'morgen', 'Sutra idemo na izlet.', 'Morgen machen wir einen Ausflug.'],
      ['iduće godine', 'nächstes Jahr', 'Iduće godine dolazimo za Božić.', 'Nächstes Jahr kommen wir an Weihnachten.', ['sljedeće godine']],
      ['srpanj', 'Juli', 'Imam godišnji u srpnju.', 'Ich habe im Juli Urlaub.'],
      ['kolovoz', 'August', 'U kolovozu je more najtoplije.', 'Im August ist das Meer am wärmsten.'],
      ['prosinac', 'Dezember', 'U prosincu je cijela obitelj zajedno.', 'Im Dezember ist die ganze Familie zusammen.'],
      ['ostati', 'bleiben', 'Koliko dugo ćeš ostati?', 'Wie lange wirst du bleiben?'],
      ['javiti se', 'sich melden', 'Javi se kad stigneš!', 'Melde dich, wenn du ankommst!'],
      ['nazvati', 'anrufen', 'Nazvat ću te večeras.', 'Ich rufe dich heute Abend an.'],
      ['stići', 'ankommen', 'Kad ćete stići?', 'Wann werdet ihr ankommen?'],
      ['izlet', 'der Ausflug', 'Idemo na izlet u planine.', 'Wir machen einen Ausflug in die Berge.'],
    ],
    [
      ['Ja ___ doći u kolovozu.', 'ich werde', 'Ich komme im August.', ['ću', 'ćeš', 'će'], 'ću'],
      ['Mi ___ vidjeti.', 'wir werden', 'Wir werden sehen.', ['ćemo', 'ćete', 'će'], 'ćemo'],
      ['Kad ___ stići?', 'ihr werdet', 'Wann werdet ihr ankommen?', ['ćete', 'ćemo', 'ćeš'], 'ćete'],
      ['___ ću te večeras.', 'anrufen', 'Ich rufe dich heute Abend an.', ['Nazvat', 'Nazvati', 'Nazvao'], 'Nazvat'],
    ],
  ),
  lesson(
    {
      id: 'l7',
      title: 'Blagdani i slavlja',
      subtitle: 'Feiertage & Familienfeste',
      place: 'Makarska',
      placeFact: 'Hinter Makarska ragt das Biokovo-Gebirge bis 1.762 m direkt aus dem Meer empor.',
      emoji: '🎉',
      grammarTitle: 'Glückwünsche & Dativ',
      grammar:
        '„Sretan“ passt sich an: Sretan Božić / rođendan (m), Sretna Nova godina (f), Sretno! (allgemein: Viel Glück!). Wem gratulieren? Dativ: čestitati tetki, baki, mami (-a → -i).',
    },
    [
      ['Sretan rođendan!', 'Alles Gute zum Geburtstag!', 'Sretan rođendan, bako!', 'Alles Gute zum Geburtstag, Oma!'],
      ['Sretan Božić!', 'Frohe Weihnachten!', 'Sretan Božić svima!', 'Frohe Weihnachten euch allen!'],
      ['Sretna Nova godina!', 'Frohes neues Jahr!', 'Sretna Nova godina i puno zdravlja!', 'Frohes neues Jahr und viel Gesundheit!'],
      ['Uskrs', 'Ostern', 'Za Uskrs bojimo jaja.', 'An Ostern färben wir Eier.'],
      ['vjenčanje', 'die Hochzeit', 'Vjenčanje je u subotu u crkvi.', 'Die Hochzeit ist am Samstag in der Kirche.'],
      ['krštenje', 'die Taufe', 'Kum je došao na krštenje.', 'Der Pate ist zur Taufe gekommen.'],
      ['kum', 'der Pate / Trauzeuge', 'Moj kum mi je kao brat.', 'Mein Pate ist für mich wie ein Bruder.'],
      ['čestitati', 'gratulieren', 'Moram čestitati tetki.', 'Ich muss der Tante gratulieren.'],
      ['poklon', 'das Geschenk', 'Ovo je mali poklon za tebe.', 'Das ist ein kleines Geschenk für dich.', ['dar']],
      ['slaviti', 'feiern', 'Kako slavite Badnjak?', 'Wie feiert ihr Heiligabend?'],
      ['Badnjak', 'Heiligabend', 'Na Badnjak jedemo bakalar.', 'An Heiligabend essen wir Stockfisch.'],
      ['Sve najbolje!', 'Alles Gute!', 'Sve najbolje i puno sreće!', 'Alles Gute und viel Glück!'],
    ],
    [
      ['___ Božić!', 'froh', 'Frohe Weihnachten!', ['Sretan', 'Sretna', 'Sretno'], 'Sretan'],
      ['___ Nova godina!', 'froh', 'Frohes neues Jahr!', ['Sretan', 'Sretna', 'Sretno'], 'Sretna'],
      ['Moram čestitati ___.', 'tetka', 'Ich muss der Tante gratulieren.', ['tetka', 'tetku', 'tetki'], 'tetki'],
      ['Kupio sam poklon ___.', 'baka', 'Ich habe Oma ein Geschenk gekauft.', ['baka', 'baku', 'baki'], 'baki'],
    ],
  ),
  lesson(
    {
      id: 'l8',
      title: 'Osjećaji',
      subtitle: 'Gefühle zeigen',
      place: 'Dubrovnik',
      placeFact: 'Die Stadtmauern von Dubrovnik sind fast 2 km lang – man kann die ganze Altstadt umrunden.',
      emoji: '❤️',
      grammarTitle: 'Gefühle mit Dativ',
      grammar:
        'Viele Gefühle drückt man mit „mir/dir“ aus: Drago mi je (Es freut mich), Žao mi je (Es tut mir leid), Hladno mi je (Mir ist kalt). mi = mir, ti = dir, mu = ihm, joj = ihr, nam = uns.',
    },
    [
      ['Nedostaješ mi.', 'Du fehlst mir.', 'Bako, jako mi nedostaješ.', 'Oma, du fehlst mir sehr.'],
      ['Drago mi je.', 'Es freut mich.', 'Drago mi je što si došao.', 'Es freut mich, dass du gekommen bist.'],
      ['Žao mi je.', 'Es tut mir leid.', 'Žao mi je, nisam znao.', 'Es tut mir leid, ich wusste es nicht.'],
      ['Volim te.', 'Ich hab dich lieb.', 'Volim te, mama.', 'Ich hab dich lieb, Mama.'],
      ['Ponosan sam na tebe.', 'Ich bin stolz auf dich.', 'Djed kaže: ponosan sam na tebe.', 'Opa sagt: Ich bin stolz auf dich.', ['Ponosna sam na tebe.']],
      ['umoran', 'müde', 'Umoran sam od puta.', 'Ich bin müde von der Reise.', ['umorna']],
      ['sretan', 'glücklich', 'Baka je sretna kad smo svi tu.', 'Oma ist glücklich, wenn wir alle da sind.', ['sretna']],
      ['tužan', 'traurig', 'Zašto si tužan?', 'Warum bist du traurig?', ['tužna']],
      ['brinuti se', 'sich Sorgen machen', 'Mama se uvijek brine.', 'Mama macht sich immer Sorgen.'],
      ['Bit će bolje.', 'Es wird besser.', 'Ne brini, bit će bolje.', 'Mach dir keine Sorgen, es wird besser.'],
      ['zdravlje', 'die Gesundheit', 'Najvažnije je zdravlje.', 'Das Wichtigste ist die Gesundheit.'],
      ['Čuvaj se!', 'Pass auf dich auf!', 'Sretan put i čuvaj se!', 'Gute Reise und pass auf dich auf!'],
    ],
    [
      ['Nedostaješ ___.', 'mir', 'Du fehlst mir.', ['mi', 'ti', 'mu'], 'mi'],
      ['Žao ___ je.', 'ihr', 'Es tut ihr leid.', ['joj', 'mu', 'mi'], 'joj'],
      ['Drago ___ je.', 'ihm', 'Es freut ihn.', ['mu', 'joj', 'ti'], 'mu'],
      ['Je li ___ hladno?', 'dir', 'Ist dir kalt?', ['ti', 'mi', 'mu'], 'ti'],
    ],
  ),
];

/** Pseudo-lesson for words the learner adds from their weekly course. */
export const CUSTOM_LESSON_ID = 'kurs';

export const ALL_BUILTIN_CARDS: Card[] = LESSONS.flatMap((l) => l.cards);
export const ALL_DRILLS: Drill[] = LESSONS.flatMap((l) => l.drills);

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
