import { useState } from 'react';
import type { AppState, Card } from '../types';
import { CUSTOM_LESSON_ID } from '../content/lessons';
import { SOLID_STAGE } from '../srs/srs';
import { DIACRITICS, SpeakButton } from './exercises/common';

interface Props {
  state: AppState;
  onAdd: (card: Card) => void;
  onDelete: (id: string) => void;
  onLearn: () => void;
}

const EMPTY = { hr: '', de: '', exampleHr: '', exampleDe: '' };

export function MyWords({ state, onAdd, onDelete, onLearn }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [focused, setFocused] = useState<'hr' | 'exampleHr'>('hr');
  const cards = state.customCards;
  const newCount = cards.filter((c) => !state.reviews[c.id]).length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.hr.trim() || !form.de.trim()) return;
    onAdd({
      id: `u-${Date.now().toString(36)}`,
      lessonId: CUSTOM_LESSON_ID,
      hr: form.hr.trim(),
      de: form.de.trim(),
      exampleHr: form.exampleHr.trim() || undefined,
      exampleDe: form.exampleDe.trim() || undefined,
    });
    setForm(EMPTY);
  }

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="page">
      <h1>✏️ Aus dem Kurs</h1>
      <p className="muted">
        Trag hier neue Wörter aus deinem wöchentlichen Kroatisch-Kurs ein. Sie werden genauso wie die anderen Wörter
        geübt und wiederholt.
      </p>

      <form className="card form" onSubmit={submit}>
        <label>
          Kroatisch *
          <input value={form.hr} onChange={set('hr')} onFocus={() => setFocused('hr')} lang="hr" placeholder="z. B. svekrva" required />
        </label>
        <label>
          Deutsch *
          <input value={form.de} onChange={set('de')} placeholder="z. B. die Schwiegermutter" required />
        </label>
        <label>
          Beispielsatz (optional)
          <input
            value={form.exampleHr}
            onChange={set('exampleHr')}
            onFocus={() => setFocused('exampleHr')}
            lang="hr"
            placeholder="z. B. Moja svekrva odlično kuha."
          />
        </label>
        <label>
          Übersetzung des Satzes
          <input value={form.exampleDe} onChange={set('exampleDe')} placeholder="z. B. Meine Schwiegermutter kocht ausgezeichnet." />
        </label>
        <div className="diacritics">
          {DIACRITICS.map((d) => (
            <button key={d} type="button" onClick={() => setForm({ ...form, [focused]: form[focused] + d })}>
              {d}
            </button>
          ))}
        </div>
        <button type="submit" className="btn primary" disabled={!form.hr.trim() || !form.de.trim()}>
          + Hinzufügen
        </button>
      </form>

      {cards.length > 0 && (
        <>
          <button type="button" className="btn secondary big" onClick={onLearn} disabled={newCount === 0}>
            <span>▶ Neue Kurs-Wörter lernen</span>
            <small>{newCount > 0 ? `${newCount} noch nicht gelernt` : 'Alle eingetragenen Wörter sind schon in der Wiederholung'}</small>
          </button>
          <h2 className="section-title">Deine Wörter ({cards.length})</h2>
          <ul className="word-list">
            {[...cards].reverse().map((c) => {
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
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`${c.hr} löschen`}
                    onClick={() => confirm(`„${c.hr}“ löschen?`) && onDelete(c.id)}
                  >
                    🗑
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
