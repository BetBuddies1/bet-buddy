export type Phase =
  | 'welcome'
  | 'rules'
  | 'setup'
  | 'teams'
  | 'roundIntro'
  | 'bidding'
  | 'challenge'
  | 'roundScore'
  | 'finished';

const gamePhases = new Set<Phase>([
  'roundIntro',
  'bidding',
  'challenge',
  'roundScore',
  'finished',
]);

const exitConfirmationPhases = new Set<Phase>([
  'roundIntro',
  'bidding',
  'challenge',
  'roundScore',
]);

export function isGamePhase(phase: Phase) {
  return gamePhases.has(phase);
}

export function requiresGameExitConfirmation(phase: Phase) {
  return exitConfirmationPhases.has(phase);
}
