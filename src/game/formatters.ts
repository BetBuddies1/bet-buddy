import type { Player, Question, Team } from './types';

export type TeamRoundRole = {
  bidder: Player;
  challengePlayer: Player;
};

type ChallengeTimerState = {
  secondsLeft: number;
};

export function getInitialChallengeSeconds(question: Question, currentBid: number) {
  if (question.type === 'duration') {
    return currentBid;
  }

  return question.timeLimit;
}

export function formatChallengeGoal(currentBid: number, question: Question) {
  if (question.type === 'duration') {
    return formatSeconds(currentBid);
  }

  if (question.type === 'drawing') {
    return `${currentBid} ${currentBid === 1 ? 'Begriff' : 'Begriffe'}`;
  }

  if (question.type === 'streak') {
    return `${currentBid} ${currentBid === 1 ? 'Treffer' : 'Treffer'} in Folge`;
  }

  return String(currentBid);
}

export function getBidAmountDisplay(currentBid: number, question: Question) {
  if (question.type === 'duration') {
    return {
      value: currentBid.toString(),
      unit: currentBid === 1 ? 'Sekunde' : 'Sekunden',
    };
  }

  if (question.type === 'drawing') {
    return {
      value: currentBid.toString(),
      unit: currentBid === 1 ? 'Begriff' : 'Begriffe',
    };
  }

  if (question.type === 'streak') {
    return {
      value: currentBid.toString(),
      unit: 'Treffer in Folge',
    };
  }

  return {
    value: currentBid.toString(),
    unit: null,
  };
}

export function formatChallengeTimer(question: Question, challengeState: ChallengeTimerState) {
  if (question.type === 'duration') {
    return `Noch: ${formatSeconds(challengeState.secondsLeft)}`;
  }

  if (question.type === 'drawing') {
    return `Zeichenzeit: ${challengeState.secondsLeft} Sekunden`;
  }

  return `Timer: ${challengeState.secondsLeft} Sekunden`;
}

export function formatRoundTimeLimit(question: Question) {
  if (question.type === 'duration') {
    return 'Einsatz zählt';
  }

  if (question.type === 'streak') {
    return 'Ohne Timer';
  }

  return `${question.timeLimit} Sekunden`;
}

export function formatChallengeProgress(
  question: Question,
  count: number,
  currentBid: number,
  isReview = false,
) {
  if (question.type === 'duration') {
    return `Gemessen: ${formatSeconds(count)} / Einsatz ${formatSeconds(currentBid)}`;
  }

  if (question.type === 'streak') {
    return `Treffer in Folge: ${count} / Einsatz ${currentBid}`;
  }

  if (question.type === 'drawing') {
    return `Erraten: ${count} / Einsatz ${currentBid}`;
  }

  return `${isReview ? 'Gezählt' : 'Tracker'}: ${count} / Einsatz ${currentBid}`;
}

export function formatSeconds(seconds: number) {
  return `${seconds} ${seconds === 1 ? 'Sekunde' : 'Sekunden'}`;
}

export function formatQuestionSkipAction(team: Team | undefined, skipsLeft: number) {
  if (team === undefined) {
    return 'Frage überspringen';
  }

  return `Frage überspringen (${team.name}: ${skipsLeft} übrig)`;
}

export function formatIncreaseTrackerLabel(question: Question) {
  if (question.type === 'duration') {
    return '+1 Sekunde';
  }

  if (question.type === 'drawing') {
    return 'Erraten +1';
  }

  if (question.type === 'streak') {
    return 'Treffer +1';
  }

  return '+1';
}

export function formatDecreaseTrackerLabel(question: Question) {
  if (question.type === 'duration') {
    return '-1 Sekunde';
  }

  if (question.type === 'streak') {
    return '-1 Treffer';
  }

  return '-1';
}

export function formatPointResult(
  teams: Team[],
  winnerIds: string[],
  challengeTeamName: string,
  wasSuccessful: boolean,
) {
  if (wasSuccessful) {
    return `${challengeTeamName} bekommt 1 Punkt.`;
  }

  const winnerNames = teams
    .filter((team) => winnerIds.includes(team.id))
    .map((team) => team.name);

  if (winnerNames.length === 1) {
    return `${winnerNames[0]} bekommt 1 Punkt.`;
  }

  if (winnerNames.length === teams.length - 1) {
    return `Alle Teams außer ${challengeTeamName} bekommen 1 Punkt.`;
  }

  return `${winnerNames.join(' und ')} bekommen je 1 Punkt.`;
}

export function formatFinaleHeading(teams: Team[]) {
  const highestScore = Math.max(...teams.map((team) => team.score));
  const winningTeams = teams.filter((team) => team.score === highestScore);

  if (winningTeams.length === 1) {
    return `${winningTeams[0].name} gewinnt`;
  }

  return 'Unentschieden';
}

export function formatFinaleScore(teams: Team[]) {
  return teams.map((team) => team.score).join(' : ');
}

export function formatPoints(score: number) {
  return `${score} ${score === 1 ? 'Punkt' : 'Punkte'}`;
}

export function formatScoreSummary(teams: Team[]) {
  if (teams.length === 2) {
    return `${teams[0].name} ${teams[0].score}:${teams[1].score} ${teams[1].name}`;
  }

  return teams.map((team) => `${team.name} ${team.score}`).join(' · ');
}

export function formatCompactScoreSummary(teams: Team[]) {
  if (teams.length === 2) {
    return `${teams[0].score}:${teams[1].score}`;
  }

  return teams.map((team) => team.score).join(' · ');
}

export function formatBiddingRole(role: TeamRoundRole) {
  return `${role.bidder.name} bietet für ${role.challengePlayer.name}`;
}

export function formatBiddingTurnLabel(team: Team | undefined, role: TeamRoundRole | undefined) {
  if (role) {
    return `${formatBiddingRole(role)} (${team?.name ?? 'Team'})`;
  }

  return `${team?.name ?? 'Aktives Team'} ist am Zug`;
}

export function formatChallengePerformer(team: Team | undefined, role: TeamRoundRole | undefined) {
  return role?.challengePlayer.name ?? team?.name ?? 'Das aktive Team';
}

export function formatChallengeRoleContext(team: Team | undefined, role: TeamRoundRole) {
  return `${role.bidder.name} hat für ${team?.name ?? 'das Team'} geboten`;
}

export function formatBidStatus(
  activeTeam: Team | undefined,
  holdingTeam: Team | undefined,
  activeTeamRole?: TeamRoundRole,
) {
  if (holdingTeam) {
    return `${holdingTeam.name} hält den Einsatz`;
  }

  return activeTeamRole
    ? formatBiddingRole(activeTeamRole)
    : `${activeTeam?.name ?? 'Aktives Team'} ist dran`;
}

export function getSoleWinningTeam(teams: Team[]) {
  if (teams.length === 0) {
    return null;
  }

  const highestScore = Math.max(...teams.map((team) => team.score));
  const winningTeams = teams.filter((team) => team.score === highestScore);

  return winningTeams.length === 1 ? winningTeams[0] : null;
}
