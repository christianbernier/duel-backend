import { UUID } from '../models';

export class TurnController {
  private turn: 'A' | 'B';
  private readonly playerAUid: UUID;
  private readonly playerBUid: UUID;
  private readonly onTurnSet: () => void;

  constructor(playerAUid: UUID, playerBUid: UUID, onTurnSet?: () => void) {
    this.turn = 'A';
    this.playerAUid = playerAUid;
    this.playerBUid = playerBUid;
    this.onTurnSet = onTurnSet || (() => undefined);
  }

  public reset(): void {
    this.turn = 'A';
    this.onTurnSet();
  }

  public set(player: UUID | 'A' | 'B'): void {
    if (player === this.playerAUid || player === 'A') {
      this.turn = 'A';
      this.onTurnSet();
    } else if (player === this.playerBUid || player === 'B') {
      this.turn = 'B';
      this.onTurnSet();
    }
  }

  public toggle(): void {
    this.turn = this.turn === 'A' ? 'B' : 'A';
    this.onTurnSet();
  }

  public asLetter(): 'A' | 'B' {
    return this.turn;
  }

  public asUid(): UUID {
    return this.turn === 'A' ? this.playerAUid : this.playerBUid;
  }

  public isTurn(player: UUID | 'A' | 'B'): boolean {
    return this.asUid() === player || this.turn === player;
  }

  public confirmTrun(): (_: unknown, playerUid: UUID) => boolean {
    return (_: unknown, playerUid: UUID) => playerUid === this.asUid();
  }
}
