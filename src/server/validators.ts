import { Card } from '../models';

const validTransmissionTypes = ['START_GAME', 'STAGE_CARD_CLICKED'] as const;

export type IncomingTransmissionType = (typeof validTransmissionTypes)[number];
interface BaseIncomingTransmission {
  type: IncomingTransmissionType;
}

export interface StartGameTransmission extends BaseIncomingTransmission {
  type: 'START_GAME';
}

export interface StageCardClickedTransmission extends BaseIncomingTransmission {
  type: 'STAGE_CARD_CLICKED';
  card: Card;
}

export type ValidIncomingTransmission =
  | StartGameTransmission
  | StageCardClickedTransmission;

/**
 * @description Checks whether the incoming transmission is a valid one.
 * @param incomingTransmission - The incoming transmission.
 * @returns - Whether the transmission is valid.
 */
export const isValid = (
  incomingTransmission: unknown,
): incomingTransmission is ValidIncomingTransmission => {
  if (!incomingTransmission) return false;
  if (typeof incomingTransmission !== 'object') return false;
  if (!('type' in incomingTransmission)) return false;
  if (!(typeof incomingTransmission.type === 'string')) return false;
  if (
    !validTransmissionTypes.find(
      (type: IncomingTransmissionType): boolean =>
        type === incomingTransmission.type,
    )
  )
    return false;

  const type = incomingTransmission.type as IncomingTransmissionType;
  const keys = Object.keys(incomingTransmission);

  switch (type) {
    case 'START_GAME':
      return keys.length === 1 && keys[0] === 'type';
    case 'STAGE_CARD_CLICKED':
      return keys.length === 2;

    // Exhaustive switch statement. The case below will throw
    // a type error if a value of IncomingTransmissionType is
    // not included in the switch statement.
    default:
      const _: never = type;
      throw new Error('Invalid transmission type.');
  }

  return true;
};

/**
 * @description Asserts that the incoming transmission is a valid one.
 * @param incomingTransmission - The incoming transmission.
 * @throws Error - If the transmission is invalid.
 */
export function assertValid(
  incomingTransmission: unknown,
): asserts incomingTransmission is ValidIncomingTransmission {
  if (!isValid(incomingTransmission)) {
    throw new Error('Incoming transmission is invalid.');
  }
}
