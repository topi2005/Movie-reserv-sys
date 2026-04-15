export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export declare class AuthService {
    /** Create a new regular user account */
    register(input: RegisterInput): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            name: string;
            createdAt: Date;
        };
        token: string;
    }>;
    /** Authenticate an existing user */
    login(input: LoginInput): Promise<{
        user: {
            email: string;
            role: import(".prisma/client").$Enums.Role;
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    /** Return profile for the currently-authenticated user */
    getProfile(userId: string): Promise<{
        email: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        name: string;
        createdAt: Date;
    }>;
    /**
     * Promote a user to ADMIN role.
     * Only an existing ADMIN may call this.
     */
    promoteToAdmin(targetUserId: string, requestingUserId: string): Promise<{
        email: string;
        role: import(".prisma/client").$Enums.Role;
        id: string;
        name: string;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=auth.services.d.ts.map