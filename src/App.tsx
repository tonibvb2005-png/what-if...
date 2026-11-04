import { useEffect, useMemo, useState } from 'react';
import type { Card, Grade, Lesson } from './types';
import { ALL_BUILTIN_CARDS, LESSONS } from './content/lessons';
import { useAppState } from './storage/store';
import { today } from './lib/date';
import { hasCroatianVoice, onVoicesChanged } from './lib/speech';
import { newReview, schedule } from './srs/srs';
import { addXp } from './game/profile';
import { buildPractice, buildSession, dueCards, type Exercise } from './session/buildSession';
import { Home } from './components/Home';
import { LessonView } from './components/LessonView';
import { MyWords } from './components/MyWords';
import { Progress } from './components/Progress';
import { Session } from './components/Session';

type Tab = 'learn' | 'words' | 'progress';

interface ActiveSession {
  title: string;
  exercises: Exercise[];
  practice?: boolean;
}

export function App() {
  const [state, update, replace] = useAppState();
  const [tab, setTab] = useState<Tab>('learn');
  const [openLesson, setOpenLesson] = useState<Lesson | null>(null);
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [voice, setVoice] = useState(hasCroatianVoice());
  const day = today();

  useEffect(() => onVoicesChanged(() => setVoice(hasCroatianVoice())), []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, openLesson, session]);

  const allCards = useMemo(() => [...ALL_BUILTIN_CARDS, ...state.customCards], [state.customCards]);
  const due = useMemo(() => dueCards(allCards, state.reviews, day), [allCards, state.reviews, day]);

  /** Drills of every lesson the learner has started. */
  const startedDrills = () => LESSONS.filter((l) => l.cards.some((c) => state.reviews[c.id])).flatMap((l) => l.drills);

  function startLesson(lesson: Lesson) {
    setSession({
      title: `${lesson.emoji} ${lesson.title}`,
      exercises: buildSession({
        newPool: lesson.cards,
        allCards,
        reviews: state.reviews,
        drills: lesson.drills,
        day,
        voice,
      }),
    });
  }

  function startReview() {
    setSession({
      title: '🔁 Wiederholen',
      exercises: buildSession({ newPool: [], allCards, reviews: state.reviews, drills: startedDrills(), day, voice, maxReviews: 15 }),
    });
  }

  function startPractice(lesson: Lesson) {
    setSession({
      title: `${lesson.emoji} ${lesson.title}`,
      practice: true,
      exercises: buildPractice(lesson.cards, allCards, state.reviews, lesson.drills, voice),
    });
  }

  function startCustom() {
    setSession({
      title: '✏️ Aus dem Kurs',
      exercises: buildSession({ newPool: state.customCards, allCards, reviews: state.reviews, drills: [], day, voice, maxReviews: 5 }),
    });
  }

  const onIntro = (card: Card) =>
    update((s) => (s.reviews[card.id] ? s : { ...s, reviews: { ...s.reviews, [card.id]: newReview(card.id, day) } }));

  const onGrade = (card: Card, grade: Grade) =>
    update((s) => {
      const r = s.reviews[card.id] ?? newReview(card.id, day);
      const answers = {
        correct: s.profile.answers.correct + (grade === 'wrong' ? 0 : 1),
        total: s.profile.answers.total + 1,
      };
      return {
        ...s,
        reviews: { ...s.reviews, [card.id]: schedule(r, grade, day) },
        profile: { ...s.profile, answers },
      };
    });

  const onXp = (amount: number) => update((s) => ({ ...s, profile: addXp(s.profile, amount, day) }));

  if (session) {
    return (
      <Session
        key={session.title + session.exercises.length}
        title={session.title}
        exercises={session.exercises}
        allCards={allCards}
        practice={session.practice}
        onIntro={onIntro}
        onGrade={onGrade}
        onXp={onXp}
        onFinish={(sum) => {
          if (sum.perfect && sum.total >= 5)
            update((s) => ({ ...s, profile: { ...s.profile, perfectSessions: s.profile.perfectSessions + 1 } }));
        }}
        onExit={() => setSession(null)}
      />
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo" aria-hidden>
          🇭🇷
        </span>
        <span className="brand">Polako</span>
        <span className="tagline">Kroatisch, Schritt für Schritt</span>
      </header>

      {tab === 'learn' &&
        (openLesson ? (
          <LessonView
            lesson={openLesson}
            state={state}
            onStart={() => startLesson(openLesson)}
            onPractice={() => startPractice(openLesson)}
            onClose={() => setOpenLesson(null)}
          />
        ) : (
          <Home
            state={state}
            day={day}
            dueCount={due.length}
            onStartLesson={startLesson}
            onReview={startReview}
            onOpenLesson={setOpenLesson}
          />
        ))}
      {tab === 'words' && (
        <MyWords
          state={state}
          onAdd={(card) => update((s) => ({ ...s, customCards: [...s.customCards, card] }))}
          onDelete={(id) =>
            update((s) => {
              const reviews = { ...s.reviews };
              delete reviews[id];
              return { ...s, customCards: s.customCards.filter((c) => c.id !== id), reviews };
            })
          }
          onLearn={startCustom}
        />
      )}
      {tab === 'progress' && <Progress state={state} day={day} onUpdate={update} onReplace={replace} />}

      <nav className="tabbar" aria-label="Navigation">
        {(
          [
            ['learn', '🗺️', 'Lernen'],
            ['words', '✏️', 'Kurs-Wörter'],
            ['progress', '📈', 'Fortschritt'],
          ] as const
        ).map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'active' : ''}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => {
              setTab(id);
              setOpenLesson(null);
            }}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
