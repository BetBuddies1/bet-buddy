import type { ChallengeState } from './challengeTypes';
import { getInitialChallengeSeconds } from './formatters';
import type { Question } from './types';

export const drawingCategoryOptions = [
  'Gegenstände',
  'Sport',
  'Tiere',
  'Marken',
] as const;

export function createReadyChallengeState(
  question: Question,
  currentBid: number,
  random = Math.random,
): ChallengeState {
  const seconds = getInitialChallengeSeconds(question, currentBid);
  const drawingCategory =
    question.type === 'drawing' && question.drawingPrompt === 'category'
      ? drawDrawingCategory(random)
      : undefined;

  return {
    count: 0,
    ...(drawingCategory !== undefined ? { drawingCategory } : {}),
    secondsLeft: seconds,
    startedAtMs: null,
    status: 'ready',
    totalSeconds: seconds,
  };
}

function drawDrawingCategory(random: () => number) {
  const categoryIndex = Math.min(
    drawingCategoryOptions.length - 1,
    Math.floor(random() * drawingCategoryOptions.length),
  );

  return drawingCategoryOptions[categoryIndex];
}

export function getCurrentChallengeTiming(challengeState: ChallengeState) {
  if (challengeState.startedAtMs === null) {
    return {
      elapsedSeconds: challengeState.count,
      secondsLeft: challengeState.secondsLeft,
    };
  }

  const elapsedSeconds = Math.min(
    challengeState.totalSeconds,
    Math.max(0, Math.floor((Date.now() - challengeState.startedAtMs) / 1000)),
  );

  return {
    elapsedSeconds,
    secondsLeft: Math.max(0, challengeState.totalSeconds - elapsedSeconds),
  };
}
