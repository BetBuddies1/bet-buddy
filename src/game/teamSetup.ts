import type { TeamDraft } from './setupTypes';
import type { Player, Team } from './types';

export function createInitialTeamDrafts(players: Player[]): TeamDraft[] {
  const teamSizes = getInitialTeamSizes(players.length);
  let playerIndex = 0;

  return teamSizes.map((teamSize, index) => {
    const teamPlayers = players.slice(playerIndex, playerIndex + teamSize);

    playerIndex += teamSize;

    return {
      id: `t${index + 1}`,
      name: `Team ${index + 1}`,
      playerIds: teamPlayers.map((player) => player.id),
    };
  });
}

export function createTeamDraftsFromTeams(teams: Team[]): TeamDraft[] {
  return teams.map((team) => ({
    id: team.id,
    name: team.name,
    playerIds: [...team.playerIds],
  }));
}

export function getReusableTeamDrafts(players: Player[], currentDrafts: TeamDraft[]) {
  const playerIds = new Set(players.map((player) => player.id));
  const assignedPlayerIds = currentDrafts.flatMap((draft) => draft.playerIds);
  const uniqueAssignedPlayerIds = new Set(assignedPlayerIds);
  const hasReusableDrafts =
    currentDrafts.length === getInitialTeamSizes(players.length).length &&
    uniqueAssignedPlayerIds.size === players.length &&
    currentDrafts.every(
      (draft) =>
        draft.playerIds.length >= 2 &&
        draft.playerIds.length <= 3 &&
        draft.playerIds.every((playerId) => playerIds.has(playerId)),
    );

  return hasReusableDrafts ? currentDrafts : createInitialTeamDrafts(players);
}

function getInitialTeamSizes(playerCount: number) {
  const teamCount = Math.floor(playerCount / 2);
  const teamSizes = Array.from({ length: teamCount }, () => 2);

  if (playerCount % 2 === 1) {
    teamSizes[teamSizes.length - 1] += 1;
  }

  return teamSizes;
}
