import { AnswerRules } from './AnswerRules';

export function RulesScreen({
  onBackHome,
  onOpenSetup,
}: {
  onBackHome: () => void;
  onOpenSetup: () => void;
}) {
  return (
    <section className="workspace rules-screen" aria-labelledby="rules-title">
      <p className="eyebrow">Kurz erklärt</p>
      <h2 id="rules-title">So läuft Bet Buddy</h2>
      <div className="rules-grid">
        <article>
          <h3>1. Einsatz hochpokern</h3>
          <p>
            In der Einsatzrunde erhöht ihr den Einsatz oder passt. Wer am höchsten pokert,
            muss gleich liefern.
          </p>
        </article>
        <article>
          <h3>2. Challenge liefern</h3>
          <p>
            Timer an, Antworten raus, alle fiebern mit. Das Team mit dem höchsten Einsatz
            muss zeigen, dass es nicht nur große Töne spuckt.
          </p>
        </article>
        <article>
          <h3>3. Zählen und fair prüfen</h3>
          <p>
            Ihr zählt mit dem Tracker mit und prüft die Antworten gemeinsam. Korrigiert
            bei Bedarf den Zähler und bestätigt das Ergebnis. Die App vergibt den Punkt.
          </p>
        </article>
      </div>
      <AnswerRules />
      <div className="action-row">
        <button className="secondary-action" onClick={onBackHome} type="button">
          Zur Startseite
        </button>
        <button className="primary-action" onClick={onOpenSetup} type="button">
          Spiel starten
        </button>
      </div>
    </section>
  );
}
