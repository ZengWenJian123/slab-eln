import { z } from "zod";

export const userSchema = z.object({
  username: z.string().min(3),
  realName: z.string().min(1),
  role: z.enum(["ADMIN", "OPERATOR", "VIEWER"]),
  status: z.boolean().default(true),
  password: z.string().min(6).optional()
});

