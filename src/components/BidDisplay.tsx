import { getBidAmountDisplay } from '../game/formatters';
import type { Question } from '../game/types';

export function BidDisplay({
  currentBid,
  question,
  statusText,
}: {
  currentBid: number;
  question: Question;
  statusText?: string;
}) {
  const bidAmount = getBidAmountDisplay(currentBid, question);
  const bidLabel = statusText ? 'Höchster Einsatz' : 'Startwert';

  return (
    <div className="table-bid-display" aria-label={bidLabel}>
      <span>{bidLabel}</span>
      <strong>{bidAmount.value}</strong>
      {bidAmount.unit ? <span className="table-bid-unit">{bidAmount.unit}</span> : null}
      {statusText ? <small>{statusText}</small> : null}
    </div>
  );
}
