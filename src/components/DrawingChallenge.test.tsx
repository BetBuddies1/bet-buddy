import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { createDrawingPromptDeck } from '../game/drawingPrompts';
import { DrawingChallenge } from './DrawingChallenge';

vi.mock('../game/drawingPrompts', () => ({ createDrawingPromptDeck: vi.fn(() => ['Schildkröte', 'Pinguin']) }));

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('DrawingChallenge', () => {
  let container: HTMLDivElement;
  let root: Root;
  let props: ComponentProps<typeof DrawingChallenge>;

  function render() { act(() => root.render(<DrawingChallenge {...props} />)); }

  function click(label: string) {
    const button = [...container.querySelectorAll('button')].find((item) => item.textContent === label);
    expect(button, `Expected button: ${label}`).toBeDefined();
    act(() => button!.click());
  }

  function startDrawing() {
    click('Begriff anzeigen');
    click('Verdecken & Zeichnen starten');
    props = { ...props, challengeState: { ...props.challengeState, status: 'running', startedAtMs: 123 } };
    render();
  }

  beforeEach(() => {
    vi.mocked(createDrawingPromptDeck).mockReturnValue(['Schildkröte', 'Pinguin']);
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
    props = {
      question: { id: 'category', category: 'spiele-kreativitaet', text: 'Zeichnen', type: 'drawing', drawingPrompt: 'category', timeLimit: 60 },
      challengeState: { status: 'ready', count: 0, secondsLeft: 60, totalSeconds: 60, startedAtMs: null, drawingCategory: 'Tiere' },
      challengeTeam: { id: 't1', name: 'Team 1', playerIds: ['anna', 'ben'], score: 0 },
      challengeTeamRole: { bidder: { id: 'anna', name: 'Anna' }, challengePlayer: { id: 'ben', name: 'Ben' } },
      judgingTeam: { id: 't2', name: 'Team 2', playerIds: [], score: 0 },
      facingClass: 'faces-home', currentBid: 2, wasSuccessful: false,
      onStart: vi.fn(), onIncrease: vi.fn(), onDecrease: vi.fn(), onReview: vi.fn(), onConfirm: vi.fn(),
    };
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it('keeps the secret out of the DOM until the drawer explicitly reveals it and hides it before starting time', () => {
    render();
    expect(container.textContent).toContain('Ben zeichnet · Anna rät');
    expect(container.textContent).toContain('Team 2 prüft mit');
    expect(container.textContent).toContain('Anna schaut weg');
    expect(container.textContent).not.toContain('Schildkröte');
    expect(container.querySelector('svg')).toBeNull();
    click('Begriff anzeigen');
    expect(container.textContent).toContain('Schildkröte');
    expect(props.onStart).not.toHaveBeenCalled();
    click('Verdecken & Zeichnen starten');
    expect(props.onStart).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain('Schildkröte');
    expect(container.querySelector('svg')?.getAttribute('aria-disabled')).toBe('true');
  });

  it('increments only a guessed word and uses a fresh hidden prompt without restarting the timer', () => {
    render();
    startDrawing();
    click('Erraten +1');
    expect(props.onIncrease).toHaveBeenCalledTimes(1);
    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).not.toContain('Pinguin');
    expect(container.textContent).toContain('Die Zeit läuft weiter');
    click('Begriff anzeigen');
    expect(container.textContent).toContain('Pinguin');
    click('Verdecken & weiterzeichnen');
    expect(props.onStart).toHaveBeenCalledTimes(1);
    expect(container.querySelectorAll('path')).toHaveLength(0);
    expect(container.textContent).not.toContain('Pinguin');
    click('Weiter ohne Treffer');
    expect(props.onIncrease).toHaveBeenCalledTimes(1);
    expect(props.onReview).toHaveBeenCalledTimes(1);
    props = { ...props, challengeState: { ...props.challengeState, status: 'review', count: 1 } };
    render();
    expect(container.textContent).toContain('Alle Begriffe gespielt');
  });

  it.each(['hidden', 'revealed', 'drawing'])('hides secrets and locks the board on timeout in the %s phase', (phase) => {
    render();
    startDrawing();
    if (phase !== 'drawing') click('Weiter ohne Treffer');
    if (phase === 'revealed') click('Begriff anzeigen');
    props = { ...props, challengeState: { ...props.challengeState, status: 'review', secondsLeft: 0 } };
    render();
    expect(container.querySelector('svg')).toBeNull();
    expect(container.textContent).not.toContain('Schildkröte');
    expect(container.textContent).not.toContain('Pinguin');
    expect(container.textContent).not.toContain('Begriff anzeigen');
    expect(container.textContent).toContain('Ergebnis-Check');
    expect(container.textContent).toContain('Nicht geschafft');
    click('Erraten +1');
    expect(props.onIncrease).toHaveBeenCalledTimes(1);
    props = { ...props, wasSuccessful: true, challengeState: { ...props.challengeState, count: 2 } };
    render();
    click('−1');
    expect(props.onDecrease).toHaveBeenCalledTimes(1);
    click('Geschafft bestätigen');
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('uses the opposite orientation for the drawing team and renders fixed logos without an unrelated category', () => {
    props = {
      ...props, facingClass: 'faces-opponent',
      question: { ...props.question, id: 'logos', drawingPrompt: undefined },
      challengeState: { ...props.challengeState, drawingCategory: undefined },
    };
    render();
    expect(container.querySelector('.drawing-challenge.faces-opponent')).not.toBeNull();
    expect(container.textContent).toContain('Markenlogos');
    expect(container.textContent).toContain('Logos ohne Markennamen');
  });

  it('offers a controlled exit instead of starting an empty prompt deck', () => {
    vi.mocked(createDrawingPromptDeck).mockReturnValue([]);
    render();
    expect(container.textContent).toContain('Keine Zeichenbegriffe verfügbar');
    expect(container.textContent).not.toContain('Begriff anzeigen');
    click('Zur Auswertung');
    expect(props.onReview).toHaveBeenCalledTimes(1);
    expect(props.onStart).not.toHaveBeenCalled();
  });
});
