import { useEffect, useRef, useState } from 'react';
import type { Card, Grade } from '../types';
import { type Exercise, pickOptions } from '../session/buildSession';
import { XP } from '../game/profile';
import { Choice, DrillExercise, Flip, IntroCard, Match, Puzzle, TypeAnswer } from './exercises/Exercises';
import { type ExerciseResult, SpeakButton } from './exercises/common';

export interface SessionSummary {
  xp: number;
  correct: number;
  total: number;
  newWords: number;
  perfect: boolean;
}

interface Props {
  title: string;
  exercises: Exercise[];
  allCards: Card[];
  /** In practice mode results do not change the review schedule. */
  practice?: boolean;
  onIntro: (card: Card) => void;
  onGrade: (card: Card, grade: Grade) => void;
  onXp: (amount: number) => void;
  onFinish: (summary: SessionSummary) => void;
  onExit: () => void;
}

function xpFor(ex: Exercise, grade: Grade): number {
  if (grade === 'wrong') return 0;
  switch (ex.kind) {
    case 'match':
      return grade === 'correct' ? XP.match : Math.round(XP.match / 2);
    case 'puzzle':
      return XP.puzzle;
    case 'drill':
      return XP.drill;
    case 'flip':
      return XP.flip;
    default:
      return grade === 'correct' ? XP.correct : XP.almost;
  }
}

const PRAISE = ['Bravo!', 'Odlično!', 'Super!', 'Tako je!', 'Svaka čast!', 'Izvrsno!'];

export function Session({ title, exercises, allCards, practice, onIntro, onGrade, onXp, onFinish, onExit }: Props) {
  const [queue, setQueue] = useState(exercises);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const stats = useRef({ xp: 0, correct: 0, total: 0, newWords: 0, retried: new Set<string>() });
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const continueBtn = useRef<HTMLButtonElement>(null);

  const ex = queue[index];

  useEffect(() => {
    if (result || ex?.kind === 'intro') continueBtn.current?.focus();
  }, [result, ex]);

  function handleResult(r: ExerciseResult) {
    if (!ex || result) return;
    const s = stats.current;
    s.total += 1;
    if (r.grade !== 'wrong') s.correct += 1;
    const xp = xpFor(ex, r.grade);
    s.xp += xp;
    if (xp) onXp(xp);
    if ('card' in ex && !practice) onGrade(ex.card, r.grade);

    // Wrong cards come back once at the end (flashcards as flashcards, everything else as an easier choice).
    let nextQueue = queue;
    if (r.grade === 'wrong' && 'card' in ex && !s.retried.has(ex.card.id)) {
      s.retried.add(ex.card.id);
      const card = ex.card;
      const retry: Exercise =
        ex.kind === 'flip'
          ? { ...ex }
          : { kind: 'choice', card, direction: 'de-hr', options: pickOptions(card, allCards, 'hr', Math.random) };
      nextQueue = [...queue, retry];
      setQueue(nextQueue);
    }
    if (r.skipFeedback) advance(nextQueue);
    else setResult(r);
  }

  function next() {
    if (ex?.kind === 'intro') {
      if (!practice) onIntro(ex.card);
      stats.current.newWords += 1;
      stats.current.xp += XP.intro;
      onXp(XP.intro);
    }
    advance(queue);
  }

  function advance(q: Exercise[]) {
    setResult(null);
    if (index + 1 < q.length) {
      setIndex(index + 1);
      return;
    }
    const s = stats.current;
    const perfect = s.total > 0 && s.correct === s.total;
    const bonus = XP.sessionBonus + (perfect ? XP.perfectBonus : 0);
    onXp(bonus);
    const sum = { xp: s.xp + bonus, correct: s.correct, total: s.total, newWords: s.newWords, perfect };
    setSummary(sum);
    onFinish(sum);
  }

  if (summary) {
    const pct = summary.total ? Math.round((summary.correct / summary.total) * 100) : 100;
    return (
      <div className="session">
        <div className="summary">
          <div className="summary-emoji pop">{summary.perfect ? '🏆' : '🎉'}</div>
          <h2>{summary.perfect ? 'Bez greške – ohne Fehler!' : 'Bravo, Runde geschafft!'}</h2>
          {summary.newWords === 0 && practice && <p className="muted">Freies Üben – dein Wiederholungsplan bleibt unverändert.</p>}
          <div className="summary-stats">
            <div>
              <strong>+{summary.xp}</strong>
              <span>XP</span>
            </div>
            <div>
              <strong>{pct}%</strong>
              <span>richtig</span>
            </div>
            <div>
              <strong>{practice ? summary.total : summary.newWords}</strong>
              <span>{practice ? 'Aufgaben' : 'neue Wörter'}</span>
            </div>
          </div>
          <button type="button" className="btn primary wide" onClick={onExit} autoFocus>
            Weiter
          </button>
        </div>
      </div>
    );
  }

  if (!ex) {
    return (
      <div className="session">
        <div className="summary">
          <div className="summary-emoji">☀️</div>
          <h2>Gerade nichts zu tun</h2>
          <p className="muted">Alle Wiederholungen sind erledigt. Komm später wieder oder starte eine neue Lektion.</p>
          <button type="button" className="btn primary wide" onClick={onExit}>
            Zurück
          </button>
        </div>
      </div>
    );
  }

  const progress = (index / queue.length) * 100;
  const locked = result !== null;
  const key = `${index}`;

  return (
    <div className="session">
      <header className="session-top">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="Lernrunde beenden">
          ✕
        </button>
        <div className="progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <div style={{ width: `${progress}%` }} />
        </div>
        <span className="session-title">{practice ? `Üben · ${title}` : title}</span>
      </header>

      <main className="session-body">
        {ex.kind === 'intro' && <IntroCard key={key} card={ex.card} />}
        {ex.kind === 'choice' && (
          <Choice key={key} card={ex.card} options={ex.options} direction={ex.direction} locked={locked} onResult={handleResult} />
        )}
        {ex.kind === 'listen' && (
          <Choice key={key} card={ex.card} options={ex.options} direction="hr-de" listen locked={locked} onResult={handleResult} />
        )}
        {ex.kind === 'flip' && <Flip key={key} card={ex.card} direction={ex.direction} locked={locked} onResult={handleResult} />}
        {ex.kind === 'type' && <TypeAnswer key={key} card={ex.card} locked={locked} onResult={handleResult} />}
        {ex.kind === 'puzzle' && <Puzzle key={key} card={ex.card} tokens={ex.tokens} locked={locked} onResult={handleResult} />}
        {ex.kind === 'drill' && <DrillExercise key={key} drill={ex.drill} locked={locked} onResult={handleResult} />}
        {ex.kind === 'match' && <Match key={key} cards={ex.cards} locked={locked} onResult={handleResult} />}
      </main>

      <footer className={`feedback ${result ? `feedback-${result.grade}` : ''}`} aria-live="polite">
        {result && (
          <div className="feedback-text">
            <strong>
              {result.grade === 'correct'
                ? PRAISE[index % PRAISE.length]
                : result.grade === 'almost'
                  ? 'Fast richtig!'
                  : 'Nicht ganz – richtig ist:'}
            </strong>
            {result.solution && (
              <div className="solution">
                {result.solution} {result.speakText && <SpeakButton text={result.speakText} />}
              </div>
            )}
            {result.note && <div className="note">{result.note}</div>}
          </div>
        )}
        {(result || ex.kind === 'intro') && (
          <button ref={continueBtn} type="button" className="btn primary wide" onClick={next}>
            {ex.kind === 'intro' ? 'Verstanden' : 'Weiter'}
          </button>
        )}
      </footer>
    </div>
  );
}
