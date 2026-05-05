export type Player = {
  id: string;
  name: string;
};

export type Team = {
  id: string;
  name: string;
  playerIds: string[];
  score: number;
};

export type CategoryId =
  | 'allgemeinwissen'
  | 'geographie'
  | 'kreativ'
  | 'koerperlich'
  | 'essen-trinken'
  | 'geschichte';

export type Question = {
  id: string;
  text: string;
  category: CategoryId;
  timeLimit: number;
  type: 'count';
  minBid: number;
};

export type BiddingState =
  | {
      status: 'bidding';
      activeTeamId: string;
      currentBid: number;
      highestBidTeamId: string | null;
      passedTeamIds: string[];
    }
  | {
      status: 'challenge';
      activeTeamId: null;
      challengeTeamId: string;
      currentBid: number;
      highestBidTeamId: string;
      passedTeamIds: string[];
    };

export type ValidationResult = { ok: true } | { ok: false; error: string };
