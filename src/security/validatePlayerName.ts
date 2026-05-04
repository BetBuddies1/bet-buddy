export type ValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

const PLAYER_NAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;
const MAX_PLAYER_NAME_LENGTH = 20;

export function validatePlayerName(rawName: string): ValidationResult {
  const name = rawName.trim();

  if (name.length === 0) {
    return { ok: false, error: 'Bitte gib einen Namen ein.' };
  }

  if (name.length > MAX_PLAYER_NAME_LENGTH) {
    return { ok: false, error: 'Namen dürfen maximal 20 Zeichen lang sein.' };
  }

  if (!PLAYER_NAME_PATTERN.test(name)) {
    return {
      ok: false,
      error:
        'Namen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    };
  }

  return { ok: true, value: name };
}
