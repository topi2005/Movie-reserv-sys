"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const express_validator_1 = require("express-validator");
const errors_1 = require("../utils/errors");
/**
 * validate – runs a chain of express-validator rules and forwards any
 * validation errors as a single ValidationError.
 */
function validate(chains) {
    return async (req, _res, next) => {
        // Run all chains in parallel
        await Promise.all(chains.map((chain) => chain.run(req)));
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty())
            return next();
        const messages = errors
            .array()
            .map((e) => e.msg)
            .join("; ");
        return next(new errors_1.ValidationError(messages));
    };
}
//# sourceMappingURL=validate.js.map