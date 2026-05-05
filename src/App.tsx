import { useEffect, useMemo, useState } from 'react';
import {
  createBiddingState,
  getEligiblePlayerCounts,
  passBid,
  raiseBid,
  resolveChallenge,
  validateManualTeams,
} from './game/gameLogic';
import type { BiddingState, CategoryId, Player, Question, Team } from './game/types';
import { createQuestionDeck, filterQuestionsByCategories } from './game/questionDeck';
import { validatePlayerName } from './security/validatePlayerName';

type Phase =
  | 'welcome'
  | 'setup'
  | 'teams'
  | 'roundIntro'
  | 'bidding'
  | 'challenge'
  | 'roundScore'
  | 'finished';
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
const categoryOptions: Array<{ id: CategoryId; label: string }> = [
  { id: 'allgemeinwissen', label: 'Allgemeinwissen' },
  { id: 'geographie', label: 'Geographie' },
  { id: 'kreativ', label: 'Kreativ' },
  { id: 'koerperlich', label: 'Körperlich' },
  { id: 'essen-trinken', label: 'Essen & Trinken' },
  { id: 'geschichte', label: 'Geschichte' },
];
const defaultSelectedCategories = categoryOptions.map((category) => category.id);

export default function App({ createDeck = createQuestionDeck }: AppProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [roundCount, setRoundCount] = useState<number>(6);
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    defaultSelectedCategories,
  );
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
  const usesTableMode = teams.length === 2;

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

  function toggleCategory(categoryId: CategoryId) {
    setSelectedCategories((currentCategories) => {
      if (currentCategories.includes(categoryId)) {
        if (currentCategories.length === 1) {
          setMessage('Mindestens eine Kategorie muss aktiv bleiben.');
          return currentCategories;
        }

        setMessage(null);
        return currentCategories.filter((currentCategoryId) => currentCategoryId !== categoryId);
      }

      setMessage(null);
      return [...currentCategories, categoryId];
    });
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
    const nextQuestionDeck = filterQuestionsByCategories(createDeck(), selectedCategories);
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

    if (nextQuestionDeck.length === 0) {
      setMessage('Für die aktive Kategorieauswahl sind keine Fragen verfügbar.');
      return;
    }

    setTeams(nextTeams);
    setQuestionDeck(nextQuestionDeck);
    setQuestionIndex(0);
    setBiddingState(createBiddingState(nextTeams, nextQuestionDeck[0], nextTeams[0].id));
    setChallengeState(null);
    setPhase('roundIntro');
    setMessage(null);
  }

  function startBiddingRound() {
    if (biddingState?.status !== 'bidding') {
      return;
    }

    setPhase('bidding');
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
    setPhase(nextBiddingState.status === 'challenge' ? 'challenge' : 'bidding');
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

    setPhase(currentRound >= roundCount ? 'finished' : 'roundScore');

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
    setPhase('roundIntro');
    setMessage(null);
  }

  function resetGame() {
    setPhase('welcome');
    setPlayerCount(null);
    setRoundCount(6);
    setSelectedCategories(defaultSelectedCategories);
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
      <div className="ambient-shapes" aria-hidden="true">
        <span className="shape shape-ribbon" />
        <span className="shape shape-pill" />
        <span className="shape shape-tile" />
        <span className="shape shape-spark" />
      </div>
      <header className="app-header">
        <div className="brand-lockup">
          <div className="buddy-mark" aria-hidden="true">
            <span />
            <span />
          </div>
          <p className="eyebrow">Lokales Partyspiel</p>
          <h1>Bet Buddy</h1>
        </div>
        <div className="header-copy">
          <p className="intro">
            Setzt Teams, bietet mutig und zeigt, wie gut ihr eure Buddies einschätzen könnt.
          </p>
          {phase !== 'welcome' ? (
            <button className="secondary-action compact-action" onClick={resetGame} type="button">
              Neues Spiel
            </button>
          ) : null}
        </div>
      </header>

      {phase === 'welcome' ? (
        <section className="workspace welcome-screen" aria-labelledby="welcome-title">
          <p className="eyebrow">Gemeinsam am Tisch</p>
          <h2 id="welcome-title">Willkommen bei Bet Buddy</h2>
          <p className="screen-copy">
            Ein lokales Teamspiel mit Fragen, mutigen Zielen und schnellen Challenges.
          </p>
          <button className="primary-action" onClick={() => setPhase('setup')} type="button">
            Spiel vorbereiten
          </button>
        </section>
      ) : null}

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

          <section aria-labelledby="category-title">
            <h3 id="category-title">Kategorien</h3>
            <div className="category-grid" aria-label="Kategorien wählen">
              {categoryOptions.map((category) => (
                <button
                  aria-pressed={selectedCategories.includes(category.id)}
                  className={selectedCategories.includes(category.id) ? 'is-selected' : ''}
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </section>

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

      {phase === 'roundIntro' ? (
        <section
          className={`workspace round-screen ${usesTableMode ? 'table-question-screen' : ''}`}
          aria-labelledby="round-title"
        >
          {usesTableMode ? (
            <QuestionTablePanel
              className="is-opponent"
              currentRound={currentRound}
              question={activeQuestion}
              roundCount={roundCount}
            />
          ) : null}
          <div className="round-panel hero-panel">
            <p className="eyebrow">Runde {currentRound} von {roundCount}</p>
            <h2 id="round-title">{activeQuestion.text}</h2>
            <p className="round-meta">
              Kategorie: {getCategoryLabel(activeQuestion.category)} · Zeitlimit:{' '}
              {activeQuestion.timeLimit} Sekunden
            </p>
          </div>
          <button className="primary-action screen-action" onClick={startBiddingRound} type="button">
            Bietrunde starten
          </button>
        </section>
      ) : null}

      {phase === 'bidding' && biddingState?.status === 'bidding' ? (
        usesTableMode ? (
          <section className="workspace table-mode" aria-label="Tischmodus für zwei Teams">
            <BiddingTablePanel
              className="is-opponent"
              currentBid={biddingState.currentBid}
              question={activeQuestion}
              teamName={getOtherTeamName(teams, biddingState.activeTeamId)}
            />
            <div className="table-core phase-panel bidding-panel">
              <p className="eyebrow">Runde {currentRound} von {roundCount}</p>
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
            <BiddingTablePanel
              className="is-active"
              currentBid={biddingState.currentBid}
              question={activeQuestion}
              teamName={teamById.get(biddingState.activeTeamId)?.name ?? 'Aktives Team'}
            />
          </section>
        ) : (
          <section className="workspace round-screen" aria-labelledby="bidding-title">
            <div className="round-controls phase-panel bidding-panel">
              <p className="eyebrow">Bietrunde</p>
              <h2 id="bidding-title" className="turn-label">
                {teamById.get(biddingState.activeTeamId)?.name} ist am Zug
              </h2>
              <p className="bid-value">Aktuelles Ziel: {biddingState.currentBid}</p>
              <p className="round-meta">{activeQuestion.text}</p>
              <div className="action-row">
                <button className="primary-action" onClick={handleRaiseBid} type="button">
                  Ziel +1
                </button>
                <button className="secondary-action" onClick={handlePassBid} type="button">
                  Passen
                </button>
              </div>
            </div>
          </section>
        )
      ) : null}

      {phase === 'challenge' && biddingState?.status === 'challenge' ? (
        <section className="workspace round-screen" aria-labelledby="challenge-title">
            <div className="round-controls phase-panel challenge-panel">
              <p className="eyebrow">Challenge</p>
              <h2 id="challenge-title" className="turn-label">
                {teamById.get(biddingState.challengeTeamId)?.name} muss{' '}
                {biddingState.currentBid} schaffen
              </h2>
              <p className="round-meta">{activeQuestion.text}</p>
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
        </section>
      ) : null}

      {phase === 'roundScore' ? (
        <section className="workspace score-screen" aria-labelledby="round-score-title">
            <div className="round-controls phase-panel">
              <h2 id="round-score-title" className="turn-label">Runde ausgewertet</h2>
              {message !== null ? <p className="round-meta">{message}</p> : null}
              <button className="primary-action" onClick={startNextRound} type="button">
                Nächste Runde
              </button>
            </div>
          <Scoreboard teams={teams} players={players} />
        </section>
      ) : null}

      {phase === 'finished' ? (
        <section className="workspace score-screen" aria-labelledby="finished-title">
          <div className="round-panel hero-panel">
            <p className="eyebrow">Nach {roundCount} Runden</p>
            <h2 id="finished-title">Spiel beendet</h2>
            {message !== null ? <p className="round-meta">{message}</p> : null}
            <p className="round-meta">{formatGameResult(teams)}</p>
          </div>
          <Scoreboard teams={teams} players={players} />
        </section>
      ) : null}

      {message !== null && phase !== 'roundScore' && phase !== 'finished' ? (
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

function getOtherTeamName(teams: Team[], activeTeamId: string) {
  return teams.find((team) => team.id !== activeTeamId)?.name ?? 'Anderes Team';
}

function QuestionTablePanel({
  className,
  currentRound,
  question,
  roundCount,
}: {
  className: string;
  currentRound: number;
  question: Question;
  roundCount: number;
}) {
  return (
    <div className={`table-question-panel ${className}`} aria-hidden={className === 'is-opponent'}>
      <p className="eyebrow">Runde {currentRound} von {roundCount}</p>
      <p className="table-question-text">{question.text}</p>
      <p className="round-meta">
        {getCategoryLabel(question.category)} · {question.timeLimit} Sekunden
      </p>
    </div>
  );
}

function BiddingTablePanel({
  className,
  currentBid,
  question,
  teamName,
}: {
  className: string;
  currentBid: number;
  question: Question;
  teamName: string;
}) {
  return (
    <div className={`table-team-panel ${className}`} aria-hidden={className === 'is-opponent'}>
      <p className="eyebrow">{teamName}</p>
      <p className="table-question-text">{question.text}</p>
      <p className="bid-value">Ziel {currentBid}</p>
    </div>
  );
}

function getCategoryLabel(category: Question['category']) {
  return categoryOptions.find((categoryOption) => categoryOption.id === category)?.label ?? category;
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
