import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import type { Question } from './game/types';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const defaultTestDeck: Question[] = [
  {
    id: 'default-test-q1',
    text: 'Wie viele Testantworten kann dein Buddy nennen?',
    category: 'allgemeinwissen',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
  },
  {
    id: 'default-test-q2',
    text: 'Wie viele weitere Testantworten kann dein Buddy nennen?',
    category: 'kreativ',
    timeLimit: 30,
    type: 'count',
    minBid: 1,
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

function clickButton(label: string) {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label,
  );

  if (!button) {
    throw new Error(`Button nicht gefunden: ${label}`);
  }

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
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

function expectButtonSelected(label: string, expectedSelected: boolean) {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === label,
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
    (candidate) => candidate.textContent === label,
  );

  expect(matchingButtons).toHaveLength(expectedCount);
}

function fillPlayerNames(names: string[]) {
  names.forEach((name, index) => {
    changeInput(`Spieler ${index + 1}`, name);
  });
}

function openSetup() {
  clickButton('Spiel vorbereiten');
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
  clickButton('Teams setzen');
  clickButton('Spiel starten');
}

function startFourPlayerGame() {
  prepareFourPlayerRound();
  clickButton('Bietrunde starten');
}

function finishSuccessfulRound() {
  clickButton('Ziel +1');
  clickButton('Passen');
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
    renderApp();
  });

  afterEach(() => {
    vi.useRealTimers();
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('starts with a focused welcome screen before setup begins', () => {
    expectText('Willkommen bei Bet Buddy');
    expectButtonCount('Spiel vorbereiten', 1);
    expectNoText('Spieleranzahl');

    openSetup();

    expectText('Spieleranzahl');
  });

  it('shows the question as its own screen before the bidding round starts', () => {
    prepareFourPlayerRound();

    expectText('Wie viele Testantworten kann dein Buddy nennen?');
    expectText('Bietrunde starten');
    expectNoText('Aktuelles Ziel');
    expectNoText('Punktestand');

    clickButton('Bietrunde starten');

    expectText('Bietrunde');
    expectText('Aktuelles Ziel: 1');
  });

  it('uses a table mode layout for two-team bidding rounds', () => {
    startFourPlayerGame();

    expect(container.querySelector('.table-mode')).not.toBeNull();
    expect(container.querySelector('.table-team-panel.is-opponent')).not.toBeNull();
    expect(container.querySelector('.table-team-panel.is-active')).not.toBeNull();
  });

  it('creates editable manual teams for a 4-player game', () => {
    openSetup();
    clickButton('4 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David']);
    clickButton('Teams setzen');

    expectText('Teams manuell setzen');
    expectText('Team 1');
    expectText('Anna');
    expectText('David');
    expectText('Spiel starten');
  });

  it('lets players choose the game scope in rounds', () => {
    openSetup();
    clickButton('8 Runden');
    startFourPlayerGame();

    expectText('Runde 1 von 8');
  });

  it('lets players filter the question deck by category', () => {
    openSetup();

    expectText('Kategorien');
    expectButtonSelected('Allgemeinwissen', true);
    expectButtonSelected('Kreativ', true);

    clickButton('Allgemeinwissen');
    expectButtonSelected('Allgemeinwissen', false);

    clickButton('4 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David']);
    clickButton('Teams setzen');
    clickButton('Spiel starten');

    expectText('Wie viele weitere Testantworten kann dein Buddy nennen?');
    expectText('Kategorie: Kreativ');
  });

  it('keeps at least one question category active', () => {
    openSetup();

    clickButton('Allgemeinwissen');
    clickButton('Kreativ');
    clickButton('Geographie');
    clickButton('Körperlich');
    clickButton('Essen & Trinken');
    clickButton('Geschichte');

    expectButtonSelected('Geschichte', true);
    expectText('Mindestens eine Kategorie muss aktiv bleiben.');
  });

  it('creates manual teams for a 6-player game', () => {
    openSetup();
    clickButton('6 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn']);
    clickButton('Teams setzen');

    expectText('Team 3');
    expectText('Elif');
    expectText('Finn');
  });

  it('creates manual teams for an 8-player game', () => {
    openSetup();
    clickButton('8 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn', 'Gina', 'Hannes']);
    clickButton('Teams setzen');

    expectText('Team 4');
    expectText('Gina');
    expectText('Hannes');
  });

  it('rejects invalid player names before teams are created', () => {
    openSetup();
    clickButton('4 Spieler');
    fillPlayerNames(['Anna<script>', 'Ben', 'Clara', 'David']);
    clickButton('Teams setzen');

    expectText(
      'Spieler 1: Namen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    );
  });

  it('rejects duplicate player assignments when teams are manually changed', () => {
    openSetup();
    clickButton('4 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David']);
    clickButton('Teams setzen');
    changeSelect('Team 2 Buddy 1', 'p1');
    clickButton('Spiel starten');

    expectText('Jeder Spieler darf nur einem Team zugeordnet sein.');
  });

  it('plays a 4-player bidding round through challenge resolution', () => {
    startFourPlayerGame();

    expectText('Bietrunde');
    expectText('Team 1 ist am Zug');
    expectButtonCount('Ziel +1', 1);
    clickButton('Ziel +1');

    expectText('Aktuelles Ziel: 2');
    expectText('Team 2 ist am Zug');
    clickButton('Passen');

    expectText('Team 1 muss 2 schaffen');
    expectText('Challenge');
    expectText('Tracker: 0 / Ziel 2');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');

    expectText('Vorschlag: Geschafft');
    expectText('Gezählt: 2 / Ziel 2');
    clickButton('Ergebnis bestätigen');

    expectText('Team 1');
    expectText('1 Punkt');
    expectText('Team 1 bekommt 1 Punkt.');
  });

  it('automatically suggests the result when the challenge timer ends', () => {
    vi.useFakeTimers();
    startFourPlayerGame();
    clickButton('Ziel +1');
    clickButton('Passen');

    expectText('Timer: 30 Sekunden');
    clickButton('Challenge starten');
    clickButton('+1');
    clickButton('+1');

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expectText('Timer: 0 Sekunden');
    expectText('Vorschlag: Geschafft');
  });

  it('allows manual correction before confirming the challenge result', () => {
    startFourPlayerGame();
    clickButton('Ziel +1');
    clickButton('Passen');
    clickButton('+1');
    clickButton('Auswertung prüfen');

    expectText('Vorschlag: Nicht geschafft');
    clickButton('+1');

    expectText('Vorschlag: Geschafft');
    clickButton('Ergebnis bestätigen');

    expectText('Team 1 bekommt 1 Punkt.');
  });

  it('explains the point result when the challenge fails', () => {
    startFourPlayerGame();
    clickButton('Ziel +1');
    clickButton('Passen');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');

    expectText('Team 2 bekommt 1 Punkt.');
  });

  it('starts a new game without reloading the app', () => {
    startFourPlayerGame();
    finishSuccessfulRound();
    expectText('Team 1 bekommt 1 Punkt.');

    clickButton('Neues Spiel');

    expectText('Willkommen bei Bet Buddy');
    expectButtonCount('Spiel vorbereiten', 1);
    expectNoText('Team 1 bekommt 1 Punkt.');
    expectNoText('1 Punkt');

    startFourPlayerGame();
    expectText('Team 1 ist am Zug');
    expectText('Aktuelles Ziel: 1');
  });

  it('ends the game after the selected number of rounds', () => {
    startFourPlayerGame();

    for (let round = 1; round <= 6; round += 1) {
      finishSuccessfulRound();

      if (round < 6) {
        clickButton('Nächste Runde');
        clickButton('Bietrunde starten');
      }
    }

    expectText('Spiel beendet');
    expectText('Unentschieden zwischen Team 1 und Team 2 mit 3 Punkten.');
    expectNoText('Nächste Runde');
  });

  it('uses the local question deck across rounds', () => {
    const controlledDeck: Question[] = [
      {
        id: 'test-q1',
        text: 'Wie viele Testbegriffe schafft Buddy A?',
        category: 'allgemeinwissen',
        timeLimit: 30,
        type: 'count',
        minBid: 1,
      },
      {
        id: 'test-q2',
        text: 'Wie viele Testbegriffe schafft Buddy B?',
        category: 'kreativ',
        timeLimit: 30,
        type: 'count',
        minBid: 2,
      },
    ];

    act(() => {
      root.unmount();
    });
    container.remove();
    renderApp({ createDeck: () => controlledDeck });

    prepareFourPlayerRound();
    expectText('Wie viele Testbegriffe schafft Buddy A?');
    clickButton('Bietrunde starten');
    clickButton('Ziel +1');
    clickButton('Passen');
    clickButton('+1');
    clickButton('+1');
    clickButton('Auswertung prüfen');
    clickButton('Ergebnis bestätigen');
    clickButton('Nächste Runde');

    expectText('Wie viele Testbegriffe schafft Buddy B?');
    expectNoText('Aktuelles Ziel: 2');
    clickButton('Bietrunde starten');
    expectText('Aktuelles Ziel: 2');
  });
});
