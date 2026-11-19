/**
 * Lesson screen (T037): top bar (exit + progress), combo badge, teach cards, exercises, feedback
 * sheet, then the completion screen. Route: #/lesson/<module>/<lesson>[/<seed>] — the optional seed
 * makes a session repeatable (tests, bug reports). A finished lesson is saved (T046); an abandoned
 * one is not. Teach cards of concepts already learned are skipped.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { sfx } from '../../audio/sfx.ts';
import type { ParsedModule } from '../../content/schema.ts';
import { grade as gradeItem } from '../../engine/grade.ts';
import { mulberry32, type Rng } from '../../engine/rng.ts';
import { summarize, type LessonResult } from '../../engine/scoring.ts';
import {
  advance,
  buildSession,
  currentStep,
  isFinished,
  progressOf,
  recordAnswer,
  startSession,
  willReturn,
  type SessionState,
  type Step,
} from '../../engine/session.ts';
import { showCombo } from '../../engine/scoring.ts';
import { completeLesson, progress, seenConcepts } from '../../state/progress.ts';
import type { Answer, Grade } from '../../engine/types.ts';
import { FeedbackSheet, feedbackHeadline } from '../components/FeedbackSheet.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { RankCardView, TeachCard } from '../components/TeachCard.tsx';
import { Button, ProgressBar, Sheet } from '../components/ui.tsx';
import { Exercise } from '../exercises/Exercise.tsx';
import { num } from '../format.ts';
import { lessonsOf, loadModule } from '../modules.ts';
import { href } from '../router.ts';
import { t } from '../strings.ar.ts';
import { Complete } from './Complete.tsx';
import './Lesson.css';

interface Props {
  moduleId: string;
  lessonId: string;
  seed?: number | undefined;
}

export function Lesson({ moduleId, lessonId, seed }: Props) {
  const [module, setModule] = useState<ParsedModule | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setModule(undefined);
    loadModule(moduleId)
      .then((m) => live && setModule(m))
      .catch(() => live && setModule(null));
    return () => {
      live = false;
    };
  }, [moduleId]);

  const lesson = module ? lessonsOf(module).find((l) => l.id === lessonId) : undefined;

  if (module === undefined)
    return (
      <div class="lesson lesson--state" aria-busy="true">
        <Mascot pose="think" size={64} />
        <p>{t.lesson.loading}</p>
      </div>
    );
  if (!module || !lesson)
    return (
      <div class="lesson lesson--state">
        <Mascot pose="think" size={64} />
        <p>{t.lesson.missing}</p>
        <a class="btn btn--primary" href={href('path')}>
          {t.goHome}
        </a>
      </div>
    );
  const all = lessonsOf(module);
  const next = all[all.findIndex((l) => l.id === lesson.id) + 1];
  return (
    <Play
      key={`${moduleId}/${lessonId}/${seed ?? ''}`}
      module={module}
      seed={seed}
      build={(rng) =>
        buildSession(module, lesson, rng, {
          seen: seenConcepts(progress.peek(), module.id, lessonsOf(module)),
        })
      }
      onFinish={(r, s) =>
        completeLesson({
          moduleId: module.id,
          lessonId: lesson.id,
          stars: r.stars,
          accuracy: r.accuracy,
          xp: r.xp,
          right: s.right,
          wrong: s.wrong,
        })
      }
      done={{
        title: lesson.title,
        nextHref: next ? href('lesson', module.id, next.id) : undefined,
        homeHref: href('path'),
        homeLabel: t.complete.home,
      }}
      exitHref={href('path')}
      emptyText={t.lesson.empty}
    />
  );
}

export interface PlayProps {
  module: ParsedModule;
  seed?: number | undefined;
  /** builds the steps of one run (called again on «عيد») */
  build: (rng: Rng) => Step[];
  /** once per finished run */
  onFinish: (result: LessonResult, s: SessionState) => void;
  done: {
    title: string;
    kicker?: string | undefined;
    nextHref?: string | undefined;
    homeHref: string;
    homeLabel: string;
  };
  exitHref: string;
  emptyText: string;
}

/** Plays one session: lessons and reviews share it. */
export function Play({ module, seed, build: buildSteps, onFinish, done, exitHref, emptyText }: PlayProps) {
  const [run, setRun] = useState(0);
  const rng = useMemo(() => mulberry32((seed ?? Date.now()) + run * 7919), [seed, run]);
  const build = (r: Rng) => startSession(buildSteps(r));
  const [s, setS] = useState<SessionState>(() => build(rng));
  const [fb, setFb] = useState<{ grade: Grade; headline: string; returns: boolean } | null>(null);
  const [live, setLive] = useState('');
  const [confirmExit, setConfirmExit] = useState(false);
  const answeredRef = useRef(0);

  // new step → move focus to the prompt so keyboard and screen-reader users start there
  useEffect(() => {
    document.getElementById('ex-prompt')?.focus();
  }, [s.index]);

  const restart = () => {
    const nextRun = run + 1;
    setRun(nextRun);
    setS(build(mulberry32((seed ?? Date.now()) + nextRun * 7919)));
    setFb(null);
  };

  const step = currentStep(s);
  const items = s.steps.filter((x) => x.type === 'item').length;
  const finished = isFinished(s) && items > 0;

  // save once per finished run (replaying saves again; stars never go down)
  const savedRun = useRef(-1);
  useEffect(() => {
    if (!finished || savedRun.current === run) return;
    savedRun.current = run;
    onFinish(summarize(s.answered, s.correct, s.hadMistake), s);
    sfx('complete');
  }, [finished, run]);

  if (isFinished(s) || items === 0) {
    if (items === 0)
      return (
        <div class="lesson lesson--state">
          <Mascot pose="think" size={64} />
          <p>{emptyText}</p>
          <a class="btn btn--primary" href={done.homeHref}>
            {done.homeLabel}
          </a>
        </div>
      );
    return (
      <Complete
        title={done.title}
        kicker={done.kicker}
        result={summarize(s.answered, s.correct, s.hadMistake)}
        nextHref={done.nextHref}
        homeHref={done.homeHref}
        homeLabel={done.homeLabel}
        onAgain={restart}
        seed={s.correct}
      />
    );
  }

  const onAnswer = (a: Answer) => {
    if (fb || step?.type !== 'item') return;
    const g = gradeItem(step.item, a);
    sfx(g.correct ? 'right' : 'wrong');
    const mistakes = typeof a === 'object' ? a.mistakes : 0;
    const headline = feedbackHeadline(g, mistakes, answeredRef.current++);
    setFb({ grade: g, headline, returns: willReturn(s) });
    setLive(g.correct ? headline : `${headline} — ${t.feedback.correctAnswer}: ${g.correctAnswer}`);
    setS(recordAnswer(s, g, rng));
  };
  const onNext = () => {
    setFb(null);
    setLive('');
    setS(advance(s));
  };

  return (
    <div class={`lesson${fb ? ' lesson--fb' : ''}`}>
      <header class="lesson__bar">
        <button
          type="button"
          class="lesson__x"
          aria-label={t.lesson.exit}
          onClick={() => setConfirmExit(true)}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <ProgressBar value={progressOf(s)} label={t.lesson.progress} />
      </header>
      {showCombo(s.combo) && <p class="lesson__combo">{t.lesson.combo(num(s.combo))}</p>}

      <main class="lesson__body">
        {step?.type === 'teach' && (
          <TeachCard module={module} concept={step.concept} onDone={() => setS(advance(s))} />
        )}
        {step?.type === 'rank-card' && (
          <RankCardView card={step.card} rank={module.rank ?? []} onDone={() => setS(advance(s))} />
        )}
        {step?.type === 'item' && (
          <Exercise
            key={`${s.index}:${step.item.key}`}
            module={module}
            item={step.item}
            locked={!!fb}
            onAnswer={onAnswer}
          />
        )}
      </main>

      <div class="visually-hidden" aria-live="assertive">
        {live}
      </div>

      {fb && <FeedbackSheet grade={fb.grade} headline={fb.headline} returns={fb.returns} onNext={onNext} />}

      {confirmExit && (
        <div class="scrim">
          <Sheet role="dialog" label={t.lesson.exitTitle}>
            <h2 class="lesson__exit-title">{t.lesson.exitTitle}</h2>
            <p>{t.lesson.exitBody}</p>
            <div class="lesson__exit-actions">
              <Button onClick={() => setConfirmExit(false)} autoFocus>
                {t.lesson.exitStay}
              </Button>
              <a class="btn btn--alt" href={exitHref}>
                {t.lesson.exitLeave}
              </a>
            </div>
          </Sheet>
        </div>
      )}
    </div>
  );
}
