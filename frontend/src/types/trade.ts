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

export const EMOTIONS: Emotion[] = [
  "CALM",
  "FOMO",
  "FEAR",
  "GREED",
  "REVENGE",
  "IMPATIENT",
  "OVERCONFIDENT",
];

export interface TradeNotes {
  whyEnter?: string;
  whatHappened?: string;
  whyExit?: string;
  whatRight?: string;
  whatWrong?: string;
  nextTime?: string;
}

export interface TradePsychology {
  emotions: Emotion[];
  followedPlan: boolean;
  movedSL: boolean;
  overtraded: boolean;
  chasedEntry: boolean;
}

export interface TradeScreenshots {
  before?: string;
  after?: string;
  exit?: string;
}

export interface Trade {
  _id: string;
  date: string;
  stock: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  target?: number;
  entryTime?: string;
  exitTime?: string;
  charges: number;
  setup?: string;
  reasonEntry?: string;
  reasonExit?: string;
  result: TradeResult;
  notes: TradeNotes;
  psychology: TradePsychology;
  screenshots: TradeScreenshots;
  grossPnl: number;
  netPnl: number;
  pctReturn: number;
  riskAmount: number;
  rMultiple: number | null;
  holdingTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export type TradeFormInput = Omit<
  Trade,
  | "_id"
  | "grossPnl"
  | "netPnl"
  | "pctReturn"
  | "riskAmount"
  | "rMultiple"
  | "holdingTimeMinutes"
  | "createdAt"
  | "updatedAt"
  | "screenshots"
>;
