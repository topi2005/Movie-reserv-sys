"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const auth_services_1 = require("../services/auth.services");
const response_1 = require("../utils/response");
class AuthController {
    async register(req, res, next) {
        try {
            const result = await auth_services_1.authService.register(req.body);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            return next(err);
        }
    }
    async login(req, res, next) {
        try {
            const result = await auth_services_1.authService.login(req.body);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            return next(err);
        }
    }
    async getProfile(req, res, next) {
        try {
            const user = await auth_services_1.authService.getProfile(req.user.sub);
            return (0, response_1.sendSuccess)(res, user);
        }
        catch (err) {
            return next(err);
        }
    }
    async promoteUser(req, res, next) {
        try {
            const updated = await auth_services_1.authService.promoteToAdmin(req.params.userId, req.user.sub);
            return (0, response_1.sendSuccess)(res, updated);
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map