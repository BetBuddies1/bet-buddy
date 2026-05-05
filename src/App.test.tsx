import { act, type ComponentProps } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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

function startFourPlayerGame() {
  clickButton('4 Spieler');
  fillPlayerNames(['Anna', 'Ben', 'Clara', 'David']);
  clickButton('Teams setzen');
  clickButton('Spiel starten');
}

function finishSuccessfulRound() {
  clickButton('Ziel +1');
  clickButton('Passen');
  clickButton('Geschafft');
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
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('creates editable manual teams for a 4-player game', () => {
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
    clickButton('8 Runden');
    startFourPlayerGame();

    expectText('Runde 1 von 8');
  });

  it('creates manual teams for a 6-player game', () => {
    clickButton('6 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn']);
    clickButton('Teams setzen');

    expectText('Team 3');
    expectText('Elif');
    expectText('Finn');
  });

  it('creates manual teams for an 8-player game', () => {
    clickButton('8 Spieler');
    fillPlayerNames(['Anna', 'Ben', 'Clara', 'David', 'Elif', 'Finn', 'Gina', 'Hannes']);
    clickButton('Teams setzen');

    expectText('Team 4');
    expectText('Gina');
    expectText('Hannes');
  });

  it('rejects invalid player names before teams are created', () => {
    clickButton('4 Spieler');
    fillPlayerNames(['Anna<script>', 'Ben', 'Clara', 'David']);
    clickButton('Teams setzen');

    expectText(
      'Spieler 1: Namen dürfen nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Unterstriche enthalten.',
    );
  });

  it('rejects duplicate player assignments when teams are manually changed', () => {
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
    clickButton('Geschafft');

    expectText('Team 1');
    expectText('1 Punkt');
    expectText('Team 1 bekommt 1 Punkt.');
  });

  it('explains the point result when the challenge fails', () => {
    startFourPlayerGame();
    clickButton('Ziel +1');
    clickButton('Passen');
    clickButton('Nicht geschafft');

    expectText('Team 2 bekommt 1 Punkt.');
  });

  it('starts a new game without reloading the app', () => {
    startFourPlayerGame();
    finishSuccessfulRound();
    expectText('Team 1 bekommt 1 Punkt.');

    clickButton('Neues Spiel');

    expectText('Spiel vorbereiten');
    expectButtonCount('4 Spieler', 1);
    expectNoText('Team 1 bekommt 1 Punkt.');
    expectNoText('1 Punkt');

    startFourPlayerGame();
    expectText('Team 1 ist am Zug');
    expectText('0 Punkte');
  });

  it('ends the game after the selected number of rounds', () => {
    startFourPlayerGame();

    for (let round = 1; round <= 6; round += 1) {
      finishSuccessfulRound();

      if (round < 6) {
        clickButton('Nächste Runde');
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

    startFourPlayerGame();
    expectText('Wie viele Testbegriffe schafft Buddy A?');
    clickButton('Ziel +1');
    clickButton('Passen');
    clickButton('Geschafft');
    clickButton('Nächste Runde');

    expectText('Wie viele Testbegriffe schafft Buddy B?');
    expectText('Aktuelles Ziel: 2');
  });
});
