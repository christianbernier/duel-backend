import {
  IncomingTransmissionType,
  ValidIncomingTransmission,
} from '../server/validators';
import { UUID } from './uuid';

export type TransmissionListener = {
  on: IncomingTransmissionType;
  do: (transmission: ValidIncomingTransmission, playerUid: UUID) => void;
  times: number;
  additionalCheck?: (
    transmission: ValidIncomingTransmission,
    playerUid: UUID,
  ) => boolean;
};
