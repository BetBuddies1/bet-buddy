import type { BiddingState, Player, Question, Team, ValidationResult } from './types';

const ELIGIBLE_PLAYER_COUNTS = [4, 6, 8] as const;

export function getEligiblePlayerCounts(): number[] {
  return [...ELIGIBLE_PLAYER_COUNTS];
}

export function validateManualTeams(players: Player[], teams: Team[]): ValidationResult {
  if (!ELIGIBLE_PLAYER_COUNTS.includes(players.length as (typeof ELIGIBLE_PLAYER_COUNTS)[number])) {
    return { ok: false, error: 'Es sind genau 4, 6 oder 8 Spieler erlaubt.' };
  }

  if (teams.length !== players.length / 2) {
    return { ok: false, error: 'Jedes Team muss aus genau zwei Spielern bestehen.' };
  }

  if (teams.some((team) => team.playerIds.length !== 2)) {
    return { ok: false, error: 'Jedes Team muss aus genau zwei Spielern bestehen.' };
  }

  const teamIds = teams.map((team) => team.id);
  const uniqueTeamIds = new Set(teamIds);

  if (teamIds.length !== uniqueTeamIds.size) {
    return { ok: false, error: 'Team-IDs müssen eindeutig sein.' };
  }

  const playerIds = new Set(players.map((player) => player.id));
  const assignedPlayerIds = teams.flatMap((team) => team.playerIds);
  const uniqueAssignedPlayerIds = new Set(assignedPlayerIds);

  if (assignedPlayerIds.length !== uniqueAssignedPlayerIds.size) {
    return { ok: false, error: 'Jeder Spieler darf nur einem Team zugeordnet sein.' };
  }

  if (assignedPlayerIds.some((playerId) => !playerIds.has(playerId))) {
    return { ok: false, error: 'Alle Team-Spieler müssen im Spiel vorhanden sein.' };
  }

  if (uniqueAssignedPlayerIds.size !== players.length) {
    return { ok: false, error: 'Jeder Spieler muss einem Team zugeordnet sein.' };
  }

  return { ok: true };
}

export function createBiddingState(
  teams: Team[],
  question: Question,
  firstTeamId: string,
): BiddingState {
  assertKnownTeam(teams, firstTeamId);

  return {
    activeTeamId: firstTeamId,
    currentBid: question.minBid,
    highestBidTeamId: null,
    passedTeamIds: [],
    status: 'bidding',
  };
}

export function raiseBid(
  state: BiddingState,
  teams: Team[],
  teamId: string,
): BiddingState {
  assertBidding(state);
  assertActiveTeam(state, teamId);

  return {
    ...state,
    activeTeamId: getNextActiveTeamId(teams, state.passedTeamIds, teamId),
    currentBid: state.currentBid + 1,
    highestBidTeamId: teamId,
  };
}

export function passBid(
  state: BiddingState,
  teams: Team[],
  teamId: string,
): BiddingState {
  assertBidding(state);
  assertActiveTeam(state, teamId);

  const passedTeamIds = [...state.passedTeamIds, teamId];
  const remainingTeamIds = teams
    .map((team) => team.id)
    .filter((candidateTeamId) => !passedTeamIds.includes(candidateTeamId));

  if (remainingTeamIds.length === 1) {
    const challengeTeamId = state.highestBidTeamId ?? remainingTeamIds[0];

    return {
      activeTeamId: null,
      challengeTeamId,
      currentBid: state.currentBid,
      highestBidTeamId: challengeTeamId,
      passedTeamIds,
      status: 'challenge',
    };
  }

  return {
    ...state,
    activeTeamId: getNextActiveTeamId(teams, passedTeamIds, teamId),
    passedTeamIds,
  };
}

export function resolveChallenge(
  teams: Team[],
  challengeTeamId: string,
  countedValue: number,
  requiredBid: number,
): string[] {
  assertKnownTeam(teams, challengeTeamId);

  if (countedValue >= requiredBid) {
    return [challengeTeamId];
  }

  return teams
    .map((team) => team.id)
    .filter((teamId) => teamId !== challengeTeamId);
}

function assertBidding(state: BiddingState): asserts state is Extract<BiddingState, { status: 'bidding' }> {
  if (state.status !== 'bidding') {
    throw new Error('Die Bietrunde ist bereits beendet.');
  }
}

function assertActiveTeam(state: Extract<BiddingState, { status: 'bidding' }>, teamId: string) {
  if (state.activeTeamId !== teamId) {
    throw new Error('Nur das aktive Team darf bieten.');
  }
}

function assertKnownTeam(teams: Team[], teamId: string) {
  if (!teams.some((team) => team.id === teamId)) {
    throw new Error('Unbekanntes Team.');
  }
}

function getNextActiveTeamId(teams: Team[], passedTeamIds: string[], currentTeamId: string): string {
  const currentIndex = teams.findIndex((team) => team.id === currentTeamId);
  const orderedTeamIds = teams.map((team) => team.id);

  for (let offset = 1; offset <= orderedTeamIds.length; offset += 1) {
    const candidateTeamId = orderedTeamIds[(currentIndex + offset) % orderedTeamIds.length];

    if (!passedTeamIds.includes(candidateTeamId)) {
      return candidateTeamId;
    }
  }

  throw new Error('Kein aktives Team verfügbar.');
}
