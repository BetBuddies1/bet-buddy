import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Question } from './game/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let originalAudio: typeof Audio;
let originalConfirm: typeof window.confirm;
let originalScrollTo: typeof window.scrollTo;
let playedSoundSources: string[];
let scrollToMock: ReturnType<typeof vi.fn>;
type TestAudioElement = {
  currentTime: number;
  loop: boolean;
  pause: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  preload: string;
  src: string;
  volume: number;
};
let createdAudioElements: TestAudioElement[];

const defaultTestDeck: Question[] = [
  {
    id: 'default-test-q1',
    text: 'Wie viele Testantworten kann dein Buddy nennen?',
    category: 'medien-popkultur',
    timeLimit: 30,
    type: 'count',
  },
  {
    id: 'default-test-q2',
    text: 'Wie viele weitere Testantworten kann dein Buddy nennen?',
    category: 'spiele-kreativitaet',
    timeLimit: 30,
    type: 'count',
  },
];

function renderApp(appProps: ComponentProps<typeof App> = {}) {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  const props = {
    createDeck: () => [...defaultTestDeck],
    ...appProps,
  };

  act(() => {
    root.render(<App {...props} />);
  });
}

function renderAppWithDeck(deck: Question[]) {
  act(() => {
    root.unmount();
  });
  container.remove();
  renderApp({ createDeck: () => deck });
}

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label || candidate.getAttribute('aria-label') === label,
  );

  if (!button) {
    throw new Error(`Button nicht gefunden: ${label}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function findButton(label: string) {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label || candidate.getAttribute('aria-label') === label,
  );

  if (!button) {
    throw new Error(`Button nicht gefunden: ${label}`);
  }

  return button as HTMLButtonElement;
}

function changeInput(label: string, value: string) {
  const input = [...container.querySelectorAll('input')].find(
    (candidate) => candidate.getAttribute('aria-label') === label,
  );

  if (!input) {
    throw new Error(`Eingabefeld nicht gefunden: ${label}`);
  }

  act(() => {
    setNativeValue(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function changeSelect(label: string, value: string) {
  const select = [...container.querySelectorAll('select')].find(
    (candidate) => candidate.getAttribute('aria-label') === label,
  );

  if (!select) {
    throw new Error(`Auswahl nicht gefunden: ${label}`);
  }

  act(() => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function findSelect(label: string) {
  const select = [...container.querySelectorAll('select')].find(
    (candidate) => candidate.getAttribute('aria-label') === label,
  );

  if (!select) {
    throw new Error(`Auswahl nicht gefunden: ${label}`);
  }

  return select as HTMLSelectElement;
}

function expectButtonSelected(label: string, expectedSelected: boolean) {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label || candidate.getAttribute('aria-label') === label,
  );

  if (!button) {
    throw new Error(`Button nicht gefunden: ${label}`);
  }

  expect(button.getAttribute('aria-pressed')).toBe(String(expectedSelected));
}

function expectText(text: string) {
  expect(container.textContent).toContain(text);
}

function expectNoText(text: string) {
  expect(container.textContent).not.toContain(text);
}

function expectButtonCount(label: string, expectedCount: number) {
  const matchingButtons = [...container.querySelectorAll('button')].filter(
    (candidate) => candidate.textContent === label || candidate.getAttribute('aria-label') === label,
  );

  expect(matchingButtons).toHaveLength(expectedCount);
}

async function flushAudioStart() {
  await act(async () => {
    await Promise.resolve();
  });
}

function expectCategoryOrder(expectedLabels: string[]) {
  const categoryButtons = [...container.querySelectorAll('.category-grid button')].map(
    (button) => button.textContent,
  );

  expect(categoryButtons).toEqual(expectedLabels);
}

function expectActiveTableTeam(teamId: string) {
  expect(container.querySelector(`.table-side-controls[data-team-id="${teamId}"]`)?.getAttribute('data-active')).toBe(
    'true',
  );
  expect(container.querySelectorAll('button.table-side-action-button[data-action="raise"]')).toHaveLength(1);
  expect(container.querySelectorAll('button.table-side-action-button[data-action="handoff"]')).toHaveLength(1);
  expect(container.querySelectorAll('button.table-side-action-button[data-action="pass"]')).toHaveLength(1);
}

function expectTableQuestionFaces(teamId: string) {
  expect(container.querySelector('.table-center-question')?.getAttribute('data-facing-team-id')).toBe(
    teamId,
  );
}

function fillPlayerNames(names: string[]) {
  names.forEach((name, index) => {
    changeInput(`Spieler ${index + 1}`, name);
  });
}

function openSetup() {
  clickButton('Spiel starten');
}

function openSetupRules() {
  openSetup();
  clickButton('4 Spieler');
  fillPlayerNames(['Anna', 'Ben', 'Clara', 'David']);
  clickButton('Weiter zu Einstellungen');
}

function ensureSetupOpen() {
  if (!container.textContent?.includes('Spieleranzahl')) {
    openSetup();
  }
}

function prepareFourPlayerRound() {
  ensureSetupOpen();
  clickButton('4 Spieler');
  fillPlayerNames(['Anna', 'Ben', 'Clara', 'David']);
  clickButton('Weiter zu Einstellungen');
  clickButton('Teams erstellen');
  clickButton('Spiel starten');
}

function startFourPlayerGame() {
  prepareFourPlayerRound();
  clickButton('Einsatzrunde starten');
}

function startSixPlayerGame() {
  openSetup();
  clickButton('6 Spieler');
  fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn']);
  clickButton('Weiter zu Einstellungen');
  clickButton('Teams erstellen');
  clickButton('Spiel starten');
  clickButton('Einsatzrunde starten');
}

function startEightPlayerGame() {
  openSetup();
  clickButton('8 Spieler');
  fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn', 'Gina', 'Hannes']);
  clickButton('Weiter zu Einstellungen');
  clickButton('Teams erstellen');
  clickButton('Spiel starten');
  clickButton('Einsatzrunde starten');
}

function prepareFivePlayerRound() {
  openSetup();
  clickButton('5 Spieler');
  fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif']);
  clickButton('Weiter zu Einstellungen');
  clickButton('Teams erstellen');
  clickButton('Spiel starten');
}

function finishSuccessfulRound() {
  clickButton('Einsatz +1');
  clickButton('Weitergeben');
  clickButton('Passen');
  clickButton('Challenge starten');
  clickButton('+1');
  clickButton('+1');
  clickButton('Auswertung prüfen');
  clickButton('Ergebnis bestätigen');
}

function setNativeValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
  const prototype = Object.getPrototypeOf(input) as HTMLInputElement;
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value);
    return;
  }

  valueSetter?.call(input, value);
}

describe('App', () => {
  beforeEach(() => {
    playedSoundSources = [];
    createdAudioElements = [];
    originalAudio = window.Audio;
    originalConfirm = window.confirm;
    originalScrollTo = window.scrollTo;
    scrollToMock = vi.fn();
    window.confirm = vi.fn(() => true);
    window.scrollTo = scrollToMock;
    window.Audio = class TestAudio {
      currentTime = 0;
      loop = false;
      pause = vi.fn();
      play = vi.fn(() => Promise.resolve());
      preload = '';
      src: string;
      volume = 1;

      constructor(src = '') {
        this.src = src;
        playedSoundSources.push(src);
        createdAudioElements.push(this);
      }
    } as unknown as typeof Audio;

    renderApp();
  });

  afterEach(() => {
    window.Audio = originalAudio;
    window.confirm = originalConfirm;
    window.scrollTo = originalScrollTo;
    vi.useRealTimers();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('starts with a focused welcome screen before setup begins', () => {
    const headerIntro = container.querySelector('.app-header .intro');

    expectText('Wer kennt seinen Buddy am besten?');
    expectText('Bildet Teams, pokert um den Einsatz und beweist, wer seine Buddies am besten einschätzt.');
    expectButtonCount('Spiel starten', 1);
    expectButtonCount('Spiel Erklärung', 1);
    expectButtonCount('Sounds aus', 1);
    expect(container.querySelector('.welcome-hero-content')).not.toBeNull();
    expect(headerIntro).toBeNull();
    expectNoText('Gemeinsam am Tisch');
    expectNoText('Wer kennt seine Buddies am besten?');
    expectNoText('Willkommen bei Bet Buddy');
    expectNoText('Das lokale Partyspiel für mutige Einsätze und gute Buddy-Instinkte.');
    expectNoText('Setzt Teams, bietet mutig und zeigt, wie gut ihr eure Buddies einschätzen könnt.');
    expectNoText('Ein lokales Teamspiel mit Fragen, mutigen Einsätzen und schnellen Challenges.');
    expectNoText('Spieleranzahl');

    openSetup();

    expectText('Spieleranzahl');
    expectText('Schritt 1 von 3');
    expectNoText('Kategorien');
    expectNoText('Spieldauer');
  });

  it('scrolls to the top when the visible phase changes', () => {
    scrollToMock.mockClear();

    openSetup();

    expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('lets players switch sounds off for the current session', () => {
    expect(findButton('Sounds aus').getAttribute('aria-pressed')).toBe('true');

    clickButton('Sounds aus');

    expectButtonCount('Sounds an', 1);
    expect(findButton('Sounds an').getAttribute('aria-pressed')).toBe('false');

    openSetup();

    expectButtonCount('Sounds an', 1);
  });

  it('asks for confirmation before leaving an active game from the start button', () => {
    const confirmMock = vi.fn(() => false);
    window.confirm = confirmMock;
    startFourPlayerGame();

    clickButton('Startseite');

    expect(confirmMock).toHaveBeenCalledWith(
      'Das laufende Spiel geht verloren. Wirklich zur Startseite zurückkehren?',
    );
    expectText('Runde 1 von 6');
    expectNoText('Wer kennt seinen Buddy am besten?');

    confirmMock.mockReturnValue(true);

    clickButton('Startseite');

    expectText('Wer kennt seinen Buddy am besten?');
  });

  it('warns before a browser refresh or tab close during an active game', () => {
    startFourPlayerGame();

    const unloadEvent = new Event('beforeunload', { cancelable: true });
    const wasNotPrevented = window.dispatchEvent(unloadEvent);

    expect(wasNotPrevented).toBe(false);
    expect(unloadEvent.defaultPrevented).toBe(true);
  });

  it('keeps setup usable when a deck has no questions', () => {
    renderAppWithDeck([]);

    expectText('Wer kennt seinen Buddy am besten?');

    prepareFourPlayerRound();

    expectText('Für die aktive Kategorieauswahl sind keine Fragen verfügbar.');
    expectNoText('Keine Frage verfügbar.');
  });

  it('shows a short explanation screen from the welcome screen', () => {
    clickButton('Spiel Erklärung');

    expectText('So läuft Bet Buddy');
    expectText('Einsatz hochpokern');
    expectText('In der Einsatzrunde erhöht ihr den Einsatz oder passt. Wer am höchsten pokert, muss gleich liefern.');
    expectText('Challenge liefern');
    expectText('Timer an, Antworten raus, alle fiebern mit. Das Team mit dem höchsten Einsatz muss zeigen, dass es nicht nur große Töne spuckt.');
    expectText('Zählen und fair prüfen');
    expectText('Der Tracker zählt live mit. Wenn etwas verrutscht, korrigiert ihr kurz und die App vergibt den Punkt.');
    expectNoText('Teams bieten ein Ziel');
    expectNoText('Eine Challenge entscheidet');
    expectNoText('Tracker zählt die Antworten');
    expectButtonCount('Zur Startseite', 1);

    clickButton('Zur Startseite');

    expectText('Wer kennt seinen Buddy am besten?');
  });

  it('shows the question as its own screen before the bidding round starts', () => {
    prepareFourPlayerRound();

    expectText('Wie viele Testantworten kann dein Buddy nennen?');
    expectText('Einsatzrunde starten');
    expectNoText('Aktueller Einsatz');
    expectNoText('Punktestand');

    clickButton('Einsatzrunde starten');

    expectText('Einsatzrunde');
    expectText('Startwert');
    expectNoText('Höchster Einsatz');
  });

  it('keeps odd player counts available as a secondary setup option', () => {
    openSetup();

    const standardCounts = [...container.querySelectorAll('.segmented-control button')].map(
      (button) => button.textContent,
    );
    const exceptionCounts = [...container.querySelectorAll('.exception-count-grid button')].map(
      (button) => button.textContent,
    );

    expect(standardCounts).toEqual(['4 Spieler', '6 Spieler', '8 Spieler']);
    expectText('Ausnahme: ungerade Spielerzahl');
    expect(exceptionCounts).toEqual(['5 Spieler', '7 Spieler']);
  });

  it('creates a two-player and a three-player team for five players', () => {
    openSetup();
    clickButton('5 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif']);
    clickButton('Weiter zu Einstellungen');
    clickButton('Teams erstellen');

    expect(container.querySelectorAll('.team-editor')).toHaveLength(2);
    expect(container.querySelectorAll('.team-editor')[0]?.textContent).toContain('Buddy 2');
    expect(container.querySelectorAll('.team-editor')[0]?.textContent).not.toContain('Buddy 3');
    expect(container.querySelectorAll('.team-editor')[1]?.textContent).toContain('Buddy 3');
    expectText('Elif');

    clickButton('Spiel starten');
    clickButton('Einsatzrunde starten');

    expectText('Anna bietet für Ben');
  });

  it('rotates bidder and challenge buddy through a three-player team', () => {
    prepareFivePlayerRound();

    clickButton('Einsatzrunde starten');
    expectText('Anna bietet für Ben');
    clickButton('Passen');
    expectText('David muss 1 schaffen');
    expectText('Clara hat für Team 2 geboten');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');
    clickButton('Nächste Runde');

    clickButton('Einsatzrunde starten');
    expectText('David bietet für Elif');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');
    clickButton('Nächste Runde');

    clickButton('Einsatzrunde starten');
    expectText('Elif bietet');
    expectText('Clara liefert');
  });

  it('skips a question without advancing the round or rotating the starting team', () => {
    const controlledDeck: Question[] = [
      {
        id: 'test-skip-q1',
        text: 'Wie viele erste Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-skip-q2',
        text: 'Wie viele zweite Testantworten kann dein Buddy nennen?',
        category: 'spiele-kreativitaet',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(controlledDeck);
    prepareFourPlayerRound();

    expectText('Runde 1 von 6');
    expectText('Wie viele erste Testantworten kann dein Buddy nennen?');

    clickButton('Frage überspringen');

    expectText('Frage übersprungen.');
    expectText('Runde 1 von 6');
    expectText('Wie viele zweite Testantworten kann dein Buddy nennen?');
    expectNoText('Wie viele erste Testantworten kann dein Buddy nennen?');

    clickButton('Einsatzrunde starten');

    expectActiveTableTeam('t1');
  });

  it('limits question skips to two per game for each team', () => {
    const controlledDeck: Question[] = [
      {
        id: 'test-limited-skip-q1',
        text: 'Wie viele erste Skip-Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-limited-skip-q2',
        text: 'Wie viele zweite Skip-Testantworten kann dein Buddy nennen?',
        category: 'spiele-kreativitaet',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-limited-skip-q3',
        text: 'Wie viele dritte Skip-Testantworten kann dein Buddy nennen?',
        category: 'welt-orte',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-limited-skip-q4',
        text: 'Wie viele vierte Skip-Testantworten kann dein Buddy nennen?',
        category: 'geschichte-kultur',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(controlledDeck);
    prepareFourPlayerRound();

    expect(findButton('Frage überspringen').textContent).toContain('Team 1: 2 übrig');

    clickButton('Frage überspringen');

    expect(findButton('Frage überspringen').textContent).toContain('Team 1: 1 übrig');

    clickButton('Frage überspringen');

    const exhaustedTeamOneSkip = findButton('Frage überspringen');

    expect(exhaustedTeamOneSkip.textContent).toContain('Team 1: 0 übrig');
    expect(exhaustedTeamOneSkip.disabled).toBe(true);

    clickButton('Einsatzrunde starten');
    finishSuccessfulRound();
    clickButton('Nächste Runde');

    expect(findButton('Frage überspringen').textContent).toContain('Team 2: 2 übrig');
    expect(findButton('Frage überspringen').disabled).toBe(false);
  });

  it('skips the current physical question without showing a second skip action', () => {
    const controlledDeck: Question[] = [
      {
        id: 'q-koerperlich-muenzturm',
        text: 'Wie viele Münzen kann dein Buddy mit einer Hand zu einem Turm stapeln?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-non-physical-q1',
        text: 'Wie viele allgemeine Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'q-koerperlich-kniebeugen',
        text: 'Wie viele Kniebeugen schafft dein Buddy in 30 Sekunden?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-non-physical-q2',
        text: 'Wie viele kreative Testantworten kann dein Buddy nennen?',
        category: 'spiele-kreativitaet',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(controlledDeck);
    prepareFourPlayerRound();

    expectText('Wie viele Münzen kann dein Buddy mit einer Hand zu einem Turm stapeln?');
    expectButtonCount('Frage überspringen', 1);
    expectButtonCount('Körperliche Fragen aussetzen', 0);

    clickButton('Frage überspringen');

    expectText('Frage übersprungen.');
    expectText('Wie viele allgemeine Testantworten kann dein Buddy nennen?');
    expectNoText('Wie viele Münzen kann dein Buddy mit einer Hand zu einem Turm stapeln?');

    clickButton('Einsatzrunde starten');
    finishSuccessfulRound();
    clickButton('Nächste Runde');

    expectText('Runde 2 von 6');
    expectText('Wie viele Kniebeugen schafft dein Buddy in 30 Sekunden?');
    expectNoText('Wie viele kreative Testantworten kann dein Buddy nennen?');

    clickButton('Startseite');
    prepareFourPlayerRound();

    expectText('Wie viele Münzen kann dein Buddy mit einer Hand zu einem Turm stapeln?');
  });

  it('shows physical question illustrations before bidding starts', () => {
    const physicalDeck: Question[] = [
      {
        id: 'q-koerperlich-luftballon-atem',
        text: 'Wie viele Sekunden kann dein Buddy einen Luftballon nur mit dem Atem in der Luft halten?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'duration',
      },
    ];

    renderAppWithDeck(physicalDeck);
    prepareFourPlayerRound();

    expect(container.querySelector('[aria-label="Luftballon mit Atem Illustration"]')).not.toBeNull();
    expectText('Einsatzrunde starten');
  });

  it('marks bitmap physical illustrations for smooth UI treatment', () => {
    const physicalDeck: Question[] = [
      {
        id: 'q-koerperlich-kniebeugen',
        text: 'Wie viele Kniebeugen schafft dein Buddy in 30 Sekunden?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(physicalDeck);
    prepareFourPlayerRound();

    const illustration = container.querySelector('[aria-label="Kniebeugen Illustration"]');

    expect(illustration?.classList.contains('challenge-illustration--bitmap')).toBe(true);
    expect(illustration?.querySelector('img')).not.toBeNull();
  });

  it('keeps physical round intros compact in two-team table games', () => {
    const physicalDeck: Question[] = [
      {
        id: 'q-koerperlich-muenzturm',
        text: 'Wie viele Münzen kann dein Buddy mit einer Hand zu einem Turm stapeln?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(physicalDeck);
    prepareFourPlayerRound();

    expect(container.querySelector('[aria-label="Münzturm Illustration"]')).not.toBeNull();
    expect(container.querySelector('.table-question-panel')).toBeNull();

    clickButton('Einsatzrunde starten');

    expect(container.querySelector('.table-mode')).not.toBeNull();
  });

  it('uses distinct illustrations for different physical challenge types', () => {
    const bookDeck: Question[] = [
      {
        id: 'q-koerperlich-buch-balancieren',
        text: 'Wie viele Sekunden kann dein Buddy ein Buch auf dem Kopf balancieren?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'duration',
      },
    ];
    const squatDeck: Question[] = [
      {
        id: 'q-koerperlich-kniebeugen',
        text: 'Wie viele Kniebeugen schafft dein Buddy in 30 Sekunden?',
        category: 'koerperlich',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(bookDeck);
    prepareFourPlayerRound();

    expect(container.querySelector('[aria-label="Buch balancieren Illustration"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Kniebeugen Illustration"]')).toBeNull();

    clickButton('Einsatzrunde starten');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expect(container.querySelector('[aria-label="Buch balancieren Illustration"]')).not.toBeNull();

    renderAppWithDeck(squatDeck);
    prepareFourPlayerRound();

    expect(container.querySelector('[aria-label="Kniebeugen Illustration"]')).not.toBeNull();
    expect(container.querySelector('[aria-label="Buch balancieren Illustration"]')).toBeNull();
  });

  it('has a specific illustration for every physical challenge question', () => {
    const physicalIllustrations: Array<{ id: string; text: string; label: string }> = [
      {
        id: 'q-koerperlich-kniebeugen',
        text: 'Wie viele Kniebeugen schafft dein Buddy in 30 Sekunden?',
        label: 'Kniebeugen Illustration',
      },
      {
        id: 'q-koerperlich-hampelmaenner',
        text: 'Wie viele Hampelmänner schafft dein Buddy in 30 Sekunden?',
        label: 'Hampelmänner Illustration',
      },
      {
        id: 'q-koerperlich-liegestuetze',
        text: 'Wie viele Liegestütze schafft dein Buddy in 30 Sekunden?',
        label: 'Liegestütze Illustration',
      },
      {
        id: 'q-koerperlich-wand-sitzposition',
        text: 'Wie viele Sekunden kann dein Buddy die Wand-Sitzposition halten?',
        label: 'Wand-Sitzposition Illustration',
      },
      {
        id: 'q-koerperlich-buch-balancieren',
        text: 'Wie viele Sekunden kann dein Buddy ein Buch auf dem Kopf balancieren?',
        label: 'Buch balancieren Illustration',
      },
      {
        id: 'q-koerperlich-loeffel-nase',
        text: 'Wie viele Sekunden kann dein Buddy einen Löffel auf der Nase balancieren?',
        label: 'Löffel balancieren Illustration',
      },
      {
        id: 'q-koerperlich-wurfgegenstand-korb',
        text: 'Wie oft trifft dein Buddy nacheinander mit einem weichen Wurfgegenstand?',
        label: 'Wurf in Korb Illustration',
      },
      {
        id: 'q-koerperlich-wasserflasche-arm',
        text: 'Wie viele Sekunden kann dein Buddy eine volle Wasserflasche halten?',
        label: 'Wasserflasche halten Illustration',
      },
      {
        id: 'q-koerperlich-ein-bein-augen-zu',
        text: 'Wie viele Sekunden kann dein Buddy auf einem Bein stehen?',
        label: 'Einbeinstand Illustration',
      },
      {
        id: 'q-koerperlich-unterarmstuetz',
        text: 'Wie viele Sekunden kann dein Buddy einen Unterarmstütz halten?',
        label: 'Unterarmstütz Illustration',
      },
      {
        id: 'q-koerperlich-superman-hold',
        text: 'Wie viele Sekunden kann dein Buddy einen Superman-Hold halten?',
        label: 'Superman-Hold Illustration',
      },
      {
        id: 'q-koerperlich-muenzturm',
        text: 'Wie viele Münzen kann dein Buddy mit einer Hand stapeln?',
        label: 'Münzturm Illustration',
      },
      {
        id: 'q-koerperlich-luftballon-atem',
        text: 'Wie viele Sekunden kann dein Buddy einen Luftballon nur mit dem Atem halten?',
        label: 'Luftballon mit Atem Illustration',
      },
    ];

    physicalIllustrations.forEach(({ id, label, text }) => {
      const isCountQuestion =
        id.includes('kniebeugen') ||
        id.includes('hampelmaenner') ||
        id.includes('liegestuetze') ||
        id.includes('muenzturm');
      renderAppWithDeck([
        {
          id,
          text,
          category: 'koerperlich',
          timeLimit: 60,
          type: id.includes('wurfgegenstand') ? 'streak' : isCountQuestion ? 'count' : 'duration',
        },
      ]);
      prepareFourPlayerRound();

      const illustration = container.querySelector(`[aria-label="${label}"]`);
      const image = illustration?.querySelector('img');

      expect(illustration).not.toBeNull();
      expect(image?.getAttribute('src')).toContain('/challenges/physical/');
      expect(illustration?.querySelector('svg')).toBeNull();
    });
  });

  it('uses a table mode layout for two-team bidding rounds', () => {
    startFourPlayerGame();

    expect(container.querySelector('.table-mode')).not.toBeNull();
    expect(container.querySelector('.table-side-controls.is-opponent')).not.toBeNull();
    expect(container.querySelector('.table-center-question')).not.toBeNull();
    expect(container.querySelector('.table-side-controls.is-active')).not.toBeNull();
  });

  it('shows a compact game header with round and score while playing', () => {
    prepareFourPlayerRound();

    const header = container.querySelector('.app-header');
    const hud = container.querySelector('.game-hud');
    const score = container.querySelector('.score-chip');

    expect(header?.classList.contains('game-header')).toBe(true);
    expect(hud?.textContent).toContain('Runde 1 von 6');
    expect(score?.textContent).toContain('Score');
    expect(score?.textContent).toContain('Team 1 0:0 Team 2');
    expect(score?.querySelector('.score-value-compact')?.textContent).toBe('0:0');
  });

  it('shows only side buttons duplicated in table mode and keeps the question once in the center', () => {
    startFourPlayerGame();

    const raiseButtons = container.querySelectorAll(
      'button.table-side-action-button[data-action="raise"]',
    );
    const passButtons = container.querySelectorAll(
      'button.table-side-action-button[data-action="pass"]',
    );
    const centeredQuestions = container.querySelectorAll('.table-question-copy');
    const centeredQuestion = container.querySelector('.table-question-copy');
    const teamOneSide = container.querySelector('.table-side-controls[data-team-id="t1"]');
    const teamTwoSide = container.querySelector('.table-side-controls[data-team-id="t2"]');
    const bidDisplay = container.querySelector('.table-bid-display');

    expect(raiseButtons).toHaveLength(1);
    expect(passButtons).toHaveLength(1);
    expect(teamOneSide?.getAttribute('data-active')).toBe('true');
    expect(teamTwoSide?.getAttribute('data-active')).toBe('false');
    expectTableQuestionFaces('t1');
    expect(teamOneSide?.querySelectorAll('button.table-side-action-button')).toHaveLength(3);
    expect(teamTwoSide?.querySelectorAll('button.table-side-action-button')).toHaveLength(0);
    expect(centeredQuestions).toHaveLength(1);
    expect(centeredQuestion?.classList.contains('is-opponent')).toBe(false);
    expect(centeredQuestion?.classList.contains('is-active')).toBe(false);
    expect(centeredQuestion?.textContent).toContain('Wie viele Testantworten kann dein Buddy nennen?');
    expect(bidDisplay?.textContent).toContain('Startwert');
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('1');
    expect(centeredQuestion?.textContent).not.toContain('Team 1 ist dran');
    expect(centeredQuestion?.textContent).not.toContain('Aktueller Einsatz');
    expect(centeredQuestion?.textContent).not.toContain('Runde 1 von 6');
    expect(centeredQuestion?.textContent).not.toContain('Team 1 ist am Zug');
    expect(teamOneSide?.textContent).not.toContain('Wie viele Testantworten kann dein Buddy nennen?');
    expect(teamTwoSide?.textContent).not.toContain('Wie viele Testantworten kann dein Buddy nennen?');
    expect(teamOneSide?.textContent).not.toContain('Einsatz 1');
    expect(teamTwoSide?.textContent).not.toContain('Einsatz 1');

    clickButton('Einsatz +1');

    expect(container.querySelector('.table-side-controls[data-team-id="t1"]')?.getAttribute('data-active')).toBe(
      'true',
    );
    expect(bidDisplay?.textContent).toContain('Höchster Einsatz');
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('2');
    expect(centeredQuestion?.textContent).toContain('Team 1 hält den Einsatz');
    expect(findButton('Passen').disabled).toBe(true);
    clickButton('Einsatz +1');
    expect(container.querySelector('.table-side-controls[data-team-id="t1"]')?.getAttribute('data-active')).toBe(
      'true',
    );
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('3');
    clickButton('Weitergeben');

    expect(container.querySelector('.table-side-controls[data-team-id="t1"]')?.getAttribute('data-active')).toBe(
      'false',
    );
    expect(container.querySelector('.table-side-controls[data-team-id="t2"]')?.getAttribute('data-active')).toBe(
      'true',
    );
    expectTableQuestionFaces('t2');
    expect(container.querySelector('.table-center-question')?.classList.contains('faces-opponent')).toBe(true);
    expect(centeredQuestion?.textContent).toContain('Team 1 hält den Einsatz');
    expect(container.querySelectorAll('button.table-side-action-button[data-action="raise"]')).toHaveLength(1);
    expect(container.querySelectorAll('button.table-side-action-button[data-action="handoff"]')).toHaveLength(1);
    expect(container.querySelectorAll('button.table-side-action-button[data-action="pass"]')).toHaveLength(1);
  });

  it('shows challenge-type units during bidding', () => {
    const durationDeck: Question[] = [
      {
        id: 'duration-bid-test-q1',
        text: 'Wie viele Sekunden kann dein Buddy einen Test-Hold halten?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'duration',
      },
    ];

    renderAppWithDeck(durationDeck);

    prepareFourPlayerRound();
    clickButton('Einsatzrunde starten');

    const bidDisplay = container.querySelector('.table-bid-display');
    const teamOneSide = container.querySelector('.table-side-controls[data-team-id="t1"]');
    const teamTwoSide = container.querySelector('.table-side-controls[data-team-id="t2"]');

    expect(bidDisplay?.textContent).toContain('Startwert');
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('1');
    expect(bidDisplay?.querySelector('.table-bid-unit')?.textContent).toBe('Sekunde');
    expect(teamOneSide?.textContent).not.toContain('Einsatz 1 Sekunde');
    expect(teamTwoSide?.textContent).not.toContain('Einsatz 1 Sekunde');

    clickButton('Einsatz +1');

    expect(bidDisplay?.textContent).toContain('Höchster Einsatz');
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('2');
    expect(bidDisplay?.querySelector('.table-bid-unit')?.textContent).toBe('Sekunden');
    expect(playedSoundSources.at(-1)).toContain('sounds/bid.mp3');
    expect(createdAudioElements.at(-1)?.volume).toBeLessThan(0.45);
    expect(teamOneSide?.textContent).not.toContain('Einsatz 2 Sekunden');
    expect(teamTwoSide?.textContent).not.toContain('Einsatz 2 Sekunden');
  });

  it('uses the prominent bid display in regular bidding rounds', () => {
    startSixPlayerGame();

    const biddingPanel = container.querySelector('.bidding-panel');
    const bidDisplay = biddingPanel?.querySelector('.table-bid-display');

    expect(container.querySelector('.table-mode')).toBeNull();
    expect(bidDisplay?.textContent).toContain('Startwert');
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('1');
    expect(bidDisplay?.textContent).not.toContain('Team 1 ist dran');
    expect(biddingPanel?.textContent).not.toContain('Höchster Einsatz: 1');

    clickButton('Einsatz +1');

    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('2');
    expect(bidDisplay?.textContent).toContain('Höchster Einsatz');
    expect(bidDisplay?.textContent).toContain('Team 1 hält den Einsatz');

    clickButton('Weitergeben');

    expectText('Clara bietet für David (Team 2)');
    expect(bidDisplay?.querySelector('strong')?.textContent).toBe('2');
    expect(bidDisplay?.textContent).toContain('Team 1 hält den Einsatz');
  });

  it('shows round intro metadata as compact stacked lines', () => {
    prepareFourPlayerRound();

    const metaLines = container.querySelectorAll('.round-meta-list .round-meta-line');

    expect(metaLines).toHaveLength(2);
    expect(container.querySelectorAll('.round-meta-pill')).toHaveLength(0);
    expect(metaLines[0]?.textContent).toContain('Kategorie');
    expect(metaLines[0]?.textContent).toContain('Medien & Popkultur');
    expect(metaLines[1]?.textContent).toContain('Zeitlimit');
    expect(metaLines[1]?.textContent).toContain('30 Sekunden');
  });

  it('creates editable manual teams for a 4-player game', () => {
    openSetupRules();
    clickButton('Teams erstellen');

    expectText('Teams erstellen');
    expectText('Team 1');
    expectText('Anna');
    expectText('David');
    expectText('Spiel starten');
    expect(container.querySelector('.team-editor[data-team-accent="0"]')).not.toBeNull();
    expect(container.querySelector('.team-editor[data-team-accent="1"]')).not.toBeNull();
  });

  it('lets players choose the game scope in rounds', () => {
    openSetupRules();
    clickButton('8 Runden');
    clickButton('Teams erstellen');
    clickButton('Spiel starten');

    expectText('Runde 1 von 8');
  });

  it('lets players filter the question deck by category', () => {
    openSetupRules();

    expectNoText('Spiel vorbereiten');
    expectText('Spieldauer');
    expectText('Kategorien');
    expectCategoryOrder([
      'Medien & Popkultur',
      'Wörter & Namen',
      'Essen & Trinken',
      'Welt & Orte',
      'Natur & Wissen',
      'Sport & Freizeit',
      'Beruf & Gesellschaft',
      'Zuhause & Alltag',
      'Marken & Technik',
      'Geschichte & Kultur',
      'Spiele & Kreativität',
      'Körperliche Challenges',
    ]);
    expectButtonSelected('Medien & Popkultur', true);
    expectButtonSelected('Spiele & Kreativität', true);

    clickButton('Medien & Popkultur');
    expectButtonSelected('Medien & Popkultur', false);

    clickButton('Teams erstellen');
    clickButton('Spiel starten');

    expectText('Wie viele weitere Testantworten kann dein Buddy nennen?');
    expectText('Kategorie');
    expectText('Spiele & Kreativität');
    expectText('Zeitlimit');
    expectText('30 Sekunden');
  });

  it('keeps special questions out by default and includes them when players opt in', () => {
    const deckWithSpecialFirst: Question[] = [
      {
        id: 'special-test-question',
        text: 'Wie viele spezielle Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
        isSpecial: true,
      },
      {
        id: 'normal-test-question',
        text: 'Wie viele normale Testantworten kann dein Buddy nennen?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
    ];

    renderAppWithDeck(deckWithSpecialFirst);
    openSetupRules();
    expectText('Normale Fragen');
    expectText('Auch Spezialfragen');
    expectText('z.B. Harry-Potter-Zaubersprüche');
    clickButton('Teams erstellen');
    clickButton('Spiel starten');

    expectText('Wie viele normale Testantworten kann dein Buddy nennen?');
    expectNoText('Wie viele spezielle Testantworten kann dein Buddy nennen?');

    renderAppWithDeck(deckWithSpecialFirst);
    openSetupRules();
    clickButton('Auch Spezialfragen');
    clickButton('Teams erstellen');
    clickButton('Spiel starten');

    expectText('Wie viele spezielle Testantworten kann dein Buddy nennen?');
  });

  it('keeps at least one question category active', () => {
    openSetupRules();

    clickButton('Medien & Popkultur');
    clickButton('Wörter & Namen');
    clickButton('Essen & Trinken');
    clickButton('Welt & Orte');
    clickButton('Natur & Wissen');
    clickButton('Sport & Freizeit');
    clickButton('Beruf & Gesellschaft');
    clickButton('Zuhause & Alltag');
    clickButton('Marken & Technik');
    clickButton('Geschichte & Kultur');
    clickButton('Spiele & Kreativität');
    clickButton('Körperliche Challenges');

    expectButtonSelected('Körperliche Challenges', true);
    expectText('Mindestens eine Kategorie muss aktiv bleiben.');
  });

  it('creates manual teams for a 6-player game', () => {
    openSetup();
    clickButton('6 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn']);
    clickButton('Weiter zu Einstellungen');
    clickButton('Teams erstellen');

    expectText('Team 3');
    expectText('Elif');
    expectText('Finn');
  });

  it('creates manual teams for an 8-player game', () => {
    openSetup();
    clickButton('8 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn', 'Gina', 'Hannes']);
    clickButton('Weiter zu Einstellungen');
    clickButton('Teams erstellen');

    expectText('Team 4');
    expectText('Gina');
    expectText('Hannes');
  });

  it('rejects invalid player names before teams are created', () => {
    openSetup();
    clickButton('4 Spieler');
    fillPlayerNames(['Anna<script>', 'Ben', 'Clara', 'David']);
    clickButton('Weiter zu Einstellungen');

    expectText(
      'Spieler 1: Namen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    );
    expectNoText('Kategorien');
  });

  it('warns about duplicate player names without blocking setup', () => {
    openSetup();
    clickButton('4 Spieler');
    fillPlayerNames(['Anna', 'Anna', 'Clara', 'David']);

    expectText('Achtung: Der Name Anna kommt mehrfach vor.');

    clickButton('Weiter zu Einstellungen');

    expectText('Spieldauer');
  });

  it('swaps players when a player assigned to another slot is selected', () => {
    openSetupRules();
    clickButton('Teams erstellen');

    changeSelect('Team 2 Buddy 1', 'p1');

    expect(findSelect('Team 1 Buddy 1').value).toBe('p3');
    expect(findSelect('Team 2 Buddy 1').value).toBe('p1');

    clickButton('Spiel starten');

    expectText('Runde 1 von 6');
  });

  it('keeps all players selectable in team dropdowns', () => {
    openSetupRules();
    clickButton('Teams erstellen');

    const teamOneBuddyOne = findSelect('Team 1 Buddy 1');
    const teamTwoBuddyOne = findSelect('Team 2 Buddy 1');

    expect(teamOneBuddyOne.querySelector('option[value="p1"]')?.disabled).toBe(false);
    expect(teamTwoBuddyOne.querySelector('option[value="p1"]')?.disabled).toBe(false);
    expect(teamTwoBuddyOne.querySelector('option[value="p3"]')?.disabled).toBe(false);
  });

  it('rejects unsafe manual team names before starting the game', () => {
    openSetupRules();
    clickButton('Teams erstellen');

    changeInput('Name Team 1', '<script>');
    clickButton('Spiel starten');

    expectText(
      'Team 1: Teamnamen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    );
    expectNoText('Runde 1 von 6');
  });

  it('plays a 4-player bidding round through challenge resolution', () => {
    startFourPlayerGame();

    expectText('Einsatzrunde');
    expectActiveTableTeam('t1');
    expectButtonCount('Einsatz +1', 1);
    expect(findButton('Weitergeben').disabled).toBe(true);
    clickButton('Einsatz +1');
    expect(findButton('Weitergeben').disabled).toBe(false);
    clickButton('Einsatz +1');

    expectNoText('Sound-Platzhalter');
    expect(container.querySelector('.table-bid-display')?.textContent).toContain('Höchster Einsatz');
    expect(container.querySelector('.table-bid-display strong')?.textContent).toBe('3');
    expectActiveTableTeam('t1');
    clickButton('Weitergeben');
    expectActiveTableTeam('t2');
    clickButton('Passen');

    expectText('Ben muss 3 schaffen');
    expectText('Challenge');
    expectText('Tracker: 0 / Einsatz 3');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');

    expectText('Ergebnis-Check');
    expectText('Geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('3 / 3');
    clickButton('Ergebnis bestätigen');

    expectText('Team 1');
    expectText('1 Punkt');
    expectText('+1');
    expectText('Team 1 bekommt 1 Punkt.');
    expect(playedSoundSources.at(-1)).toContain('sounds/challenge-success.mp3');
    expectNoText('Sound-Platzhalter');
  });

  it('shows the rotating bidder and challenge buddy for each two-player team', () => {
    startFourPlayerGame();

    const teamOneSide = container.querySelector('.table-side-controls[data-team-id="t1"]');

    expect(teamOneSide?.textContent).toContain('Anna bietet');
    expect(teamOneSide?.textContent).toContain('Ben liefert');

    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expectText('Ben muss 2 schaffen');
    expectText('Anna hat für Team 1 geboten');

    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');
    clickButton('Nächste Runde');
    clickButton('Einsatzrunde starten');

    const nextTeamOneSide = container.querySelector('.table-side-controls[data-team-id="t1"]');

    expect(nextTeamOneSide?.textContent).toContain('Ben bietet');
    expect(nextTeamOneSide?.textContent).toContain('Anna liefert');
  });

  it('orients two-team challenge controls toward the tracking team', () => {
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expect(container.querySelector('.challenge-panel')?.getAttribute('data-facing-team-id')).toBe(
      't2',
    );

    clickButton('Startseite');
    startFourPlayerGame();
    clickButton('Passen');

    expect(container.querySelector('.challenge-panel')?.getAttribute('data-facing-team-id')).toBe(
      't1',
    );
  });

  it('does not create one-shot sounds while sounds are switched off', () => {
    startFourPlayerGame();
    clickButton('Sounds aus');
    const audioCountBeforeBid = createdAudioElements.length;

    clickButton('Einsatz +1');

    expect(createdAudioElements).toHaveLength(audioCountBeforeBid);
    expect(playedSoundSources.some((source) => source.includes('sounds/bid.mp3'))).toBe(false);

    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    const audioCountBeforeResult = createdAudioElements.length;

    clickButton('Ergebnis bestätigen');

    expect(createdAudioElements).toHaveLength(audioCountBeforeResult);
    expect(playedSoundSources.some((source) => source.includes('sounds/challenge-success.mp3'))).toBe(
      false,
    );
  });

  it('keeps short one-shot sounds alive after playback starts', async () => {
    startFourPlayerGame();
    clickButton('Einsatz +1');
    await flushAudioStart();

    const bidSound = createdAudioElements.find((audio) => audio.src.includes('sounds/bid.mp3'));

    expect(bidSound).toBeDefined();
    clickButton('Sounds aus');

    expect(bidSound?.pause).toHaveBeenCalledTimes(1);

    clickButton('Startseite');
    clickButton('Sounds an');
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');
    await flushAudioStart();

    const failSound = createdAudioElements.find((audio) =>
      audio.src.includes('sounds/challenge-fail.mp3'),
    );

    expect(failSound).toBeDefined();
    clickButton('Sounds aus');

    expect(failSound?.pause).toHaveBeenCalledTimes(1);
  });

  it('stops a running result sound when sounds are switched off', () => {
    vi.useFakeTimers();
    startFourPlayerGame();
    finishSuccessfulRound();

    const successSound = createdAudioElements.find((audio) =>
      audio.src.includes('sounds/challenge-success.mp3'),
    );

    expect(successSound).toBeDefined();

    clickButton('Sounds aus');

    expect(successSound?.pause).toHaveBeenCalledTimes(1);
    expect(successSound?.currentTime).toBe(0);
    expect(successSound?.volume).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(successSound?.volume).toBe(0);
  });

  it('does not start and stops challenge loop audio while sounds are switched off', () => {
    vi.useFakeTimers();
    startFourPlayerGame();
    clickButton('Sounds aus');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');

    expect(
      createdAudioElements.some((audio) => audio.src.includes('sounds/Measured_Breath.mp3')),
    ).toBe(false);

    clickButton('Startseite');
    clickButton('Sounds an');
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');

    const runningLoop = createdAudioElements.find((audio) =>
      audio.src.includes('sounds/Measured_Breath.mp3'),
    );

    expect(runningLoop).toBeDefined();
    clickButton('Sounds aus');

    expect(runningLoop?.pause).toHaveBeenCalledTimes(1);
    expect(runningLoop?.currentTime).toBe(0);
    expect(runningLoop?.volume).toBe(0);
  });

  it('plays the success sound quieter with a smooth volume envelope', () => {
    vi.useFakeTimers();
    startFourPlayerGame();

    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');

    const successSound = createdAudioElements.find((audio) =>
      audio.src.includes('sounds/challenge-success.mp3'),
    );

    expect(successSound).toBeDefined();
    expect(successSound?.volume).toBe(0);
    expect(successSound?.play).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(successSound?.volume).toBeGreaterThan(0.3);
    expect(successSound?.volume).toBeLessThan(0.4);

    act(() => {
      vi.advanceTimersByTime(760);
    });

    expect(successSound?.volume).toBeLessThan(0.2);

    act(() => {
      vi.advanceTimersByTime(320);
    });

    expect(successSound?.volume).toBe(0);
  });

  it('keeps count trackers locked until the challenge starts', () => {
    vi.useFakeTimers();
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expectText('Tracker: 0 / Einsatz 2');
    expect(findButton('+1').disabled).toBe(true);
    expect(findButton('-1').disabled).toBe(true);
    expect(findButton('Auswertung prüfen').disabled).toBe(true);

    clickButton('Challenge starten');

    const runningLoop = createdAudioElements.find((audio) =>
      audio.src.includes('sounds/Measured_Breath.mp3'),
    );

    expect(runningLoop).toBeDefined();
    expect(runningLoop?.loop).toBe(true);
    expect(runningLoop?.volume).toBe(0);
    expect(runningLoop?.play).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(runningLoop?.volume).toBeGreaterThan(0.35);
    expect(runningLoop?.volume).toBeLessThan(0.6);
    expect(findButton('+1').disabled).toBe(false);
    expect(container.querySelector('.challenge-panel[data-challenge-status="running"]')).not.toBeNull();
    expect(container.querySelector('.challenge-running-indicator')?.textContent).toContain('Challenge läuft');
    clickButton('+1');
    expectText('Tracker: 1 / Einsatz 2');

    act(() => {
      const reviewButton = [...container.querySelectorAll('button')].find((candidate) =>
        candidate.textContent?.includes('Auswertung'),
      );

      reviewButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(runningLoop?.pause).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(runningLoop?.pause).toHaveBeenCalledTimes(1);
    expect(runningLoop?.currentTime).toBe(0);
  });

  it('automatically suggests the result when the challenge timer ends', () => {
    vi.useFakeTimers();
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expectText('Timer: 30 Sekunden');
    clickButton('Challenge starten');

    const runningLoop = createdAudioElements.find((audio) =>
      audio.src.includes('sounds/Measured_Breath.mp3'),
    );

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(runningLoop?.volume).toBeGreaterThan(0.35);
    clickButton('+1');
    clickButton('+1');

    act(() => {
      vi.advanceTimersByTime(28_200);
    });

    expect(runningLoop?.volume).toBeLessThan(0.42);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expectText('Timer: 0 Sekunden');
    expect(runningLoop?.pause).toHaveBeenCalledTimes(1);
    expectText('Ergebnis-Check');
    expectText('Geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('2 / 2');
  });

  it('uses elapsed clock time when the challenge timer updates late', () => {
    vi.useFakeTimers();
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');

    vi.setSystemTime(Date.now() + 30_000);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expectText('Timer: 0 Sekunden');
    expectText('Ergebnis-Check');
  });

  it('allows manual correction before confirming the challenge result', () => {
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('Auswertung prüfen');

    expectText('Ergebnis-Check');
    expectText('Nicht geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('1 / 2');
    clickButton('+1');

    expectText('Geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('2 / 2');
    clickButton('Ergebnis bestätigen');

    expectText('Team 1 bekommt 1 Punkt.');
  });

  it('frames challenge review as a clear correction step before confirmation', () => {
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');

    expectText('Ergebnis-Check');
    expectNoText('Zählwert vor dem Bestätigen anpassen');
    expectText('Geschafft');
    expect(container.querySelector('.challenge-review__result')?.textContent).toContain(
      'Geschafft',
    );
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain(
      '2 / 2',
    );
    expect(container.querySelector('.challenge-review__stepper')).not.toBeNull();
    expect(container.querySelector('button.primary-action')?.textContent).toBe(
      'Geschafft bestätigen',
    );

    clickButton('-1');

    expectText('Nicht geschafft');
    expect(container.querySelector('.challenge-review[data-outcome="failure"]')).not.toBeNull();
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain(
      '1 / 2',
    );
    expect(container.querySelector('button.danger-action')?.textContent).toBe(
      'Nicht geschafft bestätigen',
    );
    clickButton('Ergebnis bestätigen');

    expectText('Team 2 bekommt 1 Punkt.');
  });

  it('explains the point result when the challenge fails', () => {
    startFourPlayerGame();
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');

    expectText('Team 2 bekommt 1 Punkt.');
    expect(playedSoundSources.at(-1)).toContain('sounds/challenge-fail.mp3');
    expectNoText('Sound-Platzhalter');
    expect(container.querySelector('.score-row[data-team-id="t1"]')?.getAttribute('data-round-outcome')).toBe(
      'missed',
    );
    expect(container.querySelector('.score-row[data-team-id="t2"]')?.getAttribute('data-round-outcome')).toBe(
      'scored',
    );
    expect(container.querySelector('.score-row[data-team-id="t1"]')?.classList.contains('has-missed-point')).toBe(
      true,
    );
    expect(container.querySelector('.score-row[data-team-id="t2"]')?.classList.contains('has-recent-point')).toBe(
      true,
    );
  });

  it('tracks duration challenges by elapsed seconds instead of answer count', () => {
    vi.useFakeTimers();
    const durationDeck: Question[] = [
      {
        id: 'duration-test-q1',
        text: 'Wie viele Sekunden kann dein Buddy einen Test-Hold halten?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'duration',
      },
    ];

    renderAppWithDeck(durationDeck);

    prepareFourPlayerRound();
    clickButton('Einsatzrunde starten');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expectText('Ben muss 2 Sekunden schaffen');
    expectText('Noch: 2 Sekunden');
    expectText('Gemessen: 0 Sekunden / Einsatz 2 Sekunden');
    expectNoText('Zeitlimit: 60 Sekunden');
    expectButtonCount('Auswertung prüfen', 0);
    clickButton('Challenge starten');
    expectButtonCount('Stoppen', 1);
    expectButtonCount('Auswertung prüfen', 0);

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expectText('Noch: 1 Sekunde');
    expectText('Gemessen: 1 Sekunde / Einsatz 2 Sekunden');

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expectButtonCount('Stoppen', 0);
    expectText('Gemessen: 2 Sekunden / Einsatz 2 Sekunden');
    expectText('Ergebnis-Check');
    expectText('Geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('2 / 2');
    expect(container.querySelector('.challenge-review[data-outcome="success"]')).not.toBeNull();
  });

  it('shows failed duration reviews with a failure style and clear confirmation action', () => {
    vi.useFakeTimers();
    const durationDeck: Question[] = [
      {
        id: 'duration-fail-test-q1',
        text: 'Wie viele Sekunden kann dein Buddy einen Test-Hold halten?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'duration',
      },
    ];

    renderAppWithDeck(durationDeck);

    prepareFourPlayerRound();
    clickButton('Einsatzrunde starten');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    clickButton('Stoppen');

    expectText('Ergebnis-Check');
    expectText('Nicht geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('1 / 2');
    expect(container.querySelector('.challenge-review[data-outcome="failure"]')).not.toBeNull();
    expect(container.querySelector('button.danger-action')?.textContent).toBe(
      'Nicht geschafft bestätigen',
    );
  });

  it('shows a generated posture image for forearm plank questions', () => {
    const durationDeck: Question[] = [
      {
        id: 'q-koerperlich-unterarmstuetz',
        text: 'Wie viele Sekunden kann dein Buddy einen Unterarmstütz halten?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'duration',
      },
    ];

    renderAppWithDeck(durationDeck);

    prepareFourPlayerRound();
    clickButton('Einsatzrunde starten');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expect(container.querySelector('[aria-label="Unterarmstütz Illustration"]')).not.toBeNull();
  });

  it('uses drawing-specific wording for drawing challenges', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    const drawingDeck: Question[] = [
      {
        id: 'drawing-test-q1',
        text: 'Wie viele Testbegriffe aus einer gezogenen Kategorie kann dein Buddy zeichnen?',
        category: 'spiele-kreativitaet',
        timeLimit: 60,
        type: 'drawing',
        drawingPrompt: 'category',
      },
    ];

    try {
      renderAppWithDeck(drawingDeck);

      prepareFourPlayerRound();
      clickButton('Einsatzrunde starten');
      clickButton('Einsatz +1');
      clickButton('Weitergeben');
      clickButton('Passen');

      expectText('Ben muss 2 Begriffe schaffen');
      expectText('Zeichen-Kategorie');
      expectText('Gegenstände');
      expectText('Zeichenzeit: 60 Sekunden');
      expectText('Erraten: 0 / Einsatz 2');
      expectButtonCount('Erraten +1', 1);
    } finally {
      randomSpy.mockRestore();
    }
  });

  it('uses streak-specific controls without a timer', () => {
    const streakDeck: Question[] = [
      {
        id: 'streak-test-q1',
        text: 'Wie oft trifft dein Buddy nacheinander?',
        category: 'koerperlich',
        timeLimit: 60,
        type: 'streak',
      },
    ];

    renderAppWithDeck(streakDeck);

    prepareFourPlayerRound();
    clickButton('Einsatzrunde starten');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');

    expectText('Ben muss 2 Treffer in Folge schaffen');
    expectText('Treffer in Folge: 0 / Einsatz 2');
    expectNoText('Timer:');
    expectNoText('Zeitlimit:');
    expectButtonCount('Challenge starten', 0);
    expectButtonCount('Treffer +1', 1);
    expectButtonCount('Verfehlt', 1);

    clickButton('Treffer +1');
    expectText('Treffer in Folge: 1 / Einsatz 2');
    expectButtonCount('Verfehlt', 1);
    clickButton('Treffer +1');
    expectText('Treffer in Folge: 2 / Einsatz 2');
    expectButtonCount('Verfehlt', 0);
    expectButtonCount('Einsatz geschafft', 1);
    clickButton('Einsatz geschafft');

    expectText('Ergebnis-Check');
    expectText('Geschafft');
    expect(container.querySelector('.challenge-review__score')?.textContent).toContain('2 / 2');
  });

  it('starts a new game without reloading the app', () => {
    startFourPlayerGame();
    finishSuccessfulRound();
    expectText('Team 1 bekommt 1 Punkt.');

    expectButtonCount('Startseite', 1);
    expectNoText('Neues Spiel');

    clickButton('Startseite');

    expectText('Wer kennt seinen Buddy am besten?');
    expectButtonCount('Spiel starten', 1);
    expectNoText('Team 1 bekommt 1 Punkt.');
    expectNoText('1 Punkt');

    startFourPlayerGame();
    expectActiveTableTeam('t1');
    expectText('Startwert');
  });

  it('summarizes failed challenge points as all teams except the challenge team', () => {
    startEightPlayerGame();

    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Passen');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');

    expectText('Alle Teams außer Team 1 bekommen 1 Punkt.');
    expectNoText('Team 2 und Team 3 und Team 4 bekommen je 1 Punkt.');
  });

  it('ends the game after the selected number of rounds', () => {
    startFourPlayerGame();

    for (let round = 1; round <= 6; round += 1) {
      finishSuccessfulRound();

      if (round < 6) {
        clickButton('Nächste Runde');
        clickButton('Einsatzrunde starten');
      }
    }

    expectText('Finale');
    expectText('Unentschieden');
    expectText('3 : 3');
    expect(container.querySelector('.finale-confetti')).toBeNull();
    expectNoText('Nächste Runde');
  });

  it('starts another game from the finale with the same players and teams', () => {
    startFourPlayerGame();

    for (let round = 1; round <= 6; round += 1) {
      finishSuccessfulRound();

      if (round < 6) {
        clickButton('Nächste Runde');
        clickButton('Einsatzrunde starten');
      }
    }

    expectText('Finale');
    expectButtonCount('Nochmal spielen', 1);

    clickButton('Nochmal spielen');

    expectText('Runde 1 von 6');
    expectText('Wie viele Testantworten kann dein Buddy nennen?');
    expectText('0:0');
    expectNoText('Spieleranzahl');

    clickButton('Einsatzrunde starten');

    const teamOneSide = container.querySelector('.table-side-controls[data-team-id="t1"]');

    expect(teamOneSide?.textContent).toContain('Anna bietet');
    expect(teamOneSide?.textContent).toContain('Ben liefert');
  });

  it('starts replay with unseen questions when enough remain in the current app session', () => {
    const replayDeck = Array.from({ length: 12 }, (_, index): Question => {
      const number = index + 1;

      return {
        id: `replay-q-${number}`,
        text: `Wie viele Replay-Testantworten ${number} kann dein Buddy nennen?`,
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      };
    });

    renderAppWithDeck(replayDeck);
    prepareFourPlayerRound();

    for (let round = 1; round <= 6; round += 1) {
      expectText(`Wie viele Replay-Testantworten ${round} kann dein Buddy nennen?`);
      clickButton('Einsatzrunde starten');
      finishSuccessfulRound();

      if (round < 6) {
        clickButton('Nächste Runde');
      }
    }

    clickButton('Nochmal spielen');

    expectText('Wie viele Replay-Testantworten 7 kann dein Buddy nennen?');
    expectNoText('Wie viele Replay-Testantworten 1 kann dein Buddy nennen?');
  });

  it('treats skipped prompts as seen when building the replay deck', () => {
    const replayDeck = Array.from({ length: 14 }, (_, index): Question => {
      const number = index + 1;

      return {
        id: `skip-replay-q-${number}`,
        text: `Wie viele Skip-Replay-Testantworten ${number} kann dein Buddy nennen?`,
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      };
    });

    renderAppWithDeck(replayDeck);
    prepareFourPlayerRound();
    expectText('Wie viele Skip-Replay-Testantworten 1 kann dein Buddy nennen?');

    clickButton('Frage überspringen');
    expectText('Wie viele Skip-Replay-Testantworten 2 kann dein Buddy nennen?');

    for (let round = 1; round <= 6; round += 1) {
      clickButton('Einsatzrunde starten');
      finishSuccessfulRound();

      if (round < 6) {
        clickButton('Nächste Runde');
      }
    }

    clickButton('Nochmal spielen');

    expectText('Wie viele Skip-Replay-Testantworten 8 kann dein Buddy nennen?');
    expectNoText('Wie viele Skip-Replay-Testantworten 1 kann dein Buddy nennen?');
  });

  it('makes the finale visually distinct and lets players adjust settings before replaying', () => {
    startFourPlayerGame();

    for (let round = 1; round <= 6; round += 1) {
      if (round % 2 === 1) {
        finishSuccessfulRound();
      } else {
        clickButton('Passen');
        clickButton('Challenge starten');
        clickButton('+1');
        clickButton('Auswertung prüfen');
        clickButton('Ergebnis bestätigen');
      }

      if (round < 6) {
        clickButton('Nächste Runde');
        clickButton('Einsatzrunde starten');
      }
    }

    const finaleScreen = container.querySelector('.finished-screen');
    const rankingRows = container.querySelectorAll('.finale-ranking-row');

    expect(finaleScreen).not.toBeNull();
    expect(finaleScreen?.querySelector('.finale-panel')).not.toBeNull();
    expect(finaleScreen?.querySelector('.finale-panel .finale-confetti')).not.toBeNull();
    expectText('Finale');
    expectText('Team 1 gewinnt');
    expectText('6 : 0');
    expectNoText('Runde 6 von 6');
    expectNoText('Score');
    expectNoText('Das lokale Partyspiel für mutige Einsätze und gute Buddy-Instinkte.');
    expectNoText('Team 1 bekommt 1 Punkt.');
    expect(rankingRows).toHaveLength(2);
    expect(rankingRows[0]?.textContent).toContain('1.');
    expect(rankingRows[0]?.textContent).toContain('Team 1');
    expect(rankingRows[0]?.textContent).toContain('6 Punkte');
    expect(rankingRows[1]?.textContent).toContain('2.');
    expect(rankingRows[1]?.textContent).toContain('Team 2');
    expect(rankingRows[1]?.textContent).toContain('0 Punkte');
    expectButtonCount('Nochmal spielen', 1);
    expectButtonCount('Einstellungen ändern', 1);
    expectButtonCount('Startseite', 1);
    expectNoText('Nächste Runde');

    clickButton('Einstellungen ändern');

    expectText('Spieldauer');
    expectText('Kategorien');
    expectNoText('Spieleranzahl');

    clickButton('8 Runden');
    clickButton('Teams erstellen');

    expectText('Teams erstellen');
    expectText('Anna');
    expectText('Ben');

    clickButton('Spiel starten');

    expectText('Runde 1 von 8');
    expectText('0:0');
  });

  it('uses the local question deck across rounds', () => {
    const controlledDeck: Question[] = [
      {
        id: 'test-q1',
        text: 'Wie viele Testbegriffe schafft Buddy A?',
        category: 'medien-popkultur',
        timeLimit: 30,
        type: 'count',
      },
      {
        id: 'test-q2',
        text: 'Wie viele Testbegriffe schafft Buddy B?',
        category: 'spiele-kreativitaet',
        timeLimit: 30,
        type: 'count',
      },
    ];

    act(() => {
      root.unmount();
    });
    container.remove();
    renderApp({ createDeck: () => controlledDeck });

    prepareFourPlayerRound();
    expectText('Wie viele Testbegriffe schafft Buddy A?');
    clickButton('Einsatzrunde starten');
    clickButton('Einsatz +1');
    clickButton('Weitergeben');
    clickButton('Passen');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');
    clickButton('Nächste Runde');

    expectText('Wie viele Testbegriffe schafft Buddy B?');
    expectNoText('Höchster Einsatz');
    clickButton('Einsatzrunde starten');
    expectText('Startwert');
    expect(container.querySelector('.table-bid-display strong')?.textContent).toBe('1');
  });
});
