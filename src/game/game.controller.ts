import {
  Age,
  Card,
  CardType,
  GameState,
  Player,
  Resource,
  UUID,
} from '../models';
import { TransmissionListener } from '../models/transmission';
import {
  StageCardClickedTransmission,
  ValidIncomingTransmission,
} from '../server/validators';
import { CardDeckController } from './card-deck.controller';
import { CardStageController } from './card-stage.controller';
import { PlayerController } from './player.controller';
import { ScienceTokenController } from './science-token-controller';
import { TurnController } from './turn.controller';
import { WarController } from './war.controller';

export class GameController {
  private readonly roomUid: UUID;
  private readonly playerA: PlayerController;
  private readonly playerB: PlayerController;
  private readonly turn: TurnController;
  private readonly war: WarController;
  private readonly scienceTokens: ScienceTokenController;
  private readonly cardDeck: CardDeckController;
  private readonly cardStage: CardStageController;
  private age: Age;

  public constructor(
    roomUid: UUID,
    playerA: Pick<Player, 'uid' | 'conn' | 'name'>,
    playerB: Pick<Player, 'uid' | 'conn' | 'name'>,
    addListener: (listener: TransmissionListener) => void,
  ) {
    this.roomUid = roomUid;
    this.playerA = new PlayerController({ ...playerA, player: 'A' });
    this.playerB = new PlayerController({ ...playerB, player: 'B' });
    this.turn = new TurnController(this.playerA.uid, this.playerB.uid, () => {
      addListener({
        on: 'STAGE_CARD_CLICKED',
        do: (transmission: ValidIncomingTransmission, playerUid: UUID) => {
          const cardClickedTransmission =
            transmission as StageCardClickedTransmission;
          this.onCardClicked(cardClickedTransmission.card, playerUid);
          this.turn.toggle();
        },
        times: 1,
        additionalCheck: this.turn.confirmTrun(),
      });
    });
    this.war = new WarController();
    this.scienceTokens = new ScienceTokenController();
    this.cardDeck = new CardDeckController();
    this.cardStage = new CardStageController(this.cardDeck);
    this.age = Age.AGE_1;

    this.turn.reset();
    this.war.reset();
    this.scienceTokens.reset();
    this.cardDeck.reset(this.age);
    this.cardStage.set(this.age);
  }

  public get state(): GameState {
    return {
      roomUid: this.roomUid,
      playerA: this.playerA.sanitized,
      playerB: this.playerB.sanitized,
      turn: this.turn.asLetter(),
      inProgress: this.getWinner() !== null,
      cardStage: this.cardStage.sanitized,
      warStatus: this.war.status,
      scienceTokens: this.scienceTokens.board,
    };
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

    this.cardDeck.reset(this.age);
    this.cardStage.set(this.age);
  }

  public getWinner(): 'A' | 'B' | 'Tie' | null {
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

  public getPlayer(playerUid: UUID): PlayerController {
    return playerUid === this.playerA.uid ? this.playerA : this.playerB;
  }

  public getOtherPlayer(playerUid: UUID): PlayerController {
    return playerUid === this.playerB.uid ? this.playerA : this.playerB;
  }

  public onCardClicked(cardClicked: Pick<Card, 'uid'>, playerUid: UUID): void {
    const card = this.cardStage.getCard(cardClicked.uid);

    if (!card) {
      throw new Error('Cannot find that card.');
    }

    if (!this.cardStage.isClickable(card)) {
      throw new Error('Cannot click that card.');
    }

    const player = this.getPlayer(playerUid);
    const otherPlayer = this.getOtherPlayer(playerUid);

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
        card.onBuy(this, playerUid);
      }
    }
  }

  public processArmyPoints(playerUid: UUID, points: number): void {
    const player = this.getPlayer(playerUid);
    const otherPlayer = this.getOtherPlayer(playerUid);

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
    const player = this.getPlayer(playerUid);

    resources.forEach((resource: Resource): void => {
      player.applyResourceDiscount(resource, 1);
    });
  }

  public processCoinCard(playerUid: UUID, coins: number): void {
    this.getPlayer(playerUid).giveCoins(coins);
  }

  public processCoinsPerCardTypeCard(
    playerUid: UUID,
    cardType: CardType,
    coinsPerCardType: number,
  ): void {
    const player = this.getPlayer(playerUid);

    player.giveCoins(player.cardTypeCount(cardType) * coinsPerCardType);
  }

  public processCoinsPerWonderCard(
    playerUid: UUID,
    coinsPerWonder: number,
  ): void {
    const player = this.getPlayer(playerUid);

    player.giveCoins(player.wondersClaimed.length * coinsPerWonder);
  }
}
