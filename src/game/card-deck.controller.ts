import { Age, Card, FlippedCardType } from '../models';
import { Age1Cards, Age2Cards, Age3Cards, GuildCards } from '../fixtures';
import { v4 as uuidv4 } from 'uuid';

export class CardDeckController {
  private cards: Card[];

  public get deck(): Card[] {
    return [...this.cards];
  }

  public get deckSize(): number {
    return this.cards.length;
  }

  public constructor() {
    this.cards = [];
  }

  public reset(age: Age) {
    switch (age) {
      case Age.AGE_1: {
        this.cards = Age1Cards.map(
          (card: Partial<Card>): Card =>
            ({
              ...card,
              reverse: FlippedCardType.AGE_1,
            } as Card),
        );
        this.cards = this.shuffle(this.cards);
        this.draw();
        this.draw();
        this.draw(); // remove 3 cards from the deck
        break;
      }
      case Age.AGE_2: {
        this.cards = Age2Cards.map(
          (card: Partial<Card>): Card =>
            ({
              ...card,
              reverse: FlippedCardType.AGE_2,
            } as Card),
        );
        this.cards = this.shuffle(this.cards);
        this.draw();
        this.draw();
        this.draw(); // remove 3 cards from the deck
        break;
      }
      case Age.AGE_3: {
        this.cards = Age3Cards.map(
          (card: Partial<Card>): Card =>
            ({
              ...card,
              reverse: FlippedCardType.AGE_3_PINK,
            } as Card),
        );
        this.cards = this.shuffle(this.cards);
        this.draw();
        this.draw();
        this.draw(); // remove 3 cards from the deck
        const guildCards = this.shuffle(GuildCards) as Card[];
        this.cards = [
          ...this.cards,
          guildCards[0],
          guildCards[1],
          guildCards[2],
        ];
        this.cards = this.shuffle(this.cards);
        break;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = age;
      }
    }

    this.cards = this.cards.map(
      (card: Card): Card => ({
        ...card,
        faceDown: false,
        uid: uuidv4(),
      }),
    );
  }

  public draw(): Card {
    if (this.cards.length === 0) {
      throw new Error('There are no more cards in the deck to draw.');
    }

    const index = Math.floor(Math.random() * this.deckSize);
    return this.cards.splice(index, 1)[0];
  }

  private shuffle<T extends Partial<Card> | Card>(deck: T[]): T[] {
    const newDeck: T[] = [];

    // While there are cards left in the deck, choose one
    // at random to put at the top of the new deck.
    while (deck.length > 0) {
      const index = Math.floor(Math.random() * deck.length);
      newDeck.push(deck.splice(index, 1)[0]);
    }

    return newDeck;
  }
}
