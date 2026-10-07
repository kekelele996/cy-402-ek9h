import type { Request, Response } from "express";
import * as userService from "../services/user.service";

export async function list(req: Request, res: Response) {
  const data = await userService.listUsers();
  res.json({ data });
}

