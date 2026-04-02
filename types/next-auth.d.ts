import { Role } from "./domain";

declare module "next-auth" {
  interface Session {
    user: {
      id: number;
      uuid: string;
      username: string;
      role: Role;
      name: string;
    };
  }

  interface User {
    id: number;
    uuid: string;
    username: string;
    role: Role;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    uuid: string;
    username: string;
    role: Role;
  }
}

