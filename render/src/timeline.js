// Script -> word timings -> caption groups + sentence anchors.
// Token syntax: "word|N" overrides the syllable count used for timing (for numbers).
// If window.VOICE_TIMINGS (array of {w,start,end}) is set, it replaces the estimate.
export const SCRIPT = [
  ['hook', 'What if the guy with the water jug had stayed home?'],
  ['egypt', 'Egypt. 1900|4 BC.|2'],
  ['statue', 'A 58-ton|4 statue sits on a wooden sledge.'],
  ['men', '172|7 men grab the ropes.'],
  ['oneman', 'And one man… just pours water. Onto the sand.'],
  ['laugh', 'The workers laugh. "He\'s watering the desert!"'],
  ['overseer', 'The overseer is furious. "That water is worth more than you. Put it down!"'],
  ['shrug', 'He shrugs. And keeps pouring.'],
  ['pull', 'They pull. And the sledge glides like it\'s on ice.'],
  ['ritual', 'For thousands of years, people thought he was doing a ritual.'],
  ['lab', 'Then, in 2014,|4 physicists tested it.'],
  ['macro', 'Wet sand sticks together, so the sledge stops digging in.'],
  ['half', 'The pulling force drops by half.'],
  ['whatif', 'Without him? They\'d need twice as many men.'],
  ['wall', 'That\'s why he\'s painted on the tomb wall.'],
  ['front', 'Right at the front.'],
];

const SPEECH_START = 0.12;
const TARGET_SPEECH = 38.4; // seconds of narration
export const TAIL = 1.6;    // wink + hold after narration

function syllables(w) {
  const s = w.toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return 1;
  let n = (s.match(/[aeiouy]+/g) || []).length;
  if (s.endsWith('e') && !s.endsWith('le') && n > 1) n--;
  return Math.max(1, n);
}

const SHORT = new Set(['the', 'a', 'an', 'and', 'of', 'to', 'in', 'on', 'it', 'is', 'he', 'so', 'by', 'at', 'for', 'as', 'that', 'his', 'with', 'what', 'if', 'they', 'one']);

export function buildTimeline() {
  const words = [];
  const sentenceStart = {};
  for (const [id, text] of SCRIPT) {
    const toks = text.split(/\s+/);
    toks.forEach((t, i) => {
      let [disp, syl] = t.split('|');
      syl = syl ? +syl : syllables(disp);
      let pause = 0;
      if (/[.?!…]["”]?$/.test(disp)) pause = 0.16;
      else if (/[,]["”]?$/.test(disp)) pause = 0.07;
      if (disp.includes('…')) pause = 0.32;
      words.push({ disp, dur: 0.07 + 0.165 * syl, pause, sid: id, first: i === 0 });
    });
  }
  const voice = (typeof window !== 'undefined' && window.VOICE_TIMINGS) || null;
  if (voice && voice.length === words.length) {
    words.forEach((w, i) => { w.start = voice[i].start; w.end = voice[i].end; });
  } else {
    const raw = words.reduce((a, w) => a + w.dur + w.pause, 0);
    const k = TARGET_SPEECH / raw;
    let t = SPEECH_START;
    for (const w of words) { w.start = t; w.end = t + w.dur * k; t = w.end + w.pause * k; }
  }
  for (const w of words) if (w.first) sentenceStart[w.sid] = w.start;
  const speechEnd = words[words.length - 1].end;
  // caption groups: 1 word, short function words merge with the next word
  const groups = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const bare = w.disp.toLowerCase().replace(/[^a-z']/g, '');
    const endsSentence = /[.?!…,]["”]?$/.test(w.disp);
    const g = { text: w.disp, start: w.start, end: w.end };
    if (SHORT.has(bare) && !endsSentence && i + 1 < words.length && words[i + 1].sid === w.sid && !/^\d/.test(words[i + 1].disp)) {
      const n = words[i + 1];
      g.text += ' ' + n.disp; g.end = n.end; i++;
    }
    groups.push(g);
  }
  for (let i = 0; i < groups.length; i++) groups[i].hide = i + 1 < groups.length ? groups[i + 1].start : groups[i].end + 0.3;
  return { words, groups, S: sentenceStart, speechEnd, duration: speechEnd + TAIL };
}
