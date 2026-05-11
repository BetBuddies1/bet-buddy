export function getDuplicatePlayerNameWarning(playerNames: string[]) {
  const seenNames = new Set<string>();

  for (const playerName of playerNames) {
    const trimmedName = playerName.trim();

    if (trimmedName.length === 0) {
      continue;
    }

    const normalizedName = trimmedName.toLocaleLowerCase('de-DE');

    if (seenNames.has(normalizedName)) {
      return `Achtung: Der Name ${trimmedName} kommt mehrfach vor.`;
    }

    seenNames.add(normalizedName);
  }

  return null;
}
