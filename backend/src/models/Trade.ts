import { Schema, model, Document } from "mongoose";
import {
  ITradeNotes,
  ITradePsychology,
  ITradeScreenshots,
  ITradeCalculated,
  TradeSide,
  TradeResult,
  Emotion,
} from "../types/trade";

export interface ITrade extends Document, ITradeCalculated {
  date: Date;
  stock: string;
  side: TradeSide;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  stopLoss?: number;
  target?: number;
  entryTime?: string; // "HH:mm"
  exitTime?: string; // "HH:mm"
  charges: number;
  setup?: string;
  reasonEntry?: string;
  reasonExit?: string;
  result: TradeResult;
  notes: ITradeNotes;
  psychology: ITradePsychology;
  screenshots: ITradeScreenshots;
  createdAt: Date;
  updatedAt: Date;
}

const EMOTIONS: Emotion[] = [
  "CALM",
  "FOMO",
  "FEAR",
  "GREED",
  "REVENGE",
  "IMPATIENT",
  "OVERCONFIDENT",
];

const TradeSchema = new Schema<ITrade>(
  {
    date: { type: Date, required: true },
    stock: { type: String, required: true, trim: true, uppercase: true },
    side: { type: String, enum: ["LONG", "SHORT"], required: true },
    entryPrice: { type: Number, required: true },
    exitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    stopLoss: { type: Number },
    target: { type: Number },
    entryTime: { type: String },
    exitTime: { type: String },
    charges: { type: Number, default: 0 },
    setup: { type: String, trim: true },
    reasonEntry: { type: String },
    reasonExit: { type: String },
    result: { type: String, enum: ["WIN", "LOSS", "BE"], required: true },

    notes: {
      whyEnter: String,
      whatHappened: String,
      whyExit: String,
      whatRight: String,
      whatWrong: String,
      nextTime: String,
    },

    psychology: {
      emotions: { type: [String], enum: EMOTIONS, default: [] },
      followedPlan: { type: Boolean, default: true },
      movedSL: { type: Boolean, default: false },
      overtraded: { type: Boolean, default: false },
      chasedEntry: { type: Boolean, default: false },
    },

    screenshots: {
      before: String,
      after: String,
      exit: String,
    },

    // Calculated + cached at write time for fast aggregation queries
    grossPnl: { type: Number, required: true },
    netPnl: { type: Number, required: true },
    pctReturn: { type: Number, required: true },
    riskAmount: { type: Number, required: true },
    rMultiple: { type: Number, default: null },
    holdingTimeMinutes: { type: Number, default: null },
  },
  { timestamps: true }
);

TradeSchema.index({ date: -1 });
TradeSchema.index({ stock: 1 });
TradeSchema.index({ setup: 1 });
TradeSchema.index({ result: 1 });

export default model<ITrade>("Trade", TradeSchema);
