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
}
