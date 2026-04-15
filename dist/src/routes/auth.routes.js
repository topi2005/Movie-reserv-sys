"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/auth.routes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
// POST /auth/register
router.post("/register", (0, validate_1.validate)([
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/)
        .withMessage("Password must contain an uppercase letter")
        .matches(/[0-9]/)
        .withMessage("Password must contain a number"),
    (0, express_validator_1.body)("name").trim().notEmpty().withMessage("Name is required"),
]), auth_controller_1.authController.register.bind(auth_controller_1.authController));
// POST /auth/login
router.post("/login", (0, validate_1.validate)([
    (0, express_validator_1.body)("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
]), auth_controller_1.authController.login.bind(auth_controller_1.authController));
// GET /auth/me  (protected)
router.get("/me", auth_1.authenticate, auth_controller_1.authController.getProfile.bind(auth_controller_1.authController));
// PATCH /auth/users/:userId/promote  (admin only)
router.patch("/users/:userId/promote", auth_1.authenticate, auth_1.adminOnly, auth_controller_1.authController.promoteUser.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map