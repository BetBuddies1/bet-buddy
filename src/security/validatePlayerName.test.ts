import { describe, expect, it } from 'vitest';
import { validatePlayerName } from './validatePlayerName';

describe('validatePlayerName', () => {
  it('accepts a trimmed valid name', () => {
    expect(validatePlayerName('  Pierre  ')).toEqual({
      ok: true,
      value: 'Pierre',
    });
  });

  it('rejects empty names', () => {
    expect(validatePlayerName('   ')).toEqual({
      ok: false,
      error: 'Bitte gib einen Namen ein.',
    });
  });

  it('rejects names longer than 20 characters', () => {
    expect(validatePlayerName('ABCDEFGHIJKLMNOPQRSTU')).toEqual({
      ok: false,
      error: 'Namen dürfen maximal 20 Zeichen lang sein.',
    });
  });

  it('rejects HTML-like characters', () => {
    expect(validatePlayerName('<script>')).toEqual({
      ok: false,
      error:
        'Namen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    });
  });

  it('accepts German umlauts and digits', () => {
    expect(validatePlayerName('Jörg 2')).toEqual({
      ok: true,
      value: 'Jörg 2',
    });
  });
});
