import type { ChallengeState } from '../game/challengeTypes';
import {
  formatChallengeGoal,
  formatChallengePerformer,
  formatChallengeProgress,
  formatChallengeRoleContext,
  formatChallengeTimer,
  formatDecreaseTrackerLabel,
  formatIncreaseTrackerLabel,
  type TeamRoundRole,
} from '../game/formatters';
import type { BiddingState, Question, Team } from '../game/types';
import { ChallengeIllustration } from './ChallengeIllustration';

type ActiveChallengeState = Extract<BiddingState, { status: 'challenge' }>;

type ChallengeScreenProps = {
  biddingState: ActiveChallengeState;
  challengeFacingClass: string;
  challengeFacingTeam: Team | undefined;
  challengeState: ChallengeState | null;
  challengeTeam: Team | undefined;
  challengeTeamRole: TeamRoundRole | undefined;
  challengeWasSuccessful: boolean;
  onConfirmChallengeResult: () => void;
  onDecreaseTracker: () => void;
  onIncreaseTracker: () => void;
  onReviewChallengeResult: () => void;
  onStartChallengeTimer: () => void;
  onStopDurationChallenge: () => void;
  question: Question;
};

export function ChallengeScreen({
  biddingState,
  challengeFacingClass,
  challengeFacingTeam,
  challengeState,
  challengeTeam,
  challengeTeamRole,
  challengeWasSuccessful,
  onConfirmChallengeResult,
  onDecreaseTracker,
  onIncreaseTracker,
  onReviewChallengeResult,
  onStartChallengeTimer,
  onStopDurationChallenge,
  question,
}: ChallengeScreenProps) {
  return (
    <section className="workspace round-screen" aria-labelledby="challenge-title">
      <div
        className={`round-controls phase-panel challenge-panel ${challengeFacingClass}`}
        data-challenge-status={challengeState?.status ?? 'ready'}
        data-challenge-type={question.type}
        data-facing-team-id={challengeFacingTeam?.id}
      >
        <p className="eyebrow">Challenge</p>
        <h2 id="challenge-title" className="turn-label">
          {formatChallengePerformer(challengeTeam, challengeTeamRole)} muss{' '}
          {formatChallengeGoal(biddingState.currentBid, question)} schaffen
        </h2>
        {challengeTeamRole ? (
          <p className="round-meta">
            {formatChallengeRoleContext(challengeTeam, challengeTeamRole)}
          </p>
        ) : null}
        <p className="round-meta">{question.text}</p>
        {challengeState?.drawingCategory ? (
          <p className="drawing-category-callout">
            <span>Zeichen-Kategorie</span>
            <strong>{challengeState.drawingCategory}</strong>
          </p>
        ) : null}
        <ChallengeIllustration question={question} />
        {challengeState?.status === 'running' ? (
          <div className="challenge-running-indicator" role="status">
            <span aria-hidden="true" />
            Challenge läuft
          </div>
        ) : null}
        {challengeState !== null ? (
          <>
            <div className="challenge-metrics">
              {question.type !== 'streak' ? (
                <p className="timer-value">{formatChallengeTimer(question, challengeState)}</p>
              ) : null}
              <p className="tracker-value">
                {formatChallengeProgress(question, challengeState.count, biddingState.currentBid)}
              </p>
            </div>
            {question.type === 'streak' && challengeState.status !== 'review' ? (
              <div className="action-row">
                <button
                  className="secondary-action tracker-action tracker-action-decrease"
                  onClick={onDecreaseTracker}
                  type="button"
                >
                  -1
                </button>
                <button
                  className="secondary-action tracker-action tracker-action-increase"
                  onClick={onIncreaseTracker}
                  type="button"
                >
                  Treffer +1
                </button>
                {challengeState.count >= biddingState.currentBid ? (
                  <button
                    className="secondary-action"
                    onClick={onReviewChallengeResult}
                    type="button"
                  >
                    Einsatz geschafft
                  </button>
                ) : (
                  <button
                    className="secondary-action"
                    onClick={onReviewChallengeResult}
                    type="button"
                  >
                    Verfehlt
                  </button>
                )}
              </div>
            ) : null}
            {question.type !== 'duration' &&
            question.type !== 'streak' &&
            challengeState.status !== 'review' ? (
              <div className="action-row">
                <button
                  className="secondary-action tracker-action tracker-action-decrease"
                  disabled={challengeState.status === 'ready'}
                  onClick={onDecreaseTracker}
                  type="button"
                >
                  -1
                </button>
                <button
                  className="secondary-action tracker-action tracker-action-increase"
                  disabled={challengeState.status === 'ready'}
                  onClick={onIncreaseTracker}
                  type="button"
                >
                  {formatIncreaseTrackerLabel(question)}
                </button>
              </div>
            ) : null}
            {challengeState.status !== 'review' && question.type !== 'streak' ? (
              <div className="action-row">
                {challengeState.status === 'ready' ? (
                  <button className="primary-action" onClick={onStartChallengeTimer} type="button">
                    Challenge starten
                  </button>
                ) : null}
                {question.type === 'duration' && challengeState.status === 'running' ? (
                  <button
                    className="secondary-action"
                    onClick={onStopDurationChallenge}
                    type="button"
                  >
                    Stoppen
                  </button>
                ) : null}
                {question.type !== 'duration' ? (
                  <button
                    className="secondary-action"
                    disabled={challengeState.status === 'ready'}
                    onClick={onReviewChallengeResult}
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
                <div className="challenge-review__stepper" aria-label="Zählwert anpassen">
                  <button
                    className="secondary-action tracker-action tracker-action-decrease"
                    onClick={onDecreaseTracker}
                    type="button"
                  >
                    {formatDecreaseTrackerLabel(question)}
                  </button>
                  <button
                    className="secondary-action tracker-action tracker-action-increase"
                    onClick={onIncreaseTracker}
                    type="button"
                  >
                    {formatIncreaseTrackerLabel(question)}
                  </button>
                </div>
                <button
                  className={challengeWasSuccessful ? 'primary-action' : 'danger-action'}
                  aria-label="Ergebnis bestätigen"
                  onClick={onConfirmChallengeResult}
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
  );
}
