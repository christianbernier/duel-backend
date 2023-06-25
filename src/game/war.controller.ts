export class WarController {
  private _status: number | 'A_VICTORY' | 'B_VICTORY';

  public get status(): number | 'A_VICTORY' | 'B_VICTORY' {
    return this._status;
  }

  public constructor() {
    this._status = 0;
  }

  public reset() {
    this._status = 0;
  }

  public updateStatus(change: number): void {
    if (this._status === 'A_VICTORY' || this._status === 'B_VICTORY') return;

    this._status += change;

    if (this._status > 8) {
      this._status = 'A_VICTORY';
    } else if (this._status < -8) {
      this._status = 'B_VICTORY';
    }
  }

  public getVictoryPointsForPlayer(player: 'A' | 'B'): number {
    if (this._status === 'A_VICTORY' || this._status === 'B_VICTORY') return 0;

    if (player === 'A') {
      if (this._status >= 6) {
        return 10;
      } else if (this._status >= 3) {
        return 5;
      } else if (this._status >= 1) {
        return 2;
      }
    } else if (player === 'B') {
      if (this._status <= -6) {
        return 10;
      } else if (this._status <= -3) {
        return 5;
      } else if (this._status <= -1) {
        return 2;
      }
    }

    return 0;
  }
}
