import { ScienceProgressToken } from "../models";

export class ScienceTokenController {
  private allTokens: ScienceProgressToken[];
  private onBoard: (ScienceProgressToken | null)[];

  public get supplyCount(): number {
    return this.allTokens.length;
  }

  public get board(): (ScienceProgressToken | null)[] {
    return this.onBoard;
  }

  constructor() {
    this.allTokens = [];
    this.onBoard = [];
  }

  public reset() {
    this.allTokens = Object.keys(
      ScienceProgressToken
    ) as ScienceProgressToken[];
    this.onBoard = [
      this.nextToken(),
      this.nextToken(),
      this.nextToken(),
      this.nextToken(),
      this.nextToken(),
    ];
  }

  public getToken(index: number): ScienceProgressToken | null {
    if (index < 0 || index > this.onBoard.length) {
      throw new Error("Cannot get a token that does not exist.");
    }

    return this.onBoard[index];
  }

  private nextToken(): ScienceProgressToken {
    if (this.supplyCount === 0) {
      throw new Error("No more tokens in the supply.");
    }

    const index = Math.floor(Math.random() * this.supplyCount);
    return this.allTokens.splice(index, 1)[0];
  }
}
