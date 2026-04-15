"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showtimeController = exports.ShowtimeController = void 0;
const showtime_service_1 = require("../services/showtime.service");
const response_1 = require("../utils/response");
class ShowtimeController {
    async list(req, res, next) {
        try {
            const { date, movieId, hallId } = req.query;
            const showtimes = await showtime_service_1.showtimeService.list({ date, movieId, hallId });
            return (0, response_1.sendSuccess)(res, showtimes);
        }
        catch (err) {
            return next(err);
        }
    }
    async getOne(req, res, next) {
        try {
            const showtime = await showtime_service_1.showtimeService.getById(req.params.id);
            return (0, response_1.sendSuccess)(res, showtime);
        }
        catch (err) {
            return next(err);
        }
    }
    async create(req, res, next) {
        try {
            const showtime = await showtime_service_1.showtimeService.create({
                ...req.body,
                startsAt: new Date(req.body.startsAt),
                priceAmount: Number(req.body.priceAmount),
            });
            return (0, response_1.sendSuccess)(res, showtime, 201);
        }
        catch (err) {
            return next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await showtime_service_1.showtimeService.delete(req.params.id);
            return (0, response_1.sendSuccess)(res, { message: "Showtime deleted successfully" });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.ShowtimeController = ShowtimeController;
exports.showtimeController = new ShowtimeController();
//# sourceMappingURL=showtime.controller.js.map