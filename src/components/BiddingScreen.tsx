import {
  formatBidStatus,
  formatBiddingTurnLabel,
  type TeamRoundRole,
} from '../game/formatters';
import type { BiddingState, Question, Team } from '../game/types';
import { BidDisplay } from './BidDisplay';
import {
  BiddingCenterQuestion,
  TableSideControls,
} from './TableMode';

type ActiveBiddingState = Extract<BiddingState, { status: 'bidding' }>;

type BiddingScreenProps = {
  activeTeamCanEndBidTurn: boolean;
  activeTeamCanPassBid: boolean;
  activeTeamRole: TeamRoundRole | undefined;
  biddingState: ActiveBiddingState;
  onEndBidTurn: () => void;
  onPassBid: () => void;
  onRaiseBid: () => void;
  question: Question;
  teamById: Map<string, Team>;
  teamRoundRoles: Map<string, TeamRoundRole>;
  teams: Team[];
  usesTableMode: boolean;
};

export function BiddingScreen({
  activeTeamCanEndBidTurn,
  activeTeamCanPassBid,
  activeTeamRole,
  biddingState,
  onEndBidTurn,
  onPassBid,
  onRaiseBid,
  question,
  teamById,
  teamRoundRoles,
  teams,
  usesTableMode,
}: BiddingScreenProps) {
  const activeTeam = teamById.get(biddingState.activeTeamId);
  const holdingTeam =
    biddingState.highestBidTeamId !== null ? teamById.get(biddingState.highestBidTeamId) : undefined;

  if (usesTableMode) {
    return (
      <section className="workspace table-mode" aria-label="Tischmodus für zwei Teams">
        <TableSideControls
          canEndTurn={activeTeamCanEndBidTurn}
          canPass={activeTeamCanPassBid}
          className="is-opponent"
          isActive={teams[1]?.id === biddingState.activeTeamId}
          onEndTurn={onEndBidTurn}
          onPass={onPassBid}
          onRaise={onRaiseBid}
          role={teams[1] ? teamRoundRoles.get(teams[1].id) : undefined}
          team={teams[1]}
        />
        <BiddingCenterQuestion
          activeTeam={activeTeam}
          activeTeamRole={activeTeamRole}
          currentBid={biddingState.currentBid}
          facesOpponent={teams[1]?.id === biddingState.activeTeamId}
          holdingTeam={holdingTeam}
          question={question}
        />
        <TableSideControls
          canEndTurn={activeTeamCanEndBidTurn}
          canPass={activeTeamCanPassBid}
          className="is-active"
          isActive={teams[0]?.id === biddingState.activeTeamId}
          onEndTurn={onEndBidTurn}
          onPass={onPassBid}
          onRaise={onRaiseBid}
          role={teams[0] ? teamRoundRoles.get(teams[0].id) : undefined}
          team={teams[0]}
        />
      </section>
    );
  }

  return (
    <section className="workspace round-screen" aria-labelledby="bidding-title">
      <div className="round-controls phase-panel bidding-panel">
        <p className="eyebrow">Einsatzrunde</p>
        <h2 id="bidding-title" className="turn-label">
          {formatBiddingTurnLabel(activeTeam, activeTeamRole)}
        </h2>
        <BidDisplay
          currentBid={biddingState.currentBid}
          question={question}
          statusText={holdingTeam ? formatBidStatus(activeTeam, holdingTeam) : undefined}
        />
        <p className="round-meta">{question.text}</p>
        <div className="action-row">
          <button className="primary-action" onClick={onRaiseBid} type="button">
            Einsatz +1
          </button>
          <button
            className="secondary-action"
            disabled={!activeTeamCanEndBidTurn}
            onClick={onEndBidTurn}
            type="button"
          >
            Weitergeben
          </button>
          <button
            className="secondary-action"
            disabled={!activeTeamCanPassBid}
            onClick={onPassBid}
            type="button"
          >
            Passen
          </button>
        </div>
      </div>
    </section>
  );
}
