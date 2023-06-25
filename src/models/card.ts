import { BrownResource, GrayResource, Resource } from './resource';
import { ScienceType } from './science';
import { CommercialType } from './commercial';
import { GuildType } from './guild';
import { UUID } from './uuid';
import { GameController } from '../game/game.controller';

export enum CardType {
  BROWN_PRODUCTION = 'BROWN_PRODUCTION',
  GRAY_PRODUCTION = 'GRAY_PRODUCTION',
  RED_ARMY = 'RED_ARMY',
  GREEN_SCIENCE = 'GREEN_SCIENCE',
  YELLOW_COMMERCIAL = 'YELLOW_COMMERCIAL',
  BLUE_VICTORY = 'BLUE_VICTORY',
  PURPLE_GUILD = 'PURPLE_GUILD',
}

export enum LinkSymbol {
  HORSESHOE = 'HORSESHOE',
  SWORD = 'SWORD',
  CASTLE = 'CASTLE',
  TARGET = 'TARGET',
  HELMET = 'HELMET',
  BOOK = 'BOOK',
  GEAR = 'GEAR',
  HARP = 'HARP',
  TEA = 'TEA',
  MASK = 'MASK',
  MOON = 'MOON',
  RAIN = 'RAIN',
  COLUMN = 'COLUMN',
  SUN = 'SUN',
  BANK = 'BANK',
  VASE = 'VASE',
  BARREL = 'BARREL',
}

type BrownProductionCard = {
  cardType: CardType.BROWN_PRODUCTION;
  produces: BrownResource[];
};

type GrayProductionCard = {
  cardType: CardType.GRAY_PRODUCTION;
  produces: GrayResource[];
};

type RedArmyCard = {
  cardType: CardType.RED_ARMY;
  shields: number;
};

type GreenScienceCard = {
  cardType: CardType.GREEN_SCIENCE;
  victoryPoints: number;
  scienceType: ScienceType;
};

export type YellowCommercialCard = {
  cardType: CardType.YELLOW_COMMERCIAL;
} & (
  | {
      commercialType: CommercialType.BROWN_RESOURCE_DISCOUNT;
      resource: BrownResource;
    }
  | {
      commercialType: CommercialType.GRAY_RESOURCE_DISCOUNT;
      resources: GrayResource[];
    }
  | {
      commercialType: CommercialType.ANY_BROWN_RESOURCE;
    }
  | {
      commercialType: CommercialType.ANY_GRAY_RESOURCE;
    }
  | {
      commercialType: CommercialType.COINS;
      coins: number;
    }
  | {
      commercialType: CommercialType.COINS_PER_CARD;
      coinsForCardType: CardType;
      coinsPerCard: number;
      victoryPoints: number;
    }
  | {
      commercialType: CommercialType.COINS_PER_WONDER;
      coinsPerWonder: number;
      victoryPoints: number;
    }
);

type BlueVictoryCard = {
  cardType: CardType.BLUE_VICTORY;
  victoryPoints: number;
};

export type PurpleGuildCard = {
  cardType: CardType.PURPLE_GUILD;
} & (
  | {
      guildType: GuildType.VICTORY_POINTS_PER_WONDER;
      victoryPoints: number;
    }
  | {
      guildType: GuildType.VICTORY_POINTS_PER_COINS;
      victoryPoints: number;
      coins: number;
    }
  | {
      guildType: GuildType.VICTORY_POINTS_AND_COINS_PER_CARD_TYPE;
      victoryPoints: number;
      coins: number;
      guildCardTypes: CardType[];
    }
);

export type Card = {
  uid: UUID;
  resourceCost: Resource[];
  coinCost: number;
  buyWithLink?: LinkSymbol;
  providesLink?: LinkSymbol;
  name: string;
  faceDown: boolean;
  reverse: FlippedCardType;
  onBuy?: (game: GameController, purchaserUid: UUID) => void;
} & (
  | BrownProductionCard
  | GrayProductionCard
  | RedArmyCard
  | GreenScienceCard
  | YellowCommercialCard
  | BlueVictoryCard
  | PurpleGuildCard
);

export enum FlippedCardType {
  AGE_1 = 'AGE_1',
  AGE_2 = 'AGE_2',
  AGE_3_PINK = 'AGE_3_PINK',
  AGE_3_PURPLE = 'AGE_3_PURPLE',
}

export type CardStage = (
  | {
      type: 'FACE_UP';
      faceUpCard: Card;
    }
  | {
      type: 'FACE_DOWN';
      reverse: Card;
      faceDownCard?: FlippedCardType;
    }
  | {
      type: 'PLACEHOLDER';
    }
)[][];
