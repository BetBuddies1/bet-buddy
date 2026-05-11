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
  | 'medien-popkultur'
  | 'woerter-namen'
  | 'essen-trinken'
  | 'welt-orte'
  | 'natur-wissen'
  | 'sport-freizeit'
  | 'beruf-gesellschaft'
  | 'zuhause-alltag'
  | 'marken-technik'
  | 'geschichte-kultur'
  | 'spiele-kreativitaet'
  | 'koerperlich';

export type Question = {
  id: string;
  text: string;
  category: CategoryId;
  timeLimit: number;
  type: 'count' | 'duration' | 'drawing' | 'streak';
  isSpecial?: boolean;
  drawingPrompt?: 'category';
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
