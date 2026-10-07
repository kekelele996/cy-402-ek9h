import type { Request, Response } from "express";
import { z } from "zod";
import * as paymentService from "../services/payment.service";
import { HttpError } from "../utils/http-error";

const createPaymentSchema = z.object({
  paymentNo: z.string().min(3),
  caseId: z.string().uuid(),
  billNo: z.string().min(3).optional().nullable(),
  amount: z.union([z.string(), z.number()]).transform(String),
  receivedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  note: z.string().optional().nullable()
});

const correctPaymentSchema = z
  .object({
    billNo: z.string().min(3).optional().nullable(),
    amount: z.union([z.string(), z.number()]).transform(String).optional(),
    receivedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    note: z.string().optional().nullable()
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "At least one field must be provided"
  });

export async function list(req: Request, res: Response) {
  const data = await paymentService.listPayments({
    caseId: typeof req.query.caseId === "string" ? req.query.caseId : undefined,
    paymentNo: typeof req.query.paymentNo === "string" ? req.query.paymentNo : undefined
  });
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = createPaymentSchema.parse(req.body);
  const data = await paymentService.createPayment(input, req.user!.id);
  res.status(201).json({ data });
}

export async function correct(req: Request, res: Response) {
  const input = correctPaymentSchema.parse(req.body);
  const existing = await paymentService.getPayment(req.params.id);
  if (!existing) {
    throw new HttpError(404, "Payment not found");
  }
  const data = await paymentService.correctPayment(req.params.id, input);
  res.json({ data });
}

export async function voidPayment(req: Request, res: Response) {
  const existing = await paymentService.getPayment(req.params.id);
  if (!existing) {
    throw new HttpError(404, "Payment not found");
  }
  const data = await paymentService.voidPayment(req.params.id);
  res.json({ data });
}
