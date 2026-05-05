import { describe, expect, it } from 'vitest';
import { createQuestionDeck, filterQuestionsByCategories, getQuestionBank } from './questionDeck';

describe('questionDeck', () => {
  it('contains local questions from multiple categories', () => {
    const questions = getQuestionBank();
    const categories = new Set(questions.map((question) => question.category));

    expect(questions.length).toBeGreaterThanOrEqual(150);
    expect(categories).toEqual(
      new Set([
        'allgemeinwissen',
        'geographie',
        'kreativ',
        'koerperlich',
        'essen-trinken',
        'geschichte',
      ]),
    );
  });

  it('keeps the curated catalogue balanced across all agreed categories', () => {
    const questions = getQuestionBank();
    const counts = questions.reduce<Record<string, number>>((categoryCounts, question) => {
      categoryCounts[question.category] = (categoryCounts[question.category] ?? 0) + 1;
      return categoryCounts;
    }, {});

    expect(counts).toMatchObject({
      allgemeinwissen: 47,
      geographie: 31,
      kreativ: 18,
      koerperlich: 13,
      'essen-trinken': 23,
      geschichte: 25,
    });
  });

  it('uses unique ids and question texts without explicitly rejected prompts', () => {
    const questions = getQuestionBank();
    const ids = questions.map((question) => question.id);
    const texts = questions.map((question) => question.text);

    expect(new Set(ids)).toHaveLength(ids.length);
    expect(new Set(texts)).toHaveLength(texts.length);
    expect(texts.every((text) => /^Wie (viele|oft) /.test(text))).toBe(true);
    expect(texts.some((text) => text.includes('Magnificent Seven'))).toBe(false);
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

  it('filters questions by selected categories without mutating the original deck', () => {
    const questions = getQuestionBank();
    const filteredQuestions = filterQuestionsByCategories(questions, ['kreativ']);

    expect(filteredQuestions.length).toBeGreaterThan(0);
    expect(filteredQuestions.every((question) => question.category === 'kreativ')).toBe(true);
    expect(questions.some((question) => question.category !== 'kreativ')).toBe(true);
  });
});
