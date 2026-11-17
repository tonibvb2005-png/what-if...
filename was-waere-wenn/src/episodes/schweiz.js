// =====================================================================
// "Was wäre, wenn du in … geboren wärst?" – Nomi probiert's aus
// Folge: SCHWEIZ (Tag 1)
//
// text:  Sprechertext (Nomi spricht in der Ich-Form).
//        [Anzeige|Aussprache] → Untertitel zeigt "Anzeige", Stimme liest "Aussprache".
//        {1.5} = 1,5 s Pause.
// nomi:  Gesten: [cue-Wort, Pose, Emoji in der Hand, Gesichtsausdruck]
//        Ausdrücke: happy, excited, surprised, thinking, sleepy, content, doubt
// =====================================================================
window.EPISODE = {
  day: 1,
  country: 'Schweiz', inCountry: 'in der Schweiz', flag: '🇨🇭', accent: '#e8312f',
  reel: ['🇯🇵 Japan', '🇧🇷 Brasilien', '🇳🇬 Nigeria', '🇨🇦 Kanada', '🇮🇳 Indien', '🇮🇹 Italien', '🇦🇺 Australien',
         '🇲🇽 Mexiko', '🇳🇴 Norwegen', '🇪🇬 Ägypten', '🇰🇷 Südkorea', '🇦🇷 Argentinien', '🇹🇷 Türkei', '🇮🇸 Island',
         '🇫🇷 Frankreich', '🇿🇦 Südafrika', '🇺🇸 USA', '🇨🇳 China', '🇬🇷 Griechenland', '🇵🇪 Peru', '🇸🇪 Schweden',
         '🇹🇭 Thailand', '🇩🇪 Deutschland', '🇰🇪 Kenia', '🇵🇹 Portugal', '🇨🇭 Schweiz'],
  scenes: [
    { type: 'roulette',
      text: 'Wo werde ich heute geboren? {2.2} In der Schweiz!',
      stop: 'schweiz',
      nomi: [['wo', 'present'], ['in', 'think'], ['schweiz', 'tada']] },

    { type: 'title',
      text: 'Was wäre, wenn du in der Schweiz geboren wärst? Ich probier es für dich aus!',
      nomi: [['was', 'present'], ['ich', 'wave', null, 'excited']] },

    { type: 'birth', time: 'Tag 1', icon: '👶',
      text: 'Tag eins. Ich bin noch keinen Tag alt – und habe schon eine Krankenversicherung. Die ist hier Pflicht.',
      card: 'krankenversicherung',
      stickers: [{ text: 'Pflicht ab Geburt ✅', cue: 'pflicht' }] },

    { type: 'bedroom', time: '07:00', icon: '☀️',
      text: 'Sieben Uhr. Mein Wecker: eine Kuhglocke. Mein Ausblick: links Berge, rechts Berge. [60|Sechzig] Prozent des Landes sind Alpen.',
      cow: 'kuhglocke',
      stickers: [{ text: 'MUUUH! 🔔', cue: 'kuhglocke' }, { text: '~60 % Alpen 🏔️', cue: 'prozent' }],
      nomi: [['sieben', 'stretch'], ['kuhglocke', 'shrug', null, 'surprised'], ['links', 'lookL'], ['rechts', 'lookR'], ['prozent', 'hips']] },

    { type: 'kitchen', time: '07:20', icon: '🥣',
      text: 'Frühstück: Birchermüesli. Erfunden in Zürich – von einem Arzt. Das schmeckt man auch.',
      stickers: [{ text: 'Dr. Bircher-Benner, um 1900 👨‍⚕️', cue: 'arzt' }],
      nomi: [['frühstück', 'eat'], ['erfunden', 'present'], ['arzt', 'think'], ['schmeckt', 'eat', null, 'doubt']] },

    { type: 'station', time: '07:52', time2: '07:53', icon: '🚆',
      text: 'Mein Zug fährt um [7:52|sieben Uhr zweiundfünfzig]. Ich bin um [7:53|sieben Uhr dreiundfünfzig] da. Über [90|neunzig] Prozent der Züge sind pünktlich. Ich leider nicht.',
      arrive: '753', leave: '753',
      stickers: [{ text: '> 90 % pünktlich 🚆', cue: 'über' }, { text: 'Ich: nicht 🙃', cue: 'leider' }],
      nomi: [['ich', 'idle'], ['über', 'shrug', null, 'doubt'], ['leider', 'shrug', null, 'doubt']] },

    { type: 'classroom', time: '08:15', icon: '🏫',
      text: 'In der Schule lerne ich Deutsch, Französisch und Italienisch. Und trotzdem verstehe ich meinen Opa aus dem Wallis nicht.',
      board: [['Grüezi', 'deutsch'], ['Bonjour', 'französisch'], ['Ciao', 'italienisch'], ['???', 'wallis']],
      stickers: [{ text: 'Walliserdeutsch = Endgegner 👾', cue: 'nicht' }],
      nomi: [['in', 'sitdesk'], ['französisch', 'raise', null, 'excited'], ['trotzdem', 'sitdesk', null, 'doubt']] },

    { type: 'snack', time: '10:00', icon: '🍫',
      text: 'Pause! Schokolade. Rund [10|zehn] Kilo pro Jahr. Das ist keine Pause mehr, das ist ein Lebensstil.',
      stack: 'rund',
      stickers: [{ text: '~10 kg pro Jahr', cue: 'rund' }, { text: 'Lebensstil 🍫😌', cue: 'lebensstil' }],
      nomi: [['pause', 'tada'], ['schokolade', 'munch', '🍫', 'happy'], ['rund', 'hold', '🍫', 'surprised'], ['lebensstil', 'munch', '🍫', 'content']] },

    { type: 'cafe', time: '17:30', icon: '☕', later: 'Jahre später …',
      text: 'Jahre später verdiene ich richtig gut. Dann bestelle ich einen Kaffee. Fast fünf Franken. Mein Gesicht: {1.4}',
      receipt: { text: '4.90 CHF', cue: 'fast' }, zoom: 'gesicht',
      stickers: [{ text: 'Lohn ~6.800 CHF / Monat 💰', cue: 'verdiene' }],
      nomi: [['jahre', 'idle'], ['verdiene', 'tada', null, 'excited'], ['bestelle', 'cup', '☕', 'happy'], ['fast', 'cup', '☕', 'surprised']] },

    { type: 'lake', time: '21:00', icon: '🌙',
      text: 'Abends am See. Hier werde ich im Schnitt [84|vierundachtzig] Jahre alt. Bei den Kaffeepreisen muss ich wohl auch so lange arbeiten.',
      stickers: [{ text: 'Ø 84 Jahre ❤️', cue: 'jahre' }, { text: '… für den Kaffee 😅', cue: 'arbeiten' }],
      nomi: [['abends', 'bench', null, 'content'], ['bei', 'bench', null, 'doubt']] },

    { type: 'outro',
      text: 'Morgen werde ich woanders geboren. Wo? Schreib es in die Kommentare!',
      nomi: [['morgen', 'think'], ['schreib', 'wave', null, 'excited']] },
  ],
};
