import { categoryOptions } from '../game/categories';
import type { SetupStep } from '../game/setupTypes';
import type { CategoryId } from '../game/types';

const roundCountOptions = [6, 8, 10] as const;
const standardPlayerCountOptions = [4, 6, 8] as const;
const exceptionPlayerCountOptions = [5, 7] as const;

type SetupScreenProps = {
  duplicatePlayerNameWarning: string | null;
  onBackToPlayers: () => void;
  onChoosePlayerCount: (count: number) => void;
  onChooseQuestionLevel: (includeSpecialQuestions: boolean) => void;
  onChooseRoundCount: (count: number) => void;
  onContinueToRules: () => void;
  onPrepareTeams: () => void;
  onToggleCategory: (categoryId: CategoryId) => void;
  onUpdatePlayerName: (index: number, value: string) => void;
  playerCount: number | null;
  playerNames: string[];
  includeSpecialQuestions: boolean;
  roundCount: number;
  selectedCategories: CategoryId[];
  setupStep: SetupStep;
};

export function SetupScreen({
  duplicatePlayerNameWarning,
  onBackToPlayers,
  onChoosePlayerCount,
  onChooseQuestionLevel,
  onChooseRoundCount,
  onContinueToRules,
  onPrepareTeams,
  onToggleCategory,
  onUpdatePlayerName,
  playerCount,
  playerNames,
  includeSpecialQuestions,
  roundCount,
  selectedCategories,
  setupStep,
}: SetupScreenProps) {
  return (
    <section
      className={`workspace setup-screen setup-step-${setupStep}`}
      aria-label="Spieleinstellungen"
    >
      <p className="eyebrow setup-progress">Schritt {setupStep === 'players' ? '1' : '2'} von 3</p>

      {setupStep === 'players' ? (
        <>
          <section aria-labelledby="player-count-title">
            <h3 id="player-count-title">Spieleranzahl</h3>
            <div className="segmented-control" aria-label="Spieleranzahl wählen">
              {standardPlayerCountOptions.map((count) => (
                <button
                  className={playerCount === count ? 'is-selected' : ''}
                  key={count}
                  onClick={() => onChoosePlayerCount(count)}
                  type="button"
                >
                  {count} Spieler
                </button>
              ))}
            </div>
            <div className="exception-counts" aria-label="Ungerade Spieleranzahl">
              <p>Ausnahme: ungerade Spielerzahl</p>
              <div className="exception-count-grid">
                {exceptionPlayerCountOptions.map((count) => (
                  <button
                    className={playerCount === count ? 'is-selected' : ''}
                    key={count}
                    onClick={() => onChoosePlayerCount(count)}
                    type="button"
                  >
                    {count} Spieler
                  </button>
                ))}
              </div>
            </div>
          </section>

          {playerCount !== null ? (
            <>
              <div className="player-grid">
                {playerNames.map((name, index) => (
                  <label className="field" key={`player-${index + 1}`}>
                    <span>Spieler {index + 1}</span>
                    <input
                      aria-label={`Spieler ${index + 1}`}
                      onChange={(event) => onUpdatePlayerName(index, event.target.value)}
                      value={name}
                    />
                  </label>
                ))}
              </div>
              {duplicatePlayerNameWarning !== null ? (
                <p className="setup-warning" role="status">
                  {duplicatePlayerNameWarning}
                </p>
              ) : null}
            </>
          ) : null}

          <button className="primary-action" onClick={onContinueToRules} type="button">
            Weiter zu Einstellungen
          </button>
        </>
      ) : (
        <>
          <section aria-labelledby="round-count-title">
            <h3 id="round-count-title">Spieldauer</h3>
            <div className="segmented-control" aria-label="Spieldauer wählen">
              {roundCountOptions.map((count) => (
                <button
                  className={roundCount === count ? 'is-selected' : ''}
                  key={count}
                  onClick={() => onChooseRoundCount(count)}
                  type="button"
                >
                  {count} Runden
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="category-title">
            <h3 id="category-title">Kategorien</h3>
            <div className="category-grid" aria-label="Kategorien wählen">
              {categoryOptions.map((category) => (
                <button
                  aria-pressed={selectedCategories.includes(category.id)}
                  className={selectedCategories.includes(category.id) ? 'is-selected' : ''}
                  key={category.id}
                  onClick={() => onToggleCategory(category.id)}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="question-level-title">
            <h3 id="question-level-title">Fragen-Niveau</h3>
            <div className="segmented-control level-control" aria-label="Fragen-Niveau wählen">
              <button
                aria-pressed={!includeSpecialQuestions}
                className={!includeSpecialQuestions ? 'is-selected' : ''}
                onClick={() => onChooseQuestionLevel(false)}
                type="button"
              >
                Normale Fragen
              </button>
              <button
                aria-pressed={includeSpecialQuestions}
                className={includeSpecialQuestions ? 'is-selected' : ''}
                onClick={() => onChooseQuestionLevel(true)}
                type="button"
              >
                Auch Spezialfragen
              </button>
            </div>
            <p className="setup-hint">
              Spezialfragen sind spezielleres Wissen, z.B. Harry-Potter-Zaubersprüche.
            </p>
          </section>

          <div className="action-row">
            <button className="secondary-action" onClick={onBackToPlayers} type="button">
              Zurück
            </button>
            <button className="primary-action" onClick={onPrepareTeams} type="button">
              Teams erstellen
            </button>
          </div>
        </>
      )}
    </section>
  );
}
