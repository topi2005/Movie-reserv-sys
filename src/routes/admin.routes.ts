// src/routes/admin.routes.ts
import { Router } from "express";
import { authenticate, adminOnly } from "../middleware/auth";
import { reservationController } from "../controllers/reservation.controller";

const router = Router();

// All admin routes are protected by authenticate + adminOnly
router.use(authenticate, adminOnly);

// GET /admin/reservations
router.get("/reservations", reservationController.listAll.bind(reservationController));

// GET /admin/reports
router.get("/reports", reservationController.report.bind(reservationController));

export default router;