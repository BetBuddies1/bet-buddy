import type { Phase } from '../appTypes';
import {
  formatCompactScoreSummary,
  formatScoreSummary,
} from '../game/formatters';
import type { Team } from '../game/types';

type AppHeaderProps = {
  currentRound: number;
  isGamePhase: boolean;
  onResetGame: () => void;
  onToggleSounds: () => void;
  phase: Phase;
  roundCount: number;
  soundsEnabled: boolean;
  teams: Team[];
};

export function AppHeader({
  currentRound,
  isGamePhase,
  onResetGame,
  onToggleSounds,
  phase,
  roundCount,
  soundsEnabled,
  teams,
}: AppHeaderProps) {
  return (
    <header className={`app-header ${isGamePhase ? 'game-header' : ''}`}>
      <div className="brand-lockup">
        <div className="buddy-mark" aria-hidden="true">
          <span />
          <span />
        </div>
        <p className="eyebrow">Lokales Partyspiel</p>
        <h1>Bet Buddy</h1>
      </div>
      <div className="header-copy">
        {isGamePhase && phase !== 'finished' && teams.length > 0 ? (
          <div className="game-hud" aria-label="Spielstatus">
            <span>
              Runde {Math.min(currentRound, roundCount)} von {roundCount}
            </span>
            <span className="score-chip">
              <span className="score-label">Score</span>
              <span className="score-value score-value-full">{formatScoreSummary(teams)}</span>
              <span className="score-value score-value-compact" aria-hidden="true">
                {formatCompactScoreSummary(teams)}
              </span>
            </span>
          </div>
        ) : phase !== 'welcome' && phase !== 'finished' ? (
          <p className="intro">
            Das lokale Partyspiel für mutige Einsätze und gute Buddy-Instinkte.
          </p>
        ) : null}
        {phase !== 'welcome' ? (
          <>
            <button
              aria-label={soundsEnabled ? 'Sounds ausschalten' : 'Sounds einschalten'}
              aria-pressed={soundsEnabled}
              className="secondary-action header-sound-action"
              onClick={onToggleSounds}
              type="button"
            >
              {soundsEnabled ? 'Sounds aus' : 'Sounds an'}
            </button>
            {phase !== 'finished' ? (
              <button className="secondary-action header-home-action" onClick={onResetGame} type="button">
                Startseite
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </header>
  );
}
