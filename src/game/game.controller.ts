import {
  Age,
  Card,
  CardType,
  GameState,
  Player,
  Resource,
  UUID,
} from '../models';
import { WarController } from './war.controller';
import { ScienceTokenController } from './science-token-controller';
import { CardDeckController } from './card-deck.controller';
import { CardStageController } from './card-stage.controller';
import { PlayerController } from './player.controller';

export interface IGameController {
  state: GameState;
  reset(): void;
  nextAge(): void;
}

export class GameController implements IGameController {
  private playerA: PlayerController | null;
  private playerB: PlayerController | null;
  private turn: 'A' | 'B';
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
    return this.playerA ? 'B' : 'A';
  }

  public get players(): Player[] {
    const p = [];

    if (this.playerA) p.push(this.playerA.asPlayer);
    if (this.playerB) p.push(this.playerB.asPlayer);

    return p;
  }

  public get state(): GameState {
    return {
      roomUid: this.roomUid,
      playerA: this.playerA ? this.playerA.sanitized : null,
      playerB: this.playerB ? this.playerB.sanitized : null,
      turn: this.turn,
      inProgress: this.gameStarted,
      cardStage: this.cardStage.sanitized,
      warStatus: this.war.status,
      scienceTokens: this.scienceTokens.board,
    };
  }

  public constructor(private roomUid: UUID) {
    this.playerA = null;
    this.playerB = null;
    this.turn = 'A';
    this.gameStarted = false;
    this.age = null;
    this.war = new WarController();
    this.scienceTokens = new ScienceTokenController();
    this.cards = new CardDeckController();
    this.cardStage = new CardStageController(this.cards);
  }

  public playerJoined(player: Pick<Player, 'uid' | 'conn' | 'name'>): void {
    const newPlayer: Pick<Player, 'uid' | 'conn' | 'name' | 'player'> = {
      ...player,
      player: this.nextPlayerAssignment,
    };

    if (this.nextPlayerAssignment === 'A') {
      this.playerA = new PlayerController(newPlayer);
    } else {
      this.playerB = new PlayerController(newPlayer);
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
    this.turn = 'A';
    this.age = Age.AGE_1;
    this.war.reset();
    this.scienceTokens.reset();
    this.cards.reset(this.age);
    this.cardStage.set(this.age);
  }

  public isGameOver(): boolean {
    return this.winner() === null;
  }

  public winner(): 'A' | 'B' | 'Tie' | null {
    if (!this.playerA || !this.playerB) {
      return null;
    }

    if (this.war.status === 'A_VICTORY') {
      return 'A';
    } else if (this.war.status === 'B_VICTORY') {
      return 'B';
    } else if (this.playerA.uniqueScienceSymbols.length >= 6) {
      return 'A';
    } else if (this.playerB.uniqueScienceSymbols.length >= 6) {
      return 'B';
    } else if (this.age === Age.AGE_3 && this.cardStage.isEmpty) {
      const victoryPointsA =
        this.playerA.victoryPoints + this.war.getVictoryPointsForPlayer('A');
      const victoryPointsB =
        this.playerB.victoryPoints + this.war.getVictoryPointsForPlayer('B');

      if (victoryPointsA === victoryPointsB) {
        return 'Tie';
      } else if (victoryPointsA > victoryPointsB) {
        return 'A';
      } else {
        return 'B';
      }
    }

    return null;
  }

  public nextAge(): void {
    switch (this.age) {
      case Age.AGE_1: {
        this.age = Age.AGE_2;
        break;
      }
      case Age.AGE_2: {
        this.age = Age.AGE_3;
        break;
      }
      default: {
        throw new Error('No more ages.');
      }
    }

    this.cards.reset(this.age);
    this.cardStage.set(this.age);
  }

  public findPlayer(playerUid: UUID): PlayerController | undefined {
    if (this.playerA?.uid === playerUid) {
      return this.playerA;
    } else if (this.playerB?.uid === playerUid) {
      return this.playerB;
    }

    return undefined;
  }

  public otherPlayer(playerUid: UUID): PlayerController | null {
    const player = this.findPlayer(playerUid);

    if (player === undefined) {
      return null;
    } else if (player.uid === this.playerA?.uid) {
      return this.playerB;
    } else if (player.uid === this.playerB?.uid) {
      return this.playerA;
    }

    return null;
  }

  public isTurn(playerUid: UUID): boolean {
    if (this.turn === 'A') {
      return this.playerA?.uid === playerUid;
    } else {
      return this.playerB?.uid === playerUid;
    }
  }

  public clickedCard(cardClicked: Pick<Card, 'uid'>, playerUid: UUID): void {
    const card = this.cardStage.getCard(cardClicked.uid);

    if (!card) {
      throw new Error('Cannot find that card.');
    }

    if (!this.cardStage.isClickable(card)) {
      throw new Error('Cannot click that card.');
    }

    const player = this.findPlayer(playerUid);
    const otherPlayer = this.otherPlayer(playerUid);

    if (!player || !otherPlayer) return;

    // There are three ways to buy cards:
    // - Outright (the player can afford it)
    // - Linking (the player already has the link)
    // - Trading (the opponent has the correct resources)
    // The order of preference is Linking, Outright, Trading.

    let canBuy = false; // Keeps track of things common to all 3 methods

    if (card.buyWithLink && player.hasLinkSymbol(card.buyWithLink)) {
      canBuy = true;
    } else if (player.canAffordCard(card)) {
      canBuy = true;
      player.chargeCoins(card.coinCost);
    } else if (player.canTradeForCard(card, otherPlayer)) {
      canBuy = true;
      player.chargeCoins(
        card.coinCost + player.tradingCostForCard(card, otherPlayer),
      );
    }

    if (canBuy) {
      this.cardStage.remove(card);
      player.addCard(card);

      // Some cards have special effects that need to
      // be triggered here if they are bought.
      if (card.onBuy) {
        console.log('on buy');
        card.onBuy(this, playerUid);
      }
    }
  }

  public processArmyPoints(playerUid: UUID, points: number): void {
    const player = this.findPlayer(playerUid);
    const otherPlayer = this.otherPlayer(playerUid);

    if (!player || !otherPlayer) return;

    let multiplier = 1;
    if (player.asPlayer.player === 'A') {
      multiplier = -1;
    }

    this.war.updateStatus(multiplier * points);

    if (this.war.status !== 'A_VICTORY' && this.war.status !== 'B_VICTORY') {
      player.updateWarProgress(this.war.status);
      otherPlayer.updateWarProgress(this.war.status);
    }
  }

  public applyResourceDiscount(playerUid: UUID, resources: Resource[]): void {
    const player = this.findPlayer(playerUid);

    if (!player) return;

    resources.forEach((resource: Resource): void => {
      player.applyResourceDiscount(resource, 1);
    });
  }

  public processCoinCard(playerUid: UUID, coins: number): void {
    const player = this.findPlayer(playerUid);

    if (!player) return;

    player.giveCoins(coins);
  }

  public processCoinsPerCardTypeCard(
    playerUid: UUID,
    cardType: CardType,
    coinsPerCardType: number,
  ): void {
    const player = this.findPlayer(playerUid);

    if (!player) return;

    player.giveCoins(player.cardTypeCount(cardType) * coinsPerCardType);
  }

  public processCoinsPerWonderCard(
    playerUid: UUID,
    coinsPerWonder: number,
  ): void {
    const player = this.findPlayer(playerUid);

    if (!player) return;

    player.giveCoins(player.wondersClaimed.length * coinsPerWonder);
  }
}
