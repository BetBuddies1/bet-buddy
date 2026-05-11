import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createGameAudioController } from './gameAudio';

type TestAudioElement = {
  currentTime: number;
  loop: boolean;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  preload: string;
  src: string;
  volume: number;
};

describe('gameAudio', () => {
  let originalAudio: typeof Audio;
  let createdAudioElements: TestAudioElement[];

  beforeEach(() => {
    vi.useFakeTimers();
    createdAudioElements = [];
    originalAudio = window.Audio;
    window.Audio = class TestAudio {
      currentTime = 0;
      loop = false;
      pause = vi.fn();
      play = vi.fn(() => Promise.resolve());
      preload = '';
      src: string;
      volume = 1;

      constructor(src = '') {
        this.src = src;
        createdAudioElements.push(this);
      }
    } as unknown as typeof Audio;
  });

  afterEach(() => {
    window.Audio = originalAudio;
    vi.useRealTimers();
  });

  it('plays one-shot bid sounds with the configured source and volume', () => {
    const audio = createGameAudioController();

    audio.playSound('bid');

    const bidSound = createdAudioElements.at(-1);

    expect(bidSound?.src).toContain('sounds/bid.mp3');
    expect(bidSound?.preload).toBe('auto');
    expect(bidSound?.volume).toBeLessThan(0.45);
    expect(bidSound?.play).toHaveBeenCalledTimes(1);
  });

  it('reuses a small pool of one-shot audio elements for repeated sound effects', () => {
    const audio = createGameAudioController();

    audio.playSound('bid');
    audio.playSound('bid');
    audio.playSound('bid');
    audio.playSound('bid');

    const bidSounds = createdAudioElements.filter((element) =>
      element.src.includes('sounds/bid.mp3'),
    );

    expect(bidSounds).toHaveLength(3);
    expect(bidSounds[0].play).toHaveBeenCalledTimes(2);
    expect(bidSounds[1].play).toHaveBeenCalledTimes(1);
    expect(bidSounds[2].play).toHaveBeenCalledTimes(1);
  });

  it('uses a smooth volume envelope for challenge success sounds', () => {
    const audio = createGameAudioController();

    audio.playSound('challengeSuccess');

    const successSound = createdAudioElements.at(-1);

    expect(successSound?.src).toContain('sounds/challenge-success.mp3');
    expect(successSound?.volume).toBe(0);
    expect(successSound?.play).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(160);

    expect(successSound?.volume).toBeGreaterThan(0.3);
    expect(successSound?.volume).toBeLessThan(0.4);

    vi.advanceTimersByTime(760);

    expect(successSound?.volume).toBeLessThan(0.2);

    vi.advanceTimersByTime(320);

    expect(successSound?.volume).toBe(0);
  });

  it('starts and fades out the challenge loop independently from App state', () => {
    const audio = createGameAudioController();

    audio.startLoop(30);

    const loopSound = createdAudioElements.at(-1);

    expect(loopSound?.src).toContain('sounds/Measured_Breath.mp3');
    expect(loopSound?.loop).toBe(true);
    expect(loopSound?.volume).toBe(0);
    expect(loopSound?.play).toHaveBeenCalledTimes(1);
    expect(audio.isLoopRunning()).toBe(true);

    vi.advanceTimersByTime(1_000);

    expect(loopSound?.volume).toBeGreaterThan(0.35);
    expect(loopSound?.volume).toBeLessThan(0.6);

    audio.stopLoop();

    expect(audio.isLoopRunning()).toBe(true);

    vi.advanceTimersByTime(650);

    expect(loopSound?.pause).toHaveBeenCalledTimes(1);
    expect(loopSound?.currentTime).toBe(0);
    expect(loopSound?.volume).toBe(0);
    expect(audio.isLoopRunning()).toBe(false);
  });

  it('stops all active one-shot and loop audio immediately', () => {
    const audio = createGameAudioController();

    audio.playSound('challengeFail');
    audio.startLoop(30);

    const failSound = createdAudioElements.find((element) =>
      element.src.includes('sounds/challenge-fail.mp3'),
    );
    const loopSound = createdAudioElements.find((element) =>
      element.src.includes('sounds/Measured_Breath.mp3'),
    );

    audio.stopAll();

    expect(failSound?.pause).toHaveBeenCalledTimes(1);
    expect(failSound?.currentTime).toBe(0);
    expect(failSound?.volume).toBe(0);
    expect(loopSound?.pause).toHaveBeenCalledTimes(1);
    expect(loopSound?.currentTime).toBe(0);
    expect(loopSound?.volume).toBe(0);
    expect(audio.isLoopRunning()).toBe(false);
  });
});
