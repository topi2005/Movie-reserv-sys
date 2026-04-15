"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendPaginated = sendPaginated;
function sendSuccess(res, data, statusCode = 200, meta) {
    return res.status(statusCode).json({
        success: true,
        data,
        ...(meta ? { meta } : {}),
    });
}
function sendPaginated(res, data, total, page, limit) {
    return res.status(200).json({
        success: true,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
    });
}
//# sourceMappingURL=response.js.map