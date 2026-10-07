import type { Request, Response } from "express";
import { z } from "zod";
import * as authService from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "lawyer", "assistant"]),
  licenseNo: z.string().optional(),
  phone: z.string().optional()
});

export async function login(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);
  const data = await authService.login(input.email, input.password);
  res.json({ data });
}

export async function me(req: Request, res: Response) {
  res.json({ data: req.user });
}

export async function register(req: Request, res: Response) {
  const input = registerSchema.parse(req.body);
  const data = await authService.registerUser(input);
  res.status(201).json({ data });
}

