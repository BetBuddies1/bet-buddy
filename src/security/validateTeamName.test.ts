import { describe, expect, it } from 'vitest';
import { validateTeamName } from './validateTeamName';

describe('validateTeamName', () => {
  it('accepts a trimmed valid team name', () => {
    expect(validateTeamName('  Team Blau  ', 'Team 1')).toEqual({
      ok: true,
      value: 'Team Blau',
    });
  });

  it('uses the fallback for empty team names', () => {
    expect(validateTeamName('   ', 'Team 2')).toEqual({
      ok: true,
      value: 'Team 2',
    });
  });

  it('rejects team names longer than 30 characters', () => {
    expect(validateTeamName('ABCDEFGHIJKLMNOPQRSTUVWXYZABCDE', 'Team 1')).toEqual({
      ok: false,
      error: 'Teamnamen dürfen maximal 30 Zeichen lang sein.',
    });
  });

  it('rejects HTML-like characters', () => {
    expect(validateTeamName('<script>', 'Team 1')).toEqual({
      ok: false,
      error:
        'Teamnamen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    });
  });
});
