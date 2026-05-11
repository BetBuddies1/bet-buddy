export type ChallengeState = {
  status: 'ready' | 'running' | 'review';
  count: number;
  secondsLeft: number;
  startedAtMs: number | null;
  totalSeconds: number;
  drawingCategory?: string;
};
