/**
 * Represents a server.
 */
export abstract class Server {
  /**
   * Identifier for this server instance.
   */
  abstract get identifier(): string;

  /**
   * @description Logs a message to the console.
   * @param message - The message to be logged.
   * @protected
   */
  protected log(message: string) {
    console.log(`[${this.identifier}] ${message}`);
  }
}
