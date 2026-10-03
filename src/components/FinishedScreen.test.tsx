import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Team } from '../game/types';
import { FinishedScreen } from './FinishedScreen';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('finale standings', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it.each([
    {
      name: 'a sole winner in an unsorted field',
      scores: [2, 6, 4],
      teamOrder: ['t2', 't3', 't1'],
      places: ['1.', '2.', '3.'],
      highlighted: ['t2'],
      heading: 'Team 2 gewinnt',
      confetti: true,
    },
    {
      name: 'two teams tied at 3:3',
      scores: [3, 3],
      teamOrder: ['t1', 't2'],
      places: ['1.', '1.'],
      highlighted: ['t1', 't2'],
      heading: 'Unentschieden',
      confetti: false,
    },
    {
      name: 'two leaders followed by third place',
      scores: [2, 5, 5],
      teamOrder: ['t2', 't3', 't1'],
      places: ['1.', '1.', '3.'],
      highlighted: ['t2', 't3'],
      heading: 'Unentschieden',
      confetti: false,
    },
    {
      name: 'a tie for second behind a sole winner',
      scores: [2, 4, 6, 4],
      teamOrder: ['t3', 't2', 't4', 't1'],
      places: ['1.', '2.', '2.', '4.'],
      highlighted: ['t3'],
      heading: 'Team 3 gewinnt',
      confetti: true,
    },
    {
      name: 'all four teams tied',
      scores: [3, 3, 3, 3],
      teamOrder: ['t1', 't2', 't3', 't4'],
      places: ['1.', '1.', '1.', '1.'],
      highlighted: ['t1', 't2', 't3', 't4'],
      heading: 'Unentschieden',
      confetti: false,
    },
    {
      name: 'a scoreless tie',
      scores: [0, 0],
      teamOrder: ['t1', 't2'],
      places: ['1.', '1.'],
      highlighted: ['t1', 't2'],
      heading: 'Unentschieden',
      confetti: false,
    },
  ])('shows consistent results for $name', ({ scores, teamOrder, places, highlighted, heading, confetti }) => {
    const teams: Team[] = scores.map((score, index) => ({
      id: `t${index + 1}`,
      name: `Team ${index + 1}`,
      playerIds: [`p${index + 1}`],
      score,
    }));
    const players = teams.map((team, index) => ({
      id: team.playerIds[0],
      name: `Spieler ${index + 1}`,
    }));
    act(() => {
      root.render(
        <FinishedScreen
          teams={teams}
          players={players}
          onEditReplaySettings={() => {}}
          onReplayGame={() => {}}
          onResetGame={() => {}}
        />,
      );
    });
    const rows = [...container.querySelectorAll('.finale-ranking-row')];

    expect(container.querySelector('#finished-title')?.textContent).toBe(heading);
    expect(rows.map((row) => row.getAttribute('data-team-id'))).toEqual(teamOrder);
    expect(rows.map((row) => row.querySelector('.finale-rank-place')?.textContent)).toEqual(places);
    expect(
      rows
        .filter((row) => row.classList.contains('is-winner'))
        .map((row) => row.getAttribute('data-team-id')),
    ).toEqual(highlighted);
    expect(container.querySelector('.finale-confetti') !== null).toBe(confetti);
    expect(teams.map((team) => team.score)).toEqual(scores);
  });
});
