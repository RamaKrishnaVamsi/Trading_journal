import { Router } from "express";
import { getDashboard, getPerformance } from "../controllers/analyticsController";

const router = Router();

router.get("/dashboard", getDashboard);
router.get("/performance", getPerformance);

export default router;
