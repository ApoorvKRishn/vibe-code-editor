import {userRole} from "@prisma/client";
import NextAuth , {type DefaultSession} from "next-auth"

export type ExtendedUser = DefaultSession["user"] & {
    role: userRole
}

declare module "next-auth"{
    interface Session{
        user: ExtendedUser
    }
}

import {JWT} from "next/jwt";

declare module "next-auth/jwt"{
    interface JWT{
        role: userRole;
    }
}