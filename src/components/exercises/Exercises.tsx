import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card, Drill } from '../../types';
import { checkAnswer, normalize } from '../../lib/answer';
import { speak } from '../../lib/speech';
import { shuffle } from '../../session/buildSession';
import { DIACRITICS, type ExerciseProps, SpeakButton } from './common';

/* ---------- New card ---------- */

export function IntroCard({ card }: { card: Card }) {
  useEffect(() => {
    speak(card.hr);
  }, [card]);
  return (
    <div className="exercise">
      <p className="ex-label">Neu ✨</p>
      <div className="flashcard">
        <div className="flash-hr">
          {card.hr} <SpeakButton text={card.hr} />
        </div>
        <div className="flash-de">{card.de}</div>
        {card.alt?.length ? <div className="flash-alt">auch: {card.alt.join(', ')}</div> : null}
        {card.exampleHr && (
          <div className="example">
            <div>
              {card.exampleHr} <SpeakButton text={card.exampleHr} />
            </div>
            <div className="muted">{card.exampleDe}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Multiple choice (reading or listening) ---------- */

export function Choice({
  card,
  options,
  direction,
  listen = false,
  locked,
  onResult,
}: ExerciseProps & { card: Card; options: string[]; direction: 'hr-de' | 'de-hr'; listen?: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  const answer = direction === 'hr-de' ? card.de : card.hr;

  useEffect(() => {
    if (listen) speak(card.hr);
  }, [card, listen]);

  function pick(opt: string) {
    if (locked) return;
    setPicked(opt);
    if (direction === 'de-hr') speak(opt);
    onResult({
      grade: opt === answer ? 'correct' : 'wrong',
      solution: `${card.hr} = ${card.de}`,
      speakText: card.hr,
    });
  }

  return (
    <div className="exercise">
      {listen ? (
        <>
          <p className="ex-label">Hör-Detektiv 🎧 – Was bedeutet das?</p>
          <div className="prompt-center">
            <SpeakButton text={card.hr} big label="Nochmal anhören" />
            <button type="button" className="link" onClick={() => speak(card.hr, 0.6)}>
              🐢 langsam
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="ex-label">{direction === 'hr-de' ? 'Was bedeutet …' : 'Wie sagt man auf Kroatisch …'}</p>
          <div className="prompt">
            {direction === 'hr-de' ? (
              <>
                {card.hr} <SpeakButton text={card.hr} />
              </>
            ) : (
              card.de
            )}
          </div>
        </>
      )}
      <div className="options">
        {options.map((opt, i) => {
          let cls = 'option';
          if (locked && opt === answer) cls += ' is-right';
          else if (locked && opt === picked) cls += ' is-wrong';
          return (
            <button key={opt} type="button" className={cls} onClick={() => pick(opt)} disabled={locked}>
              <span className="key">{i + 1}</span>
              {opt}
            </button>
          );
        })}
      </div>
      <NumberKeys count={options.length} onKey={(i) => pick(options[i])} disabled={locked} />
    </div>
  );
}

function NumberKeys({ count, onKey, disabled }: { count: number; onKey: (i: number) => void; disabled: boolean }) {
  const ref = useRef(onKey);
  ref.current = onKey;
  useEffect(() => {
    if (disabled) return;
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const n = Number(e.key);
      if (n >= 1 && n <= count) ref.current(n - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [count, disabled]);
  return null;
}

/* ---------- Typing ---------- */

export function TypeAnswer({ card, locked, onResult }: ExerciseProps & { card: Card }) {
  const [value, setValue] = useState('');
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
  }, []);

  function submit(giveUp = false) {
    if (locked) return;
    const res = checkAnswer(giveUp ? '' : value, [card.hr, ...(card.alt ?? [])]);
    onResult({
      grade: res.grade,
      solution: res.expected,
      note:
        res.reason === 'diacritics'
          ? 'Fast! Achte auf die Sonderzeichen (č, ć, đ, š, ž).'
          : res.reason === 'typo'
            ? 'Fast! Kleiner Tippfehler.'
            : card.exampleHr
              ? `${card.exampleHr} – ${card.exampleDe}`
              : undefined,
      speakText: res.expected,
    });
  }

  function insert(ch: string) {
    const el = input.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    setValue(value.slice(0, start) + ch + value.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + 1, start + 1);
    });
  }

  return (
    <div className="exercise">
      <p className="ex-label">Schreib auf Kroatisch ✍️</p>
      <div className="prompt">{card.de}</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={input}
          className="text-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={locked}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          lang="hr"
          placeholder="Antwort eingeben …"
          aria-label="Antwort auf Kroatisch"
        />
        <div className="diacritics">
          {DIACRITICS.map((d) => (
            <button key={d} type="button" onClick={() => insert(d)} disabled={locked}>
              {d}
            </button>
          ))}
        </div>
        {!locked && (
          <div className="row">
            <button type="button" className="btn ghost" onClick={() => submit(true)}>
              Weiß ich nicht
            </button>
            <button type="submit" className="btn primary" disabled={!value.trim()}>
              Prüfen
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

/* ---------- Sentence puzzle ---------- */

export function Puzzle({ card, tokens, locked, onResult }: ExerciseProps & { card: Card; tokens: string[] }) {
  const [placed, setPlaced] = useState<number[]>([]);

  function check() {
    const built = placed.map((i) => tokens[i]).join(' ');
    onResult({
      grade: normalize(built) === normalize(card.exampleHr!) ? 'correct' : 'wrong',
      solution: card.exampleHr,
      note: card.exampleDe,
      speakText: card.exampleHr,
    });
  }

  return (
    <div className="exercise">
      <p className="ex-label">Satz-Puzzle 🧩 – Bring die Wörter in die richtige Reihenfolge</p>
      <div className="prompt small">{card.exampleDe}</div>
      <div className="puzzle-line" aria-label="Dein Satz">
        {placed.length === 0 && <span className="muted">Tippe die Wörter an …</span>}
        {placed.map((i) => (
          <button
            key={i}
            type="button"
            className="chip"
            disabled={locked}
            onClick={() => setPlaced(placed.filter((x) => x !== i))}
          >
            {tokens[i]}
          </button>
        ))}
      </div>
      <div className="chips">
        {tokens.map((t, i) => (
          <button
            key={i}
            type="button"
            className="chip"
            disabled={locked || placed.includes(i)}
            onClick={() => setPlaced([...placed, i])}
          >
            {t}
          </button>
        ))}
      </div>
      {!locked && (
        <div className="row">
          <button type="button" className="btn ghost" onClick={() => setPlaced([])}>
            Zurücksetzen
          </button>
          <button type="button" className="btn primary" disabled={placed.length !== tokens.length} onClick={check}>
            Prüfen
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Grammar gap fill ("Fall-Fänger") ---------- */

export function DrillExercise({ drill, locked, onResult }: ExerciseProps & { drill: Drill }) {
  const [picked, setPicked] = useState<string | null>(null);
  const options = useMemo(() => shuffle(drill.options), [drill]);
  const full = drill.sentence.replace('___', drill.answer);

  function pick(opt: string) {
    if (locked) return;
    setPicked(opt);
    speak(full);
    onResult({ grade: opt === drill.answer ? 'correct' : 'wrong', solution: full, note: drill.de, speakText: full });
  }

  const [before, after] = drill.sentence.split('___');
  return (
    <div className="exercise">
      <p className="ex-label">Fall-Fänger 🎯 – Welche Form passt?</p>
      <div className="prompt">
        {before}
        <span className="gap">{locked ? drill.answer : '___'}</span>
        {after}
      </div>
      <p className="muted center">({drill.hint})</p>
      <div className="options options-row">
        {options.map((opt, i) => {
          let cls = 'option';
          if (locked && opt === drill.answer) cls += ' is-right';
          else if (locked && opt === picked) cls += ' is-wrong';
          return (
            <button key={opt} type="button" className={cls} disabled={locked} onClick={() => pick(opt)}>
              <span className="key">{i + 1}</span>
              {opt}
            </button>
          );
        })}
      </div>
      <NumberKeys count={options.length} onKey={(i) => pick(options[i])} disabled={locked} />
    </div>
  );
}

/* ---------- Matching game ---------- */

export function Match({ cards, locked, onResult }: ExerciseProps & { cards: Card[] }) {
  const left = useMemo(() => shuffle(cards), [cards]);
  const right = useMemo(() => shuffle(cards), [cards]);
  const [sel, setSel] = useState<{ side: 'l' | 'r'; id: string } | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  function tap(side: 'l' | 'r', id: string) {
    if (locked || done.includes(id)) return;
    if (side === 'l') speak(cards.find((c) => c.id === id)!.hr);
    if (!sel || sel.side === side) {
      setSel({ side, id });
      return;
    }
    if (sel.id === id) {
      const next = [...done, id];
      setDone(next);
      setSel(null);
      if (next.length === cards.length) {
        onResult({
          grade: mistakes === 0 ? 'correct' : 'almost',
          solution: mistakes === 0 ? 'Alle Paare ohne Fehler!' : `Alle Paare gefunden (${mistakes} Fehler)`,
        });
      }
    } else {
      setMistakes((m) => m + 1);
      setWrong(`${side}-${id}`);
      setTimeout(() => setWrong(null), 450);
      setSel(null);
    }
  }

  const cls = (side: 'l' | 'r', id: string) =>
    [
      'match-item',
      done.includes(id) && 'is-done',
      sel?.side === side && sel.id === id && 'is-selected',
      wrong === `${side}-${id}` && 'is-wrong shake',
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className="exercise">
      <p className="ex-label">Wort-Match 🔗 – Finde die Paare</p>
      <div className="match">
        <div className="match-col">
          {left.map((c) => (
            <button key={c.id} type="button" className={cls('l', c.id)} onClick={() => tap('l', c.id)}>
              {c.hr}
            </button>
          ))}
        </div>
        <div className="match-col">
          {right.map((c) => (
            <button key={c.id} type="button" className={cls('r', c.id)} onClick={() => tap('r', c.id)}>
              {c.de}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
