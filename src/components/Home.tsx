import type { AppState, Lesson } from '../types';
import { LESSONS } from '../content/lessons';
import { currentStreak, introducedCount, isLessonComplete, isLessonUnlocked, level, solidCount } from '../game/profile';

interface Props {
  state: AppState;
  day: string;
  dueCount: number;
  onStartLesson: (lesson: Lesson) => void;
  onReview: () => void;
  onOpenLesson: (lesson: Lesson) => void;
}

export function Home({ state, day, dueCount, onStartLesson, onReview, onOpenLesson }: Props) {
  const p = state.profile;
  const todayXp = p.history[day] ?? 0;
  const goalPct = Math.min(100, Math.round((todayXp / p.dailyGoal) * 100));
  const lv = level(p.xp);
  const streak = currentStreak(p, day);
  const current = LESSONS.find((l, i) => isLessonUnlocked(state, LESSONS, i) && !isLessonComplete(state, l));

  return (
    <div className="page">
      <section className="stats-bar" aria-label="Dein Stand">
        <div className="stat" title="Tage am Stück">
          <span className={streak > 0 ? 'flame' : 'flame off'}>🔥</span>
          <strong>{streak}</strong>
          {p.freezes > 0 && <span className="freeze" title={`${p.freezes} Streak-Schutz`}>🧊{p.freezes}</span>}
        </div>
        <div className="stat" title="Level">
          ⭐ <strong>Level {lv.level}</strong>
          <div className="mini-bar">
            <div style={{ width: `${(lv.into / lv.needed) * 100}%` }} />
          </div>
        </div>
        <div className="stat" title="Gesamt-XP">
          💎 <strong>{p.xp}</strong>
        </div>
      </section>

      <section className="card goal">
        <div className="goal-ring" style={{ '--pct': `${goalPct}%` } as React.CSSProperties}>
          <span>{goalPct >= 100 ? '✓' : `${goalPct}%`}</span>
        </div>
        <div className="goal-text">
          <strong>{goalPct >= 100 ? 'Tagesziel erreicht! Bravo! 🎉' : 'Tagesziel'}</strong>
          <span className="muted">
            {todayXp} / {p.dailyGoal} XP heute
          </span>
        </div>
      </section>

      <section className="actions">
        {current ? (
          <button type="button" className="btn primary big" onClick={() => onStartLesson(current)}>
            <span>▶ Weiterlernen</span>
            <small>
              {current.emoji} {current.title} · {current.place}
              {dueCount > 0 && ` · + ${dueCount} Wiederholungen`}
            </small>
          </button>
        ) : (
          <div className="card center">
            <strong>Alle Stationen geschafft! 🏰</strong>
            <p className="muted">Wiederhole täglich und trag neue Wörter aus deinem Kurs ein.</p>
          </div>
        )}
        <button type="button" className="btn secondary big" onClick={onReview} disabled={dueCount === 0}>
          <span>🔁 Wiederholen</span>
          <small>{dueCount > 0 ? `${dueCount} Wörter sind fällig` : 'Gerade nichts fällig – super!'}</small>
        </button>
      </section>

      <h2 className="section-title">Deine Reise durch Kroatien</h2>
      <ol className="journey">
        {LESSONS.map((l, i) => {
          const unlocked = isLessonUnlocked(state, LESSONS, i);
          const done = isLessonComplete(state, l);
          const learned = introducedCount(state, l.cards);
          const solid = solidCount(state, l.cards);
          const status = done ? 'done' : unlocked ? 'open' : 'locked';
          return (
            <li key={l.id} className={`stop stop-${status} ${l === current ? 'stop-current' : ''}`}>
              <button type="button" onClick={() => onOpenLesson(l)} aria-label={`${l.title} – ${l.place}`}>
                <span className="stop-node">{status === 'locked' ? '🔒' : l.emoji}</span>
                <span className="stop-info">
                  <span className="stop-place">
                    {i + 1}. {l.place}
                  </span>
                  <strong>{l.title}</strong>
                  <span className="muted">{l.subtitle}</span>
                  {unlocked && (
                    <span className="stop-progress">
                      <span className="mini-bar">
                        <span style={{ width: `${(learned / l.cards.length) * 100}%` }} />
                      </span>
                      <span className="muted small">
                        {learned}/{l.cards.length} gelernt{solid > 0 && ` · ${solid} sicher`}
                      </span>
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
