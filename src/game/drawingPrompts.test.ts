import { describe, expect, it, vi } from 'vitest';
import { drawingCategoryOptions } from './challengeTiming';
import { createDrawingPromptDeck, getDrawingPromptCount } from './drawingPrompts';
import type { Question } from './types';

const categoryQuestion: Question = Object.freeze({
  id: 'q-kreativ-zeichnen-kategorie',
  text: 'Zeichne Begriffe aus der gezogenen Kategorie.',
  category: 'spiele-kreativitaet',
  timeLimit: 60,
  type: 'drawing',
  drawingPrompt: 'category',
});

const logoQuestion: Question = Object.freeze({
  ...categoryQuestion,
  id: 'q-kreativ-logos-zeichnen',
  drawingPrompt: undefined,
});

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

describe('drawing prompt decks', () => {
  it('counts every supported drawing pool without consuming randomness', () => {
    const random = vi.spyOn(Math, 'random');

    try {
      for (const category of drawingCategoryOptions) {
        expect(getDrawingPromptCount(categoryQuestion, category)).toBe(24);
      }
      expect(getDrawingPromptCount(logoQuestion)).toBe(24);
      expect(random).not.toHaveBeenCalled();
    } finally {
      random.mockRestore();
    }
  });

  it.each(drawingCategoryOptions)('keeps the bid limit equal to the full %s deck size', (category) => {
    const deck = createDrawingPromptDeck(categoryQuestion, category, seededRandom(42));

    expect(getDrawingPromptCount(categoryQuestion, category)).toBe(deck.length);
    deck.pop();
    expect(getDrawingPromptCount(categoryQuestion, category)).toBe(deck.length + 1);
  });

  it('returns no drawing capacity for unavailable categories and other challenge types', () => {
    expect(getDrawingPromptCount(categoryQuestion)).toBe(0);
    expect(getDrawingPromptCount(categoryQuestion, 'Unbekannt')).toBe(0);
    expect(getDrawingPromptCount({ ...categoryQuestion, type: 'count' }, 'Tiere')).toBe(0);
  });

  it.each(drawingCategoryOptions)('provides a usable, distinct deck for %s', (category) => {
    const deck = createDrawingPromptDeck(categoryQuestion, category, seededRandom(42));

    expect(deck.length).toBeGreaterThanOrEqual(20);
    expect(deck.every((prompt) => prompt.length > 0 && prompt === prompt.trim())).toBe(true);
    expect(new Set(deck.map((prompt) => prompt.toLocaleLowerCase('de'))).size).toBe(deck.length);
  });

  it.each([
    ['Gegenstände', 'Regenschirm'],
    ['Sport', 'Tennis'],
    ['Tiere', 'Giraffe'],
    ['Berufe', 'Feuerwehrkraft'],
  ])('keeps prompts within the requested %s category', (category, example) => {
    expect(createDrawingPromptDeck(categoryQuestion, category)).toContain(example);

    for (const otherCategory of drawingCategoryOptions.filter((value) => value !== category)) {
      expect(createDrawingPromptDeck(categoryQuestion, otherCategory)).not.toContain(example);
    }
  });

  it('provides a separate logo deck with pictorial brands', () => {
    const deck = createDrawingPromptDeck(logoQuestion);

    expect(deck.length).toBeGreaterThanOrEqual(20);
    expect(new Set(deck.map((prompt) => prompt.toLocaleLowerCase('de'))).size).toBe(deck.length);
    expect(deck).toEqual(expect.arrayContaining(['Nike', 'Apple', 'Audi', 'Mercedes-Benz']));
    expect(deck).not.toContain('Coca-Cola');
    expect(deck).not.toContain('Google');
    expect(deck).not.toContain('Regenschirm');
  });

  it('uses logos for fixed drawing prompts and the known logo question', () => {
    const expected = createDrawingPromptDeck(logoQuestion, undefined, seededRandom(7));

    expect(createDrawingPromptDeck({ ...logoQuestion, id: 'fixed-drawing' }, 'Tiere', seededRandom(7)))
      .toEqual(expected);
    expect(createDrawingPromptDeck({ ...logoQuestion, drawingPrompt: 'category' }, 'Tiere', seededRandom(7)))
      .toEqual(expected);
  });

  it('reproduces a seeded shuffle and retains the same cards with another seed', () => {
    const first = createDrawingPromptDeck(categoryQuestion, 'Tiere', seededRandom(1));
    const repeat = createDrawingPromptDeck(categoryQuestion, 'Tiere', seededRandom(1));
    const other = createDrawingPromptDeck(categoryQuestion, 'Tiere', seededRandom(2));

    expect(first).toEqual(repeat);
    expect(other).not.toEqual(first);
    expect([...other].sort()).toEqual([...first].sort());
  });

  it('returns fresh decks without changing the source pool or question', () => {
    const originalQuestion = { ...categoryQuestion };
    const first = createDrawingPromptDeck(categoryQuestion, 'Sport', seededRandom(9));
    const expected = [...first];

    first[0] = 'Geänderte Karte';
    first.pop();

    expect(createDrawingPromptDeck(categoryQuestion, 'Sport', seededRandom(9))).toEqual(expected);
    expect(categoryQuestion).toEqual(originalQuestion);
  });

  it.each([undefined, '', 'Unbekannt', 'toString', 'constructor'])(
    'does not substitute another topic for an unavailable category (%s)',
    (category) => {
      expect(createDrawingPromptDeck(categoryQuestion, category)).toEqual([]);
    },
  );

  it.each(['count', 'duration', 'streak'] as const)('does not provide prompts for %s challenges', (type) => {
    expect(createDrawingPromptDeck({ ...categoryQuestion, type }, 'Tiere')).toEqual([]);
  });
});
