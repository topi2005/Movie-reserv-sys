"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
// src/utils/jwt.ts
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d");
if (!SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
}
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, SECRET);
    }
    catch (err) {
        if (err instanceof jsonwebtoken_1.default.TokenExpiredError) {
            throw new errors_1.UnauthorizedError("Token has expired");
        }
        throw new errors_1.UnauthorizedError("Invalid token");
    }
}
//# sourceMappingURL=jwt.js.map