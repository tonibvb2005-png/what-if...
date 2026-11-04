import { speak } from '../../lib/speech';
import type { Grade } from '../../types';

export interface ExerciseResult {
  grade: Grade;
  /** Correct solution to show in the feedback panel. */
  solution?: string;
  /** Extra line under the solution (translation, hint …). */
  note?: string;
  /** Croatian text to read out in the feedback panel. */
  speakText?: string;
}

export interface ExerciseProps {
  locked: boolean;
  onResult: (r: ExerciseResult) => void;
}

export function SpeakButton({ text, big = false, label }: { text: string; big?: boolean; label?: string }) {
  return (
    <button
      type="button"
      className={big ? 'speak speak-big' : 'speak'}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
      aria-label={label ?? `Vorlesen: ${text}`}
      title="Anhören"
    >
      🔊
    </button>
  );
}

export const DIACRITICS = ['č', 'ć', 'đ', 'š', 'ž'];
