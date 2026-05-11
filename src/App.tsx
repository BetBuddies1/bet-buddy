import { useEffect, useMemo, useRef, useState } from 'react';
import {
  canEndBidTurn,
  canPassBid,
  createBiddingState,
  endBidTurn,
  passBid,
  raiseBid,
  resolveChallenge,
  validateManualTeams,
} from './game/gameLogic';
import type { BiddingState, CategoryId, Player, Question, Team } from './game/types';
import {
  createQuestionDeck,
  filterQuestionsByCategories,
  filterQuestionsForReplay,
  findNextPlayableQuestionIndex,
} from './game/questionDeck';
import { validatePlayerName } from './security/validatePlayerName';
import { validateTeamName } from './security/validateTeamName';
import { createGameAudioController, type GameAudioController } from './audio/gameAudio';
import { isGamePhase, requiresGameExitConfirmation, type Phase } from './appTypes';
import { AppHeader } from './components/AppHeader';
import { BiddingScreen } from './components/BiddingScreen';
import { ChallengeScreen } from './components/ChallengeScreen';
import { FinishedScreen } from './components/FinishedScreen';
import { RulesScreen } from './components/RulesScreen';
import { RoundIntroScreen } from './components/RoundIntroScreen';
import { RoundScoreScreen } from './components/RoundScoreScreen';
import { SetupScreen } from './components/SetupScreen';
import { TeamsScreen } from './components/TeamsScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { defaultSelectedCategories } from './game/categories';
import type { ChallengeState } from './game/challengeTypes';
import { createReadyChallengeState, getCurrentChallengeTiming } from './game/challengeTiming';
import {
  formatPointResult,
  type TeamRoundRole,
} from './game/formatters';
import { getDuplicatePlayerNameWarning } from './game/playerNames';
import { getTeamRoundRole } from './game/roundRoles';
import type { SetupStep, TeamDraft } from './game/setupTypes';
import {
  createInitialTeamDrafts,
  createTeamDraftsFromTeams,
  getReusableTeamDrafts,
} from './game/teamSetup';

type AppProps = {
  createDeck?: () => Question[];
};

const maxQuestionSkipsPerTeam = 2;
const activeGameExitMessage =
  'Das laufende Spiel geht verloren. Wirklich zur Startseite zurückkehren?';

const fallbackQuestion: Question = {
  id: 'fallback-empty-question',
  text: 'Keine Frage verfügbar.',
  category: 'welt-orte',
  timeLimit: 30,
  type: 'count',
};

export default function App({ createDeck = createQuestionDeck }: AppProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [setupStep, setSetupStep] = useState<SetupStep>('players');
  const [playerCount, setPlayerCount] = useState<number | null>(null);
  const [roundCount, setRoundCount] = useState<number>(6);
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    defaultSelectedCategories,
  );
  const [includeSpecialQuestions, setIncludeSpecialQuestions] = useState(false);
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
  const [teamQuestionSkipCounts, setTeamQuestionSkipCounts] = useState<Record<string, number>>({});
  const [seenQuestionIds, setSeenQuestionIds] = useState<Set<string>>(() => new Set());
  const gameAudioRef = useRef<GameAudioController | null>(null);

  if (gameAudioRef.current === null) {
    gameAudioRef.current = createGameAudioController();
  }

  const gameAudio = gameAudioRef.current;

  const activeQuestion =
    questionDeck.length > 0
      ? questionDeck[questionIndex % questionDeck.length]
      : fallbackQuestion;
  const currentRound = roundIndex + 1;
  const teamById = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );
  const playerById = useMemo(
    () => new Map(players.map((player) => [player.id, player])),
    [players],
  );
  const teamRoundRoles = useMemo(
    () =>
      new Map(
        teams
          .map((team) => [team.id, getTeamRoundRole(team, playerById, roundIndex)] as const)
          .filter((entry): entry is readonly [string, TeamRoundRole] => entry[1] !== undefined),
      ),
    [playerById, roundIndex, teams],
  );
  const usesTableMode = teams.length === 2;
  const usesMirroredRoundIntro = usesTableMode && activeQuestion.category !== 'koerperlich';
  const isActiveGamePhase = isGamePhase(phase);
  const shouldConfirmGameExit = requiresGameExitConfirmation(phase);
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
  const activeTeamRole =
    biddingState?.status === 'bidding'
      ? teamRoundRoles.get(biddingState.activeTeamId)
      : undefined;
  const challengeTeam =
    biddingState?.status === 'challenge'
      ? teamById.get(biddingState.challengeTeamId)
      : undefined;
  const challengeTeamRole =
    biddingState?.status === 'challenge'
      ? teamRoundRoles.get(biddingState.challengeTeamId)
      : undefined;
  const nextQuestionIndex = findNextPlayableQuestionIndex(questionDeck, questionIndex + 1);
  const roundStartingTeam = teams.length > 0 ? teams[roundIndex % teams.length] : undefined;
  const roundStartingTeamSkipCount =
    roundStartingTeam === undefined ? 0 : (teamQuestionSkipCounts[roundStartingTeam.id] ?? 0);
  const roundStartingTeamSkipsLeft = Math.max(
    0,
    maxQuestionSkipsPerTeam - roundStartingTeamSkipCount,
  );
  const canSkipCurrentQuestion =
    phase === 'roundIntro' &&
    roundStartingTeamSkipsLeft > 0 &&
    nextQuestionIndex !== null &&
    questionDeck.length > 0 &&
    nextQuestionIndex % questionDeck.length !== questionIndex % questionDeck.length;
  const challengeFacingTeam =
    biddingState?.status === 'challenge' && usesTableMode
      ? teams.find((team) => team.id !== biddingState.challengeTeamId)
      : undefined;
  const challengeFacingClass =
    challengeFacingTeam?.id === teams[1]?.id
      ? 'faces-opponent'
      : challengeFacingTeam?.id === teams[0]?.id
        ? 'faces-home'
        : '';
  const duplicatePlayerNameWarning =
    phase === 'setup' && setupStep === 'players'
      ? getDuplicatePlayerNameWarning(playerNames)
      : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [phase]);

  useEffect(() => {
    if (!shouldConfirmGameExit) {
      return undefined;
    }

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', warnBeforeUnload);

    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [shouldConfirmGameExit]);

  useEffect(() => {
    if (phase !== 'roundIntro' || questionDeck.length === 0) {
      return;
    }

    const visibleQuestionId = activeQuestion.id;

    setSeenQuestionIds((currentSeenQuestionIds) => {
      if (currentSeenQuestionIds.has(visibleQuestionId)) {
        return currentSeenQuestionIds;
      }

      return new Set(currentSeenQuestionIds).add(visibleQuestionId);
    });
  }, [activeQuestion.id, phase, questionDeck.length]);

  useEffect(() => {
    if (challengeState?.status !== 'running') {
      gameAudio.stopLoop();
      return undefined;
    }

    const timer = window.setInterval(() => {
      setChallengeState((currentChallengeState) => {
        if (currentChallengeState?.status !== 'running') {
          return currentChallengeState;
        }

        const timing = getCurrentChallengeTiming(currentChallengeState);

        if (activeQuestion.type === 'duration') {
          const nextCount = timing.elapsedSeconds;

          if (timing.secondsLeft <= 0) {
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
            secondsLeft: timing.secondsLeft,
          };
        }

        if (timing.secondsLeft <= 0) {
          return {
            ...currentChallengeState,
            secondsLeft: 0,
            status: 'review',
          };
        }

        return {
          ...currentChallengeState,
          secondsLeft: timing.secondsLeft,
        };
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, [activeQuestion.type, challengeState?.status, gameAudio]);

  useEffect(
    () => () => {
      gameAudio.stopAll();
    },
    [gameAudio],
  );

  useEffect(() => {
    if (!soundsEnabled) {
      gameAudio.stopAll();
      return;
    }

    if (challengeState?.status === 'running' && !gameAudio.isLoopRunning()) {
      gameAudio.startLoop(challengeState.secondsLeft);
    }
  }, [challengeState?.secondsLeft, challengeState?.status, gameAudio, soundsEnabled]);

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

  function chooseQuestionLevel(shouldIncludeSpecialQuestions: boolean) {
    setIncludeSpecialQuestions(shouldIncludeSpecialQuestions);
    setMessage(null);
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
    setTeamDrafts(getReusableTeamDrafts(validatedPlayers, teamDrafts));
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
      currentDrafts.map((draft, currentIndex) => ({
        ...draft,
        playerIds: draft.playerIds.map((currentPlayerId, currentPlayerSlot) => {
          const isTargetSlot = currentIndex === index && currentPlayerSlot === playerSlot;
          const previousPlayerId = currentDrafts[index]?.playerIds[playerSlot];

          if (isTargetSlot) {
            return playerId;
          }

          if (currentPlayerId === playerId) {
            return previousPlayerId ?? currentPlayerId;
          }

          return currentPlayerId;
        }),
      })),
    );
  }

  function startGame() {
    const nextQuestionDeck = filterQuestionsByCategories(createDeck(), selectedCategories, {
      includeSpecialQuestions,
    });
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
    setTeamQuestionSkipCounts({});
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
    if (soundsEnabled) {
      gameAudio.playSound('bid');
    }
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
        ? createReadyChallengeState(activeQuestion, nextBiddingState.currentBid)
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

    if (soundsEnabled) {
      gameAudio.startLoop(challengeState.secondsLeft);
    }
    setChallengeState({ ...challengeState, startedAtMs: Date.now(), status: 'running' });
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
    setChallengeState((currentChallengeState) => {
      if (currentChallengeState?.status !== 'running') {
        return currentChallengeState;
      }

      const timing = getCurrentChallengeTiming(currentChallengeState);

      return {
        ...currentChallengeState,
        count: timing.elapsedSeconds,
        secondsLeft: timing.secondsLeft,
        status: 'review',
      };
    });
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

    if (soundsEnabled) {
      gameAudio.playSound(wasSuccessful ? 'challengeSuccess' : 'challengeFail');
    }
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

  function replayGame() {
    if (teams.length === 0) {
      return;
    }

    const nextQuestionDeck = filterQuestionsForReplay(createDeck(), selectedCategories, {
      includeSpecialQuestions,
      minimumQuestionCount: roundCount,
      seenQuestionIds,
    });

    if (nextQuestionDeck.length === 0) {
      setMessage('Für die aktive Kategorieauswahl sind keine Fragen verfügbar.');
      return;
    }

    const resetTeams = teams.map((team) => ({ ...team, score: 0 }));

    setTeams(resetTeams);
    setQuestionDeck(nextQuestionDeck);
    setRoundIndex(0);
    setQuestionIndex(0);
    setChallengeState(null);
    setRecentPointTeamIds([]);
    setTeamQuestionSkipCounts({});
    setBiddingState(createBiddingState(resetTeams, nextQuestionDeck[0], resetTeams[0].id));
    setPhase('roundIntro');
    setMessage(null);
  }

  function editReplaySettings() {
    if (players.length === 0) {
      return;
    }

    setTeamDrafts(createTeamDraftsFromTeams(teams));
    setSetupStep('rules');
    setPhase('setup');
    setBiddingState(null);
    setChallengeState(null);
    setRecentPointTeamIds([]);
    setMessage(null);
  }

  function skipCurrentQuestion() {
    if (phase !== 'roundIntro') {
      return;
    }

    if (roundStartingTeam === undefined) {
      return;
    }

    if (roundStartingTeamSkipsLeft <= 0) {
      setMessage(`${roundStartingTeam.name} hat keine Skips mehr.`);
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

    setTeamQuestionSkipCounts((currentCounts) => ({
      ...currentCounts,
      [roundStartingTeam.id]: (currentCounts[roundStartingTeam.id] ?? 0) + 1,
    }));
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
        gameAudio.stopAll();
      }

      return !currentSoundsEnabled;
    });
  }

  function resetGame() {
    if (shouldConfirmGameExit && !window.confirm(activeGameExitMessage)) {
      return;
    }

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
    setTeamQuestionSkipCounts({});
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
      <AppHeader
        currentRound={currentRound}
        isGamePhase={isActiveGamePhase}
        onResetGame={resetGame}
        onToggleSounds={toggleSounds}
        phase={phase}
        roundCount={roundCount}
        soundsEnabled={soundsEnabled}
        teams={teams}
      />

      {phase === 'welcome' ? (
        <WelcomeScreen
          onOpenRules={() => setPhase('rules')}
          onOpenSetup={openSetupScreen}
          onToggleSounds={toggleSounds}
          soundsEnabled={soundsEnabled}
        />
      ) : null}

      {phase === 'rules' ? (
        <RulesScreen onBackHome={() => setPhase('welcome')} onOpenSetup={openSetupScreen} />
      ) : null}

      {phase === 'setup' ? (
        <SetupScreen
          duplicatePlayerNameWarning={duplicatePlayerNameWarning}
          onBackToPlayers={() => setSetupStep('players')}
          onChoosePlayerCount={choosePlayerCount}
          onChooseRoundCount={chooseRoundCount}
          onChooseQuestionLevel={chooseQuestionLevel}
          onContinueToRules={continueToRules}
          onPrepareTeams={prepareTeams}
          onToggleCategory={toggleCategory}
          onUpdatePlayerName={updatePlayerName}
          playerCount={playerCount}
          playerNames={playerNames}
          roundCount={roundCount}
          includeSpecialQuestions={includeSpecialQuestions}
          selectedCategories={selectedCategories}
          setupStep={setupStep}
        />
      ) : null}

      {phase === 'teams' ? (
        <TeamsScreen
          onBackToRules={() => {
            setSetupStep('rules');
            setPhase('setup');
          }}
          onStartGame={startGame}
          onUpdateTeamName={updateTeamName}
          onUpdateTeamPlayer={updateTeamPlayer}
          players={players}
          teamDrafts={teamDrafts}
        />
      ) : null}

      {phase === 'roundIntro' ? (
        <RoundIntroScreen
          canSkipCurrentQuestion={canSkipCurrentQuestion}
          currentRound={currentRound}
          onSkipCurrentQuestion={skipCurrentQuestion}
          onStartBiddingRound={startBiddingRound}
          question={activeQuestion}
          roundCount={roundCount}
          roundStartingTeam={roundStartingTeam}
          roundStartingTeamSkipsLeft={roundStartingTeamSkipsLeft}
          usesMirroredRoundIntro={usesMirroredRoundIntro}
        />
      ) : null}

      {phase === 'bidding' && biddingState?.status === 'bidding' ? (
        <BiddingScreen
          activeTeamCanEndBidTurn={activeTeamCanEndBidTurn}
          activeTeamCanPassBid={activeTeamCanPassBid}
          activeTeamRole={activeTeamRole}
          biddingState={biddingState}
          onEndBidTurn={handleEndBidTurn}
          onPassBid={handlePassBid}
          onRaiseBid={handleRaiseBid}
          question={activeQuestion}
          teamById={teamById}
          teamRoundRoles={teamRoundRoles}
          teams={teams}
          usesTableMode={usesTableMode}
        />
      ) : null}

      {phase === 'challenge' && biddingState?.status === 'challenge' ? (
        <ChallengeScreen
          biddingState={biddingState}
          challengeFacingClass={challengeFacingClass}
          challengeFacingTeam={challengeFacingTeam}
          challengeState={challengeState}
          challengeTeam={challengeTeam}
          challengeTeamRole={challengeTeamRole}
          challengeWasSuccessful={challengeWasSuccessful}
          onConfirmChallengeResult={confirmChallengeResult}
          onDecreaseTracker={decreaseTracker}
          onIncreaseTracker={increaseTracker}
          onReviewChallengeResult={reviewChallengeResult}
          onStartChallengeTimer={startChallengeTimer}
          onStopDurationChallenge={stopDurationChallenge}
          question={activeQuestion}
        />
      ) : null}

      {phase === 'roundScore' ? (
        <RoundScoreScreen
          message={message}
          onStartNextRound={startNextRound}
          players={players}
          recentPointTeamIds={recentPointTeamIds}
          teams={teams}
        />
      ) : null}

      {phase === 'finished' ? (
        <FinishedScreen
          onEditReplaySettings={editReplaySettings}
          onReplayGame={replayGame}
          onResetGame={resetGame}
          players={players}
          teams={teams}
        />
      ) : null}

      {message !== null && phase !== 'roundScore' && phase !== 'finished' ? (
        <p className="status-message" role="status">
          {message}
        </p>
      ) : null}
    </main>
  );
}
