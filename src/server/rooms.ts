import { UUID } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { Controller } from '../controller';

export class RoomState {
  // Singleton
  public static State = new RoomState();

  private rooms: Map<UUID, Controller>;

  // Prevent further instantiation.
  private constructor() {
    this.rooms = new Map();
    this.rooms.set('test', new Controller('test'));
  }

  /**
   * @description Creates a new room.
   * @returns - The UID of the new room.
   */
  public createRoom(): UUID {
    const newUid: UUID = uuidv4();
    this.rooms.set(newUid, new Controller(newUid));
    return newUid;
  }

  /**
   * @description Does a room with the provided UID exist?
   * @param uid - The UID of the room.
   * @returns - Whether the room exists.
   */
  public doesRoomExist(uid: UUID): boolean {
    return this.rooms.has(uid);
  }

  /**
   * @description Gets the controller for the provided room.
   * @param uid - The UID of the room.
   * @return - The controller for that room.
   */
  public getRoom(uid: UUID): Controller {
    if (!this.doesRoomExist(uid)) {
      throw new Error(`Room with UID ${uid} does not exist.`);
    }

    return this.rooms.get(uid)!;
  }
}
