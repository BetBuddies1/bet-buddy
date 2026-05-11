import { describe, expect, it } from 'vitest';
import {
  canPassBid,
  createBiddingState,
  endBidTurn,
  getEligiblePlayerCounts,
  passBid,
  raiseBid,
  resolveChallenge,
  validateManualTeams,
} from './gameLogic';
import type { Player, Question, Team } from './types';

const players: Player[] = [
  { id: 'p1', name: 'Anna' },
  { id: 'p2', name: 'Ben' },
  { id: 'p3', name: 'Clara' },
  { id: 'p4', name: 'David' },
  { id: 'p5', name: 'Elif' },
  { id: 'p6', name: 'Finn' },
];

const teams: Team[] = [
  { id: 't1', name: 'Team A', playerIds: ['p1', 'p2'], score: 0 },
  { id: 't2', name: 'Team B', playerIds: ['p3', 'p4'], score: 0 },
  { id: 't3', name: 'Team C', playerIds: ['p5', 'p6'], score: 0 },
];

const question: Question = {
  id: 'q1',
  text: 'Wie viele Hauptstädte kann dein Buddy nennen?',
  category: 'welt-orte',
  timeLimit: 30,
  type: 'count',
};

describe('gameLogic', () => {
  it('allows the standard player counts plus odd-player exception counts', () => {
    expect(getEligiblePlayerCounts()).toEqual([4, 5, 6, 7, 8]);
  });

  it('accepts manual teams when every player is assigned exactly once in pairs', () => {
    expect(validateManualTeams(players, teams)).toEqual({ ok: true });
  });

  it('accepts manual teams for 4 players', () => {
    expect(
      validateManualTeams(players.slice(0, 4), [
        { id: 't1', name: 'Team A', playerIds: ['p1', 'p2'], score: 0 },
        { id: 't2', name: 'Team B', playerIds: ['p3', 'p4'], score: 0 },
      ]),
    ).toEqual({ ok: true });
  });

  it('accepts manual teams with one three-player team for odd player counts', () => {
    expect(
      validateManualTeams(players.slice(0, 5), [
        { id: 't1', name: 'Team A', playerIds: ['p1', 'p2'], score: 0 },
        { id: 't2', name: 'Team B', playerIds: ['p3', 'p4', 'p5'], score: 0 },
      ]),
    ).toEqual({ ok: true });
  });

  it('accepts manual teams for 8 players', () => {
    const eightPlayers: Player[] = [
      ...players,
      { id: 'p7', name: 'Gina' },
      { id: 'p8', name: 'Hannes' },
    ];

    expect(
      validateManualTeams(eightPlayers, [
        { id: 't1', name: 'Team A', playerIds: ['p1', 'p2'], score: 0 },
        { id: 't2', name: 'Team B', playerIds: ['p3', 'p4'], score: 0 },
        { id: 't3', name: 'Team C', playerIds: ['p5', 'p6'], score: 0 },
        { id: 't4', name: 'Team D', playerIds: ['p7', 'p8'], score: 0 },
      ]),
    ).toEqual({ ok: true });
  });

  it('rejects manual teams with duplicate team ids', () => {
    const duplicatedTeamIds: Team[] = [
      { id: 't1', name: 'Team A', playerIds: ['p1', 'p2'], score: 0 },
      { id: 't1', name: 'Team B', playerIds: ['p3', 'p4'], score: 0 },
      { id: 't3', name: 'Team C', playerIds: ['p5', 'p6'], score: 0 },
    ];

    expect(validateManualTeams(players, duplicatedTeamIds)).toEqual({
      ok: false,
      error: 'Team-IDs müssen eindeutig sein.',
    });
  });

  it('rejects manual teams with duplicate players', () => {
    const duplicatedTeams: Team[] = [
      { id: 't1', name: 'Team A', playerIds: ['p1', 'p2'], score: 0 },
      { id: 't2', name: 'Team B', playerIds: ['p2', 'p3'], score: 0 },
      { id: 't3', name: 'Team C', playerIds: ['p4', 'p5'], score: 0 },
    ];

    expect(validateManualTeams(players, duplicatedTeams)).toEqual({
      ok: false,
      error: 'Jeder Spieler darf nur einem Team zugeordnet sein.',
    });
  });

  it('starts bidding with all teams active and a bid of one', () => {
    expect(createBiddingState(teams, question, 't2')).toEqual({
      activeTeamId: 't2',
      currentBid: 1,
      highestBidTeamId: null,
      passedTeamIds: [],
      status: 'bidding',
    });
  });

  it('raises the bid for the active team without ending the turn', () => {
    const bidding = createBiddingState(teams, question, 't1');

    expect(raiseBid(bidding, teams, 't1')).toEqual({
      activeTeamId: 't1',
      currentBid: 2,
      highestBidTeamId: 't1',
      passedTeamIds: [],
      status: 'bidding',
    });
  });

  it('lets the active team raise multiple times before handing over the turn', () => {
    const bidding = createBiddingState(teams, question, 't1');
    const firstRaise = raiseBid(bidding, teams, 't1');
    const secondRaise = raiseBid(firstRaise, teams, 't1');

    expect(endBidTurn(secondRaise, teams, 't1')).toEqual({
      activeTeamId: 't2',
      currentBid: 3,
      highestBidTeamId: 't1',
      passedTeamIds: [],
      status: 'bidding',
    });
  });

  it('requires the active team to raise before handing over the turn', () => {
    const bidding = createBiddingState(teams, question, 't1');
    const raised = raiseBid(bidding, teams, 't1');
    const handedOver = endBidTurn(raised, teams, 't1');

    expect(() => endBidTurn(bidding, teams, 't1')).toThrow(
      'Erst erhöhen, dann weitergeben.',
    );
    expect(() => endBidTurn(handedOver, teams, 't2')).toThrow(
      'Erst erhöhen, dann weitergeben.',
    );
  });

  it('prevents the current highest bidder from passing', () => {
    const bidding = createBiddingState(teams, question, 't1');
    const raised = raiseBid(bidding, teams, 't1');

    expect(canPassBid(bidding, 't1')).toBe(true);
    expect(canPassBid(raised, 't1')).toBe(false);
    expect(() => passBid(raised, teams, 't1')).toThrow(
      'Das Team mit dem höchsten Einsatz kann nicht passen.',
    );
  });

  it('supports a 4-player bidding round with two teams', () => {
    const twoTeams = teams.slice(0, 2);
    const bidding = createBiddingState(twoTeams, question, 't1');
    const raised = raiseBid(bidding, twoTeams, 't1');
    const handedOver = endBidTurn(raised, twoTeams, 't1');

    expect(passBid(handedOver, twoTeams, 't2')).toEqual({
      activeTeamId: null,
      challengeTeamId: 't1',
      currentBid: 2,
      highestBidTeamId: 't1',
      passedTeamIds: ['t2'],
      status: 'challenge',
    });
  });

  it('supports an 8-player bidding round with four teams', () => {
    const fourTeams: Team[] = [
      ...teams,
      { id: 't4', name: 'Team D', playerIds: ['p7', 'p8'], score: 0 },
    ];
    const bidding = createBiddingState(fourTeams, question, 't1');
    const raised = raiseBid(bidding, fourTeams, 't1');
    const handedOver = endBidTurn(raised, fourTeams, 't1');
    const firstPass = passBid(handedOver, fourTeams, 't2');
    const secondPass = passBid(firstPass, fourTeams, 't3');

    expect(secondPass).toEqual({
      activeTeamId: 't4',
      currentBid: 2,
      highestBidTeamId: 't1',
      passedTeamIds: ['t2', 't3'],
      status: 'bidding',
    });

    expect(passBid(secondPass, fourTeams, 't4')).toEqual({
      activeTeamId: null,
      challengeTeamId: 't1',
      currentBid: 2,
      highestBidTeamId: 't1',
      passedTeamIds: ['t2', 't3', 't4'],
      status: 'challenge',
    });
  });

  it('rejects bids from a team that is not active', () => {
    const bidding = createBiddingState(teams, question, 't1');

    expect(() => raiseBid(bidding, teams, 't2')).toThrow(
      'Nur das aktive Team darf bieten.',
    );
  });

  it('keeps bidding open while more than one team has not passed', () => {
    const bidding = createBiddingState(teams, question, 't1');
    const raised = raiseBid(bidding, teams, 't1');
    const handedOver = endBidTurn(raised, teams, 't1');

    expect(passBid(handedOver, teams, 't2')).toEqual({
      activeTeamId: 't3',
      currentBid: 2,
      highestBidTeamId: 't1',
      passedTeamIds: ['t2'],
      status: 'bidding',
    });
  });

  it('moves to challenge when only one team remains after passing', () => {
    const bidding = createBiddingState(teams, question, 't1');
    const raised = raiseBid(bidding, teams, 't1');
    const handedOver = endBidTurn(raised, teams, 't1');
    const firstPass = passBid(handedOver, teams, 't2');

    expect(passBid(firstPass, teams, 't3')).toEqual({
      activeTeamId: null,
      challengeTeamId: 't1',
      currentBid: 2,
      highestBidTeamId: 't1',
      passedTeamIds: ['t2', 't3'],
      status: 'challenge',
    });
  });

  it('awards the point to the challenge team on success', () => {
    expect(resolveChallenge(teams, 't1', 5, 5)).toEqual(['t1']);
  });

  it('awards one point to every other team on failure', () => {
    expect(resolveChallenge(teams, 't1', 4, 5)).toEqual(['t2', 't3']);
  });
});
