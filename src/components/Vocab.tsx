import { useMemo, useState } from 'react';
import type { AppState, Card } from '../types';
import { CUSTOM_LESSON_ID, LESSONS } from '../content/lessons';
import { SOLID_STAGE } from '../srs/srs';
import { normalize, stripDiacritics } from '../lib/answer';
import type { VocabDirection, VocabMode } from '../session/buildSession';
import { SpeakButton } from './exercises/common';

export interface VocabSettings {
  lessonIds: string[];
  filter: 'all' | 'learned' | 'hard';
  mode: VocabMode;
  direction: VocabDirection;
  count: number;
}

interface Props {
  state: AppState;
  allCards: Card[];
  onStart: (cards: Card[], settings: VocabSettings) => void;
}

const MODES: { id: VocabMode; label: string; hint: string }[] = [
  { id: 'mixed', label: 'Gemischt', hint: 'alles durcheinander' },
  { id: 'flip', label: 'Karteikarten', hint: 'umdrehen & selbst prüfen' },
  { id: 'choice', label: 'Auswahl', hint: '4 Möglichkeiten' },
  { id: 'type', label: 'Schreiben', hint: 'auf Kroatisch tippen' },
];
const DIRECTIONS: { id: VocabDirection; label: string }[] = [
  { id: 'hr-de', label: 'Kroatisch → Deutsch' },
  { id: 'de-hr', label: 'Deutsch → Kroatisch' },
  { id: 'mixed', label: 'Beides' },
];
const COUNTS = [10, 20, 50, 0];
const FILTERS: { id: VocabSettings['filter']; label: string }[] = [
  { id: 'all', label: 'Alle Wörter' },
  { id: 'learned', label: 'Schon gelernte' },
  { id: 'hard', label: 'Schwierige' },
];

const SETTINGS_KEY = 'polako-vocab-settings';

function loadSettings(): VocabSettings {
  const base: VocabSettings = { lessonIds: [], filter: 'all', mode: 'mixed', direction: 'mixed', count: 20 };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...base, ...JSON.parse(raw) } : base;
  } catch {
    return base;
  }
}

/** Text for searching: lower case, no diacritics. */
const searchable = (s: string) => stripDiacritics(normalize(s));

export function Vocab({ state, allCards, onStart }: Props) {
  const [settings, setSettingsState] = useState<VocabSettings>(loadSettings);
  const [query, setQuery] = useState('');

  function setSettings(patch: Partial<VocabSettings>) {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // ignore – settings are only a convenience
    }
  }

  const groups = useMemo(
    () => [
      ...LESSONS.map((l) => ({ id: l.id, label: `${l.emoji} ${l.title}`, cards: l.cards })),
      ...(state.customCards.length
        ? [{ id: CUSTOM_LESSON_ID, label: '✏️ Kurs-Wörter', cards: state.customCards }]
        : []),
    ],
    [state.customCards],
  );

  const all = settings.lessonIds.length === 0;
  const selectedCards = useMemo(() => {
    const ids = new Set(settings.lessonIds);
    const inLessons = all ? allCards : allCards.filter((c) => ids.has(c.lessonId));
    if (settings.filter === 'learned') return inLessons.filter((c) => state.reviews[c.id]);
    if (settings.filter === 'hard') {
      return inLessons.filter((c) => {
        const r = state.reviews[c.id];
        return r && (r.lapses > 0 || r.ease < 2.3);
      });
    }
    return inLessons;
  }, [all, allCards, settings.lessonIds, settings.filter, state.reviews]);

  const count = settings.count === 0 ? selectedCards.length : Math.min(settings.count, selectedCards.length);

  function toggleLesson(id: string) {
    const ids = settings.lessonIds.includes(id)
      ? settings.lessonIds.filter((x) => x !== id)
      : [...settings.lessonIds, id];
    setSettings({ lessonIds: ids.length === groups.length ? [] : ids });
  }

  const q = searchable(query);
  const listed = q
    ? allCards.filter((c) => searchable(c.hr).includes(q) || searchable(c.de).includes(q))
    : selectedCards;

  return (
    <div className="page">
      <h1>📚 Vokabeltrainer</h1>
      <p className="muted">
        Übe beliebige Wörter so oft du willst. Freies Üben bringt XP, ändert aber nichts an deinem Wiederholungsplan.
      </p>

      <section className="card trainer">
        <div className="field">
          <strong>Lektionen</strong>
          <div className="chips-select">
            <button type="button" className={all ? 'pick active' : 'pick'} aria-pressed={all} onClick={() => setSettings({ lessonIds: [] })}>
              Alle
            </button>
            {groups.map((g) => {
              const on = !all && settings.lessonIds.includes(g.id);
              return (
                <button key={g.id} type="button" className={on ? 'pick active' : 'pick'} aria-pressed={on} onClick={() => toggleLesson(g.id)}>
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <strong>Welche Wörter?</strong>
          <div className="segmented">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={settings.filter === f.id ? 'active' : ''} onClick={() => setSettings({ filter: f.id })}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <strong>Übungsart</strong>
          <div className="segmented wrap">
            {MODES.map((m) => (
              <button key={m.id} type="button" className={settings.mode === m.id ? 'active' : ''} onClick={() => setSettings({ mode: m.id })}>
                {m.label}
                <small>{m.hint}</small>
              </button>
            ))}
          </div>
        </div>

        {settings.mode !== 'type' && (
          <div className="field">
            <strong>Richtung</strong>
            <div className="segmented wrap">
              {DIRECTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={settings.direction === d.id ? 'active' : ''}
                  onClick={() => setSettings({ direction: d.id })}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <strong>Anzahl</strong>
          <div className="segmented">
            {COUNTS.map((n) => (
              <button key={n} type="button" className={settings.count === n ? 'active' : ''} onClick={() => setSettings({ count: n })}>
                {n === 0 ? 'Alle' : n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="btn primary big"
          disabled={count === 0}
          onClick={() => onStart(selectedCards, settings)}
        >
          <span>▶ {count} Vokabeln üben</span>
          <small>
            {count === 0
              ? settings.filter === 'hard'
                ? 'Noch keine schwierigen Wörter – super!'
                : 'Für diese Auswahl gibt es noch keine Wörter.'
              : `aus ${selectedCards.length} passenden Wörtern`}
          </small>
        </button>
      </section>

      <h2 className="section-title">Wörterliste</h2>
      <input
        id="vocab-search"
        className="text-input"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Suchen, z. B. baka oder Oma …"
        aria-label="Wörter suchen"
      />
      <p className="small muted">
        {q ? `${listed.length} Treffer in allen Lektionen` : `${listed.length} Wörter in deiner Auswahl`}
      </p>
      {listed.length > 0 && (
        <ul className="word-list">
          {listed.map((c) => {
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
      )}
    </div>
  );
}
