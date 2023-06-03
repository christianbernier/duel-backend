import { GameController } from '../game/game.controller';
import {
  CardType,
  Resource,
  ScienceProgressToken,
  ScienceType,
  UUID,
} from '../models';

export const onBuyArmyCard = (
  armyPoints: number,
): ((game: GameController, purchaserUid: UUID) => void) => {
  return (game: GameController, purchaserUid: UUID) => {
    game.processArmyPoints(purchaserUid, armyPoints);
  };
};

export const onBuyResourceDiscountCard = (
  resourcesDiscounted: Resource[],
): ((game: GameController, purchaserUid: UUID) => void) => {
  return (game: GameController, purchaserUid: UUID) => {
    game.applyResourceDiscount(purchaserUid, resourcesDiscounted);
  };
};

export const onBuyCoinCard = (
  coins: number,
): ((game: GameController, purchaserUid: UUID) => void) => {
  return (game: GameController, purchaserUid: UUID) => {
    game.processCoinCard(purchaserUid, coins);
  };
};

export const onBuyCoinsPerCardTypeCard = (
  coinsPerCardType: number,
  ...cardTypes: CardType[]
): ((game: GameController, purchaserUid: UUID) => void) => {
  return (game: GameController, purchaserUid: UUID) => {
    cardTypes.forEach((cardType: CardType): void => {
      game.processCoinsPerCardTypeCard(
        purchaserUid,
        cardType,
        coinsPerCardType,
      );
    })
  };
};

export const onBuyCoinsPerWonderCard = (
  coinsPerWonder: number,
): ((game: GameController, purchaserUid: UUID) => void) => {
  return (game: GameController, purchaserUid: UUID) => {
    game.processCoinsPerWonderCard(purchaserUid, coinsPerWonder);
  };
};
