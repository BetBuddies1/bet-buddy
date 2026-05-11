export function WelcomeScreen({
  onOpenRules,
  onOpenSetup,
  onToggleSounds,
  soundsEnabled,
}: {
  onOpenRules: () => void;
  onOpenSetup: () => void;
  onToggleSounds: () => void;
  soundsEnabled: boolean;
}) {
  return (
    <section className="workspace welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-hero-content">
        <h2 id="welcome-title">Wer kennt seinen Buddy am besten?</h2>
        <p className="screen-copy">
          Bildet Teams, pokert um den Einsatz und beweist, wer seine Buddies am besten einschätzt.
        </p>
        <div className="welcome-actions">
          <button className="primary-action" onClick={onOpenSetup} type="button">
            Spiel starten
          </button>
          <button className="secondary-action" onClick={onOpenRules} type="button">
            Spiel Erklärung
          </button>
          <button
            aria-label={soundsEnabled ? 'Sounds ausschalten' : 'Sounds einschalten'}
            aria-pressed={soundsEnabled}
            className="secondary-action"
            onClick={onToggleSounds}
            type="button"
          >
            {soundsEnabled ? 'Sounds aus' : 'Sounds an'}
          </button>
        </div>
      </div>
    </section>
  );
}
