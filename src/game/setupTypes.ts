export type SetupStep = 'players' | 'rules';

export type TeamDraft = {
  id: string;
  name: string;
  playerIds: string[];
};
