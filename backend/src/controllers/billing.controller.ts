import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import * as billingService from "../services/billing.service";

const billingTypeSchema = z.enum(["attorney_fee", "court_fee", "travel_fee", "other"]);
const billingStatusSchema = z.enum(["pending", "paid", "invoiced", "voided"]);

const createBillingSchema = z.object({
  billNo: z.string().min(3),
  type: billingTypeSchema,
  amount: z.union([z.string(), z.number()]).transform(String),
  status: billingStatusSchema.optional(),
  caseId: z.string().uuid(),
  clientId: z.string().uuid(),
  invoiceInfo: z.record(z.unknown()).optional()
});

const statusSchema = z.object({
  status: billingStatusSchema
});

export async function list(req: Request, res: Response) {
  const data = await billingService.listBillings({
    caseId: typeof req.query.caseId === "string" ? req.query.caseId : undefined,
    clientId: typeof req.query.clientId === "string" ? req.query.clientId : undefined,
    status: typeof req.query.status === "string" ? billingStatusSchema.parse(req.query.status) : undefined
  });
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = createBillingSchema.parse(req.body);
  const data = await billingService.createBilling({
    ...input,
    invoiceInfo: input.invoiceInfo as Prisma.InputJsonValue | undefined
  });
  res.status(201).json({ data });
}

export async function updateStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  const data = await billingService.updateBillingStatus(req.params.id, status);
  res.json({ data });
}

export async function summary(req: Request, res: Response) {
  const data = await billingService.billingSummary();
  res.json({ data });
}
