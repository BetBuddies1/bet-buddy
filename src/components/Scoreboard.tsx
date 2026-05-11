import { formatPoints } from '../game/formatters';
import type { Player, Team } from '../game/types';

export function Scoreboard({
  teams,
  players,
  recentPointTeamIds = [],
}: {
  teams: Team[];
  players: Player[];
  recentPointTeamIds?: string[];
}) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const recentPointTeams = new Set(recentPointTeamIds);

  return (
    <section className="scoreboard" aria-label="Punktestand">
      {teams.map((team) => {
        const hasRecentPoint = recentPointTeams.has(team.id);
        const hasRoundOutcome = recentPointTeamIds.length > 0;
        const missedRecentPoint = hasRoundOutcome && !hasRecentPoint;

        return (
          <article
            className={`score-row ${hasRecentPoint ? 'has-recent-point' : ''} ${
              missedRecentPoint ? 'has-missed-point' : ''
            }`}
            data-recent-point={hasRecentPoint ? 'true' : 'false'}
            data-round-outcome={
              hasRoundOutcome ? (hasRecentPoint ? 'scored' : 'missed') : undefined
            }
            data-team-id={team.id}
            key={team.id}
          >
            <div>
              <h3>{team.name}</h3>
              <p>
                {team.playerIds
                  .map((playerId) => playerById.get(playerId)?.name)
                  .filter(Boolean)
                  .join(' & ')}
              </p>
            </div>
            <strong>
              {hasRecentPoint ? (
                <span className="score-delta" aria-label="Punkt in dieser Runde">
                  +1
                </span>
              ) : null}
              {formatPoints(team.score)}
            </strong>
          </article>
        );
      })}
    </section>
  );
}
