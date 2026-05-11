export type GameSound = 'bid' | 'challengeSuccess' | 'challengeFail';

type LoopSound = 'challengeRunningLoop';
type AudioSound = GameSound | LoopSound;

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

export type GameAudioController = {
  playSound: (sound: GameSound) => void;
  startLoop: (durationSeconds: number) => void;
  stopLoop: (fadeOutMs?: number) => void;
  stopAll: () => void;
  isLoopRunning: () => boolean;
};

const gameSoundFiles: Record<AudioSound, string> = {
  bid: 'sounds/bid.mp3',
  challengeRunningLoop: 'sounds/Measured_Breath.mp3',
  challengeSuccess: 'sounds/challenge-success.mp3',
  challengeFail: 'sounds/challenge-fail.mp3',
};
const challengeLoopTargetVolume = 0.42;
const challengeSuccessTargetVolume = 0.34;
const gameSoundVolumes: Record<AudioSound, number> = {
  bid: 0.38,
  challengeRunningLoop: challengeLoopTargetVolume,
  challengeSuccess: challengeSuccessTargetVolume,
  challengeFail: 0.72,
};
const manualChallengeLoopFadeOutMs = 650;
const challengeSuccessFadeInMs = 120;
const challengeSuccessFadeOutDelayMs = 560;
const challengeSuccessFadeOutMs = 520;
const oneShotSoundCleanupMs: Record<GameSound, number> = {
  bid: 1_500,
  challengeSuccess: challengeSuccessFadeOutDelayMs + challengeSuccessFadeOutMs + 250,
  challengeFail: 4_500,
};
const oneShotAudioPoolSize = 3;

export function createGameAudioController(): GameAudioController {
  let challengeLoopAudio: ChallengeLoopAudioState | null = null;
  let oneShotAudioStates: OneShotAudioState[] = [];
  const oneShotAudioPools = new Map<GameSound, HTMLAudioElement[]>();
  const oneShotAudioPoolIndexes = new Map<GameSound, number>();

  function playSound(sound: GameSound) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const audio = getPooledOneShotAudio(sound);
      clearExistingOneShotAudioState(audio);
      const audioState = createOneShotAudioState(audio);

      oneShotAudioStates = [...oneShotAudioStates, audioState];

      if (sound === 'challengeSuccess') {
        playFadedOneShotAudio(
          audioState,
          challengeSuccessTargetVolume,
          challengeSuccessFadeInMs,
          challengeSuccessFadeOutDelayMs,
          challengeSuccessFadeOutMs,
        );
        scheduleOneShotCleanup(audioState, oneShotSoundCleanupMs[sound]);
        return;
      }

      audio.volume = gameSoundVolumes[sound];
      audio.currentTime = 0;
      scheduleOneShotCleanup(audioState, oneShotSoundCleanupMs[sound]);
      void audio.play().catch(() => undefined);
    } catch {
      // Audio is progressive enhancement; gameplay must never depend on browser audio support.
    }
  }

  function startLoop(durationSeconds: number) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      stopLoop(0);

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
      challengeLoopAudio = loopState;
      fadeChallengeLoopAudio(challengeLoopTargetVolume, fadeInMs, false);

      loopState.fadeOutTimeoutId = window.setTimeout(() => {
        fadeChallengeLoopAudio(0, fadeOutMs, true);
      }, fadeOutStartMs);

      void audio.play().catch(() => undefined);
    } catch {
      // Loop audio is atmospheric only; the challenge must stay playable without sound.
    }
  }

  function stopLoop(fadeOutMs = manualChallengeLoopFadeOutMs) {
    if (typeof window === 'undefined' || challengeLoopAudio === null) {
      return;
    }

    clearChallengeLoopFadeOut(challengeLoopAudio);

    if (fadeOutMs <= 0) {
      finishChallengeLoopAudio(challengeLoopAudio);
      return;
    }

    fadeChallengeLoopAudio(0, fadeOutMs, true);
  }

  function stopAll() {
    if (typeof window === 'undefined') {
      return;
    }

    stopLoop(0);

    const activeOneShotAudio = new Set(
      oneShotAudioStates.map((audioState) => audioState.audio),
    );

    oneShotAudioStates.forEach((audioState) => {
      clearOneShotAudioState(audioState);
    });

    oneShotAudioStates = [];
    oneShotAudioPools.forEach((audioPool) => {
      audioPool.forEach((audio) => {
        if (activeOneShotAudio.has(audio)) {
          return;
        }

        resetOneShotAudioElement(audio, false);
      });
    });
  }

  function isLoopRunning() {
    return challengeLoopAudio !== null;
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

  function scheduleOneShotCleanup(audioState: OneShotAudioState, cleanupMs: number) {
    audioState.cleanupTimeoutId = window.setTimeout(() => {
      removeOneShotAudioState(audioState);
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

  function removeOneShotAudioState(audioState: OneShotAudioState) {
    oneShotAudioStates = oneShotAudioStates.filter(
      (currentAudioState) => currentAudioState !== audioState,
    );
  }

  function getPooledOneShotAudio(sound: GameSound) {
    let audioPool = oneShotAudioPools.get(sound);

    if (audioPool === undefined) {
      audioPool = [];
      oneShotAudioPools.set(sound, audioPool);
      oneShotAudioPoolIndexes.set(sound, 0);
    }

    const audioIndex = oneShotAudioPoolIndexes.get(sound) ?? 0;
    const audio = audioPool[audioIndex] ?? createGameAudio(sound);

    if (audioPool[audioIndex] === undefined) {
      audioPool.push(audio);
    }

    const nextAudioIndex =
      audioPool.length < oneShotAudioPoolSize ? audioPool.length : (audioIndex + 1) % audioPool.length;
    oneShotAudioPoolIndexes.set(sound, nextAudioIndex);

    return audio;
  }

  function clearExistingOneShotAudioState(audio: HTMLAudioElement) {
    const existingAudioState = oneShotAudioStates.find((audioState) => audioState.audio === audio);

    if (existingAudioState === undefined) {
      return;
    }

    clearOneShotAudioState(existingAudioState);
    removeOneShotAudioState(existingAudioState);
  }

  function fadeChallengeLoopAudio(
    targetVolume: number,
    durationMs: number,
    pauseWhenSilent: boolean,
  ) {
    const loopState = challengeLoopAudio;

    if (typeof window === 'undefined' || loopState === null) {
      return;
    }

    clearChallengeLoopFadeInterval(loopState);

    const startVolume = loopState.audio.volume;

    if (durationMs <= 0) {
      loopState.audio.volume = targetVolume;

      if (pauseWhenSilent) {
        finishChallengeLoopAudio(loopState);
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
          finishChallengeLoopAudio(loopState);
        }
      }
    }, stepMs);
  }

  function finishChallengeLoopAudio(loopState: ChallengeLoopAudioState) {
    clearChallengeLoopFadeInterval(loopState);
    clearChallengeLoopFadeOut(loopState);
    loopState.audio.volume = 0;
    loopState.audio.pause();
    loopState.audio.currentTime = 0;

    if (challengeLoopAudio === loopState) {
      challengeLoopAudio = null;
    }
  }

  return {
    playSound,
    startLoop,
    stopLoop,
    stopAll,
    isLoopRunning,
  };
}

function createOneShotAudioState(audio: HTMLAudioElement): OneShotAudioState {
  return {
    audio,
    cleanupTimeoutId: null,
    fadeIntervalIds: [],
    fadeOutTimeoutId: null,
  };
}

function clearOneShotAudioState(audioState: OneShotAudioState) {
  audioState.fadeIntervalIds.forEach((intervalId) => window.clearInterval(intervalId));
  audioState.fadeIntervalIds = [];

  if (audioState.cleanupTimeoutId !== null) {
    window.clearTimeout(audioState.cleanupTimeoutId);
    audioState.cleanupTimeoutId = null;
  }

  if (audioState.fadeOutTimeoutId !== null) {
    window.clearTimeout(audioState.fadeOutTimeoutId);
    audioState.fadeOutTimeoutId = null;
  }

  resetOneShotAudioElement(audioState.audio, true);
}

function resetOneShotAudioElement(audio: HTMLAudioElement, forcePause: boolean) {
  if (!forcePause && audio.currentTime === 0 && audio.volume === 0) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
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

function createGameAudio(sound: AudioSound) {
  const audio = new Audio(getGameSoundSource(sound));

  audio.preload = 'auto';
  return audio;
}

function getGameSoundSource(sound: AudioSound) {
  return `${import.meta.env.BASE_URL}${gameSoundFiles[sound]}`;
}
