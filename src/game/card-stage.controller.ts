import { Age, Card, CardStage } from "../models";
import { CardDeckController } from "./card-deck.controller";
import { Age1CardStage, Age2CardStage, Age3CardStage } from "../fixtures";

export class CardStageController {
  private stage: CardStage;

  public get sanitized(): CardStage {
    return this.stage.map((cardStageRow) => {
      return cardStageRow.map((cardPlace) => {
        switch (cardPlace.type) {
          case "FACE_UP":
            return cardPlace;
          case "FACE_DOWN":
            return {
              ...cardPlace,
              faceDownCard: cardPlace.reverse?.reverse,
              reverse: undefined,
            };
          case "PLACEHOLDER":
            return cardPlace;
        }
      });
    });
  }

  public constructor(private cards: CardDeckController) {
    this.stage = [];
  }

  public set(age: Age) {
    this.stage = [];
    let stagePattern: string[] = [];

    switch (age) {
      case Age.AGE_1:
        stagePattern = Age1CardStage;
        break;
      case Age.AGE_2:
        stagePattern = Age2CardStage;
        break;
      case Age.AGE_3:
        stagePattern = Age3CardStage;
        break;
      default:
        const _: never = age;
    }

    stagePattern.forEach((cardTemplate: string, a): void => {
      const cardStageRow: (
        | {
            type: "FACE_UP";
            faceUpCard: Card;
          }
        | {
            type: "FACE_DOWN";
            reverse: Card;
          }
        | {
            type: "PLACEHOLDER";
          }
      )[] = [];

      cardTemplate.split("").forEach((cardType: string, b): void => {
        switch (cardType) {
          case "U":
            cardStageRow.push({
              type: "FACE_UP",
              faceUpCard: this.cards.draw(),
            });
            break;
          case "D":
            cardStageRow.push({
              type: "FACE_DOWN",
              reverse: this.cards.draw(),
            });
            break;
          case "P":
            cardStageRow.push({
              type: "PLACEHOLDER",
            });
            break;
        }
      });

      this.stage.push(cardStageRow);
    });
  }

  public clickable(card: Card): boolean {
    let clickable = false;

    this.stage.forEach((stageRow, row): void => {
      stageRow.forEach((cardSpot, column): void => {
        if (cardSpot.type !== 'FACE_UP') return;
        if (cardSpot.faceUpCard.uid !== card.uid) return;

        if (row === this.stage.length - 1) {
          clickable = true;
          return;
        }

        if (row % 2 === 0) {
          // Even row
          clickable = (
            this.stage[row + 1][column].type === 'PLACEHOLDER' &&
            (this.stage[row + 1][column + 1].type === 'PLACEHOLDER' || column === this.stage[0].length - 1)
          );
          return;
        } else {
          // Odd row
          clickable = (
            this.stage[row + 1][column].type === 'PLACEHOLDER' &&
            (this.stage[row + 1][column - 1].type === 'PLACEHOLDER' || column === 0)
          );
          return;
        }
      })
    })

    return clickable;
  }

  public remove(card: Card): void {
    this.stage.forEach((stageRow, row): void => {
      stageRow.forEach((cardSpot, column): void => {
        if (cardSpot.type !== 'FACE_UP') return;
        if (cardSpot.faceUpCard.uid !== card.uid) return;

        this.stage[row][column] = {
          type: 'PLACEHOLDER',
        };

        this.revealIfAble(row - 1, column);
        if (row % 2 === 0) {
          // Even row
          this.revealIfAble(row - 1, column + 1);
        } else {
          // Odd row
          this.revealIfAble(row - 1, column - 1);
        }
      })
    })
  }

  private revealIfAble(row: number, column: number) {
    if (row < 0 || column < 0 || row >= this.stage.length || column >= this.stage[0].length) return;

    const card = this.stage[row][column];
    if (card.type === 'PLACEHOLDER' || card.type === 'FACE_UP') return;

    if (row !== this.stage.length - 1) {
      if (this.stage[row + 1][column].type !== 'PLACEHOLDER') return;

      if (row % 2 === 1 && column !== 0) {
        // Odd row
        if (this.stage[row + 1][column - 1].type !== 'PLACEHOLDER') return;
      } else if (row % 2 === 0 && column !== this.stage[0].length - 1) {
        // Odd row
        if (this.stage[row + 1][column + 1].type !== 'PLACEHOLDER') return;
      }
    }

    this.stage[row][column] = {
      type: 'FACE_UP',
      faceUpCard: card.reverse!,
    }
  }
}
