import type { TeamDraft } from '../game/setupTypes';
import type { Player } from '../game/types';
import { MAX_TEAM_NAME_LENGTH } from '../security/validateTeamName';

type TeamsScreenProps = {
  onBackToRules: () => void;
  onStartGame: () => void;
  onUpdateTeamName: (teamIndex: number, value: string) => void;
  onUpdateTeamPlayer: (teamIndex: number, playerSlot: number, playerId: string) => void;
  players: Player[];
  teamDrafts: TeamDraft[];
};

export function TeamsScreen({
  onBackToRules,
  onStartGame,
  onUpdateTeamName,
  onUpdateTeamPlayer,
  players,
  teamDrafts,
}: TeamsScreenProps) {
  return (
    <section className="workspace" aria-labelledby="teams-title">
      <p className="eyebrow setup-progress">Schritt 3 von 3</p>
      <h2 id="teams-title">Teams erstellen</h2>
      <div className="team-list">
        {teamDrafts.map((teamDraft, teamIndex) => (
          <fieldset className="team-editor" data-team-accent={teamIndex % 4} key={teamDraft.id}>
            <legend>{teamDraft.name}</legend>
            <label className="field">
              <span>Teamname</span>
              <input
                aria-label={`Name ${teamDraft.name}`}
                maxLength={MAX_TEAM_NAME_LENGTH}
                onChange={(event) => onUpdateTeamName(teamIndex, event.target.value)}
                value={teamDraft.name}
              />
            </label>
            {teamDraft.playerIds.map((playerId, playerSlot) => (
              <label className="field" key={`${teamDraft.id}-${playerSlot}`}>
                <span>Buddy {playerSlot + 1}</span>
                <select
                  aria-label={`${teamDraft.name} Buddy ${playerSlot + 1}`}
                  onChange={(event) =>
                    onUpdateTeamPlayer(teamIndex, playerSlot, event.target.value)
                  }
                  value={playerId}
                >
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="action-row">
        <button className="secondary-action" onClick={onBackToRules} type="button">
          Zurück
        </button>
        <button className="primary-action" onClick={onStartGame} type="button">
          Spiel starten
        </button>
      </div>
    </section>
  );
}
