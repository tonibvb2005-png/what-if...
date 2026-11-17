// =====================================================================
// "Was wäre, wenn du in … geboren wärst?" – mit Nomi
// Folge: SCHWEIZ
//
// text:  Sprechertext. [Anzeige|Aussprache] → Untertitel zeigt "Anzeige",
//        die Stimme liest "Aussprache". {1.5} = 1,5 s Pause.
// cue:   Wort, bei dem etwas passiert (klein geschrieben, ohne Satzzeichen)
// nomi:  Gesten von Nomi: [cue-Wort, Pose, Emoji in der Hand]
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
      text: 'Wo bist du heute geboren? {2.2} In der Schweiz!',
      stop: 'schweiz',
      nomi: [['wo', 'present'], ['in', 'think'], ['schweiz', 'tada']] },

    { type: 'title',
      text: 'Was wäre, wenn du in der Schweiz geboren wärst? Komm mit, ich zeig es dir!',
      nomi: [['was', 'present'], ['komm', 'wave']] },

    { type: 'birth', time: 'Tag 1', icon: '👶',
      text: 'Du kommst in Zürich zur Welt. Nur etwa eins von [1.600|sechzehnhundert] Babys weltweit wird hier geboren.',
      stickers: [{ text: '1 von 1.600 Babys 🌍', cue: 'nur' }] },

    { type: 'bedroom', time: '07:00', icon: '☀️',
      text: 'Sieben Uhr. Aus deinem Fenster: die Alpen. Sie bedecken rund [60|sechzig] Prozent des Landes.',
      stickers: [{ text: '~60 % Alpen 🏔️', cue: 'alpen' }],
      nomi: [['sieben', 'stretch', null, 'yawn'], ['fenster', 'point'], ['bedecken', 'hips']] },

    { type: 'kitchen', time: '07:20', icon: '🥣',
      text: 'Zum Frühstück: Birchermüesli. Das wurde übrigens hier in Zürich erfunden.',
      stickers: [{ text: 'Erfunden in Zürich!', cue: 'erfunden' }],
      nomi: [['zum', 'eat'], ['übrigens', 'present'], ['erfunden', 'eat']] },

    { type: 'station', time: '07:52', icon: '🚆',
      text: 'Dein Zug kommt auf die Minute. Über [90|neunzig] Prozent sind pünktlich. Drei Minuten zu spät? Ein Skandal!',
      arrive: 'minute',
      stickers: [{ text: '> 90 % pünktlich', cue: 'über' }, { text: '+3 Min = SKANDAL 😱', cue: 'skandal' }],
      nomi: [['dein', 'watch'], ['minute', 'present'], ['drei', 'think'], ['skandal', 'shrug', null, 'wow']] },

    { type: 'classroom', time: '08:15', icon: '🏫',
      text: 'In der Schule redest du Schweizerdeutsch und lernst früh Französisch. Das Land hat vier Sprachen!',
      board: [['Grüezi', 'schweizerdeutsch'], ['Bonjour', 'französisch'], ['Ciao', 'vier'], ['Allegra', 'sprachen']],
      nomi: [['in', 'sitdesk'], ['französisch', 'raise'], ['vier', 'sitdesk']] },

    { type: 'snack', time: '10:00', icon: '🍫',
      text: 'Pause! Und in der Pause gibt es natürlich Schokolade. Rund [10|zehn] Kilo pro Jahr isst man hier.',
      stickers: [{ text: '~10 kg pro Jahr 🍫', cue: 'rund' }],
      nomi: [['pause', 'tada'], ['schokolade', 'munch', '🍫'], ['rund', 'hold', '🍫', 'wow']] },

    { type: 'cafe', time: '17:30', icon: '☕', later: 'Jahre später …',
      text: 'Jahre später verdienst du richtig gut. Aber ein Kaffee kostet dich fast fünf Franken!',
      stickers: [{ text: 'Lohn ~6.800 CHF / Monat', cue: 'verdienst' }],
      receipt: { text: '4.90 CHF', cue: 'kaffee' },
      nomi: [['jahre', 'idle'], ['verdienst', 'tada'], ['kaffee', 'cup', '☕'], ['fünf', 'cup', '☕', 'wow']] },

    { type: 'lake', time: '21:00', icon: '🌙',
      text: 'Und abends am See weißt du: Hier wirst du im Schnitt fast [84|vierundachtzig] Jahre alt.',
      stickers: [{ text: 'Ø 84 Jahre ❤️', cue: 'jahre' }],
      nomi: [['und', 'bench'], ['jahre', 'bench']] },

    { type: 'outro',
      text: 'Und wo bist du morgen geboren? Schreib es in die Kommentare!',
      nomi: [['und', 'think'], ['schreib', 'wave']] },
  ],
};
