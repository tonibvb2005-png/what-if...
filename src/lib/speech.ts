/** Croatian text-to-speech via the browser's Web Speech API. */

let croatianVoice: SpeechSynthesisVoice | null = null;
let listeners: Array<() => void> = [];

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return;
  const voices = speechSynthesis.getVoices();
  croatianVoice =
    voices.find((v) => v.lang.toLowerCase() === 'hr-hr') ??
    voices.find((v) => v.lang.toLowerCase().startsWith('hr')) ??
    // Serbian/Bosnian voices are a reasonable fallback for pronunciation.
    voices.find((v) => /^(bs|sr-latn)/i.test(v.lang)) ??
    null;
  listeners.forEach((l) => l());
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function speechSupported(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

export function hasCroatianVoice(): boolean {
  return croatianVoice !== null;
}

export function onVoicesChanged(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function speak(text: string, rate = 0.9): void {
  if (!speechSupported()) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/…/g, ''));
  u.lang = croatianVoice?.lang ?? 'hr-HR';
  if (croatianVoice) u.voice = croatianVoice;
  u.rate = rate;
  speechSynthesis.speak(u);
}
