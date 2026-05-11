import { describe, expect, it } from 'vitest';
import {
  createQuestionDeck,
  filterQuestionsByCategories,
  filterQuestionsForReplay,
  findNextPlayableQuestionIndex,
  getQuestionBank,
} from './questionDeck';
import type { Question } from './types';

describe('questionDeck', () => {
  it('contains local questions from multiple categories', () => {
    const questions = getQuestionBank();
    const categories = new Set(questions.map((question) => question.category));

    expect(questions).toHaveLength(345);
    expect(categories).toEqual(
      new Set([
        'medien-popkultur',
        'woerter-namen',
        'essen-trinken',
        'welt-orte',
        'natur-wissen',
        'sport-freizeit',
        'beruf-gesellschaft',
        'zuhause-alltag',
        'marken-technik',
        'geschichte-kultur',
        'spiele-kreativitaet',
        'koerperlich',
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
      'medien-popkultur': 29,
      'woerter-namen': 53,
      'essen-trinken': 46,
      'welt-orte': 50,
      'natur-wissen': 18,
      'sport-freizeit': 21,
      'beruf-gesellschaft': 20,
      'zuhause-alltag': 31,
      'marken-technik': 16,
      'geschichte-kultur': 29,
      'spiele-kreativitaet': 16,
      koerperlich: 16,
    });
  });

  it('keeps ancient Rome people in the history and culture category', () => {
    const questions = getQuestionBank();

    expect(questions).toContainEqual(
      expect.objectContaining({
        id: 'q-geschichte-personen-altes-rom',
        category: 'geschichte-kultur',
      }),
    );
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

  it('marks curated special questions and excludes them unless explicitly requested', () => {
    const questions = getQuestionBank();
    const specialQuestionIds = questions
      .filter((question) => question.isSpecial)
      .map((question) => question.id);
    const mixedQuestions: Question[] = [
      {
        id: 'special-test-question',
        text: 'Wie viele spezielle Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
        isSpecial: true,
      },
      {
        id: 'normal-test-question',
        text: 'Wie viele normale Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
    ];

    expect(specialQuestionIds).toHaveLength(44);
    expect(specialQuestionIds).toContain('q-allgemeinwissen-harry-potter-zaubersprueche');
    expect(specialQuestionIds).toContain('candidate-allgemeinwissen-ikea-produktnamen');
    expect(specialQuestionIds).not.toContain('candidate-allgemeinwissen-hochzeitsjubilaeen');
    expect(filterQuestionsByCategories(mixedQuestions, ['medien-popkultur']).map((question) => question.id)).toEqual([
      'normal-test-question',
    ]);
    expect(
      filterQuestionsByCategories(mixedQuestions, ['medien-popkultur'], {
        includeSpecialQuestions: true,
      }).map((question) => question.id),
    ).toEqual(['special-test-question', 'normal-test-question']);
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
        }),
        expect.objectContaining({
          text: 'Wie viele bekannte Milliardärinnen oder Milliardäre kann dein Buddy nennen?',
        }),
        expect.objectContaining({
          text: 'Wie viele Fernsehserien kann dein Buddy nennen?',
        }),
        expect.objectContaining({
          text: 'Wie viele deutsche Autokennzeichen-Kürzel kann dein Buddy nennen?',
        }),
        expect.objectContaining({
          text: 'Wie viele Weltwunder der Antike oder der Neuzeit kann dein Buddy nennen?',
        }),
        expect.objectContaining({
          text: 'Wie viele Begriffe aus der gezogenen Zeichen-Kategorie kann dein Buddy in 1 Minute so zeichnen, dass sein Team sie errät?',
          timeLimit: 60,
          type: 'drawing',
          drawingPrompt: 'category',
        }),
        expect.objectContaining({
          text: 'Wie viele Biersorten kann dein Buddy nennen?',
        }),
        expect.objectContaining({
          text: 'Wie viele Mineralwassermarken kann dein Buddy nennen?',
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
        (question) => question.text.includes('Sekunden') && question.timeLimit >= 1,
      ),
    ).toBe(true);
    expect(questions.every((question) => !('minBid' in question))).toBe(true);
    expect(
      questionsByType.streak?.every((question) => /Treffer|nacheinander/.test(question.text)),
    ).toBe(true);
  });

  it('does not store per-question minimum bids', () => {
    const questions = getQuestionBank();

    expect(questions.every((question) => !('minBid' in question))).toBe(true);
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
    const filteredQuestions = filterQuestionsByCategories(questions, ['spiele-kreativitaet']);

    expect(filteredQuestions.length).toBeGreaterThan(0);
    expect(filteredQuestions.every((question) => question.category === 'spiele-kreativitaet')).toBe(
      true,
    );
    expect(questions.some((question) => question.category !== 'spiele-kreativitaet')).toBe(true);
  });

  it('prefers unseen questions for replay when enough are available', () => {
    const questions: Question[] = [
      {
        id: 'q-seen',
        text: 'Wie viele bekannte Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'q-unseen-a',
        text: 'Wie viele neue Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'q-unseen-b',
        text: 'Wie viele weitere neue Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
    ];

    expect(
      filterQuestionsForReplay(questions, ['medien-popkultur'], {
        minimumQuestionCount: 2,
        seenQuestionIds: ['q-seen'],
      }).map((question) => question.id),
    ).toEqual(['q-unseen-a', 'q-unseen-b']);
  });

  it('falls back to the full filtered replay deck when too few unseen questions remain', () => {
    const questions: Question[] = [
      {
        id: 'q-seen-a',
        text: 'Wie viele alte Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'q-seen-b',
        text: 'Wie viele weitere alte Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'q-unseen',
        text: 'Wie viele frische Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
    ];

    expect(
      filterQuestionsForReplay(questions, ['medien-popkultur'], {
        minimumQuestionCount: 2,
        seenQuestionIds: ['q-seen-a', 'q-seen-b'],
      }).map((question) => question.id),
    ).toEqual(['q-seen-a', 'q-seen-b', 'q-unseen']);
  });

  it('finds the next playable question while respecting runtime skipped categories', () => {
    const questions: Question[] = [
      {
        id: 'q-a',
        text: 'Wie viele Testantworten kann dein Buddy nennen?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'q-b',
        text: 'Wie viele andere Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
    ];

    expect(findNextPlayableQuestionIndex(questions, 0)).toBe(0);
    expect(findNextPlayableQuestionIndex(questions, 0, ['koerperlich'])).toBe(1);
    expect(findNextPlayableQuestionIndex(questions, 2, ['koerperlich'])).toBe(3);
    expect(findNextPlayableQuestionIndex(questions, 0, ['koerperlich', 'medien-popkultur'])).toBe(
      null,
    );
    expect(findNextPlayableQuestionIndex([], 0)).toBe(null);
  });
});
