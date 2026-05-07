export type TeamNameValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

export const MAX_TEAM_NAME_LENGTH = 30;

const TEAM_NAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;

export function validateTeamName(rawName: string, fallbackName: string): TeamNameValidationResult {
  const name = rawName.trim();

  if (name.length === 0) {
    return { ok: true, value: fallbackName };
  }

  if (name.length > MAX_TEAM_NAME_LENGTH) {
    return { ok: false, error: 'Teamnamen dürfen maximal 30 Zeichen lang sein.' };
  }

  if (!TEAM_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      error:
        'Teamnamen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    };
  }

  return { ok: true, value: name };
}
