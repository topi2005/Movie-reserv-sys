// src/routes/reservation.routes.ts
import { Router } from "express";
import { body } from "express-validator";
import { reservationController } from "../controllers/reservation.controller";
import { authenticate, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// POST /reservations  – authenticated users
router.post(
  "/",
  authenticate,
  validate([
    body("showtimeId").notEmpty().withMessage("showtimeId is required"),
    body("seatIds")
      .isArray({ min: 1, max: 10 })
      .withMessage("seatIds must be a non-empty array (max 10)"),
    body("seatIds.*").isString().withMessage("Each seatId must be a string"),
  ]),
  reservationController.reserve.bind(reservationController)
);

// GET /reservations/me  – my reservations
router.get(
  "/me",
  authenticate,
  reservationController.listMine.bind(reservationController)
);

// DELETE /reservations/:id  – cancel my reservation
router.delete(
  "/:id",
  authenticate,
  reservationController.cancel.bind(reservationController)
);

// ── Admin routes ──────────────────────────────────────────

// GET /reservations  – all reservations (admin)
router.get(
  "/",
  authenticate,
  adminOnly,
  reservationController.listAll.bind(reservationController)
);

export default router;