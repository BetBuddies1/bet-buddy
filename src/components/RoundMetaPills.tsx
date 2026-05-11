import { getCategoryLabel } from '../game/categories';
import { formatRoundTimeLimit } from '../game/formatters';
import type { Question } from '../game/types';

export function RoundMetaPills({ question }: { question: Question }) {
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
