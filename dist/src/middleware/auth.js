"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userOrAdmin = exports.adminOnly = void 0;
exports.authenticate = authenticate;
exports.authorize = authorize;
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
/**
 * authenticate – verifies the Bearer token in the Authorization header
 * and attaches the decoded payload to req.user.
 */
function authenticate(req, _res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return next(new errors_1.UnauthorizedError("No token provided"));
    }
    const token = header.slice(7);
    try {
        req.user = (0, jwt_1.verifyToken)(token);
        return next();
    }
    catch (err) {
        return next(err);
    }
}
/**
 * authorize – factory that creates a middleware checking that req.user
 * has one of the allowed roles.
 */
function authorize(...roles) {
    return (req, _res, next) => {
        if (!req.user)
            return next(new errors_1.UnauthorizedError());
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError());
        }
        return next();
    };
}
/** Convenience aliases */
exports.adminOnly = authorize("ADMIN");
exports.userOrAdmin = authorize("USER", "ADMIN");
//# sourceMappingURL=auth.js.map