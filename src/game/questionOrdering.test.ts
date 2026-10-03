import { describe, expect, it } from 'vitest';
import { arrangeQuestionDeck } from './questionOrdering';
import type { Question } from './types';

function question(id: string, topicFamily?: string, overrides: Partial<Question> = {}): Question {
  return {
    id,
    text: `Question ${id}`,
    category: 'woerter-namen',
    timeLimit: 60,
    type: 'count',
    ...(topicFamily ? { topicFamily } : {}),
    ...overrides,
  };
}

const ids = (questions: Question[]) => questions.map((entry) => entry.id);

describe('arrangeQuestionDeck', () => {
  it('preserves every question and its original object reference exactly once', () => {
    const input = [
      question('name-1', 'names'),
      question('name-2', 'names'),
      question('other'),
      question('country-1', 'countries'),
      question('country-2', 'countries'),
    ];
    const arranged = arrangeQuestionDeck(input);

    expect(arranged).toHaveLength(input.length);
    expect(new Set(ids(arranged))).toHaveLength(input.length);
    expect(ids(arranged).sort()).toEqual(ids(input).sort());
    for (const entry of input) {
      expect(arranged.filter((candidate) => candidate === entry)).toHaveLength(1);
    }
  });

  it('does not mutate the input array or metadata when promoting a preferred variant', () => {
    const input = [
      question('male', 'names'),
      question('other'),
      question('neutral', 'names', { preferredInFamily: true }),
    ];
    const before = JSON.stringify(input);
    input.forEach(Object.freeze);
    Object.freeze(input);

    const arranged = arrangeQuestionDeck(input);

    expect(JSON.stringify(input)).toBe(before);
    expect(arranged).not.toBe(input);
    expect(ids(arranged)).toEqual(['neutral', 'other', 'male']);
  });

  it('keeps the input order exactly when no family repeats', () => {
    const input = [
      question('a', 'names', { preferredInFamily: true }),
      question('b'),
      question('c', 'words'),
      question('d'),
    ];

    expect(arrangeQuestionDeck(input)).toEqual(input);
  });

  it('spreads variants after filtering to one category', () => {
    const input = [
      question('name-1', 'names'),
      question('name-2', 'names'),
      question('country', 'countries', { category: 'welt-orte' }),
      question('word-1', 'words'),
      question('word-2', 'words'),
      question('rhyme-1', 'rhymes'),
      question('rhyme-2', 'rhymes'),
    ].filter((entry) => entry.category === 'woerter-namen');
    const arranged = arrangeQuestionDeck(input);

    expect(ids(arranged)).toEqual(['name-1', 'word-1', 'rhyme-1', 'name-2', 'word-2', 'rhyme-2']);
    for (let index = 1; index < arranged.length; index += 1) {
      expect(arranged[index].topicFamily).not.toBe(arranged[index - 1].topicFamily);
    }
  });

  it('terminates with a single family and retains its variant order', () => {
    const input = Array.from({ length: 30 }, (_, index) => question(`name-${index}`, 'names'));

    expect(arrangeQuestionDeck(input)).toEqual(input);
  });

  it('treats untagged questions as independent families without id collisions', () => {
    const input = [
      question('tagged-1', 'names'),
      question('tagged-2', 'names'),
      question('names'),
      question('untagged-2'),
    ];

    expect(ids(arrangeQuestionDeck(input))).toEqual(['tagged-1', 'names', 'untagged-2', 'tagged-2']);
  });

  it('uses the shuffled input family order consistently for ties', () => {
    const input = [
      question('b-1', 'b'),
      question('a-1', 'a'),
      question('a-2', 'a'),
      question('b-2', 'b'),
    ];

    expect(ids(arrangeQuestionDeck(input))).toEqual(['b-1', 'a-1', 'b-2', 'a-2']);
    expect(arrangeQuestionDeck(input)).toEqual(arrangeQuestionDeck(input));
  });

  it('prefers a neutral names variant once while retaining male and female variants', () => {
    const input = [
      question('male', 'names'),
      question('words', 'words'),
      question('female', 'names'),
      question('neutral-a', 'names', { preferredInFamily: true }),
      question('neutral-b', 'names', { preferredInFamily: true }),
    ];

    expect(ids(arrangeQuestionDeck(input))).toEqual(['neutral-a', 'words', 'male', 'female', 'neutral-b']);
  });

  it('exposes every available family before reusing one despite unequal family sizes', () => {
    const input = [
      ...Array.from({ length: 20 }, (_, index) => question(`name-${index}`, 'names')),
      question('country-1', 'countries'),
      question('country-2', 'countries'),
      question('standalone'),
      question('word-1', 'words'),
      question('word-2', 'words'),
      question('word-3', 'words'),
    ];
    const arranged = arrangeQuestionDeck(input);

    expect(ids(arranged).slice(0, 9)).toEqual([
      'name-0', 'country-1', 'standalone', 'word-1',
      'name-1', 'country-2', 'word-2', 'name-2', 'word-3',
    ]);
    expect(arranged).toHaveLength(input.length);
    expect(new Set(arranged)).toHaveLength(input.length);
    expect(ids(arranged).slice(9)).toEqual(input.slice(3, 20).map((entry) => entry.id));
  });

  it('handles an empty pool and a single untagged question', () => {
    expect(arrangeQuestionDeck([])).toEqual([]);
    const onlyQuestion = question('only');
    expect(arrangeQuestionDeck([onlyQuestion])).toEqual([onlyQuestion]);
  });
});
