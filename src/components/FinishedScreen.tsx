import {
  formatFinaleHeading,
  formatFinaleScore,
  getSoleWinningTeam,
} from '../game/formatters';
import type { Player, Team } from '../game/types';
import { FinaleConfetti } from './FinaleConfetti';
import { FinaleRanking } from './FinaleRanking';

type FinishedScreenProps = {
  onEditReplaySettings: () => void;
  onReplayGame: () => void;
  onResetGame: () => void;
  players: Player[];
  teams: Team[];
};

export function FinishedScreen({
  onEditReplaySettings,
  onReplayGame,
  onResetGame,
  players,
  teams,
}: FinishedScreenProps) {
  return (
    <section className="workspace score-screen finished-screen" aria-labelledby="finished-title">
      <div className="round-panel hero-panel finale-panel">
        <FinaleConfetti winner={getSoleWinningTeam(teams)} />
        <p className="eyebrow">Finale</p>
        <h2 id="finished-title">{formatFinaleHeading(teams)}</h2>
        <p className="finale-score-line">{formatFinaleScore(teams)}</p>
        <div className="finale-actions">
          <button className="primary-action finale-replay-action" onClick={onReplayGame} type="button">
            Nochmal spielen
          </button>
          <button className="secondary-action" onClick={onEditReplaySettings} type="button">
            Einstellungen ändern
          </button>
          <button className="secondary-action" onClick={onResetGame} type="button">
            Startseite
          </button>
        </div>
      </div>
      <FinaleRanking players={players} teams={teams} />
    </section>
  );
}
