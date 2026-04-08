// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.services";
import { sendSuccess } from "../utils/response";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, 201);
    } catch (err) {
      return next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.sub);
      return sendSuccess(res, user);
    } catch (err) {
      return next(err);
    }
  }

  async promoteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await authService.promoteToAdmin(
        req.params.userId,
        req.user!.sub
      );
      return sendSuccess(res, updated);
    } catch (err) {
      return next(err);
    }
  }
}

export const authController = new AuthController();