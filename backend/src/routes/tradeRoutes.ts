import { Router } from "express";
import {
  createTrade,
  updateTrade,
  deleteTrade,
  getTrade,
  listTrades,
  getCalendar,
  getTradesForDay,
} from "../controllers/tradeController";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/calendar", getCalendar);
router.get("/day/:date", getTradesForDay);

router.get("/", listTrades);
router.post("/", createTrade);
router.get("/:id", getTrade);
router.put("/:id", updateTrade);
router.delete("/:id", deleteTrade);

// Screenshot upload: field name must be "screenshot"; ?type=before|after|exit
router.post("/:id/screenshot", upload.single("screenshot"), async (req, res) => {
  const Trade = (await import("../models/Trade")).default;
  const type = (req.query.type as string) || "before";
  if (!["before", "after", "exit"].includes(type)) {
    return res.status(400).json({ message: "type must be before|after|exit" });
  }
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const trade = await Trade.findById(req.params.id);
  if (!trade) return res.status(404).json({ message: "Trade not found" });

  const url = `/uploads/${req.file.filename}`;
  (trade.screenshots as any)[type] = url;
  await trade.save();

  res.json({ url, screenshots: trade.screenshots });
});

export default router;
