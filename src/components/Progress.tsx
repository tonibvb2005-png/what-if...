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

  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [importText, setImportText] = useState('');
  const [pendingImport, setPendingImport] = useState<AppState | null>(null);
  const backupCode = JSON.stringify(state);

  async function copyBackup() {
    setShowCode(true);
    try {
      await navigator.clipboard.writeText(backupCode);
      setBackupMsg('Sicherungscode kopiert. Speichere ihn z. B. in einer Notiz.');
    } catch {
      setBackupMsg('Markiere den Code unten und kopiere ihn von Hand.');
    }
  }

  function readImport(text: string) {
    try {
      setPendingImport(parseState(JSON.parse(text)));
      setBackupMsg(null);
    } catch {
      setPendingImport(null);
      setBackupMsg('Der Code konnte nicht gelesen werden. Prüfe, ob er vollständig eingefügt ist.');
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

        <div className="backup">
          <strong>Sicherung</strong>
          <p className="small muted">
            Dein Fortschritt wird nur in diesem Browser gespeichert. Kopiere ab und zu den Sicherungscode, um ihn auf ein
            anderes Gerät zu übertragen oder wiederherzustellen.
          </p>
          <div className="row">
            <button type="button" className="btn ghost" onClick={copyBackup}>
              📋 Sicherungscode kopieren
            </button>
            <button type="button" className="btn ghost" onClick={() => fileInput.current?.click()}>
              ⬆ Aus Datei laden
            </button>
            <input
              ref={fileInput}
              id="backup-file"
              type="file"
              accept="application/json,.json,.txt"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) readImport(await f.text());
                e.target.value = '';
              }}
            />
          </div>
          {showCode && (
            <textarea id="backup-code" className="code" readOnly value={backupCode} onFocus={(e) => e.target.select()} rows={3} />
          )}
          <label className="small" htmlFor="backup-import">
            Sicherungscode einfügen
          </label>
          <textarea
            id="backup-import"
            className="code"
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"version":1, …}'
          />
          <button type="button" className="btn ghost" disabled={!importText.trim()} onClick={() => readImport(importText)}>
            Code prüfen
          </button>
          {pendingImport && (
            <div className="confirm-box">
              <span>
                Gefunden: {pendingImport.profile.xp} XP, gelernte Wörter: {Object.keys(pendingImport.reviews).length}. Der
                aktuelle Stand wird ersetzt.
              </span>
              <div className="row">
                <button type="button" className="btn ghost" onClick={() => setPendingImport(null)}>
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    onReplace(pendingImport);
                    setPendingImport(null);
                    setImportText('');
                    setBackupMsg('Fortschritt geladen.');
                  }}
                >
                  Ja, laden
                </button>
              </div>
            </div>
          )}
          {backupMsg && (
            <p className="small" role="status">
              {backupMsg}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
