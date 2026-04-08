// src/routes/movie.routes.ts
import { Router } from "express";
import { body } from "express-validator";
import { movieController } from "../controllers/movie.controller";
import { authenticate, adminOnly } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadPoster } from "../utils/upload";

const router = Router();

const movieBodyRules = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("durationMin")
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer (minutes)"),
  body("genre")
    .isIn([
      "ACTION","COMEDY","DRAMA","HORROR","THRILLER","ROMANCE",
      "SCIENCE_FICTION","ANIMATION","DOCUMENTARY","FANTASY",
    ])
    .withMessage("Invalid genre"),
];

// GET /movies  – public
router.get("/", movieController.list.bind(movieController));

// GET /movies/:id  – public
router.get("/:id", movieController.getOne.bind(movieController));

// POST /movies  – admin only
router.post(
  "/",
  authenticate,
  adminOnly,
  uploadPoster,
  validate(movieBodyRules),
  movieController.create.bind(movieController)
);

// PATCH /movies/:id  – admin only
router.patch(
  "/:id",
  authenticate,
  adminOnly,
  uploadPoster,
  movieController.update.bind(movieController)
);

// DELETE /movies/:id  – admin only
router.delete(
  "/:id",
  authenticate,
  adminOnly,
  movieController.delete.bind(movieController)
);

export default router;