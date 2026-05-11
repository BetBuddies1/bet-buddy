import { formatQuestionSkipAction } from '../game/formatters';
import type { Question, Team } from '../game/types';
import { ChallengeIllustration } from './ChallengeIllustration';
import { RoundMetaPills } from './RoundMetaPills';
import { QuestionTablePanel } from './TableMode';

type RoundIntroScreenProps = {
  canSkipCurrentQuestion: boolean;
  currentRound: number;
  onSkipCurrentQuestion: () => void;
  onStartBiddingRound: () => void;
  question: Question;
  roundCount: number;
  roundStartingTeam: Team | undefined;
  roundStartingTeamSkipsLeft: number;
  usesMirroredRoundIntro: boolean;
};

export function RoundIntroScreen({
  canSkipCurrentQuestion,
  currentRound,
  onSkipCurrentQuestion,
  onStartBiddingRound,
  question,
  roundCount,
  roundStartingTeam,
  roundStartingTeamSkipsLeft,
  usesMirroredRoundIntro,
}: RoundIntroScreenProps) {
  return (
    <section
      className={`workspace round-screen ${usesMirroredRoundIntro ? 'table-question-screen' : ''}`}
      aria-labelledby="round-title"
    >
      {usesMirroredRoundIntro ? (
        <QuestionTablePanel
          className="is-opponent"
          currentRound={currentRound}
          question={question}
          roundCount={roundCount}
        />
      ) : null}
      <div className="round-panel hero-panel">
        <p className="eyebrow">
          Runde {currentRound} von {roundCount}
        </p>
        <h2 id="round-title">{question.text}</h2>
        <ChallengeIllustration question={question} />
        <RoundMetaPills question={question} />
      </div>
      <div className="round-intro-actions">
        <button className="primary-action screen-action" onClick={onStartBiddingRound} type="button">
          Einsatzrunde starten
        </button>
        <button
          aria-label="Frage überspringen"
          className="secondary-action"
          disabled={!canSkipCurrentQuestion}
          onClick={onSkipCurrentQuestion}
          type="button"
        >
          {formatQuestionSkipAction(roundStartingTeam, roundStartingTeamSkipsLeft)}
        </button>
      </div>
    </section>
  );
}
