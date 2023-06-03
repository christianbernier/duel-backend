import { FlippedCardType } from './card';
import { Resource } from './resource';

export enum WonderType {
  THE_APPIAN_WAY = 'THE_APPIAN_WAY',
  CIRCUS_MAXIMUS = 'CIRCUS_MAXIMUS',
  THE_COLOSSUS = 'THE_COLOSSUS',
  THE_GREAT_LIBRARY = 'THE_GREAT_LIBRARY',
  THE_GREAT_LIGHTHOUSE = 'THE_GREAT_LIGHTHOUSE',
  THE_HANGING_GARDENS = 'THE_HANGING_GARDENS',
  THE_MAUSOLEUM = 'THE_MAUSOLEUM',
  PIRAEUS = 'PIRAEUS',
  THE_PYRAMIDS = 'THE_PYRAMIDS',
  THE_SPHINX = 'THE_SPHINX',
  THE_STATUE_OF_ZEUS = 'THE_STATUE_OF_ZEUS',
  THE_TEMPLE_OF_ARTEMIS = 'THE_TEMPLE_OF_ARTEMIS',
}

export type Wonder = {
  type: WonderType;
  disabled: boolean;
  resourceCost: Resource[];
  claimedWith: FlippedCardType | null;
};
