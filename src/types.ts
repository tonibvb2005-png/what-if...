export interface Card {
  id: string;
  /** Croatian text (the answer when typing). */
  hr: string;
  /** German meaning. */
  de: string;
  /** Other accepted Croatian answers, e.g. the feminine form. */
  alt?: string[];
  exampleHr?: string;
  exampleDe?: string;
  lessonId: string;
}

/** A gap-fill grammar drill ("Fall-Fänger"). The sentence contains "___". */
export interface Drill {
  id: string;
  sentence: string;
  hint: string;
  de: string;
  options: string[];
  answer: string;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  place: string;
  placeFact: string;
  emoji: string;
  /** Heading of the journey part this lesson starts or belongs to. */
  part?: string;
  grammarTitle: string;
  grammar: string;
  cards: Card[];
  drills: Drill[];
}

export interface Review {
  cardId: string;
  /** 0 = new, 1 = introduced, 2..5 = growing mastery. */
  stage: number;
  ease: number;
  intervalDays: number;
  /** Local date string YYYY-MM-DD. */
  due: string;
  reps: number;
  lapses: number;
}

export type Grade = 'correct' | 'almost' | 'wrong';

export interface Profile {
  xp: number;
  streak: number;
  bestStreak: number;
  freezes: number;
  lastActive: string | null;
  dailyGoal: number;
  /** XP earned per day (YYYY-MM-DD → XP). */
  history: Record<string, number>;
  answers: { correct: number; total: number };
  perfectSessions: number;
  unlockAll: boolean;
}

export interface AppState {
  version: 1;
  profile: Profile;
  reviews: Record<string, Review>;
  customCards: Card[];
}
