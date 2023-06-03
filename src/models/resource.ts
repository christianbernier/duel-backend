export enum BrownResource {
  WOOD = 'WOOD',
  CLAY = 'CLAY',
  STONE = 'STONE',
}

export enum GrayResource {
  GLASS = 'GLASS',
  PAPYRUS = 'PAPYRUS',
}

export type Resource = BrownResource | GrayResource;

export type ResourceDiscount = {
  type: Resource;
  coinsPer: number;
};
