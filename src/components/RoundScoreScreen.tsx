import type { Player, Team } from '../game/types';
import { Scoreboard } from './Scoreboard';

type RoundScoreScreenProps = {
  message: string | null;
  onStartNextRound: () => void;
  players: Player[];
  recentPointTeamIds: string[];
  teams: Team[];
};

export function RoundScoreScreen({
  message,
  onStartNextRound,
  players,
  recentPointTeamIds,
  teams,
}: RoundScoreScreenProps) {
  return (
    <section className="workspace score-screen" aria-labelledby="round-score-title">
      <div className="round-controls phase-panel">
        <h2 id="round-score-title" className="turn-label">
          Runde ausgewertet
        </h2>
        {message !== null ? <p className="round-meta">{message}</p> : null}
        <button className="primary-action" onClick={onStartNextRound} type="button">
          Nächste Runde
        </button>
      </div>
      <Scoreboard players={players} recentPointTeamIds={recentPointTeamIds} teams={teams} />
    </section>
  );
}
