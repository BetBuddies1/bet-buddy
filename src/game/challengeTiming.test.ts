import { describe, expect, it } from 'vitest';
import { createReadyChallengeState } from './challengeTiming';
import type { Question } from './types';

describe('challengeTiming', () => {
  it('draws a concrete category for category-based drawing challenges', () => {
    const drawingQuestion: Question = {
      id: 'q-kreativ-zeichnen-kategorie',
      text: 'Wie viele Begriffe aus einer gezogenen Kategorie kann dein Buddy zeichnen?',
      category: 'spiele-kreativitaet',
      timeLimit: 60,
      type: 'drawing',
      drawingPrompt: 'category',
    };

    expect(createReadyChallengeState(drawingQuestion, 2, () => 0)).toMatchObject({
      count: 0,
      drawingCategory: 'Gegenstände',
      secondsLeft: 60,
      status: 'ready',
      totalSeconds: 60,
    });
  });

  it('does not add a random drawing category to fixed drawing prompts', () => {
    const logosQuestion: Question = {
      id: 'q-kreativ-logos-zeichnen',
      text: 'Wie viele Markenlogos kann dein Buddy so zeichnen, dass sein Team sie errät?',
      category: 'spiele-kreativitaet',
      timeLimit: 60,
      type: 'drawing',
    };

    expect(createReadyChallengeState(logosQuestion, 2, () => 0).drawingCategory).toBeUndefined();
  });
});
