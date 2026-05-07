import { useEffect, useMemo, useRef, useState } from 'react';
import {
  canEndBidTurn,
  canPassBid,
  createBiddingState,
  endBidTurn,
  getEligiblePlayerCounts,
  passBid,
  raiseBid,
  resolveChallenge,
  validateManualTeams,
} from './game/gameLogic';
import type { BiddingState, CategoryId, Player, Question, Team } from './game/types';
import {
  createQuestionDeck,
  filterQuestionsByCategories,
  findNextPlayableQuestionIndex,
} from './game/questionDeck';
import { validatePlayerName } from './security/validatePlayerName';
import { MAX_TEAM_NAME_LENGTH, validateTeamName } from './security/validateTeamName';

type Phase =
  | 'welcome'
  | 'rules'
  | 'setup'
  | 'teams'
  | 'roundIntro'
  | 'bidding'
  | 'challenge'
  | 'roundScore'
  | 'finished';
type SetupStep = 'players' | 'rules';
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

type ChallengeLoopAudioState = {
  audio: HTMLAudioElement;
  fadeIntervalId: number | null;
  fadeOutTimeoutId: number | null;
};

type OneShotAudioState = {
  audio: HTMLAudioElement;
  cleanupTimeoutId: number | null;
  fadeIntervalIds: number[];
  fadeOutTimeoutId: number | null;
};

type GameSound = 'bid' | 'challengeRunningLoop' | 'challengeSuccess' | 'challengeFail';

const gameSoundFiles: Record<GameSound, string> = {
  bid: 'sounds/bid.wav',
  challengeRunningLoop: 'sounds/Measured_Breath.mp3',
  challengeSuccess: 'sounds/challenge-success.wav',
  challengeFail: 'sounds/challenge-fail.wav',
};
const challengeLoopTargetVolume = 0.42;
const challengeSuccessTargetVolume = 0.34;
const gameSoundVolumes: Record<GameSound, number> = {
  bid: 0.38,
  challengeRunningLoop: challengeLoopTargetVolume,
  challengeSuccess: challengeSuccessTargetVolume,
  challengeFail: 0.72,
};
const manualChallengeLoopFadeOutMs = 650;
const challengeSuccessFadeInMs = 120;
const challengeSuccessFadeOutDelayMs = 560;
const challengeSuccessFadeOutMs = 520;
const oneShotSoundCleanupMs: Record<Exclude<GameSound, 'challengeRunningLoop'>, number> = {
  bid: 1_500,
  challengeSuccess: challengeSuccessFadeOutDelayMs + challengeSuccessFadeOutMs + 250,
  challengeFail: 4_500,
};

const roundCountOptions = [6, 8, 10] as const;
const categoryOptions: Array<{ id: CategoryId; label: string }> = [
  { id: 'allgemeinwissen', label: 'Allgemeinwissen' },
  { id: 'essen-trinken', label: 'Essen & Trinken' },
  { id: 'geographie', label: 'Geographie' },
  { id: 'geschichte', label: 'Geschichte' },
  { id: 'koerperlich', label: 'Körperlich' },
  { id: 'kreativ', label: 'Kreativ' },
];
const defaultSelectedCategories = categoryOptions.map((category) => category.id);
const fallbackQuestion: Question = {
  id: 'fallback-empty-question',
  text: 'Keine Frage verfügbar.',
  category: 'allgemeinwissen',
  timeLimit: 30,
  type: 'count',
  minBid: 1,
};

export default function App({ createDeck = createQuestionDeck }: AppProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [setupStep, setSetupStep] = useState<SetupStep>('players');
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
  const [roundIndex, setRoundIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionDeck, setQuestionDeck] = useState<Question[]>(() => createDeck());
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [recentPointTeamIds, setRecentPointTeamIds] = useState<string[]>([]);
  const challengeLoopAudioRef = useRef<ChallengeLoopAudioState | null>(null);
  const oneShotAudioRefs = useRef<OneShotAudioState[]>([]);

  const activeQuestion =
    questionDeck.length > 0
      ? questionDeck[questionIndex % questionDeck.length]
      : fallbackQuestion;
  const currentRound = roundIndex + 1;
  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );
  const usesTableMode = teams.length === 2;
  const usesMirroredRoundIntro = usesTableMode && activeQuestion.category !== 'koerperlich';
  const isGamePhase =
    phase === 'roundIntro' ||
    phase === 'bidding' ||
    phase === 'challenge' ||
    phase === 'roundScore' ||
    phase === 'finished';
  const challengeWasSuccessful =
    biddingState?.status === 'challenge' && challengeState !== null
      ? challengeState.count >= biddingState.currentBid
      : false;
  const activeTeamCanEndBidTurn =
    biddingState?.status === 'bidding'
      ? canEndBidTurn(biddingState, biddingState.activeTeamId)
      : false;
  const activeTeamCanPassBid =
    biddingState?.status === 'bidding' ? canPassBid(biddingState, biddingState.activeTeamId) : false;
  const nextQuestionIndex = findNextPlayableQuestionIndex(questionDeck, questionIndex + 1);
  const canSkipCurrentQuestion =
    phase === 'roundIntro' &&
    nextQuestionIndex !== null &&
    questionDeck.length > 0 &&
    nextQuestionIndex % questionDeck.length !== questionIndex % questionDeck.length;

  useEffect(() => {
    if (challengeState?.status !== 'running') {
      stopChallengeLoopAudio(challengeLoopAudioRef);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setChallengeState((currentChallengeState) => {
        if (currentChallengeState?.status !== 'running') {
          return currentChallengeState;
        }

        if (activeQuestion.type === 'duration') {
          const nextCount = currentChallengeState.count + 1;

          if (currentChallengeState.secondsLeft <= 1) {
            return {
              ...currentChallengeState,
              count: nextCount,
              secondsLeft: 0,
              status: 'review',
            };
          }

          return {
            ...currentChallengeState,
            count: nextCount,
            secondsLeft: currentChallengeState.secondsLeft - 1,
          };
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
  }, [activeQuestion.type, challengeState?.status]);

  useEffect(
    () => () => {
      stopChallengeLoopAudio(challengeLoopAudioRef, 0);
      stopOneShotAudio(oneShotAudioRefs);
    },
    [],
  );

  useEffect(() => {
    if (!soundsEnabled) {
      stopChallengeLoopAudio(challengeLoopAudioRef, 0);
      stopOneShotAudio(oneShotAudioRefs);
      return;
    }

    if (challengeState?.status === 'running' && challengeLoopAudioRef.current === null) {
      startChallengeLoopAudio(challengeLoopAudioRef, challengeState.secondsLeft, true);
    }
  }, [challengeState?.secondsLeft, challengeState?.status, soundsEnabled]);

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

  function openSetupScreen() {
    setSetupStep('players');
    setPhase('setup');
    setMessage(null);
  }

  function validateCurrentPlayers() {
    if (playerCount === null) {
      setMessage('Bitte wählt zuerst eine Spieleranzahl.');
      return null;
    }

    const validatedPlayers: Player[] = [];

    for (let index = 0; index < playerCount; index += 1) {
      const validation = validatePlayerName(playerNames[index] ?? '');

      if (!validation.ok) {
        setMessage(`Spieler ${index + 1}: ${validation.error}`);
        return null;
      }

      validatedPlayers.push({
        id: `p${index + 1}`,
        name: validation.value,
      });
    }

    return validatedPlayers;
  }

  function continueToRules() {
    const validatedPlayers = validateCurrentPlayers();

    if (validatedPlayers === null) {
      return;
    }

    setPlayers(validatedPlayers);
    setSetupStep('rules');
    setMessage(null);
  }

  function prepareTeams() {
    const validatedPlayers = validateCurrentPlayers();

    if (validatedPlayers === null) {
      return;
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
    const nextTeams: Team[] = [];

    for (const [index, draft] of teamDrafts.entries()) {
      const fallbackName = `Team ${index + 1}`;
      const teamNameValidation = validateTeamName(draft.name, fallbackName);

      if (!teamNameValidation.ok) {
        setMessage(`${fallbackName}: ${teamNameValidation.error}`);
        return;
      }

      nextTeams.push({
        id: draft.id,
        name: teamNameValidation.value,
        playerIds: draft.playerIds,
        score: 0,
      });
    }
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
    setRoundIndex(0);
    setQuestionIndex(0);
    setBiddingState(createBiddingState(nextTeams, nextQuestionDeck[0], nextTeams[0].id));
    setChallengeState(null);
    setRecentPointTeamIds([]);
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
    playGameSound('bid', soundsEnabled, oneShotAudioRefs);
    setMessage(null);
  }

  function handleEndBidTurn() {
    if (biddingState?.status !== 'bidding') {
      return;
    }

    if (!canEndBidTurn(biddingState, biddingState.activeTeamId)) {
      setMessage('Erhöht zuerst den Einsatz oder passt.');
      return;
    }

    setBiddingState(endBidTurn(biddingState, teams, biddingState.activeTeamId));
    setMessage(null);
  }

  function handlePassBid() {
    if (biddingState?.status !== 'bidding') {
      return;
    }

    if (!canPassBid(biddingState, biddingState.activeTeamId)) {
      setMessage('Das Team mit dem höchsten Einsatz muss weitergeben oder liefern.');
      return;
    }

    const nextBiddingState = passBid(biddingState, teams, biddingState.activeTeamId);

    setBiddingState(nextBiddingState);
    setChallengeState(
      nextBiddingState.status === 'challenge'
        ? {
            count: 0,
            secondsLeft: getInitialChallengeSeconds(activeQuestion, nextBiddingState.currentBid),
            status: 'ready',
          }
        : null,
    );
    setPhase(nextBiddingState.status === 'challenge' ? 'challenge' : 'bidding');
    setMessage(null);
  }

  function increaseTracker() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState === null ||
      (currentChallengeState.status === 'ready' && activeQuestion.type !== 'streak')
        ? currentChallengeState
        : { ...currentChallengeState, count: currentChallengeState.count + 1 },
    );
  }

  function decreaseTracker() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState === null ||
      (currentChallengeState.status === 'ready' && activeQuestion.type !== 'streak')
        ? currentChallengeState
        : { ...currentChallengeState, count: Math.max(0, currentChallengeState.count - 1) },
    );
  }

  function startChallengeTimer() {
    if (challengeState?.status !== 'ready') {
      return;
    }

    startChallengeLoopAudio(challengeLoopAudioRef, challengeState.secondsLeft, soundsEnabled);
    setChallengeState({ ...challengeState, status: 'running' });
  }

  function reviewChallengeResult() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState === null ||
      (currentChallengeState.status === 'ready' && activeQuestion.type !== 'streak')
        ? currentChallengeState
        : { ...currentChallengeState, status: 'review' },
    );
  }

  function stopDurationChallenge() {
    setChallengeState((currentChallengeState) =>
      currentChallengeState?.status === 'running'
        ? { ...currentChallengeState, status: 'review' }
        : currentChallengeState,
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
    const nextTeams = teams.map((team) =>
      winnerIds.includes(team.id) ? { ...team, score: team.score + 1 } : team,
    );

    playGameSound(
      wasSuccessful ? 'challengeSuccess' : 'challengeFail',
      soundsEnabled,
      oneShotAudioRefs,
    );
    setTeams(nextTeams);
    setRecentPointTeamIds(winnerIds);
    setBiddingState(null);
    setChallengeState(null);

    setPhase(currentRound >= roundCount ? 'finished' : 'roundScore');

    setMessage(formatPointResult(teams, winnerIds, challengeTeamName, wasSuccessful));
  }

  function startNextRound() {
    if (teams.length === 0) {
      return;
    }

    const nextRoundIndex = roundIndex + 1;
    const nextPlayableQuestionIndex =
      findNextPlayableQuestionIndex(questionDeck, questionIndex + 1) ?? questionIndex + 1;
    const firstTeam = teams[nextRoundIndex % teams.length];

    setRoundIndex(nextRoundIndex);
    setQuestionIndex(nextPlayableQuestionIndex);
    setChallengeState(null);
    setRecentPointTeamIds([]);
    setBiddingState(
      createBiddingState(
        teams,
        questionDeck[nextPlayableQuestionIndex % questionDeck.length],
        firstTeam.id,
      ),
    );
    setPhase('roundIntro');
    setMessage(null);
  }

  function skipCurrentQuestion() {
    if (phase !== 'roundIntro') {
      return;
    }

    const nextPlayableQuestionIndex = findNextPlayableQuestionIndex(questionDeck, questionIndex + 1);

    if (
      nextPlayableQuestionIndex === null ||
      nextPlayableQuestionIndex % questionDeck.length === questionIndex % questionDeck.length
    ) {
      setMessage('Keine weitere passende Frage verfügbar.');
      return;
    }

    moveToQuestionInCurrentRound(nextPlayableQuestionIndex, 'Frage übersprungen.');
  }

  function moveToQuestionInCurrentRound(nextPlayableQuestionIndex: number, nextMessage: string) {
    if (teams.length === 0) {
      return;
    }

    const firstTeam = teams[roundIndex % teams.length];

    setQuestionIndex(nextPlayableQuestionIndex);
    setChallengeState(null);
    setRecentPointTeamIds([]);
    setBiddingState(
      createBiddingState(
        teams,
        questionDeck[nextPlayableQuestionIndex % questionDeck.length],
        firstTeam.id,
      ),
    );
    setPhase('roundIntro');
    setMessage(nextMessage);
  }

  function toggleSounds() {
    setSoundsEnabled((currentSoundsEnabled) => {
      if (currentSoundsEnabled) {
        stopChallengeLoopAudio(challengeLoopAudioRef, 0);
        stopOneShotAudio(oneShotAudioRefs);
      }

      return !currentSoundsEnabled;
    });
  }

  function resetGame() {
    setPhase('welcome');
    setSetupStep('players');
    setPlayerCount(null);
    setRoundCount(6);
    setSelectedCategories(defaultSelectedCategories);
    setPlayerNames([]);
    setPlayers([]);
    setTeamDrafts([]);
    setTeams([]);
    setBiddingState(null);
    setChallengeState(null);
    setRoundIndex(0);
    setQuestionIndex(0);
    setQuestionDeck(createDeck());
    setRecentPointTeamIds([]);
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
          {isGamePhase && teams.length > 0 ? (
            <div className="game-hud" aria-label="Spielstatus">
              <span>Runde {Math.min(currentRound, roundCount)} von {roundCount}</span>
              <span className="score-chip">
                <span className="score-label">Score</span>
                <span className="score-value score-value-full">{formatScoreSummary(teams)}</span>
                <span className="score-value score-value-compact" aria-hidden="true">
                  {formatCompactScoreSummary(teams)}
                </span>
              </span>
            </div>
          ) : phase !== 'welcome' ? (
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
                onClick={toggleSounds}
                type="button"
              >
                {soundsEnabled ? 'Sounds aus' : 'Sounds an'}
              </button>
              <button className="secondary-action header-home-action" onClick={resetGame} type="button">
                Startseite
              </button>
            </>
          ) : null}
        </div>
      </header>

      {phase === 'welcome' ? (
        <section className="workspace welcome-screen" aria-labelledby="welcome-title">
          <div className="welcome-hero-content">
            <h2 id="welcome-title">Wer kennt seinen Buddy am besten?</h2>
            <p className="screen-copy">
              Bildet Teams, pokert um den Einsatz und beweist, wer seine Buddies am besten einschätzt.
            </p>
            <div className="welcome-actions">
              <button className="primary-action" onClick={openSetupScreen} type="button">
                Spiel starten
              </button>
              <button className="secondary-action" onClick={() => setPhase('rules')} type="button">
                Spiel Erklärung
              </button>
              <button
                aria-label={soundsEnabled ? 'Sounds ausschalten' : 'Sounds einschalten'}
                aria-pressed={soundsEnabled}
                className="secondary-action"
                onClick={toggleSounds}
                type="button"
              >
                {soundsEnabled ? 'Sounds aus' : 'Sounds an'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {phase === 'rules' ? (
        <section className="workspace rules-screen" aria-labelledby="rules-title">
          <p className="eyebrow">Kurz erklärt</p>
          <h2 id="rules-title">So läuft Bet Buddy</h2>
          <div className="rules-grid">
            <article>
              <h3>1. Einsatz hochpokern</h3>
              <p>In der Einsatzrunde erhöht ihr den Einsatz oder passt. Wer am höchsten pokert, muss gleich liefern.</p>
            </article>
            <article>
              <h3>2. Challenge liefern</h3>
              <p>
                Timer an, Antworten raus, alle fiebern mit. Das Team mit dem höchsten Einsatz muss zeigen,
                dass es nicht nur große Töne spuckt.
              </p>
            </article>
            <article>
              <h3>3. Zählen und fair prüfen</h3>
              <p>Der Tracker zählt live mit. Wenn etwas verrutscht, korrigiert ihr kurz und die App vergibt den Punkt.</p>
            </article>
          </div>
          <div className="action-row">
            <button className="secondary-action" onClick={() => setPhase('welcome')} type="button">
              Zur Startseite
            </button>
            <button className="primary-action" onClick={openSetupScreen} type="button">
              Spiel starten
            </button>
          </div>
        </section>
      ) : null}

      {phase === 'setup' ? (
        <section
          className={`workspace setup-screen setup-step-${setupStep}`}
          aria-label="Spieleinstellungen"
        >
          <p className="eyebrow setup-progress">
            Schritt {setupStep === 'players' ? '1' : '2'} von 3
          </p>

          {setupStep === 'players' ? (
            <>
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

              {playerCount !== null ? (
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
              ) : null}

              <button className="primary-action" onClick={continueToRules} type="button">
                Weiter zu Einstellungen
              </button>
            </>
          ) : (
            <>
              <section aria-labelledby="round-count-title">
                <h3 id="round-count-title">Spieldauer</h3>
                <div className="segmented-control" aria-label="Spieldauer wählen">
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

              <div className="action-row">
                <button
                  className="secondary-action"
                  onClick={() => setSetupStep('players')}
                  type="button"
                >
                  Zurück
                </button>
                <button className="primary-action" onClick={prepareTeams} type="button">
                  Teams erstellen
                </button>
              </div>
            </>
          )}
        </section>
      ) : null}

      {phase === 'teams' ? (
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
            <button
              className="secondary-action"
              onClick={() => {
                setSetupStep('rules');
                setPhase('setup');
              }}
              type="button"
            >
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
          className={`workspace round-screen ${usesMirroredRoundIntro ? 'table-question-screen' : ''}`}
          aria-labelledby="round-title"
        >
          {usesMirroredRoundIntro ? (
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
            <ChallengeIllustration question={activeQuestion} />
            <RoundMetaPills question={activeQuestion} />
          </div>
          <div className="round-intro-actions">
            <button className="primary-action screen-action" onClick={startBiddingRound} type="button">
              Einsatzrunde starten
            </button>
            <button
              className="secondary-action"
              disabled={!canSkipCurrentQuestion}
              onClick={skipCurrentQuestion}
              type="button"
            >
              Frage überspringen
            </button>
          </div>
        </section>
      ) : null}

      {phase === 'bidding' && biddingState?.status === 'bidding' ? (
        usesTableMode ? (
          <section className="workspace table-mode" aria-label="Tischmodus für zwei Teams">
            <TableSideControls
              canEndTurn={activeTeamCanEndBidTurn}
              canPass={activeTeamCanPassBid}
              className="is-opponent"
              isActive={teams[1]?.id === biddingState.activeTeamId}
              onEndTurn={handleEndBidTurn}
              onPass={handlePassBid}
              onRaise={handleRaiseBid}
              team={teams[1]}
            />
            <BiddingCenterQuestion
              activeTeam={teamById.get(biddingState.activeTeamId)}
              currentBid={biddingState.currentBid}
              facesOpponent={teams[1]?.id === biddingState.activeTeamId}
              holdingTeam={
                biddingState.highestBidTeamId !== null
                  ? teamById.get(biddingState.highestBidTeamId)
                  : undefined
              }
              question={activeQuestion}
            />
            <TableSideControls
              canEndTurn={activeTeamCanEndBidTurn}
              canPass={activeTeamCanPassBid}
              className="is-active"
              isActive={teams[0]?.id === biddingState.activeTeamId}
              onEndTurn={handleEndBidTurn}
              onPass={handlePassBid}
              onRaise={handleRaiseBid}
              team={teams[0]}
            />
          </section>
        ) : (
          <section className="workspace round-screen" aria-labelledby="bidding-title">
            <div className="round-controls phase-panel bidding-panel">
              <p className="eyebrow">Einsatzrunde</p>
              <h2 id="bidding-title" className="turn-label">
                {teamById.get(biddingState.activeTeamId)?.name} ist am Zug
              </h2>
              <BidDisplay
                currentBid={biddingState.currentBid}
                question={activeQuestion}
                statusText={
                  biddingState.highestBidTeamId !== null
                    ? formatBidStatus(
                        teamById.get(biddingState.activeTeamId),
                        teamById.get(biddingState.highestBidTeamId),
                      )
                    : undefined
                }
              />
              <p className="round-meta">{activeQuestion.text}</p>
              <div className="action-row">
                <button className="primary-action" onClick={handleRaiseBid} type="button">
                  Einsatz +1
                </button>
                <button
                  className="secondary-action"
                  disabled={!activeTeamCanEndBidTurn}
                  onClick={handleEndBidTurn}
                  type="button"
                >
                  Weitergeben
                </button>
                <button
                  className="secondary-action"
                  disabled={!activeTeamCanPassBid}
                  onClick={handlePassBid}
                  type="button"
                >
                  Passen
                </button>
              </div>
            </div>
          </section>
        )
      ) : null}

      {phase === 'challenge' && biddingState?.status === 'challenge' ? (
        <section className="workspace round-screen" aria-labelledby="challenge-title">
            <div
              className="round-controls phase-panel challenge-panel"
              data-challenge-status={challengeState?.status ?? 'ready'}
              data-challenge-type={activeQuestion.type}
            >
              <p className="eyebrow">Challenge</p>
              <h2 id="challenge-title" className="turn-label">
                {teamById.get(biddingState.challengeTeamId)?.name} muss{' '}
                {formatChallengeGoal(biddingState.currentBid, activeQuestion)} schaffen
              </h2>
              <p className="round-meta">{activeQuestion.text}</p>
              <ChallengeIllustration question={activeQuestion} />
              {challengeState?.status === 'running' ? (
                <div className="challenge-running-indicator" role="status">
                  <span aria-hidden="true" />
                  Challenge läuft
                </div>
              ) : null}
              {challengeState !== null ? (
                <>
                  <div className="challenge-metrics">
                    {activeQuestion.type !== 'streak' ? (
                      <p className="timer-value">
                        {formatChallengeTimer(activeQuestion, challengeState)}
                      </p>
                    ) : null}
                    <p className="tracker-value">
                      {formatChallengeProgress(
                        activeQuestion,
                        challengeState.count,
                        biddingState.currentBid,
                      )}
                    </p>
                  </div>
                  {activeQuestion.type === 'streak' && challengeState.status !== 'review' ? (
                    <div className="action-row">
                      <button className="secondary-action tracker-action tracker-action-decrease" onClick={decreaseTracker} type="button">
                        -1
                      </button>
                      <button className="secondary-action tracker-action tracker-action-increase" onClick={increaseTracker} type="button">
                        Treffer +1
                      </button>
                      {challengeState.count >= biddingState.currentBid ? (
                        <button className="secondary-action" onClick={reviewChallengeResult} type="button">
                          Einsatz geschafft
                        </button>
                      ) : (
                        <button className="secondary-action" onClick={reviewChallengeResult} type="button">
                          Verfehlt
                        </button>
                      )}
                    </div>
                  ) : null}
                  {activeQuestion.type !== 'duration' &&
                  activeQuestion.type !== 'streak' &&
                  challengeState.status !== 'review' ? (
                    <div className="action-row">
                      <button
                        className="secondary-action tracker-action tracker-action-decrease"
                        disabled={challengeState.status === 'ready'}
                        onClick={decreaseTracker}
                        type="button"
                      >
                        -1
                      </button>
                      <button
                        className="secondary-action tracker-action tracker-action-increase"
                        disabled={challengeState.status === 'ready'}
                        onClick={increaseTracker}
                        type="button"
                      >
                        {formatIncreaseTrackerLabel(activeQuestion)}
                      </button>
                    </div>
                  ) : null}
                  {challengeState.status !== 'review' && activeQuestion.type !== 'streak' ? (
                    <div className="action-row">
                      {challengeState.status === 'ready' ? (
                        <button className="primary-action" onClick={startChallengeTimer} type="button">
                          Challenge starten
                        </button>
                      ) : null}
                      {activeQuestion.type === 'duration' && challengeState.status === 'running' ? (
                        <button className="secondary-action" onClick={stopDurationChallenge} type="button">
                          Stoppen
                        </button>
                      ) : null}
                      {activeQuestion.type !== 'duration' ? (
                        <button
                          className="secondary-action"
                          disabled={challengeState.status === 'ready'}
                          onClick={reviewChallengeResult}
                          type="button"
                        >
                          Auswertung prüfen
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {challengeState.status === 'review' ? (
                    <div
                      className="challenge-review"
                      data-outcome={challengeWasSuccessful ? 'success' : 'failure'}
                    >
                      <div className="challenge-review__header">
                        <p className="eyebrow">Ergebnis-Check</p>
                        <p className="challenge-review__result" role="status">
                          {challengeWasSuccessful ? 'Geschafft' : 'Nicht geschafft'}
                        </p>
                        <p className="challenge-review__score">
                          {challengeState.count} / {biddingState.currentBid}
                        </p>
                      </div>
                      <div
                        className="challenge-review__stepper"
                        aria-label="Zählwert anpassen"
                      >
                        <button
                          className="secondary-action tracker-action tracker-action-decrease"
                          onClick={decreaseTracker}
                          type="button"
                        >
                          {formatDecreaseTrackerLabel(activeQuestion)}
                        </button>
                        <button
                          className="secondary-action tracker-action tracker-action-increase"
                          onClick={increaseTracker}
                          type="button"
                        >
                          {formatIncreaseTrackerLabel(activeQuestion)}
                        </button>
                      </div>
                      <button
                        className={challengeWasSuccessful ? 'primary-action' : 'danger-action'}
                        aria-label="Ergebnis bestätigen"
                        onClick={confirmChallengeResult}
                        type="button"
                      >
                        {challengeWasSuccessful ? 'Geschafft' : 'Nicht geschafft'} bestätigen
                      </button>
                    </div>
                  ) : null}
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
          <Scoreboard players={players} recentPointTeamIds={recentPointTeamIds} teams={teams} />
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
          <Scoreboard players={players} recentPointTeamIds={recentPointTeamIds} teams={teams} />
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

function BiddingCenterQuestion({
  activeTeam,
  currentBid,
  facesOpponent,
  holdingTeam,
  question,
}: {
  activeTeam: Team | undefined;
  currentBid: number;
  facesOpponent: boolean;
  holdingTeam: Team | undefined;
  question: Question;
}) {
  return (
    <div
      className={`table-center-question ${facesOpponent ? 'faces-opponent' : 'faces-home'}`}
      data-facing-team-id={activeTeam?.id}
    >
      <div className="table-question-copy">
        <p className="eyebrow">Einsatzrunde</p>
        <p className="table-question-text">{question.text}</p>
        <BidDisplay
          currentBid={currentBid}
          question={question}
          statusText={holdingTeam ? formatBidStatus(activeTeam, holdingTeam) : undefined}
        />
      </div>
    </div>
  );
}

function BidDisplay({
  currentBid,
  question,
  statusText,
}: {
  currentBid: number;
  question: Question;
  statusText?: string;
}) {
  const bidAmount = getBidAmountDisplay(currentBid, question);
  const bidLabel = statusText ? 'Höchster Einsatz' : 'Mindest-Einsatz';

  return (
    <div className="table-bid-display" aria-label={bidLabel}>
      <span>{bidLabel}</span>
      <strong>{bidAmount.value}</strong>
      {bidAmount.unit ? <span className="table-bid-unit">{bidAmount.unit}</span> : null}
      {statusText ? <small>{statusText}</small> : null}
    </div>
  );
}

function RoundMetaPills({ question }: { question: Question }) {
  return (
    <div className="round-meta-list" aria-label="Rundeninformationen">
      <p className="round-meta-line">
        <span>Kategorie:</span>
        <strong>{getCategoryLabel(question.category)}</strong>
      </p>
      <p className="round-meta-line">
        <span>Zeitlimit:</span>
        <strong>{formatRoundTimeLimit(question)}</strong>
      </p>
    </div>
  );
}

function TableSideControls({
  canEndTurn,
  canPass,
  className,
  isActive,
  onEndTurn,
  onPass,
  onRaise,
  team,
}: {
  canEndTurn: boolean;
  canPass: boolean;
  className: string;
  isActive: boolean;
  onEndTurn: () => void;
  onPass: () => void;
  onRaise: () => void;
  team: Team | undefined;
}) {
  return (
    <div
      className={`table-side-controls ${className} ${isActive ? 'has-turn' : 'is-waiting'}`}
      data-active={isActive ? 'true' : 'false'}
      data-team-id={team?.id}
    >
      <div>
        <p className="eyebrow">{team?.name ?? 'Team'}</p>
        <p className="table-side-status">{isActive ? 'Am Zug' : 'Wartet'}</p>
      </div>
      {isActive ? (
        <div className="table-side-actions">
          <button
            aria-label="Einsatz +1"
            className="primary-action table-side-action-button"
            data-action="raise"
            onClick={onRaise}
            type="button"
          >
            Einsatz +1
          </button>
          <button
            aria-label="Weitergeben"
            className="secondary-action table-side-action-button"
            data-action="handoff"
            disabled={!canEndTurn}
            onClick={onEndTurn}
            type="button"
          >
            Weitergeben
          </button>
          <button
            aria-label="Passen"
            className="secondary-action table-side-action-button"
            data-action="pass"
            disabled={!canPass}
            onClick={onPass}
            type="button"
          >
            Passen
          </button>
        </div>
      ) : null}
    </div>
  );
}

const physicalChallengeIllustrations = [
  {
    idPart: 'kniebeugen',
    label: 'Kniebeugen Illustration',
    fileName: 'kniebeugen.png',
  },
  {
    idPart: 'hampelmaenner',
    label: 'Hampelmänner Illustration',
    fileName: 'hampelmaenner.png',
  },
  {
    idPart: 'liegestuetze',
    label: 'Liegestütze Illustration',
    fileName: 'liegestuetze.png',
  },
  {
    idPart: 'wand-sitzposition',
    label: 'Wand-Sitzposition Illustration',
    fileName: 'wand-sitzposition.png',
  },
  {
    idPart: 'buch-balancieren',
    label: 'Buch balancieren Illustration',
    fileName: 'buch-balancieren.png',
  },
  {
    idPart: 'loeffel-nase',
    label: 'Löffel balancieren Illustration',
    fileName: 'loeffel-nase.png',
  },
  {
    idPart: 'wurfgegenstand-korb',
    label: 'Wurf in Korb Illustration',
    fileName: 'wurfgegenstand-korb.png',
  },
  {
    idPart: 'wasserflasche-arm',
    label: 'Wasserflasche halten Illustration',
    fileName: 'wasserflasche-arm.png',
  },
  {
    idPart: 'ein-bein-augen-zu',
    label: 'Einbeinstand Illustration',
    fileName: 'ein-bein-augen-zu.png',
  },
  {
    idPart: 'unterarmstuetz',
    label: 'Unterarmstütz Illustration',
    fileName: 'unterarmstuetz.png',
  },
  {
    idPart: 'superman-hold',
    label: 'Superman-Hold Illustration',
    fileName: 'superman-hold.png',
  },
  {
    idPart: 'muenzturm',
    label: 'Münzturm Illustration',
    fileName: 'muenzturm.png',
  },
  {
    idPart: 'luftballon-atem',
    label: 'Luftballon mit Atem Illustration',
    fileName: 'luftballon-atem.png',
  },
] as const;

function ChallengeIllustration({ question }: { question: Question }) {
  const physicalIllustration = physicalChallengeIllustrations.find((illustration) =>
    question.id.includes(illustration.idPart),
  );

  if (physicalIllustration) {
    return (
      <figure className="challenge-illustration" aria-label={physicalIllustration.label}>
        <img
          alt=""
          decoding="async"
          src={`${import.meta.env.BASE_URL}challenges/physical/${physicalIllustration.fileName}`}
        />
      </figure>
    );
  }

  if (question.id.includes('luftballon-atem')) {
    return (
      <figure className="challenge-illustration" aria-label="Luftballon mit Atem Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-air" d="M62 73c24-18 52-18 82 0" />
          <path className="illustration-air" d="M76 92c18-10 38-10 58 0" />
          <circle className="illustration-balloon" cx="192" cy="38" r="24" />
          <path className="illustration-string" d="M192 62c-2 12-10 20-22 25" />
          <circle className="illustration-head" cx="92" cy="42" r="15" />
          <path className="illustration-body" d="M92 58v35" />
          <path className="illustration-limb" d="M92 70 66 82" />
          <path className="illustration-limb" d="M94 70 120 82" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('buch-balancieren')) {
    return (
      <figure className="challenge-illustration" aria-label="Buch balancieren Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M58 98h164" />
          <path className="illustration-book" d="M113 18h58v16h-58z" />
          <circle className="illustration-head" cx="142" cy="51" r="15" />
          <path className="illustration-body" d="M142 67v27" />
          <path className="illustration-limb" d="M140 73 104 60" />
          <path className="illustration-limb" d="M144 73 180 60" />
          <path className="illustration-limb" d="M141 92 120 107" />
          <path className="illustration-limb" d="M146 92 169 107" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('kniebeugen')) {
    return (
      <figure className="challenge-illustration" aria-label="Kniebeugen Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M52 98h176" />
          <circle className="illustration-head" cx="142" cy="35" r="15" />
          <path className="illustration-body" d="M142 51 132 76 150 76" />
          <path className="illustration-limb" d="M136 60 104 72" />
          <path className="illustration-limb" d="M148 60 180 72" />
          <path className="illustration-limb" d="M132 76 105 100" />
          <path className="illustration-limb" d="M150 76 178 100" />
          <path className="illustration-motion" d="M86 36c-12 12-12 28 0 40" />
          <path className="illustration-motion" d="M198 36c12 12 12 28 0 40" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('hampelmaenner')) {
    return (
      <figure className="challenge-illustration" aria-label="Hampelmänner Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M58 100h164" />
          <circle className="illustration-head" cx="142" cy="34" r="14" />
          <path className="illustration-body" d="M142 49v31" />
          <path className="illustration-limb" d="M138 57 101 28" />
          <path className="illustration-limb" d="M146 57 183 28" />
          <path className="illustration-limb" d="M140 80 111 105" />
          <path className="illustration-limb" d="M146 80 174 105" />
          <path className="illustration-motion" d="M84 45c-12 20-12 34 0 50" />
          <path className="illustration-motion" d="M200 45c12 20 12 34 0 50" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('liegestuetze')) {
    return (
      <figure className="challenge-illustration" aria-label="Liegestütze Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M36 96h210" />
          <circle className="illustration-head" cx="214" cy="48" r="15" />
          <path className="illustration-body" d="M198 55 145 62 88 62" />
          <path className="illustration-limb" d="M186 62 174 94" />
          <path className="illustration-limb" d="M164 64 154 94" />
          <path className="illustration-limb" d="M88 63 58 94" />
          <path className="illustration-limb" d="M105 63 75 94" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('wand-sitzposition')) {
    return (
      <figure className="challenge-illustration" aria-label="Wand-Sitzposition Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-wall" d="M82 16v88" />
          <path className="illustration-mat" d="M66 104h158" />
          <circle className="illustration-head" cx="124" cy="35" r="14" />
          <path className="illustration-body" d="M116 50 116 76 155 76" />
          <path className="illustration-limb" d="M116 58 92 70" />
          <path className="illustration-limb" d="M120 58 145 68" />
          <path className="illustration-limb" d="M155 76 172 102" />
          <path className="illustration-limb" d="M136 76 136 102" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('unterarmstuetz')) {
    return (
      <figure className="challenge-illustration" aria-label="Unterarmstütz Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M34 94h216" />
          <circle className="illustration-head" cx="218" cy="39" r="16" />
          <path className="illustration-body" d="M202 47 154 62 90 63" />
          <path className="illustration-limb" d="M190 56 178 88" />
          <path className="illustration-limb" d="M175 61 164 89" />
          <path className="illustration-limb" d="M92 64 58 90" />
          <path className="illustration-limb" d="M112 64 78 90" />
          <path className="illustration-support" d="M156 88h42" />
          <path className="illustration-support" d="M52 92h38" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('loeffel-nase')) {
    return (
      <figure className="challenge-illustration" aria-label="Löffel balancieren Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <circle className="illustration-head" cx="140" cy="55" r="28" />
          <path className="illustration-body" d="M140 83v24" />
          <path className="illustration-spoon" d="M150 52c24-12 50-12 72 0" />
          <ellipse className="illustration-spoon-bowl" cx="228" cy="48" rx="12" ry="7" />
          <path className="illustration-limb" d="M136 93 112 108" />
          <path className="illustration-limb" d="M144 93 168 108" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('wurfgegenstand-korb')) {
    return (
      <figure className="challenge-illustration" aria-label="Wurf in Korb Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <circle className="illustration-ball" cx="94" cy="44" r="12" />
          <path className="illustration-arc" d="M105 42c38-30 82-25 112 12" />
          <path className="illustration-basket" d="M198 66h48l-10 38h-28z" />
          <path className="illustration-basket" d="M194 66h56" />
          <circle className="illustration-head" cx="64" cy="64" r="13" />
          <path className="illustration-body" d="M64 78v28" />
          <path className="illustration-limb" d="M66 82 96 58" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('wasserflasche-arm')) {
    return (
      <figure className="challenge-illustration" aria-label="Wasserflasche halten Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <circle className="illustration-head" cx="120" cy="38" r="14" />
          <path className="illustration-body" d="M120 53v42" />
          <path className="illustration-limb" d="M122 62 178 62" />
          <path className="illustration-limb" d="M116 62 88 78" />
          <path className="illustration-limb" d="M119 94 98 108" />
          <path className="illustration-limb" d="M123 94 146 108" />
          <path className="illustration-bottle" d="M184 47h18v38h-18z" />
          <path className="illustration-bottle" d="M188 38h10v10h-10z" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('ein-bein-augen-zu')) {
    return (
      <figure className="challenge-illustration" aria-label="Einbeinstand Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M70 104h140" />
          <circle className="illustration-head" cx="142" cy="34" r="14" />
          <path className="illustration-eye" d="M133 34h18" />
          <path className="illustration-body" d="M142 49v38" />
          <path className="illustration-limb" d="M139 58 108 74" />
          <path className="illustration-limb" d="M145 58 176 74" />
          <path className="illustration-limb" d="M142 86 142 108" />
          <path className="illustration-limb" d="M142 86 174 96" />
          <path className="illustration-motion" d="M102 28c-12 18-12 45 0 64" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('superman-hold')) {
    return (
      <figure className="challenge-illustration" aria-label="Superman-Hold Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M42 98h196" />
          <circle className="illustration-head" cx="202" cy="50" r="14" />
          <path className="illustration-body" d="M187 56 142 66 96 62" />
          <path className="illustration-limb" d="M186 58 226 35" />
          <path className="illustration-limb" d="M150 66 112 38" />
          <path className="illustration-limb" d="M98 62 66 42" />
          <path className="illustration-limb" d="M112 65 82 84" />
          <path className="illustration-motion" d="M58 30h44" />
        </svg>
      </figure>
    );
  }

  if (question.id.includes('muenzturm')) {
    return (
      <figure className="challenge-illustration" aria-label="Münzturm Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M76 100h128" />
          <ellipse className="illustration-coin" cx="142" cy="90" rx="30" ry="8" />
          <ellipse className="illustration-coin" cx="142" cy="76" rx="30" ry="8" />
          <ellipse className="illustration-coin" cx="142" cy="62" rx="30" ry="8" />
          <ellipse className="illustration-coin" cx="142" cy="48" rx="30" ry="8" />
          <path className="illustration-limb" d="M78 58c18 12 32 16 48 12" />
          <circle className="illustration-ball" cx="205" cy="45" r="9" />
        </svg>
      </figure>
    );
  }

  if (question.category === 'koerperlich') {
    return (
      <figure className="challenge-illustration" aria-label="Körperliche Challenge Illustration">
        <svg viewBox="0 0 280 120" role="img" aria-hidden="true">
          <path className="illustration-mat" d="M42 96h196" />
          <circle className="illustration-head" cx="142" cy="33" r="15" />
          <path className="illustration-body" d="M142 49v32" />
          <path className="illustration-limb" d="M140 58 108 75" />
          <path className="illustration-limb" d="M144 58 176 75" />
          <path className="illustration-limb" d="M140 80 116 101" />
          <path className="illustration-limb" d="M145 80 168 101" />
        </svg>
      </figure>
    );
  }

  return null;
}

function getCategoryLabel(category: Question['category']) {
  return categoryOptions.find((categoryOption) => categoryOption.id === category)?.label ?? category;
}

function getInitialChallengeSeconds(question: Question, currentBid: number) {
  if (question.type === 'duration') {
    return currentBid;
  }

  return question.timeLimit;
}

function formatChallengeGoal(currentBid: number, question: Question) {
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

function getBidAmountDisplay(currentBid: number, question: Question) {
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

function formatChallengeTimer(question: Question, challengeState: ChallengeState) {
  if (question.type === 'duration') {
    return `Noch: ${formatSeconds(challengeState.secondsLeft)}`;
  }

  if (question.type === 'drawing') {
    return `Zeichenzeit: ${challengeState.secondsLeft} Sekunden`;
  }

  return `Timer: ${challengeState.secondsLeft} Sekunden`;
}

function formatRoundTimeLimit(question: Question) {
  if (question.type === 'duration') {
    return 'Einsatz zählt';
  }

  if (question.type === 'streak') {
    return 'Ohne Timer';
  }

  return `${question.timeLimit} Sekunden`;
}

function formatChallengeProgress(
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

function formatSeconds(seconds: number) {
  return `${seconds} ${seconds === 1 ? 'Sekunde' : 'Sekunden'}`;
}

function formatIncreaseTrackerLabel(question: Question) {
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

function formatDecreaseTrackerLabel(question: Question) {
  if (question.type === 'duration') {
    return '-1 Sekunde';
  }

  if (question.type === 'streak') {
    return '-1 Treffer';
  }

  return '-1';
}

function playGameSound(
  sound: GameSound,
  soundsEnabled: boolean,
  oneShotAudioRef: { current: OneShotAudioState[] },
) {
  if (!soundsEnabled || typeof window === 'undefined') {
    return;
  }

  try {
    const audio = createGameAudio(sound);
    const audioState = createOneShotAudioState(audio);

    oneShotAudioRef.current = [...oneShotAudioRef.current, audioState];

    if (sound === 'challengeSuccess') {
      playFadedOneShotAudio(
        audioState,
        challengeSuccessTargetVolume,
        challengeSuccessFadeInMs,
        challengeSuccessFadeOutDelayMs,
        challengeSuccessFadeOutMs,
      );
      scheduleOneShotCleanup(oneShotAudioRef, audioState, oneShotSoundCleanupMs[sound]);
      return;
    }

    audio.volume = gameSoundVolumes[sound];
    audio.currentTime = 0;
    scheduleOneShotCleanup(oneShotAudioRef, audioState, oneShotSoundCleanupMs[sound]);
    void audio.play().catch(() => undefined);
  } catch {
    // Audio is progressive enhancement; gameplay must never depend on browser audio support.
  }
}

function playFadedOneShotAudio(
  audioState: OneShotAudioState,
  targetVolume: number,
  fadeInMs: number,
  fadeOutDelayMs: number,
  fadeOutMs: number,
) {
  const { audio } = audioState;

  audio.volume = 0;
  audio.currentTime = 0;
  fadeOneShotAudio(audioState, targetVolume, fadeInMs);

  audioState.fadeOutTimeoutId = window.setTimeout(() => {
    fadeOneShotAudio(audioState, 0, fadeOutMs);
  }, fadeOutDelayMs);

  void audio.play().catch(() => undefined);
}

function createOneShotAudioState(audio: HTMLAudioElement): OneShotAudioState {
  return {
    audio,
    cleanupTimeoutId: null,
    fadeIntervalIds: [],
    fadeOutTimeoutId: null,
  };
}

function scheduleOneShotCleanup(
  ref: { current: OneShotAudioState[] },
  audioState: OneShotAudioState,
  cleanupMs: number,
) {
  audioState.cleanupTimeoutId = window.setTimeout(() => {
    removeOneShotAudioState(ref, audioState);
  }, cleanupMs);
}

function fadeOneShotAudio(
  audioState: OneShotAudioState,
  targetVolume: number,
  durationMs: number,
) {
  const { audio } = audioState;
  const startVolume = audio.volume;

  if (durationMs <= 0) {
    audio.volume = targetVolume;
    return;
  }

  const stepMs = 40;
  let elapsedMs = 0;
  const intervalId = window.setInterval(() => {
    elapsedMs += stepMs;
    const progress = Math.min(1, elapsedMs / durationMs);

    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress >= 1) {
      window.clearInterval(intervalId);
      audioState.fadeIntervalIds = audioState.fadeIntervalIds.filter(
        (currentIntervalId) => currentIntervalId !== intervalId,
      );
    }
  }, stepMs);

  audioState.fadeIntervalIds.push(intervalId);
}

function stopOneShotAudio(ref: { current: OneShotAudioState[] }) {
  if (typeof window === 'undefined') {
    return;
  }

  ref.current.forEach((audioState) => {
    audioState.fadeIntervalIds.forEach((intervalId) => window.clearInterval(intervalId));

    if (audioState.cleanupTimeoutId !== null) {
      window.clearTimeout(audioState.cleanupTimeoutId);
    }

    if (audioState.fadeOutTimeoutId !== null) {
      window.clearTimeout(audioState.fadeOutTimeoutId);
    }

    audioState.audio.pause();
    audioState.audio.currentTime = 0;
    audioState.audio.volume = 0;
  });

  ref.current = [];
}

function removeOneShotAudioState(
  ref: { current: OneShotAudioState[] },
  audioState: OneShotAudioState,
) {
  ref.current = ref.current.filter((currentAudioState) => currentAudioState !== audioState);
}

function startChallengeLoopAudio(
  ref: { current: ChallengeLoopAudioState | null },
  durationSeconds: number,
  soundsEnabled: boolean,
) {
  if (!soundsEnabled || typeof window === 'undefined') {
    return;
  }

  try {
    stopChallengeLoopAudio(ref, 0);

    const audio = createGameAudio('challengeRunningLoop');
    const loopState: ChallengeLoopAudioState = {
      audio,
      fadeIntervalId: null,
      fadeOutTimeoutId: null,
    };
    const fadeInMs = getChallengeLoopFadeInMs(durationSeconds);
    const fadeOutMs = getChallengeLoopFadeOutMs(durationSeconds);
    const fadeOutStartMs = Math.max(0, durationSeconds * 1000 - fadeOutMs);

    audio.loop = true;
    audio.volume = 0;
    audio.currentTime = 0;
    ref.current = loopState;
    fadeChallengeLoopAudio(ref, challengeLoopTargetVolume, fadeInMs, false);

    loopState.fadeOutTimeoutId = window.setTimeout(() => {
      fadeChallengeLoopAudio(ref, 0, fadeOutMs, true);
    }, fadeOutStartMs);

    void audio.play().catch(() => undefined);
  } catch {
    // Loop audio is atmospheric only; the challenge must stay playable without sound.
  }
}

function stopChallengeLoopAudio(
  ref: { current: ChallengeLoopAudioState | null },
  fadeOutMs = manualChallengeLoopFadeOutMs,
) {
  if (typeof window === 'undefined' || ref.current === null) {
    return;
  }

  clearChallengeLoopFadeOut(ref.current);

  if (fadeOutMs <= 0) {
    finishChallengeLoopAudio(ref, ref.current);
    return;
  }

  fadeChallengeLoopAudio(ref, 0, fadeOutMs, true);
}

function fadeChallengeLoopAudio(
  ref: { current: ChallengeLoopAudioState | null },
  targetVolume: number,
  durationMs: number,
  pauseWhenSilent: boolean,
) {
  const loopState = ref.current;

  if (typeof window === 'undefined' || loopState === null) {
    return;
  }

  clearChallengeLoopFadeInterval(loopState);

  const startVolume = loopState.audio.volume;

  if (durationMs <= 0) {
    loopState.audio.volume = targetVolume;

    if (pauseWhenSilent) {
      finishChallengeLoopAudio(ref, loopState);
    }

    return;
  }

  const stepMs = 50;
  let elapsedMs = 0;

  loopState.fadeIntervalId = window.setInterval(() => {
    elapsedMs += stepMs;

    const progress = Math.min(1, elapsedMs / durationMs);
    loopState.audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress >= 1) {
      clearChallengeLoopFadeInterval(loopState);

      if (pauseWhenSilent) {
        finishChallengeLoopAudio(ref, loopState);
      }
    }
  }, stepMs);
}

function finishChallengeLoopAudio(
  ref: { current: ChallengeLoopAudioState | null },
  loopState: ChallengeLoopAudioState,
) {
  clearChallengeLoopFadeInterval(loopState);
  clearChallengeLoopFadeOut(loopState);
  loopState.audio.volume = 0;
  loopState.audio.pause();
  loopState.audio.currentTime = 0;

  if (ref.current === loopState) {
    ref.current = null;
  }
}

function clearChallengeLoopFadeInterval(loopState: ChallengeLoopAudioState) {
  if (loopState.fadeIntervalId !== null) {
    window.clearInterval(loopState.fadeIntervalId);
    loopState.fadeIntervalId = null;
  }
}

function clearChallengeLoopFadeOut(loopState: ChallengeLoopAudioState) {
  if (loopState.fadeOutTimeoutId !== null) {
    window.clearTimeout(loopState.fadeOutTimeoutId);
    loopState.fadeOutTimeoutId = null;
  }
}

function getChallengeLoopFadeInMs(durationSeconds: number) {
  return Math.round(Math.min(1000, Math.max(250, durationSeconds * 1000 * 0.2)));
}

function getChallengeLoopFadeOutMs(durationSeconds: number) {
  return Math.round(Math.min(2200, Math.max(650, durationSeconds * 1000 * 0.25)));
}

function createGameAudio(sound: GameSound) {
  const audio = new Audio(getGameSoundSource(sound));

  audio.preload = 'auto';
  return audio;
}

function getGameSoundSource(sound: GameSound) {
  return `${import.meta.env.BASE_URL}${gameSoundFiles[sound]}`;
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

  if (winnerNames.length === teams.length - 1) {
    return `Alle Teams außer ${challengeTeamName} bekommen 1 Punkt.`;
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

function formatScoreSummary(teams: Team[]) {
  if (teams.length === 2) {
    return `${teams[0].name} ${teams[0].score}:${teams[1].score} ${teams[1].name}`;
  }

  return teams.map((team) => `${team.name} ${team.score}`).join(' · ');
}

function formatCompactScoreSummary(teams: Team[]) {
  if (teams.length === 2) {
    return `${teams[0].score}:${teams[1].score}`;
  }

  return teams.map((team) => team.score).join(' · ');
}

function formatBidStatus(activeTeam: Team | undefined, holdingTeam: Team | undefined) {
  if (holdingTeam) {
    return `${holdingTeam.name} hält den Einsatz`;
  }

  return `${activeTeam?.name ?? 'Aktives Team'} ist dran`;
}

function Scoreboard({
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
              {team.score} {team.score === 1 ? 'Punkt' : 'Punkte'}
            </strong>
          </article>
        );
      })}
    </section>
  );
}
