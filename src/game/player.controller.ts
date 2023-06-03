import {
  BrownResource,
  Card,
  CardType,
  CommercialType,
  GrayResource,
  LinkSymbol,
  Player,
  Resource,
  ResourceDiscount,
  UUID,
  Wonder,
} from '../models';

export class PlayerController {
  private readonly player: Player;

  private readonly resourceDiscounts: ResourceDiscount[];

  public get asPlayer(): Player {
    return this.player;
  }

  public get uid(): UUID {
    return this.player.uid;
  }

  public get sanitized(): Partial<Player> {
    return {
      ...this.player,
      conn: undefined,
    };
  }

  public get resources(): Resource[] {
    const resources: Resource[] = [];

    this.player.cards.forEach((card: Card): void => {
      if (
        card.cardType === CardType.BROWN_PRODUCTION ||
        card.cardType === CardType.GRAY_PRODUCTION
      ) {
        resources.push(...card.produces);
      }
    });

    return resources;
  }

  public get wildcardResource(): Resource[][] {
    const wildcardResources: Resource[][] = [];

    this.player.cards.forEach((card: Card): void => {
      if (card.cardType === CardType.YELLOW_COMMERCIAL) {
        if (card.commercialType === CommercialType.ANY_BROWN_RESOURCE) {
          wildcardResources.push([
            BrownResource.WOOD,
            BrownResource.STONE,
            BrownResource.CLAY,
          ]);
        } else if (card.commercialType === CommercialType.ANY_GRAY_RESOURCE) {
          wildcardResources.push([GrayResource.GLASS, GrayResource.PAPYRUS]);
        }
      }
    });

    return wildcardResources;
  }

  public get linkSymbols(): LinkSymbol[] {
    const linkSymbols: LinkSymbol[] = [];

    this.player.cards.forEach((card: Card): void => {
      if (card.providesLink) {
        linkSymbols.push(card.providesLink);
      }
    });

    return linkSymbols;
  }

  public get wondersClaimed(): Wonder[] {
    return this.player.wonders.filter(
      (wonder: Wonder): boolean => wonder.claimedWith !== null,
    );
  }

  public constructor(player: Pick<Player, 'uid' | 'conn' | 'name' | 'player'>) {
    this.player = {
      ...player,
      ...PlayerController.defaultPlayer(),
    };
    this.resourceDiscounts = [];
  }

  private static defaultPlayer(): Omit<
    Player,
    'uid' | 'conn' | 'name' | 'player'
  > {
    return {
      cards: [],
      scienceTokens: [],
      wonders: [],
      coins: 7,
      warLootingStatus: 0,
    };
  }

  public hasLinkSymbol(linkSymbol: LinkSymbol): boolean {
    return this.linkSymbols.includes(linkSymbol);
  }

  private canAffordCardWithResources(
    card: Card,
    resources: Resource[],
    useWildcardResources: boolean,
  ): boolean {
    const resourcesLeft = [...resources];
    const wildcardResourcesLeft = useWildcardResources
      ? [...this.wildcardResource]
      : [];

    let canBuy = true;

    card.resourceCost.forEach((resource: Resource): void => {
      if (!canBuy) return;

      const indexOfResource = resourcesLeft.findIndex(
        (playerResource: Resource): boolean => playerResource === resource,
      );
      const indexOfWildcardResource = wildcardResourcesLeft.findIndex(
        (resourceSet: Resource[]) => resourceSet.includes(resource),
      );

      if (indexOfResource === -1 && indexOfWildcardResource === -1) {
        canBuy = false;
      } else if (indexOfWildcardResource !== -1) {
        wildcardResourcesLeft.splice(indexOfWildcardResource, 1);
      } else {
        resourcesLeft.splice(indexOfResource, 1);
      }
    });

    return canBuy;
  }

  public canAffordCard(card: Card): boolean {
    if (card.coinCost > this.player.coins) {
      return false;
    }

    return this.canAffordCardWithResources(card, this.resources, true);
  }

  public resourceCount(resource: Resource): number {
    return this.resources.filter(
      (playerResource: Resource) => playerResource === resource,
    ).length;
  }

  public canTradeForCard(card: Card, otherPlayer: PlayerController): boolean {
    return (
      card.coinCost + this.tradingCostForCard(card, otherPlayer) <=
      this.player.coins
    );
  }

  public tradingCostForCard(card: Card, otherPlayer: PlayerController): number {
    let tradingCost = 0;
    const resourcesLeft = [...this.resources];
    const wildcardResourcesLeft = [...this.wildcardResource];

    card.resourceCost.forEach((resource: Resource): void => {
      const indexOfResource = resourcesLeft.findIndex(
        (playerResource: Resource): boolean => playerResource === resource,
      );
      const indexOfWildcardResource = wildcardResourcesLeft.findIndex(
        (resourceSet: Resource[]): boolean => resourceSet.includes(resource),
      );

      if (indexOfResource === -1 && indexOfWildcardResource == -1) {
        const discount = this.resourceDiscounts.find(
          (discount: ResourceDiscount): boolean => discount.type === resource,
        );

        if (discount) {
          tradingCost += discount.coinsPer;
        } else {
          tradingCost += 2 + otherPlayer.resourceCount(resource);
        }
      } else if (indexOfWildcardResource !== -1) {
        wildcardResourcesLeft.splice(indexOfWildcardResource, 1);
      } else {
        resourcesLeft.splice(indexOfResource, 1);
      }
    });

    return tradingCost;
  }

  public addCard(card: Card): void {
    this.player.cards.push(card);
  }

  public chargeCoins(coins: number): void {
    // A player cannot have less than 0 coins.
    this.player.coins = Math.max(0, this.player.coins - coins);
  }

  public giveCoins(coins: number): void {
    this.player.coins += coins;
  }

  public updateWarProgress(warStatus: number): void {
    // If the update is only relevant for the other player, return.
    if (
      (warStatus > 0 && this.player.player === 'A') ||
      (warStatus < 0 && this.player.player === 'B')
    ) {
      return;
    }

    const magnitude = Math.abs(warStatus);
    if (this.player.warLootingStatus === 2 && magnitude >= 6) {
      this.player.warLootingStatus = 5;
      this.chargeCoins(5);
    } else if (this.player.warLootingStatus === 0 && magnitude >= 3) {
      this.player.warLootingStatus = 2;
      this.chargeCoins(2);
    }
  }

  public cardTypeCount(cardType: CardType): number {
    return this.player.cards.filter(
      (card: Card): boolean => card.cardType === cardType,
    ).length;
  }

  public applyResourceDiscount(resourceType: Resource, coinsPer: number): void {
    this.resourceDiscounts.push({
      type: resourceType,
      coinsPer: coinsPer,
    });
  }
}
