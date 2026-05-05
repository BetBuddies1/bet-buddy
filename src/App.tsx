import { useEffect, useMemo, useState } from 'react';
import {
  createBiddingState,
  getEligiblePlayerCounts,
  passBid,
  raiseBid,
  resolveChallenge,
  validateManualTeams,
} from './game/gameLogic';
import type { BiddingState, Player, Question, Team } from './game/types';
import { createQuestionDeck } from './game/questionDeck';
import { validatePlayerName } from './security/validatePlayerName';

type Phase = 'setup' | 'teams' | 'result' | 'finished';
type AppProps = {
  createDeck?: () => Question[];
};

type TeamDraft = {
  id: string;
  name: string;
  playerIds: string[];
};

type ChallengeState = {
  status: 'ready' | 'running' | 'review';
  count: number;
  secondsLeft: number;
};

const soundPlaceholders = {
  bid: 'sounds/bid-placeholder.mp3',
  challengeSuccess: 'sounds/challenge-success-placeholder.mp3',
  challengeFail: 'sounds/challenge-fail-placeholder.mp3',
};
const roundCountOptions = [6, 8, 10] as const;

export default function App({ createDeck = createQuestionDeck }: AppProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [roundCount, setRoundCount] = useState<number>(6);
  const [playerNames, setPlayerNames] = useState<string[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamDrafts, setTeamDrafts] = useState<TeamDraft[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [biddingState, setBiddingState] = useState<BiddingState | null>(null);
  const [challengeState, setChallengeState] = useState<ChallengeState | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionDeck, setQuestionDeck] = useState<Question[]>(() => createDeck());
  const [message, setMessage] = useState<string | null>(null);

  const activeQuestion = questionDeck[questionIndex % questionDeck.length];
  const currentRound = questionIndex + 1;
  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );

  useEffect(() => {
    if (challengeState?.status !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setChallengeState((currentChallengeState) => {
        if (currentChallengeState?.status !== 'running') {
          return currentChallengeState;
        }

        if (currentChallengeState.secondsLeft <= 1) {
          return {
            ...currentChallengeState,
            secondsLeft: 0,
            status: 'review',
          };
        }

        return {
          ...currentChallengeState,
          secondsLeft: currentChallengeState.secondsLeft - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [challengeState?.status]);

  function choosePlayerCount(count: number) {
    setPlayerCount(count);
    setPlayerNames(Array.from({ length: count }, (_, index) => playerNames[index] ?? ''));
    setMessage(null);
  }

  function chooseRoundCount(count: number) {
    setRoundCount(count);
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
    const nextQuestionDeck = createDeck();
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
    setQuestionDeck(nextQuestionDeck);
    setQuestionIndex(0);
    setBiddingState(createBiddingState(nextTeams, nextQuestionDeck[0], nextTeams[0].id));
    setChallengeState(null);
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

    const nextBiddingState = passBid(biddingState, teams, biddingState.activeTeamId);

    setBiddingState(nextBiddingState);
    setChallengeState(
      nextBiddingState.status === 'challenge'
        ? {
            count: 0,
            secondsLeft: activeQuestion.timeLimit,
            status: 'ready',
          }
        : null,
    );
    setMessage(null);
  }

  function increaseTracker() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState === null
        ? currentChallengeState
        : { ...currentChallengeState, count: currentChallengeState.count + 1 },
    );
  }

  function decreaseTracker() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState === null
        ? currentChallengeState
        : { ...currentChallengeState, count: Math.max(0, currentChallengeState.count - 1) },
    );
  }

  function startChallengeTimer() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState?.status === 'ready'
        ? { ...currentChallengeState, status: 'running' }
        : currentChallengeState,
    );
  }

  function reviewChallengeResult() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState === null
        ? currentChallengeState
        : { ...currentChallengeState, status: 'review' },
    );
  }

  function confirmChallengeResult() {
    if (biddingState?.status !== 'challenge' || challengeState === null) {
      return;
    }

    applyChallengeResult(challengeState.count >= biddingState.currentBid);
  }

  function applyChallengeResult(wasSuccessful: boolean) {
    if (biddingState?.status !== 'challenge') {
      return;
    }

    const challengeTeamName =
      teamById.get(biddingState.challengeTeamId)?.name ?? 'Das aktive Team';
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

    const nextTeams = teams.map((team) =>
        winnerIds.includes(team.id) ? { ...team, score: team.score + 1 } : team,
    );

    setTeams(nextTeams);
    setBiddingState(null);
    setChallengeState(null);

    if (currentRound >= roundCount) {
      setPhase('finished');
    }

    setMessage(
      `${formatPointResult(teams, winnerIds, challengeTeamName, wasSuccessful)} Sound-Platzhalter: ${sound}`,
    );
  }

  function startNextRound() {
    if (teams.length === 0) {
      return;
    }

    const nextQuestionIndex = questionIndex + 1;
    const firstTeam = teams[nextQuestionIndex % teams.length];

    setQuestionIndex(nextQuestionIndex);
    setChallengeState(null);
    setBiddingState(
      createBiddingState(
        teams,
        questionDeck[nextQuestionIndex % questionDeck.length],
        firstTeam.id,
      ),
    );
    setMessage(null);
  }

  function resetGame() {
    setPhase('setup');
    setPlayerCount(null);
    setRoundCount(6);
    setPlayerNames([]);
    setPlayers([]);
    setTeamDrafts([]);
    setTeams([]);
    setBiddingState(null);
    setChallengeState(null);
    setQuestionIndex(0);
    setQuestionDeck(createDeck());
    setMessage(null);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Lokales Partyspiel</p>
          <h1>Bet Buddy</h1>
        </div>
        <div className="header-copy">
          <p className="intro">
            Setzt Teams, bietet mutig und zeigt, wie gut ihr eure Buddies einschätzen könnt.
          </p>
          {phase !== 'setup' ? (
            <button className="secondary-action compact-action" onClick={resetGame} type="button">
              Neues Spiel
            </button>
          ) : null}
        </div>
      </header>

      {phase === 'setup' ? (
        <section className="workspace" aria-labelledby="setup-title">
          <h2 id="setup-title">Spiel vorbereiten</h2>
          <div className="setup-grid">
            <section aria-labelledby="player-count-title">
              <h3 id="player-count-title">Spieleranzahl</h3>
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
            </section>
            <section aria-labelledby="round-count-title">
              <h3 id="round-count-title">Spielumfang</h3>
              <div className="segmented-control" aria-label="Spielumfang wählen">
                {roundCountOptions.map((count) => (
                  <button
                    className={roundCount === count ? 'is-selected' : ''}
                    key={count}
                    onClick={() => chooseRoundCount(count)}
                    type="button"
                  >
                    {count} Runden
                  </button>
                ))}
              </div>
            </section>
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
            <p className="eyebrow">Runde {currentRound} von {roundCount}</p>
            <h2 id="round-title">{activeQuestion.text}</h2>
            <p className="round-meta">
              Kategorie: {getCategoryLabel(activeQuestion.category)} · Zeitlimit:{' '}
              {activeQuestion.timeLimit} Sekunden
            </p>
          </div>

          {biddingState?.status === 'bidding' ? (
            <div className="round-controls">
              <p className="eyebrow">Bietrunde</p>
              <p className="turn-label">
                {teamById.get(biddingState.activeTeamId)?.name} ist am Zug
              </p>
              <p className="bid-value">Aktuelles Ziel: {biddingState.currentBid}</p>
              <div className="action-row">
                <button className="primary-action" onClick={handleRaiseBid} type="button">
                  Ziel +1
                </button>
                <button className="secondary-action" onClick={handlePassBid} type="button">
                  Passen
                </button>
              </div>
            </div>
          ) : null}

          {biddingState?.status === 'challenge' ? (
            <div className="round-controls">
              <p className="eyebrow">Challenge</p>
              <p className="turn-label">
                {teamById.get(biddingState.challengeTeamId)?.name} muss{' '}
                {biddingState.currentBid} schaffen
              </p>
              {challengeState !== null ? (
                <>
                  <p className="timer-value">Timer: {challengeState.secondsLeft} Sekunden</p>
                  <p className="tracker-value">
                    Tracker: {challengeState.count} / Ziel {biddingState.currentBid}
                  </p>
                  <div className="action-row">
                    <button className="secondary-action tracker-action" onClick={decreaseTracker} type="button">
                      -1
                    </button>
                    <button className="primary-action tracker-action" onClick={increaseTracker} type="button">
                      +1
                    </button>
                  </div>
                  {challengeState.status !== 'review' ? (
                    <div className="action-row">
                      {challengeState.status === 'ready' ? (
                        <button className="primary-action" onClick={startChallengeTimer} type="button">
                          Challenge starten
                        </button>
                      ) : null}
                      <button className="secondary-action" onClick={reviewChallengeResult} type="button">
                        Auswertung prüfen
                      </button>
                    </div>
                  ) : (
                    <div className="challenge-review">
                      <p className="bid-value">
                        Vorschlag:{' '}
                        {challengeState.count >= biddingState.currentBid
                          ? 'Geschafft'
                          : 'Nicht geschafft'}
                      </p>
                      <p className="round-meta">
                        Gezählt: {challengeState.count} / Ziel {biddingState.currentBid}
                      </p>
                      <button className="primary-action" onClick={confirmChallengeResult} type="button">
                        Ergebnis bestätigen
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          ) : null}

          {biddingState === null ? (
            <div className="round-controls">
              <p className="turn-label">Runde ausgewertet</p>
              <button className="primary-action" onClick={startNextRound} type="button">
                Nächste Runde
              </button>
            </div>
          ) : null}

          <Scoreboard teams={teams} players={players} />
        </section>
      ) : null}

      {phase === 'finished' ? (
        <section className="workspace play-space" aria-labelledby="finished-title">
          <div className="round-panel">
            <p className="eyebrow">Nach {roundCount} Runden</p>
            <h2 id="finished-title">Spiel beendet</h2>
            <p className="round-meta">{formatGameResult(teams)}</p>
          </div>
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

function formatPointResult(
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

  return `${winnerNames.join(' und ')} bekommen je 1 Punkt.`;
}

function formatGameResult(teams: Team[]) {
  const highestScore = Math.max(...teams.map((team) => team.score));
  const winningTeams = teams.filter((team) => team.score === highestScore);

  if (winningTeams.length === 1) {
    return `${winningTeams[0].name} gewinnt mit ${highestScore} ${
      highestScore === 1 ? 'Punkt' : 'Punkten'
    }.`;
  }

  return `Unentschieden zwischen ${winningTeams
    .map((team) => team.name)
    .join(' und ')} mit ${highestScore} ${highestScore === 1 ? 'Punkt' : 'Punkten'}.`;
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
