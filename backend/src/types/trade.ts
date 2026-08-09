export type TradeSide = "LONG" | "SHORT";
export type TradeResult = "WIN" | "LOSS" | "BE";

export type Emotion =
  | "CALM"
  | "FOMO"
  | "FEAR"
  | "GREED"
  | "REVENGE"
  | "IMPATIENT"
  | "OVERCONFIDENT";

export interface ITradeNotes {
  whyEnter?: string;
  whatHappened?: string;
  whyExit?: string;
  whatRight?: string;
  whatWrong?: string;
  nextTime?: string;
}

export interface ITradePsychology {
  emotions: Emotion[];
  followedPlan: boolean;
  movedSL: boolean;
  overtraded: boolean;
  chasedEntry: boolean;
}

export interface ITradeScreenshots {
  before?: string;
  after?: string;
  exit?: string;
}

export interface ITradeCalculated {
  grossPnl: number;
  netPnl: number;
  pctReturn: number;
  riskAmount: number;
  rMultiple: number | null;
  holdingTimeMinutes: number | null;
}
