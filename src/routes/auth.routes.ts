// src/routes/auth.routes.ts
import { Router } from "express";
import { body } from "express-validator";
import { authController } from "../controllers/auth.controller";
import { authenticate, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// POST /auth/register
router.post(
  "/register",
  validate([
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
    body("name").trim().notEmpty().withMessage("Name is required"),
  ]),
  authController.register.bind(authController)
);

// POST /auth/login
router.post(
  "/login",
  validate([
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ]),
  authController.login.bind(authController)
);

// GET /auth/me  (protected)
router.get("/me", authenticate, authController.getProfile.bind(authController));

// PATCH /auth/users/:userId/promote  (admin only)
router.patch(
  "/users/:userId/promote",
  authenticate,
  adminOnly,
  authController.promoteUser.bind(authController)
);

export default router;