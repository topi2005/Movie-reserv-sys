// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import prisma from "../utils/prisma";
import { signToken } from "../utils/jwt";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from "../utils/errors";

const SALT_ROUNDS = 12;

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  /** Create a new regular user account */
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        name: input.name,
        role: "USER",
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { user, token };
  }

  /** Authenticate an existing user */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user) throw new UnauthorizedError("Invalid email or password");

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid email or password");

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, token };
  }

  /** Return profile for the currently-authenticated user */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundError("User");
    return user;
  }

  /**
   * Promote a user to ADMIN role.
   * Only an existing ADMIN may call this.
   */
  async promoteToAdmin(targetUserId: string, requestingUserId: string) {
    const requester = await prisma.user.findUnique({
      where: { id: requestingUserId },
    });
    if (!requester || requester.role !== "ADMIN") {
      throw new ForbiddenError("Only admins can promote users");
    }

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new NotFoundError("User");
    if (target.role === "ADMIN") throw new ConflictError("User is already an admin");

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: "ADMIN" },
      select: { id: true, email: true, name: true, role: true },
    });
    return updated;
  }
}

export const authService = new AuthService();