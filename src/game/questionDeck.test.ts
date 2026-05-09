import { describe, expect, it } from 'vitest';
import {
  createQuestionDeck,
  filterQuestionsByCategories,
  findNextPlayableQuestionIndex,
  getQuestionBank,
} from './questionDeck';
import type { Question } from './types';

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
      allgemeinwissen: 48,
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

  it('keeps prompts concrete enough for quick table scoring', () => {
    const questions = getQuestionBank();
    const rejectedFragments = [
      'Dinosaurierarten',
    ];

    rejectedFragments.forEach((fragment) => {
      expect(questions.some((question) => question.text.includes(fragment))).toBe(false);
    });
  });

  it('keeps intentionally restored expert and table prompts in the catalogue', () => {
    const questions = getQuestionBank();

    expect(questions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'Wie viele Nobelpreisträgerinnen oder Nobelpreisträger kann dein Buddy nennen?',
          minBid: 1,
        }),
        expect.objectContaining({
          text: 'Wie viele bekannte Milliardärinnen oder Milliardäre kann dein Buddy nennen?',
          minBid: 1,
        }),
        expect.objectContaining({
          text: 'Wie viele Fernsehserien kann dein Buddy nennen?',
          minBid: 1,
        }),
        expect.objectContaining({
          text: 'Wie viele deutsche Autokennzeichen-Kürzel kann dein Buddy nennen?',
          minBid: 1,
        }),
        expect.objectContaining({
          text: 'Wie viele Weltwunder der Antike oder der Neuzeit kann dein Buddy nennen?',
          minBid: 1,
        }),
        expect.objectContaining({
          text: 'Wie viele Begriffe aus einer gezogenen Kategorie kann dein Buddy in 1 Minute so zeichnen, dass sein Team sie errät?',
          minBid: 1,
          timeLimit: 60,
          type: 'drawing',
        }),
        expect.objectContaining({
          text: 'Wie viele Biersorten kann dein Buddy nennen?',
          minBid: 1,
        }),
        expect.objectContaining({
          text: 'Wie viele Mineralwassermarken kann dein Buddy nennen?',
          minBid: 1,
        }),
      ]),
    );
  });

  it('marks questions with the challenge mode they need in the app', () => {
    const questions = getQuestionBank();
    const questionTypes = new Set(questions.map((question) => question.type));
    const questionsByType = questions.reduce<Record<string, typeof questions>>(
      (groupedQuestions, question) => {
        groupedQuestions[question.type] = groupedQuestions[question.type] ?? [];
        groupedQuestions[question.type].push(question);
        return groupedQuestions;
      },
      {},
    );

    expect(questionTypes).toEqual(new Set(['count', 'duration', 'drawing', 'streak']));
    expect(questionsByType.count?.length).toBeGreaterThan(0);
    expect(questionsByType.drawing?.length).toBeGreaterThan(0);
    expect(questionsByType.duration?.length).toBeGreaterThan(0);
    expect(questionsByType.streak?.length).toBeGreaterThan(0);
    expect(questionsByType.drawing?.every((question) => question.timeLimit >= 60)).toBe(true);
    expect(
      questionsByType.duration?.every(
        (question) => question.text.includes('Sekunden') && question.timeLimit >= question.minBid,
      ),
    ).toBe(true);
    expect(questionsByType.count?.every((question) => question.minBid >= 1)).toBe(true);
    expect(questions.every((question) => question.minBid === 1)).toBe(true);
    expect(
      questionsByType.streak?.every((question) => /Treffer|nacheinander/.test(question.text)),
    ).toBe(true);
  });

  it('sets every minimum bid to one', () => {
    const questions = getQuestionBank();

    expect(questions.every((question) => question.minBid === 1)).toBe(true);
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

  it('finds the next playable question while respecting runtime skipped categories', () => {
    const questions: Question[] = [
      {
        id: 'q-a',
        text: 'Wie viele Testantworten kann dein Buddy nennen?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
        minBid: 1,
      },
      {
        id: 'q-b',
        text: 'Wie viele andere Testantworten kann dein Buddy nennen?',
        category: 'allgemeinwissen',
        timeLimit: 30,
        type: 'count',
        minBid: 1,
      },
    ];

    expect(findNextPlayableQuestionIndex(questions, 0)).toBe(0);
    expect(findNextPlayableQuestionIndex(questions, 0, ['koerperlich'])).toBe(1);
    expect(findNextPlayableQuestionIndex(questions, 2, ['koerperlich'])).toBe(3);
    expect(findNextPlayableQuestionIndex(questions, 0, ['koerperlich', 'allgemeinwissen'])).toBe(
      null,
    );
    expect(findNextPlayableQuestionIndex([], 0)).toBe(null);
  });
});
