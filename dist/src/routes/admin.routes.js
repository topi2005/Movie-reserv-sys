"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/admin.routes.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reservation_controller_1 = require("../controllers/reservation.controller");
const router = (0, express_1.Router)();
// All admin routes are protected by authenticate + adminOnly
router.use(auth_1.authenticate, auth_1.adminOnly);
// GET /admin/reservations
router.get("/reservations", reservation_controller_1.reservationController.listAll.bind(reservation_controller_1.reservationController));
// GET /admin/reports
router.get("/reports", reservation_controller_1.reservationController.report.bind(reservation_controller_1.reservationController));
exports.default = router;
//# sourceMappingURL=admin.routes.js.map