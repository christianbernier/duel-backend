import { WebSocket, WebSocketServer as WSS } from 'ws';
import { Server } from './abstract-server';
import { IncomingMessage } from 'http';
import { RoomState } from './rooms';

export const WebSocketServerPort = 8080;
export class WebSocketServer extends Server {
  // Singleton server instance.
  public static readonly Server = new WebSocketServer();

  get identifier(): string {
    return 'WS';
  }

  private wss: WSS;

  // Disallow further instantiations of this class.
  private constructor() {
    super();
    this.wss = new WSS({ port: WebSocketServerPort });
    this.log('Init done.');
  }

  /**
   * @description Start the server.
   */
  public start() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage): void => {
      if (!req.url) {
        this.closeConnectionWithMessage(ws, 'Invalid request.');
        return;
      }

      const url = new URL(`ws://duel${req.url}`);

      switch (url.pathname) {
        case '/join': {
          const roomUid = url.searchParams.get('room');
          const name = url.searchParams.get('name');

          if (!roomUid) {
            this.closeConnectionWithMessage(ws, 'Must include room UID.');
            break;
          }

          if (!name) {
            this.closeConnectionWithMessage(ws, 'Must include name.');
            break;
          }

          if (!RoomState.State.doesRoomExist(roomUid)) {
            this.closeConnectionWithMessage(ws, 'Invalid room UID.');
            break;
          }

          const controller = RoomState.State.getRoom(roomUid);

          if (controller.playerCount >= 2) {
            this.closeConnectionWithMessage(
              ws,
              'Too many players are in that room.',
            );
            break;
          }

          controller.onConnect(name, ws);
          break;
        }
        default: {
          this.closeConnectionWithMessage(ws, 'Invalid URL path.');
        }
      }
    });

    this.log(`Listening on port ${WebSocketServerPort}`);
  }

  private closeConnectionWithMessage(conn: WebSocket, message: string): void {
    conn.send(
      JSON.stringify({
        error: message,
      }),
    );
    conn.close();
  }
}
