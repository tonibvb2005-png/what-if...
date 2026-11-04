import { useEffect, useRef, useState } from 'react';
import type { AppState } from '../types';
import { LESSONS } from '../content/lessons';
import { badges, currentStreak, level } from '../game/profile';
import { SOLID_STAGE } from '../srs/srs';
import { addDays } from '../lib/date';
import { hasCroatianVoice, onVoicesChanged, speak, speechSupported } from '../lib/speech';
import { parseState } from '../storage/store';

interface Props {
  state: AppState;
  day: string;
  onUpdate: (fn: (s: AppState) => AppState) => void;
  onReplace: (s: AppState) => void;
}

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const GOALS = [
  { xp: 30, label: 'Locker', hint: '~5 Min.' },
  { xp: 50, label: 'Normal', hint: '~10 Min.' },
  { xp: 100, label: 'Ehrgeizig', hint: '~20 Min.' },
];

export function Progress({ state, day, onUpdate, onReplace }: Props) {
  const p = state.profile;
  const reviews = Object.values(state.reviews);
  const solid = reviews.filter((r) => r.stage >= SOLID_STAGE).length;
  const accuracy = p.answers.total ? Math.round((p.answers.correct / p.answers.total) * 100) : 0;
  const week = Array.from({ length: 7 }, (_, i) => addDays(day, i - 6));
  const maxXp = Math.max(p.dailyGoal, ...week.map((d) => p.history[d] ?? 0));
  const allBadges = badges(state, LESSONS);
  const [voice, setVoice] = useState(hasCroatianVoice());
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => onVoicesChanged(() => setVoice(hasCroatianVoice())), []);

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `polako-backup-${day}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importData(file: File) {
    try {
      const data = parseState(JSON.parse(await file.text()));
      if (confirm('Fortschritt aus der Datei laden? Der aktuelle Stand wird ersetzt.')) onReplace(data);
    } catch {
      alert('Die Datei konnte nicht gelesen werden.');
    }
  }

  return (
    <div className="page">
      <h1>📈 Fortschritt</h1>

      <section className="grid-stats">
        <div className="card stat-tile">
          <strong>{reviews.length}</strong>
          <span>Wörter gelernt</span>
        </div>
        <div className="card stat-tile">
          <strong>{solid}</strong>
          <span>sicher im Kopf</span>
        </div>
        <div className="card stat-tile">
          <strong>{accuracy}%</strong>
          <span>Trefferquote</span>
        </div>
        <div className="card stat-tile">
          <strong>{currentStreak(p, day)} 🔥</strong>
          <span>Rekord: {p.bestStreak} {p.bestStreak === 1 ? "Tag" : "Tage"}</span>
        </div>
        <div className="card stat-tile">
          <strong>{level(p.xp).level}</strong>
          <span>Level · {p.xp} XP</span>
        </div>
        <div className="card stat-tile">
          <strong>{p.freezes} 🧊</strong>
          <span>Streak-Schutz</span>
        </div>
      </section>

      <section className="card">
        <h2>Letzte 7 Tage</h2>
        <div className="week" role="img" aria-label="XP der letzten 7 Tage">
          {week.map((d) => {
            const xp = p.history[d] ?? 0;
            const [y, m, dd] = d.split('-').map(Number);
            return (
              <div key={d} className="week-day">
                <span className="small muted">{xp || ''}</span>
                <div className="week-bar">
                  <div
                    className={xp >= p.dailyGoal ? 'reached' : ''}
                    style={{ height: `${(xp / maxXp) * 100}%` }}
                  />
                </div>
                <span className={d === day ? 'small strong' : 'small muted'}>{WEEKDAYS[new Date(y, m - 1, dd).getDay()]}</span>
              </div>
            );
          })}
        </div>
      </section>

      <h2 className="section-title">Abzeichen</h2>
      <ul className="badges">
        {allBadges.map((b) => (
          <li key={b.id} className={b.earned ? 'badge earned' : 'badge'} title={b.description}>
            <span className="badge-emoji">{b.earned ? b.emoji : '❔'}</span>
            <strong>{b.title}</strong>
            <span className="small muted">{b.description}</span>
          </li>
        ))}
      </ul>

      <h2 className="section-title">⚙️ Einstellungen</h2>
      <section className="card settings">
        <div>
          <strong>Tagesziel</strong>
          <div className="segmented">
            {GOALS.map((g) => (
              <button
                key={g.xp}
                type="button"
                className={p.dailyGoal === g.xp ? 'active' : ''}
                onClick={() => onUpdate((s) => ({ ...s, profile: { ...s.profile, dailyGoal: g.xp } }))}
              >
                {g.label}
                <small>
                  {g.xp} XP · {g.hint}
                </small>
              </button>
            ))}
          </div>
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={p.unlockAll}
            onChange={(e) => onUpdate((s) => ({ ...s, profile: { ...s.profile, unlockAll: e.target.checked } }))}
          />
          <span>
            <strong>Alle Lektionen freischalten</strong>
            <small className="muted">Praktisch, wenn du ein Thema schon aus dem Kurs kennst.</small>
          </span>
        </label>

        <div>
          <strong>Aussprache</strong>
          <p className="small muted">
            {!speechSupported()
              ? 'Dein Browser unterstützt keine Sprachausgabe.'
              : voice
                ? 'Kroatische Stimme gefunden ✓ – Hörübungen sind aktiv.'
                : 'Keine kroatische Stimme installiert. Hörübungen werden ausgelassen. Tipp: In den System-Einstellungen (Sprache/Bedienungshilfen) die Stimme „Kroatisch“ nachladen.'}
          </p>
          <button type="button" className="btn ghost" onClick={() => speak('Dobar dan! Kako si?')}>
            🔊 Testen: „Dobar dan! Kako si?“
          </button>
        </div>

        <div>
          <strong>Sicherung</strong>
          <p className="small muted">Dein Fortschritt wird nur auf diesem Gerät gespeichert. Sichere ihn ab und zu als Datei.</p>
          <div className="row">
            <button type="button" className="btn ghost" onClick={exportData}>
              ⬇ Exportieren
            </button>
            <button type="button" className="btn ghost" onClick={() => fileInput.current?.click()}>
              ⬆ Importieren
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = '';
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
