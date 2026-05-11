import type { TeamRoundRole } from './formatters';
import type { Player, Team } from './types';

export function getTeamRoundRole(
  team: Team,
  playerById: Map<string, Player>,
  roundIndex: number,
): TeamRoundRole | undefined {
  if (team.playerIds.length < 2) {
    return undefined;
  }

  const bidderId = team.playerIds[roundIndex % team.playerIds.length];
  const challengePlayerId = team.playerIds[(roundIndex + 1) % team.playerIds.length];
  const bidder = playerById.get(bidderId);
  const challengePlayer = playerById.get(challengePlayerId);

  if (!bidder || !challengePlayer) {
    return undefined;
  }

  return { bidder, challengePlayer };
}
