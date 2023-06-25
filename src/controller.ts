import { MessageEvent, WebSocket } from 'ws';
import { Card, Player, UUID } from './models';
import { v4 as uuidv4 } from 'uuid';
import {
  assertValid,
  isValid,
  ValidIncomingTransmission,
} from './server/validators';
import { GameController } from './game/game.controller';

export class Controller {
  private readonly uid: UUID;
  private readonly game: GameController;

  public constructor(uid: UUID) {
    this.uid = uid;
    this.game = new GameController(uid);
  }

  public get playerCount(): number {
    return this.game.playerCount;
  }

  public onConnect(name: string, conn: WebSocket): void {
    if (this.playerCount >= 2) {
      throw new Error('Too many players!');
    }

    const uid = uuidv4();

    this.game.playerJoined({
      uid,
      conn,
      name,
    });

    this.broadcastStateUpdate();

    conn.onclose = () => this.onDisconnect(uid);
    conn.onmessage = (event: MessageEvent) => {
      let data: ValidIncomingTransmission;

      try {
        data = JSON.parse(event.data as string);
        assertValid(data);
      } catch (e) {
        this.sendErrorToPlayer(uid, 'Message type is not recognized.');
        return;
      }

      try {
        this.onReceive(uid, data);
      } catch (e) {
        this.sendErrorToPlayer(uid, 'Internal server error.');
      }
    };
  }

  /**
   * @description Handler for when a player disconnects. Removes the player from
   * the list of players in this room.
   * @param uid - The UID of the player that disconnected.
   * @private
   */
  private onDisconnect(uid: UUID): void {
    this.game.playerLeft(uid);
    this.broadcastStateUpdate();
  }

  /**
   * @description Handler for when a message is received from a player WebSocket
   * connection.
   * @param playerUid - The player who sent the message.
   * @param transmission - The contents of the message, as an object.
   * @private
   */
  private onReceive(
    playerUid: UUID,
    transmission: ValidIncomingTransmission,
  ): void {
    if (isValid(transmission)) {
      switch (transmission.type) {
        case 'START_GAME':
          this.startGame(playerUid);
          break;
        case 'STAGE_CARD_CLICKED':
          this.cardClicked(transmission.card, playerUid);
          break;
        default: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _: never = transmission;
          throw new Error('Missing receive logic in controller.');
        }
      }
    }
  }

  /**
   * @description Send the same message to all users connected.
   * @param message - The message to send.
   * @private
   */
  private broadcastMessage(message: object): void {
    this.game.players.forEach((player: Player | null): void => {
      if (player === null) return;
      player.conn.send(JSON.stringify(message));
    });
  }

  /**
   * @description Broadcasts the current state of the room to all players.
   * @private
   */
  private broadcastStateUpdate(): void {
    this.broadcastMessage(this.game.state);
  }

  private sendMessageToPlayer(playerUid: UUID, message: string) {
    const player = this.game.findPlayer(playerUid);
    if (player) {
      player.asPlayer.conn.send(message);
    } else {
      throw new Error('Player does not exist.');
    }
  }

  private sendErrorToPlayer(playerUid: UUID, error: string) {
    this.sendMessageToPlayer(
      playerUid,
      JSON.stringify({
        error,
      }),
    );
  }

  // // // // // // // // //
  //    EVENT HANDLERS    //
  // // // // // // // // //

  private startGame(playerUid: UUID): void {
    if (this.playerCount !== 2) {
      this.sendErrorToPlayer(playerUid, 'Not enough players.');
      return;
    }

    this.game.reset();
    this.broadcastStateUpdate();
  }

  private cardClicked(card: Card, playerUid: UUID): void {
    if (!this.game.isTurn(playerUid)) {
      this.sendErrorToPlayer(playerUid, 'It is not your turn.');
      return;
    }

    try {
      this.game.clickedCard(card, playerUid);
    } catch (e) {
      this.sendErrorToPlayer(playerUid, 'Cannot click that card.');
      return;
    }

    this.broadcastStateUpdate();
  }
}
