import express = require('express');
import { Express as ExpressServer, Request, Response } from 'express';
import { Server } from './abstract-server';
const cors = require('cors');

export const RestServerPort = 8081;
export class RestServer extends Server {
  // Singleton server instance.
  public static readonly Server = new RestServer();

  get identifier(): string {
    return 'REST';
  }

  private readonly app: ExpressServer;

  // Disallow further instantiations of this class.
  private constructor() {
    super();
    this.app = express();
    this.app.use(cors());
    this.log('Init done.');
  }

  /**
   * @description Start the server.
   */
  public start(): void {
    this.app.get('/new-room', (req: Request, res: Response): void => {
      console.log('req req new room :D');
    });

    this.app.listen(RestServerPort);
    this.log(`Listening on port ${RestServerPort}`);
  }
}
