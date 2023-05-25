import {Age, GameState, Player, UUID} from "../models";
import {WarController} from "./war.controller";
import {ScienceTokenController} from "./science-token-controller";
import {CardDeckController} from "./card-deck.controller";
import {CardStageController} from "./card-stage.controller";

export interface IGameController {
  state: GameState;
  reset(): void;
  nextAge(): void;
}

export class GameController implements IGameController {
  private playerA: Player | null;
  private playerB: Player | null;
  private gameStarted: boolean;
  private age: Age | null;
  private readonly war: WarController;
  private readonly scienceTokens: ScienceTokenController;
  private readonly cards: CardDeckController;
  private readonly cardStage: CardStageController;

  public get playerCount(): number {
    let count = 0;
    if (this.playerA) {
      count++;
    }
    if (this.playerB) {
      count++;
    }
    return count;
  }

  public get nextPlayerAssignment(): 'A' | 'B' {
    return (this.playerA) ? 'B' : 'A';
  }

  public get state(): GameState {
    return {
      roomUid: this.roomUid,
      playerA: this.sanitizePlayer(this.playerA),
      playerB: this.sanitizePlayer(this.playerB),
      inProgress: this.gameStarted,
      cardStage: this.cardStage.sanitized,
      warStatus: this.war.status,
      scienceTokens: this.scienceTokens.board,
    };
  }

  public constructor(private roomUid: UUID) {
    this.playerA = null;
    this.playerB = null;
    this.gameStarted = false;
    this.age = null;
    this.war = new WarController();
    this.scienceTokens = new ScienceTokenController();
    this.cards = new CardDeckController();
    this.cardStage = new CardStageController(this.cards);
  }

  public playerJoined(player: Player): void {
    if (this.nextPlayerAssignment === 'A') {
      this.playerA = player;
    } else {
      this.playerB = player;
    }
  }

  public playerLeft(uid: UUID): void {
    if (this.playerA?.uid === uid) {
      this.playerA = null;
    } else if (this.playerB?.uid === uid) {
      this.playerB = null;
    }
  }

  public reset(): void {
    this.gameStarted = true;
    this.age = Age.AGE_1;
    this.war.reset();
    this.scienceTokens.reset();
    this.cards.reset(this.age);
    this.cardStage.set(this.age);
  }

  public nextAge(): void {

  }

  private sanitizePlayer(player: Player | null): Partial<Player> | null {
    if (player === null) return null;
    return {
      ...player,
      conn: undefined,
    };
  }

  private findPlayer(playerUid: UUID): Player | undefined {
    if (this.playerA?.uid === playerUid) {
      return this.playerA;
    } else if (this.playerB?.uid === playerUid) {
      return this.playerB;
    }

    return undefined;
  }
}
