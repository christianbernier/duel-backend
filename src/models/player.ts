import { WebSocket } from 'ws';
import { UUID } from './uuid';
import { ScienceProgressToken } from './science';
import { Card } from './card';
import { Wonder } from './wonder';

export type Player = {
  uid: UUID;
  conn: WebSocket;
  name: string;
  player: 'A' | 'B';
  cards: Card[];
  wonders: Wonder[];
  coins: number;
  scienceTokens: ScienceProgressToken[];
  warLootingStatus: 0 | 2 | 5;
};
