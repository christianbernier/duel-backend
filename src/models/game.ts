import { ScienceProgressToken } from './science';
import { CardStage } from './card';
import { Player } from './player';
import { UUID } from './uuid';

export type GameState = {
  roomUid: UUID;
  inProgress: boolean;
  playerA: Partial<Player> | null;
  playerB: Partial<Player> | null;
  cardStage: CardStage;
  warStatus: number | 'A_VICTORY' | 'B_VICTORY';
  scienceTokens: (ScienceProgressToken | null)[];
};
