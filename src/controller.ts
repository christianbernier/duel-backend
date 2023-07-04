import WebSocket, { MessageEvent } from 'ws';
import { GameController } from './game/game.controller';
import { GameState, Player, UUID } from './models';
import { TransmissionListener } from './models/transmission';
import { v4 as uuidv4 } from 'uuid';
import { ValidIncomingTransmission, assertValid } from './server/validators';

export class Controller {
  private readonly roomUid: UUID;
  private game: GameController | null;
  private listeners: TransmissionListener[];

  private playerA: Pick<Player, 'uid' | 'conn' | 'name'> | null;
  private playerB: Pick<Player, 'uid' | 'conn' | 'name'> | null;

  public constructor(roomUid: UUID) {
    this.roomUid = roomUid;
    this.game = null;
    this.listeners = [];
    this.playerA = null;
    this.playerB = null;

    this.listeners.push({
      on: 'START_GAME',
      do: this.startGame,
      times: 1,
      additionalCheck: (): boolean => !!this.playerA && !!this.playerB,
    });
  }

  public sendMessage(conn: WebSocket, message: object): void {
    conn.send(JSON.stringify(message));
  }

  public sendError(
    conn: WebSocket,
    errorCode: string,
    errorMessage?: string,
  ): void {
    this.sendMessage(conn, {
      type: 'ERROR',
      errorCode,
      errorMessage,
    });
  }

  public broadcastState(): void {
    [this.playerA, this.playerB].forEach(
      (player: Pick<Player, 'conn'> | null): void => {
        if (!player) return;

        const currentGameState: GameState = this.game
          ? this.game.state
          : {
              roomUid: this.roomUid,
              inProgress: false,
              playerA: this.playerA
                ? {
                    ...this.playerA,
                    conn: undefined,
                    uid: undefined,
                  }
                : null,
              playerB: this.playerB
                ? {
                    ...this.playerB,
                    conn: undefined,
                    uid: undefined,
                  }
                : null,
              turn: 'A',
              cardStage: [],
              warStatus: 0,
              scienceTokens: [],
            };

        this.sendMessage(player?.conn, currentGameState);
      },
    );
  }

  public onConnection(conn: WebSocket, playerName: string): void {
    // First, check that a player can be added to the room.
    if (this.playerA && this.playerB) {
      this.sendError(
        conn,
        'TOO_MANY_PLAYERS',
        'There are already two players in this room.',
      );
      conn.close();
      return;
    }

    // Initialize the new player.
    const uid: UUID = uuidv4();
    const newPlayer: Pick<Player, 'uid' | 'conn' | 'name'> = {
      uid,
      conn,
      name: playerName,
    };

    if (!this.playerA) {
      this.playerA = newPlayer;
    } else {
      this.playerB = newPlayer;
    }

    // Send an update to players.
    this.broadcastState();

    // Set up WebSocket event handlers.
    conn.onclose = () => this.onDisconnect(uid);
    conn.onmessage = (event: MessageEvent) => this.onMessage(uid, event);
  }

  public onDisconnect(playerUid: UUID): void {
    if (this.game) {
      this.game = null;
    }

    if (this.playerA?.uid === playerUid) {
      this.playerA = null;
    }

    if (this.playerB?.uid === playerUid) {
      this.playerB = null;
    }

    this.broadcastState();
  }

  public onMessage(playerUid: UUID, event: MessageEvent): void {
    const player = this.getPlayerFromUid(playerUid);
    if (!player) return;

    // Validate the data
    let data: ValidIncomingTransmission;
    try {
      data = JSON.parse(event.data as string);
      assertValid(data);
    } catch (e) {
      this.sendError(
        player.conn,
        'MESSAGE_NOT_RECOGNIZED',
        'Message type is not recognized.',
      );
      return;
    }

    // Check for listeners
    const typesHandled: string[] = [];
    this.listeners.forEach(
      (listener: TransmissionListener, index: number): void => {
        if (typesHandled.includes(listener.on)) return;
        if (listener.on !== data.type) return;
        if (
          listener.additionalCheck &&
          !listener.additionalCheck.call(this, data, playerUid)
        )
          return;

        // Met criteria
        try {
          listener.do.call(this, data, playerUid);
          typesHandled.push(listener.on);

          if (listener.times && --listener.times === 0) {
            this.listeners.splice(index, 1);
          }

          this.broadcastState();
        } catch (e) {
          this.sendError(player.conn, 'INTERNAL_ERROR', (e as Error).message);
        }
      },
    );
  }

  private getPlayerFromUid(
    playerUid: UUID,
  ): Pick<Player, 'uid' | 'conn' | 'name'> | null {
    if (this.playerA?.uid === playerUid) {
      return this.playerA;
    }

    if (this.playerB?.uid === playerUid) {
      return this.playerB;
    }

    return null;
  }

  public startGame(): void {
    if (!this.playerA || !this.playerB) {
      throw new Error('Not enough players to start the game.');
    }

    this.game = new GameController(
      this.roomUid,
      this.playerA,
      this.playerB,
      this.addListener.bind(this),
    );
    this.broadcastState();
  }

  public clearListenersOfType(listenerType: string): void {
    this.listeners = this.listeners.filter(
      (listener: TransmissionListener) => listener.on === listenerType,
    );
  }

  public addListener(listener: TransmissionListener): void {
    this.listeners.push(listener);
  }
}
