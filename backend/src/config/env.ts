import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 chars"),
  PORT: z.coerce.number().default(29069),
  CORS_ORIGIN: z.string().optional(),
  UPLOAD_DIR: z.string().default("uploads")
});

export const env = envSchema.parse(process.env);

