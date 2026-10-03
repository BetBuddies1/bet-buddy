import { useState } from 'react';
import type { ChallengeState } from '../game/challengeTypes';
import { createDrawingPromptDeck } from '../game/drawingPrompts';
import type { TeamRoundRole } from '../game/formatters';
import type { Question, Team } from '../game/types';
import { DrawingBoard } from './DrawingBoard';
import './drawing.css';

type DrawingChallengeProps = {
  question: Question;
  challengeState: ChallengeState;
  challengeTeam?: Team;
  challengeTeamRole?: TeamRoundRole;
  judgingTeam?: Team;
  facingClass: string;
  currentBid: number;
  wasSuccessful: boolean;
  onStart: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
  onReview: () => void;
  onConfirm: () => void;
};

export function DrawingChallenge({
  question, challengeState, challengeTeam, challengeTeamRole, judgingTeam, facingClass,
  currentBid, wasSuccessful, onStart, onIncrease, onDecrease, onReview, onConfirm,
}: DrawingChallengeProps) {
  const [deck] = useState(() => createDrawingPromptDeck(question, challengeState.drawingCategory));
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptPhase, setPromptPhase] = useState<'hidden' | 'revealed' | 'drawing'>('hidden');
  const [exhausted, setExhausted] = useState(false);
  const drawer = challengeTeamRole?.challengePlayer.name ?? challengeTeam?.name ?? 'Der Zeichner';
  const guesser = challengeTeamRole?.bidder.name ?? 'Dein Buddy';
  const judges = judgingTeam?.name ?? 'Die anderen Teams';
  const isReview = challengeState.status === 'review';
  const isRunning = challengeState.status === 'running';
  const isDrawing = !isReview && promptPhase === 'drawing';
  const currentPrompt = deck[promptIndex];

  function beginDrawing() {
    if (isReview || currentPrompt === undefined) return;
    setPromptPhase('drawing');
    if (challengeState.status === 'ready') onStart();
  }

  function nextPrompt(wasGuessed: boolean) {
    if (!isRunning || !isDrawing) return;
    if (wasGuessed) onIncrease();
    setPromptPhase('hidden');
    if (promptIndex + 1 >= deck.length) {
      setExhausted(true);
      onReview();
    } else {
      setPromptIndex((index) => index + 1);
    }
  }

  return (
    <section
      className={`drawing-challenge ${facingClass}`}
      aria-labelledby="drawing-title"
      data-drawing-phase={isReview ? 'review' : promptPhase}
    >
      <header className="drawing-challenge__header">
        <h2 id="drawing-title">{drawer} zeichnet · {guesser} rät</h2>
        <p>{challengeState.drawingCategory ?? 'Markenlogos'} · {judges} prüft mit</p>
        <div className="drawing-challenge__metrics">
          <strong aria-label={`Zeichenzeit: ${challengeState.secondsLeft} Sekunden`}>
            {challengeState.secondsLeft}s
          </strong>
          <span>Erraten: {challengeState.count} / {currentBid}</span>
        </div>
      </header>

      {isReview ? (
        <div className="drawing-review" data-outcome={wasSuccessful ? 'success' : 'failure'}>
          <p className="eyebrow">Ergebnis-Check</p>
          <h3 role="status">{wasSuccessful ? 'Geschafft' : 'Nicht geschafft'}</h3>
          {exhausted ? <p>Alle Begriffe gespielt. Prüft jetzt das Ergebnis.</p> : null}
          <p>Prüft gemeinsam die erratenen Begriffe und korrigiert den Zähler bei Bedarf.</p>
          <div className="drawing-actions">
            <button className="secondary-action" type="button" onClick={onDecrease} disabled={challengeState.count === 0}>−1</button>
            <button className="secondary-action" type="button" onClick={onIncrease}>Erraten +1</button>
          </div>
          <button
            className={wasSuccessful ? 'primary-action' : 'danger-action'}
            type="button"
            aria-label="Ergebnis bestätigen"
            onClick={onConfirm}
          >
            {wasSuccessful ? 'Geschafft' : 'Nicht geschafft'} bestätigen
          </button>
        </div>
      ) : currentPrompt === undefined ? (
        <div className="drawing-secret">
          <h3>Keine Zeichenbegriffe verfügbar</h3>
          <p>Diese Aufgabe kann gerade nicht gespielt werden. Prüft das Ergebnis gemeinsam.</p>
          <button className="secondary-action" type="button" onClick={onReview}>Zur Auswertung</button>
        </div>
      ) : isDrawing ? (
        <>
          <DrawingBoard
            key={promptIndex}
            disabled={!isRunning}
            rotated={facingClass === 'faces-opponent'}
          />
          <div className="drawing-actions drawing-actions--play">
            <button className="secondary-action" type="button" onClick={() => nextPrompt(false)} disabled={!isRunning}>Weiter ohne Treffer</button>
            <button className="primary-action" type="button" onClick={() => nextPrompt(true)} disabled={!isRunning}>Erraten +1</button>
          </div>
          <button className="drawing-finish" type="button" onClick={onReview}>Zeichnen beenden &amp; prüfen</button>
        </>
      ) : (
        <div className="drawing-secret">
          <h3>Nur {drawer} schaut aufs Handy</h3>
          <p>{guesser} schaut weg. Nehmt das Handy kurz vom Tisch; legt es erst nach dem Verdecken wieder hin.</p>
          {isRunning ? (
            <p className="drawing-time-note" role="status">Die Zeit läuft weiter – auch beim nächsten Begriff.</p>
          ) : (
            <p className="drawing-time-note">{challengeState.totalSeconds} Sekunden insgesamt. Der Timer startet nach dem Verdecken.</p>
          )}
          {promptPhase === 'revealed' ? (
            <>
              <p className="drawing-secret__word" aria-label="Geheimer Zeichenbegriff">{currentPrompt}</p>
              <button className="primary-action" type="button" onClick={beginDrawing}>
                {isRunning ? 'Verdecken & weiterzeichnen' : 'Verdecken & Zeichnen starten'}
              </button>
            </>
          ) : (
            <button className="primary-action" type="button" onClick={() => setPromptPhase('revealed')}>Begriff anzeigen</button>
          )}
          <p className="drawing-rules">Nur zeichnen: keine Buchstaben, Zahlen, gesprochenen Hinweise oder Gesten. Logos ohne Markennamen. Jede Lösung zählt einmal.</p>
          {isRunning ? <button className="drawing-finish" type="button" onClick={onReview}>Zeichnen beenden &amp; prüfen</button> : null}
        </div>
      )}
    </section>
  );
}
