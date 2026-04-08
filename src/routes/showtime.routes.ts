// src/routes/showtime.routes.ts
import { Router } from "express";
import { body } from "express-validator";
import { showtimeController } from "../controllers/showtime.controller";
import { authenticate, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";

const router = Router();

// GET /showtimes  – public (supports ?date=YYYY-MM-DD &movieId= &hallId=)
router.get("/", showtimeController.list.bind(showtimeController));

// GET /showtimes/:id  – public (full seat map)
router.get("/:id", showtimeController.getOne.bind(showtimeController));

// POST /showtimes  – admin only
router.post(
  "/",
  authenticate,
  adminOnly,
  validate([
    body("movieId").notEmpty().withMessage("movieId is required"),
    body("hallId").notEmpty().withMessage("hallId is required"),
    body("startsAt").isISO8601().withMessage("startsAt must be a valid ISO 8601 date"),
    body("priceAmount")
      .isFloat({ min: 0 })
      .withMessage("priceAmount must be a non-negative number"),
    body("priceCurrency")
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage("priceCurrency must be a 3-letter ISO code"),
  ]),
  showtimeController.create.bind(showtimeController)
);

// DELETE /showtimes/:id  – admin only
router.delete(
  "/:id",
  authenticate,
  adminOnly,
  showtimeController.delete.bind(showtimeController)
);

export default router;