import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must contain at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().url().default("http://localhost:5173"),
  RENDER_URL: z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional()),
  RESEND_API_KEY: z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional()),
  REMINDER_FROM_EMAIL: z.preprocess((value) => value === "" ? undefined : value, z.string().email().optional()),
}).refine(
  (env) => Boolean(env.RESEND_API_KEY) === Boolean(env.REMINDER_FROM_EMAIL),
  { message: "RESEND_API_KEY and REMINDER_FROM_EMAIL must be configured together", path: ["RESEND_API_KEY"] },
);

const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error("Invalid environment configuration:", result.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = result.data;
