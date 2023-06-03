export type ArmyStagePortion = (
  | {
      type: 'VICTORY';
    }
  | {
      type: 'POINTS';
      side: 'A' | 'B';
      victoryPoints: number;
      coinPenalty: 0 | 2 | 5;
    }
  | {
      type: 'CENTER';
    }
) & {
  indices: (number | 'A_VICTORY' | 'B_VICTORY')[];
};
