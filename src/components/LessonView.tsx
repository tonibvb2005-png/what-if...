import type { AppState, Lesson } from '../types';
import { LESSONS } from '../content/lessons';
import { isLessonComplete, isLessonUnlocked } from '../game/profile';
import { SOLID_STAGE } from '../srs/srs';
import { SpeakButton } from './exercises/common';

interface Props {
  lesson: Lesson;
  state: AppState;
  onStart: () => void;
  onPractice: () => void;
  onClose: () => void;
}

export function LessonView({ lesson, state, onStart, onPractice, onClose }: Props) {
  const index = LESSONS.indexOf(lesson);
  const unlocked = isLessonUnlocked(state, LESSONS, index);
  const done = isLessonComplete(state, lesson);
  const anyLearned = lesson.cards.some((c) => state.reviews[c.id]);

  return (
    <div className="page">
      <button type="button" className="link back" onClick={onClose}>
        ← Zurück zur Reise
      </button>
      <header className="lesson-head">
        <div className="lesson-emoji">{lesson.emoji}</div>
        <div>
          <p className="muted">
            Station {index + 1} · {lesson.place}
          </p>
          <h1>{lesson.title}</h1>
          <p>{lesson.subtitle}</p>
        </div>
      </header>

      <div className="card fact">📍 {lesson.placeFact}</div>

      {unlocked ? (
        <div className="row">
          {!done && (
            <button type="button" className="btn primary" onClick={onStart}>
              ▶ Lektion lernen
            </button>
          )}
          {anyLearned && (
            <button type="button" className={done ? 'btn primary' : 'btn secondary'} onClick={onPractice}>
              🎯 Frei üben
            </button>
          )}
        </div>
      ) : (
        <div className="card muted">
          🔒 Schließe zuerst „{LESSONS[index - 1].title}“ ab – oder schalte in den Einstellungen alle Lektionen frei.
        </div>
      )}

      <section className="card grammar">
        <h2>📘 Grammatik: {lesson.grammarTitle}</h2>
        <p>{lesson.grammar}</p>
      </section>

      <h2 className="section-title">Wörter & Phrasen</h2>
      <ul className="word-list">
        {lesson.cards.map((c) => {
          const r = state.reviews[c.id];
          const status = !r ? 'neu' : r.stage >= SOLID_STAGE ? 'sicher' : 'gelernt';
          return (
            <li key={c.id}>
              <SpeakButton text={c.hr} />
              <div className="word-main">
                <strong>{c.hr}</strong>
                <span className="muted">{c.de}</span>
              </div>
              <span className={`tag tag-${status}`}>{status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
