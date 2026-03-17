import { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/roles";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: number;
      role: AppRole;
      rememberMe?: boolean;
    };
  }

  interface User {
    role: AppRole;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    role?: AppRole;
    rememberMe?: boolean;
  }
}
