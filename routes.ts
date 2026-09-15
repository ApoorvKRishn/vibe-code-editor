/**
 * An Array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */

export const publicRoutes: string[] = [
    "/",
]

export const protectedRoutes: string[] = [
    "/dashboard",
    "/playground",
]

export const authRoutes: string[] = [
    "/auth/sign-in",
]

export const apiAuthPrefix: string = "/api/auth"

export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
