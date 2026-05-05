import { describe, expect, it } from 'vitest';
import { createQuestionDeck, getQuestionBank } from './questionDeck';

describe('questionDeck', () => {
  it('contains local questions from multiple categories', () => {
    const questions = getQuestionBank();
    const categories = new Set(questions.map((question) => question.category));

    expect(questions.length).toBeGreaterThanOrEqual(8);
    expect(categories.size).toBeGreaterThanOrEqual(4);
  });

  it('creates a shuffled copy without dropping or duplicating questions', () => {
    const originalQuestions = getQuestionBank();
    const shuffledQuestions = createQuestionDeck(() => 0);

    expect(shuffledQuestions).not.toBe(originalQuestions);
    expect(shuffledQuestions).not.toEqual(originalQuestions);
    expect(shuffledQuestions.map((question) => question.id).sort()).toEqual(
      originalQuestions.map((question) => question.id).sort(),
    );
  });

  it('returns defensive copies so callers cannot mutate the question bank', () => {
    const firstRead = getQuestionBank();
    const removedQuestion = firstRead.pop();

    expect(removedQuestion).toBeDefined();
    expect(getQuestionBank()).toHaveLength(firstRead.length + 1);
  });

  it('returns defensive question objects so callers cannot mutate future decks', () => {
    const firstQuestion = getQuestionBank()[0];

    firstQuestion.text = 'Manipulierte Frage';

    expect(getQuestionBank()[0].text).not.toBe('Manipulierte Frage');
    expect(createQuestionDeck(() => 0).map((question) => question.text)).not.toContain(
      'Manipulierte Frage',
    );
  });
});
