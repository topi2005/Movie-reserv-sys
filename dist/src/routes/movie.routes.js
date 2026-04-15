"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/movie.routes.ts
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const movie_controller_1 = require("../controllers/movie.controller");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const upload_1 = require("../utils/upload");
const router = (0, express_1.Router)();
const movieBodyRules = [
    (0, express_validator_1.body)("title").trim().notEmpty().withMessage("Title is required"),
    (0, express_validator_1.body)("description").trim().notEmpty().withMessage("Description is required"),
    (0, express_validator_1.body)("durationMin")
        .isInt({ min: 1 })
        .withMessage("Duration must be a positive integer (minutes)"),
    (0, express_validator_1.body)("genre")
        .isIn([
        "ACTION", "COMEDY", "DRAMA", "HORROR", "THRILLER", "ROMANCE",
        "SCIENCE_FICTION", "ANIMATION", "DOCUMENTARY", "FANTASY",
    ])
        .withMessage("Invalid genre"),
];
// GET /movies  – public
router.get("/", movie_controller_1.movieController.list.bind(movie_controller_1.movieController));
// GET /movies/:id  – public
router.get("/:id", movie_controller_1.movieController.getOne.bind(movie_controller_1.movieController));
// POST /movies  – admin only
router.post("/", auth_1.authenticate, auth_1.adminOnly, upload_1.uploadPoster, (0, validate_1.validate)(movieBodyRules), movie_controller_1.movieController.create.bind(movie_controller_1.movieController));
// PATCH /movies/:id  – admin only
router.patch("/:id", auth_1.authenticate, auth_1.adminOnly, upload_1.uploadPoster, movie_controller_1.movieController.update.bind(movie_controller_1.movieController));
// DELETE /movies/:id  – admin only
router.delete("/:id", auth_1.authenticate, auth_1.adminOnly, movie_controller_1.movieController.delete.bind(movie_controller_1.movieController));
exports.default = router;
//# sourceMappingURL=movie.routes.js.map