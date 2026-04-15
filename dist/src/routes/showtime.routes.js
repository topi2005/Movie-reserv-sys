"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/showtime.routes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const showtime_controller_1 = require("../controllers/showtime.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// GET /showtimes  – public (supports ?date=YYYY-MM-DD &movieId= &hallId=)
router.get("/", showtime_controller_1.showtimeController.list.bind(showtime_controller_1.showtimeController));
// GET /showtimes/:id  – public (full seat map)
router.get("/:id", showtime_controller_1.showtimeController.getOne.bind(showtime_controller_1.showtimeController));
// POST /showtimes  – admin only
router.post("/", auth_1.authenticate, auth_1.adminOnly, (0, validate_1.validate)([
    (0, express_validator_1.body)("movieId").notEmpty().withMessage("movieId is required"),
    (0, express_validator_1.body)("hallId").notEmpty().withMessage("hallId is required"),
    (0, express_validator_1.body)("startsAt").isISO8601().withMessage("startsAt must be a valid ISO 8601 date"),
    (0, express_validator_1.body)("priceAmount")
        .isFloat({ min: 0 })
        .withMessage("priceAmount must be a non-negative number"),
    (0, express_validator_1.body)("priceCurrency")
        .optional()
        .isLength({ min: 3, max: 3 })
        .withMessage("priceCurrency must be a 3-letter ISO code"),
]), showtime_controller_1.showtimeController.create.bind(showtime_controller_1.showtimeController));
// DELETE /showtimes/:id  – admin only
router.delete("/:id", auth_1.authenticate, auth_1.adminOnly, showtime_controller_1.showtimeController.delete.bind(showtime_controller_1.showtimeController));
exports.default = router;
//# sourceMappingURL=showtime.routes.js.map