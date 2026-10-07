import type { Request, Response } from "express";
import { z } from "zod";
import type { CaseFilters } from "../services/case.service";
import * as caseService from "../services/case.service";
import { HttpError } from "../utils/http-error";

const caseTypeSchema = z.enum(["civil", "criminal", "administrative", "commercial", "labor"]);
const caseStatusSchema = z.enum(["filed", "investigating", "hearing", "closed", "archived"]);

const createCaseSchema = z.object({
  caseNo: z.string().min(3),
  title: z.string().min(2),
  type: caseTypeSchema,
  status: caseStatusSchema.optional(),
  acceptedAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  closedAt: z.string().optional().nullable(),
  summary: z.string().min(5),
  clientId: z.string().uuid(),
  mainLawyerId: z.string().uuid(),
  collaboratorIds: z.array(z.string().uuid()).optional()
});

const statusSchema = z.object({
  status: caseStatusSchema
});

const assignSchema = z.object({
  mainLawyerId: z.string().uuid(),
  collaboratorIds: z.array(z.string().uuid()).default([])
});

export async function list(req: Request, res: Response) {
  const filters: CaseFilters = {
    type: typeof req.query.type === "string" ? caseTypeSchema.parse(req.query.type) : undefined,
    status: typeof req.query.status === "string" ? caseStatusSchema.parse(req.query.status) : undefined,
    lawyerId: typeof req.query.lawyerId === "string" ? req.query.lawyerId : undefined,
    startDate: typeof req.query.startDate === "string" ? req.query.startDate : undefined,
    endDate: typeof req.query.endDate === "string" ? req.query.endDate : undefined
  };
  const data = await caseService.listCases(filters);
  res.json({ data });
}

export async function detail(req: Request, res: Response) {
  const data = await caseService.getCase(req.params.id);
  if (!data) {
    throw new HttpError(404, "Case not found");
  }
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const input = createCaseSchema.parse(req.body);
  const data = await caseService.createCase(input);
  res.status(201).json({ data });
}

export async function updateStatus(req: Request, res: Response) {
  const { status } = statusSchema.parse(req.body);
  const data = await caseService.updateCaseStatus(req.params.id, status);
  res.json({ data });
}

export async function assignLawyers(req: Request, res: Response) {
  const input = assignSchema.parse(req.body);
  const data = await caseService.assignLawyers(req.params.id, input.mainLawyerId, input.collaboratorIds);
  res.json({ data });
}

