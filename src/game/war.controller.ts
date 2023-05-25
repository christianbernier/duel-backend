export class WarController {
  private _status: number | "A_VICTORY" | "B_VICTORY";

  public get status(): number | "A_VICTORY" | "B_VICTORY" {
    return this._status;
  }

  public constructor() {
    this._status = 0;
  }

  public reset() {
    this._status = 0;
  }
}
