export interface TokenPayload {
    sub: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
export declare function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string;
export declare function verifyToken(token: string): TokenPayload;
//# sourceMappingURL=jwt.d.ts.map