// =====================================================================
// "Was wäre, wenn du in … geboren wärst?" – Folge: SCHWEIZ
//
// text: Sprechertext. [Anzeige|Aussprache] = Untertitel zeigt "Anzeige",
//       die Stimme liest "Aussprache" (z.B. Zahlen).
// cue:  Wort im Text, bei dem ein Element erscheint (klein geschrieben).
// host: Gesten der Figur: [cue-Wort, Pose, Requisite-Emoji]
//       Posen: idle, wave, present, point, shrug, think, tada, hips
// =====================================================================
window.EPISODE = {
  day: 1, total: 195,
  country: 'Schweiz', inCountry: 'in der Schweiz', flag: '🇨🇭',
  isoId: '756', center: [8.2, 46.8], zoom: 5200, accent: '#e8312f',
  scenes: [
    { type: 'intro',
      text: 'Was wäre, wenn du in der Schweiz geboren wärst?',
      host: [['was', 'wave', '🇨🇭'], ['schweiz', 'present', '🇨🇭']] },

    { type: 'odds', tag: '👶 GEBURT', n: 1600, big: '1 von 1.600', sub: 'Babys weltweit',
      text: 'Erstmal: Glück gehabt. Nur etwa eins von [1.600|sechzehnhundert] Babys weltweit kommt in der Schweiz zur Welt.',
      cue: 'nur', reveal: 'schweiz', pre: { emoji: '🍀', text: 'GLÜCK GEHABT!' },
      host: [['glück', 'tada'], ['nur', 'present'], ['schweiz', 'point']] },

    { type: 'bubbles', tag: '🗣️ SPRACHE',
      text: 'Je nach Region sprichst du Deutsch, Französisch, Italienisch oder Rätoromanisch. Aber zu Hause redest du Schweizerdeutsch – und das versteht in Deutschland kaum jemand.',
      items: [
        { say: 'Hallo!',     lang: 'Deutsch',       cue: 'deutsch' },
        { say: 'Bonjour!',   lang: 'Französisch',   cue: 'französisch' },
        { say: 'Ciao!',      lang: 'Italienisch',   cue: 'italienisch' },
        { say: 'Allegra!',   lang: 'Rätoromanisch', cue: 'rätoromanisch' },
      ],
      finale: { say: 'Grüezi mitenand!', lang: 'Schweizerdeutsch', cue: 'schweizerdeutsch' },
      sticker: { text: '🇩🇪 Hä??', cue: 'versteht' },
      host: [['je', 'present'], ['schweizerdeutsch', 'tada'], ['versteht', 'shrug']] },

    { type: 'stat', tag: '🍫 ESSEN', emoji: '🍫', anim: 'rain',
      value: 10, prefix: '~', unit: ' kg', label: 'Schokolade pro Person & Jahr',
      text: 'Du isst rund [10|zehn] Kilo Schokolade. Pro Jahr!',
      cue: 'isst', sticker: { text: 'PRO JAHR!', cue: 'pro', n: 1 },
      host: [['du', 'present', '🍫'], ['pro', 'tada', '🍫']] },

    { type: 'versus', tag: '💰 GELD',
      text: 'Dein mittlerer Lohn: rund [6.800|sechstausendachthundert] Franken im Monat. Dafür kostet dich ein Kaffee fast fünf Franken.',
      cards: [
        { emoji: '💰', value: '6.800 CHF', label: 'Lohn pro Monat', cue: 'lohn', color: '#5cf29a' },
        { emoji: '☕', value: '~5 CHF', label: 'ein Kaffee', cue: 'kaffee', color: '#ff4f8b' },
      ],
      mid: { text: 'ABER', cue: 'dafür' },
      host: [['lohn', 'tada', '💰'], ['dafür', 'shrug', '☕']] },

    { type: 'stat', tag: '🚆 ALLTAG', emoji: '🚆', anim: 'slide',
      value: 90, prefix: '>', unit: ' %', label: 'der Züge sind pünktlich',
      text: 'Dein Zug ist zu über [90|neunzig] Prozent pünktlich. Drei Minuten Verspätung? Ein Skandal!',
      cue: 'zug', sticker: { text: '+3 Min. = SKANDAL 😱', cue: 'skandal' },
      host: [['zug', 'point'], ['drei', 'think'], ['skandal', 'shrug']] },

    { type: 'versus', tag: '🪖 PFLICHT',
      text: 'Als Mann musst du ins Militär. Und dein Sturmgewehr bewahrst du oft zu Hause im Schrank auf.',
      cards: [
        { emoji: '🪖', value: 'Militär', label: 'Pflicht für Männer', cue: 'militär', color: '#9bd36b' },
        { emoji: '🏠', value: 'Zuhause', label: 'Gewehr im Schrank', cue: 'sturmgewehr', color: '#ffd23f' },
      ],
      host: [['mann', 'present'], ['sturmgewehr', 'think']] },

    { type: 'life', tag: '❤️ LEBEN', value: 84, world: 73,
      text: 'Und das Beste: Du wirst im Schnitt fast [84|vierundachtzig] Jahre alt.',
      cue: 'du',
      host: [['beste', 'tada'], ['jahre', 'point']] },

    { type: 'outro',
      text: 'Tag [1|eins] von [195|hundertfünfundneunzig]. Welches Land kommt morgen? Schreib es in die Kommentare!',
      host: [['tag', 'present'], ['welches', 'think'], ['schreib', 'wave']] },
  ],
};
