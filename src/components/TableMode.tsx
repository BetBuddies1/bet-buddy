import { getCategoryLabel } from '../game/categories';
import {
  formatBidStatus,
  formatBiddingRole,
  type TeamRoundRole,
} from '../game/formatters';
import type { Question, Team } from '../game/types';
import { BidDisplay } from './BidDisplay';

export function QuestionTablePanel({
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

export function BiddingCenterQuestion({
  activeTeam,
  activeTeamRole,
  currentBid,
  facesOpponent,
  holdingTeam,
  question,
}: {
  activeTeam: Team | undefined;
  activeTeamRole: TeamRoundRole | undefined;
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
        {activeTeamRole ? (
          <p className="table-role-line">{formatBiddingRole(activeTeamRole)}</p>
        ) : null}
        <p className="table-question-text">{question.text}</p>
        <BidDisplay
          currentBid={currentBid}
          question={question}
          statusText={
            holdingTeam
              ? formatBidStatus(activeTeam, holdingTeam, activeTeamRole)
              : undefined
          }
        />
      </div>
    </div>
  );
}

export function TableSideControls({
  canEndTurn,
  canPass,
  className,
  isActive,
  onEndTurn,
  onPass,
  onRaise,
  role,
  team,
}: {
  canEndTurn: boolean;
  canPass: boolean;
  className: string;
  isActive: boolean;
  onEndTurn: () => void;
  onPass: () => void;
  onRaise: () => void;
  role: TeamRoundRole | undefined;
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
        <p className="table-side-status">
          {role ? `${role.bidder.name} bietet` : isActive ? 'Am Zug' : 'Wartet'}
        </p>
        {role ? (
          <p className="table-side-role">
            {role.challengePlayer.name} liefert{isActive ? '' : ' · Wartet'}
          </p>
        ) : null}
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
