"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationController = exports.ReservationController = void 0;
const reservation_service_1 = require("../services/reservation.service");
const response_1 = require("../utils/response");
class ReservationController {
    /** POST /reservations – reserve seats */
    async reserve(req, res, next) {
        try {
            const reservations = await reservation_service_1.reservationService.reserve({
                userId: req.user.sub,
                showtimeId: req.body.showtimeId,
                seatIds: req.body.seatIds,
            });
            return (0, response_1.sendSuccess)(res, reservations, 201);
        }
        catch (err) {
            return next(err);
        }
    }
    /** GET /reservations/me – my reservations */
    async listMine(req, res, next) {
        try {
            const { page, limit, status } = req.query;
            const result = await reservation_service_1.reservationService.listMyReservations(req.user.sub, {
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                status: status,
            });
            return (0, response_1.sendPaginated)(res, result.reservations, result.total, result.page, result.limit);
        }
        catch (err) {
            return next(err);
        }
    }
    /** DELETE /reservations/:id – cancel my reservation */
    async cancel(req, res, next) {
        try {
            const result = await reservation_service_1.reservationService.cancel(req.params.id, req.user.sub);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            return next(err);
        }
    }
    // ── Admin ──────────────────────────────────────────────
    /** GET /admin/reservations – all reservations */
    async listAll(req, res, next) {
        try {
            const { page, limit, status, showtimeId } = req.query;
            const result = await reservation_service_1.reservationService.listAll({
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
                status: status,
                showtimeId,
            });
            return (0, response_1.sendPaginated)(res, result.reservations, result.total, result.page, result.limit);
        }
        catch (err) {
            return next(err);
        }
    }
    /** GET /admin/reports – capacity & revenue report */
    async report(req, res, next) {
        try {
            const { fromDate, toDate, movieId } = req.query;
            const data = await reservation_service_1.reservationService.report({ fromDate, toDate, movieId });
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.ReservationController = ReservationController;
exports.reservationController = new ReservationController();
//# sourceMappingURL=reservation.controller.js.map