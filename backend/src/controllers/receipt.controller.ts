import type { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../utils/http-error";
import * as receiptService from "../services/receipt.service";
import { prisma } from "../utils/prisma";

const amountSchema = z
  .union([z.string(), z.number()])
  .refine((value) => Number(value) > 0, { message: "到账金额必须大于 0" })
  .transform(String);

const createReceiptSchema = z.object({
  receiptNo: z.string().min(3),
  amount: amountSchema,
  receivedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  payerName: z.string().max(100).optional(),
  payChannel: z.string().max(50).optional(),
  remark: z.string().max(500).optional(),
  caseId: z.string().uuid().optional().nullable()
});

const correctReceiptSchema = z.object({
  amount: amountSchema.optional(),
  receivedAt: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  payerName: z.string().max(100).optional(),
  payChannel: z.string().max(50).optional(),
  remark: z.string().max(500).optional(),
  caseId: z.string().uuid().optional().nullable()
});

export async function list(req: Request, res: Response) {
  const data = await receiptService.listReceipts({
    caseId: typeof req.query.caseId === "string" ? req.query.caseId : undefined
  });
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = createReceiptSchema.parse(req.body);
  if (input.caseId) {
    const caseExists = await prisma.case.findUnique({ where: { id: input.caseId }, select: { id: true } });
    if (!caseExists) {
      throw new HttpError(404, "关联案件不存在");
    }
  }
  const data = await receiptService.createReceipt(input, req.user!.id);
  res.status(201).json({ data });
}

export async function correct(req: Request, res: Response) {
  const patch = correctReceiptSchema.parse(req.body);
  const existing = await prisma.paymentReceipt.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new HttpError(404, "到账流水不存在");
  }
  if (patch.caseId) {
    const caseExists = await prisma.case.findUnique({ where: { id: patch.caseId }, select: { id: true } });
    if (!caseExists) {
      throw new HttpError(404, "关联案件不存在");
    }
  }
  const data = await receiptService.correctReceipt(req.params.id, patch, req.user!.id);
  res.json({ data });
}
