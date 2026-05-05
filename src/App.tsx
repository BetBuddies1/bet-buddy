import { useMemo, useState } from 'react';
import {
  createBiddingState,
  getEligiblePlayerCounts,
  passBid,
  raiseBid,
  resolveChallenge,
  validateManualTeams,
} from './game/gameLogic';
import type { BiddingState, Player, Question, Team } from './game/types';
import { validatePlayerName } from './security/validatePlayerName';

type Phase = 'setup' | 'teams' | 'result';

type TeamDraft = {
  id: string;
  name: string;
  playerIds: string[];
};

const questions: Question[] = [
  {
    id: 'q1',
    text: 'Wie viele europäische Hauptstädte kann dein Buddy nennen?',
    category: 'geographie',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
  {
    id: 'q2',
    text: 'Wie viele Dinge in dieser Küche kann dein Buddy in 30 Sekunden finden?',
    category: 'kreativ',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
  {
    id: 'q3',
    text: 'Wie viele Filme mit einer Zahl im Titel kann dein Buddy nennen?',
    category: 'allgemeinwissen',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
];

const soundPlaceholders = {
  bid: 'sounds/bid-placeholder.mp3',
  challengeSuccess: 'sounds/challenge-success-placeholder.mp3',
  challengeFail: 'sounds/challenge-fail-placeholder.mp3',
};

export default function App() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamDrafts, setTeamDrafts] = useState<TeamDraft[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [biddingState, setBiddingState] = useState<BiddingState | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const activeQuestion = questions[questionIndex % questions.length];
  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  function choosePlayerCount(count: number) {
    setPlayerCount(count);
    setPlayerNames(Array.from({ length: count }, (_, index) => playerNames[index] ?? ''));
    setMessage(null);
  }

  function updatePlayerName(index: number, value: string) {
    setPlayerNames((currentNames) =>
      currentNames.map((currentName, currentIndex) =>
        currentIndex === index ? value : currentName,
      ),
    );
  }

  function prepareTeams() {
    if (playerCount === null) {
      return;
    }

    const validatedPlayers: Player[] = [];

    for (let index = 0; index < playerCount; index += 1) {
      const validation = validatePlayerName(playerNames[index] ?? '');

      if (!validation.ok) {
        setMessage(`Spieler ${index + 1}: ${validation.error}`);
        return;
      }

      validatedPlayers.push({
        id: `p${index + 1}`,
        name: validation.value,
      });
    }

    setPlayers(validatedPlayers);
    setTeamDrafts(createInitialTeamDrafts(validatedPlayers));
    setPhase('teams');
    setMessage(null);
  }

  function updateTeamName(index: number, value: string) {
    setTeamDrafts((currentDrafts) =>
      currentDrafts.map((draft, currentIndex) =>
        currentIndex === index ? { ...draft, name: value } : draft,
      ),
    );
  }

  function updateTeamPlayer(index: number, playerSlot: number, playerId: string) {
    setTeamDrafts((currentDrafts) =>
      currentDrafts.map((draft, currentIndex) => {
        if (currentIndex !== index) {
          return draft;
        }

        const nextPlayerIds = [...draft.playerIds];
        nextPlayerIds[playerSlot] = playerId;

        return { ...draft, playerIds: nextPlayerIds };
      }),
    );
  }

  function startGame() {
    const nextTeams: Team[] = teamDrafts.map((draft, index) => ({
      id: draft.id,
      name: draft.name.trim() || `Team ${index + 1}`,
      playerIds: draft.playerIds,
      score: 0,
    }));
    const validation = validateManualTeams(players, nextTeams);

    if (!validation.ok) {
      setMessage(validation.error);
      return;
    }

    setTeams(nextTeams);
    setBiddingState(createBiddingState(nextTeams, activeQuestion, nextTeams[0].id));
    setPhase('result');
    setMessage(null);
  }

  function handleRaiseBid() {
    if (biddingState?.status !== 'bidding') {
      return;
    }

    setBiddingState(raiseBid(biddingState, teams, biddingState.activeTeamId));
    setMessage(`Sound-Platzhalter: ${soundPlaceholders.bid}`);
  }

  function handlePassBid() {
    if (biddingState?.status !== 'bidding') {
      return;
    }

    setBiddingState(passBid(biddingState, teams, biddingState.activeTeamId));
    setMessage(null);
  }

  function handleChallengeResult(wasSuccessful: boolean) {
    if (biddingState?.status !== 'challenge') {
      return;
    }

    const countedValue = wasSuccessful ? biddingState.currentBid : biddingState.currentBid - 1;
    const winnerIds = resolveChallenge(
      teams,
      biddingState.challengeTeamId,
      countedValue,
      biddingState.currentBid,
    );
    const sound = wasSuccessful
      ? soundPlaceholders.challengeSuccess
      : soundPlaceholders.challengeFail;

    setTeams((currentTeams) =>
      currentTeams.map((team) =>
        winnerIds.includes(team.id) ? { ...team, score: team.score + 1 } : team,
      ),
    );
    setBiddingState(null);
    setMessage(`Sound-Platzhalter: ${sound}`);
  }

  function startNextQuestion() {
    if (teams.length === 0) {
      return;
    }

    const nextQuestionIndex = (questionIndex + 1) % questions.length;
    const firstTeam = teams[nextQuestionIndex % teams.length];

    setQuestionIndex(nextQuestionIndex);
    setBiddingState(createBiddingState(teams, questions[nextQuestionIndex], firstTeam.id));
    setMessage(null);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Lokales Partyspiel</p>
          <h1>Bet Buddy</h1>
        </div>
        <p className="intro">
          Setzt Teams, bietet mutig und zeigt, wie gut ihr eure Buddies einschätzen könnt.
        </p>
      </header>

      {phase === 'setup' ? (
        <section className="workspace" aria-labelledby="setup-title">
          <h2 id="setup-title">Spiel vorbereiten</h2>
          <div className="segmented-control" aria-label="Spieleranzahl wählen">
            {getEligiblePlayerCounts().map((count) => (
              <button
                className={playerCount === count ? 'is-selected' : ''}
                key={count}
                onClick={() => choosePlayerCount(count)}
                type="button"
              >
                {count} Spieler
              </button>
            ))}
          </div>

          {playerCount !== null ? (
            <>
              <div className="player-grid">
                {playerNames.map((name, index) => (
                  <label className="field" key={`player-${index + 1}`}>
                    <span>Spieler {index + 1}</span>
                    <input
                      aria-label={`Spieler ${index + 1}`}
                      onChange={(event) => updatePlayerName(index, event.target.value)}
                      value={name}
                    />
                  </label>
                ))}
              </div>
              <button className="primary-action" onClick={prepareTeams} type="button">
                Teams setzen
              </button>
            </>
          ) : null}
        </section>
      ) : null}

      {phase === 'teams' ? (
        <section className="workspace" aria-labelledby="teams-title">
          <h2 id="teams-title">Teams manuell setzen</h2>
          <div className="team-list">
            {teamDrafts.map((teamDraft, teamIndex) => (
              <fieldset className="team-editor" key={teamDraft.id}>
                <legend>{teamDraft.name}</legend>
                <label className="field">
                  <span>Teamname</span>
                  <input
                    aria-label={`Name ${teamDraft.name}`}
                    onChange={(event) => updateTeamName(teamIndex, event.target.value)}
                    value={teamDraft.name}
                  />
                </label>
                {[0, 1].map((playerSlot) => (
                  <label className="field" key={`${teamDraft.id}-${playerSlot}`}>
                    <span>Buddy {playerSlot + 1}</span>
                    <select
                      aria-label={`${teamDraft.name} Buddy ${playerSlot + 1}`}
                      onChange={(event) =>
                        updateTeamPlayer(teamIndex, playerSlot, event.target.value)
                      }
                      value={teamDraft.playerIds[playerSlot]}
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
            <button className="secondary-action" onClick={() => setPhase('setup')} type="button">
              Zurück
            </button>
            <button className="primary-action" onClick={startGame} type="button">
              Spiel starten
            </button>
          </div>
        </section>
      ) : null}

      {phase === 'result' ? (
        <section className="workspace play-space" aria-labelledby="round-title">
          <div className="round-panel">
            <p className="eyebrow">Frage {questionIndex + 1}</p>
            <h2 id="round-title">{activeQuestion.text}</h2>
            <p className="round-meta">
              Kategorie: {getCategoryLabel(activeQuestion.category)} · Zeitlimit:{' '}
              {activeQuestion.timeLimit} Sekunden
            </p>
          </div>

          {biddingState?.status === 'bidding' ? (
            <div className="round-controls">
              <p className="turn-label">
                {teamById.get(biddingState.activeTeamId)?.name} ist am Zug
              </p>
              <p className="bid-value">Aktuelles Gebot: {biddingState.currentBid}</p>
              <div className="action-row">
                <button className="primary-action" onClick={handleRaiseBid} type="button">
                  Bieten +1
                </button>
                <button className="secondary-action" onClick={handlePassBid} type="button">
                  Passen
                </button>
              </div>
            </div>
          ) : null}

          {biddingState?.status === 'challenge' ? (
            <div className="round-controls">
              <p className="turn-label">
                {teamById.get(biddingState.challengeTeamId)?.name} spielt für{' '}
                {biddingState.currentBid}
              </p>
              <div className="action-row">
                <button
                  className="primary-action"
                  onClick={() => handleChallengeResult(true)}
                  type="button"
                >
                  Geschafft
                </button>
                <button
                  className="secondary-action"
                  onClick={() => handleChallengeResult(false)}
                  type="button"
                >
                  Nicht geschafft
                </button>
              </div>
            </div>
          ) : null}

          {biddingState === null ? (
            <div className="round-controls">
              <p className="turn-label">Runde ausgewertet</p>
              <button className="primary-action" onClick={startNextQuestion} type="button">
                Nächste Frage
              </button>
            </div>
          ) : null}

          <Scoreboard teams={teams} players={players} />
        </section>
      ) : null}

      {message !== null ? (
        <p className="status-message" role="status">
          {message}
        </p>
      ) : null}
    </main>
  );
}

function createInitialTeamDrafts(players: Player[]): TeamDraft[] {
  return Array.from({ length: players.length / 2 }, (_, index) => ({
    id: `t${index + 1}`,
    name: `Team ${index + 1}`,
    playerIds: [players[index * 2].id, players[index * 2 + 1].id],
  }));
}

function getCategoryLabel(category: Question['category']) {
  const labels: Record<Question['category'], string> = {
    allgemeinwissen: 'Allgemeinwissen',
    geographie: 'Geographie',
    kreativ: 'Kreativ',
    koerperlich: 'Körperlich',
    'essen-trinken': 'Essen & Trinken',
    geschichte: 'Geschichte',
  };

  return labels[category];
}

function Scoreboard({ teams, players }: { teams: Team[]; players: Player[] }) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <section className="scoreboard" aria-label="Punktestand">
      {teams.map((team) => (
        <article className="score-row" key={team.id}>
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
            {team.score} {team.score === 1 ? 'Punkt' : 'Punkte'}
          </strong>
        </article>
      ))}
    </section>
  );
}
