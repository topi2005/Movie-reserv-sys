"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/reservation.routes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const reservation_controller_1 = require("../controllers/reservation.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// POST /reservations  – authenticated users
router.post("/", auth_1.authenticate, (0, validate_1.validate)([
    (0, express_validator_1.body)("showtimeId").notEmpty().withMessage("showtimeId is required"),
    (0, express_validator_1.body)("seatIds")
        .isArray({ min: 1, max: 10 })
        .withMessage("seatIds must be a non-empty array (max 10)"),
    (0, express_validator_1.body)("seatIds.*").isString().withMessage("Each seatId must be a string"),
]), reservation_controller_1.reservationController.reserve.bind(reservation_controller_1.reservationController));
// GET /reservations/me  – my reservations
router.get("/me", auth_1.authenticate, reservation_controller_1.reservationController.listMine.bind(reservation_controller_1.reservationController));
// DELETE /reservations/:id  – cancel my reservation
router.delete("/:id", auth_1.authenticate, reservation_controller_1.reservationController.cancel.bind(reservation_controller_1.reservationController));
// ── Admin routes ──────────────────────────────────────────
// GET /reservations  – all reservations (admin)
router.get("/", auth_1.authenticate, auth_1.adminOnly, reservation_controller_1.reservationController.listAll.bind(reservation_controller_1.reservationController));
exports.default = router;
//# sourceMappingURL=reservation.routes.js.map