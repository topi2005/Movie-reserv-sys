"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
// src/services/auth.service.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const SALT_ROUNDS = 12;
class AuthService {
    /** Create a new regular user account */
    async register(input) {
        const existing = await prisma_1.default.user.findUnique({
            where: { email: input.email.toLowerCase() },
        });
        if (existing)
            throw new errors_1.ConflictError("Email already registered");
        const passwordHash = await bcryptjs_1.default.hash(input.password, SALT_ROUNDS);
        const user = await prisma_1.default.user.create({
            data: {
                email: input.email.toLowerCase(),
                passwordHash,
                name: input.name,
                role: "USER",
            },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        const token = (0, jwt_1.signToken)({ sub: user.id, email: user.email, role: user.role });
        return { user, token };
    }
    /** Authenticate an existing user */
    async login(input) {
        const user = await prisma_1.default.user.findUnique({
            where: { email: input.email.toLowerCase() },
        });
        if (!user)
            throw new errors_1.UnauthorizedError("Invalid email or password");
        const valid = await bcryptjs_1.default.compare(input.password, user.passwordHash);
        if (!valid)
            throw new errors_1.UnauthorizedError("Invalid email or password");
        const token = (0, jwt_1.signToken)({ sub: user.id, email: user.email, role: user.role });
        const { passwordHash: _, ...safeUser } = user;
        return { user: safeUser, token };
    }
    /** Return profile for the currently-authenticated user */
    async getProfile(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, name: true, role: true, createdAt: true },
        });
        if (!user)
            throw new errors_1.NotFoundError("User");
        return user;
    }
    /**
     * Promote a user to ADMIN role.
     * Only an existing ADMIN may call this.
     */
    async promoteToAdmin(targetUserId, requestingUserId) {
        const requester = await prisma_1.default.user.findUnique({
            where: { id: requestingUserId },
        });
        if (!requester || requester.role !== "ADMIN") {
            throw new errors_1.ForbiddenError("Only admins can promote users");
        }
        const target = await prisma_1.default.user.findUnique({ where: { id: targetUserId } });
        if (!target)
            throw new errors_1.NotFoundError("User");
        if (target.role === "ADMIN")
            throw new errors_1.ConflictError("User is already an admin");
        const updated = await prisma_1.default.user.update({
            where: { id: targetUserId },
            data: { role: "ADMIN" },
            select: { id: true, email: true, name: true, role: true },
        });
        return updated;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.services.js.map