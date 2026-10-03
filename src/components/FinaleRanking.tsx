import { formatPoints } from '../game/formatters';
import type { Player, Team } from '../game/types';

export function FinaleRanking({ teams, players }: { teams: Team[]; players: Player[] }) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const rankedTeams = [...teams].sort((firstTeam, secondTeam) => secondTeam.score - firstTeam.score);

  return (
    <section className="finale-ranking" aria-label="Endstand">
      <p className="eyebrow">Endstand</p>
      <div className="finale-ranking-list">
        {rankedTeams.map((team) => (
          <article
            className={`finale-ranking-row ${team.score === rankedTeams[0].score ? 'is-winner' : ''}`}
            data-team-id={team.id}
            key={team.id}
          >
            <div className="finale-rank-place">
              {rankedTeams.findIndex((candidate) => candidate.score === team.score) + 1}.
            </div>
            <div>
              <h3>{team.name}</h3>
              <p>
                {team.playerIds
                  .map((playerId) => playerById.get(playerId)?.name)
                  .filter(Boolean)
                  .join(' & ')}
              </p>
            </div>
            <strong>{formatPoints(team.score)}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
