import type { Team } from '../game/types';

export function FinaleConfetti({ winner }: { winner: Team | null }) {
  if (winner === null) {
    return null;
  }

  return (
    <div className="finale-confetti" aria-hidden="true">
      {Array.from({ length: 18 }, (_, index) => (
        <span key={`${winner.id}-confetti-${index}`} />
      ))}
    </div>
  );
}
