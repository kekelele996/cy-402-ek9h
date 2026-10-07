import type { Request, Response } from "express";
import { HttpError } from "../utils/http-error";
import { prisma } from "../utils/prisma";
import * as reconciliationService from "../services/reconciliation.service";

/** 试算（不落库）：给前端展示“对得上 / 对不上”及两边的逐笔明细。 */
export async function preview(req: Request, res: Response) {
  const caseRecord = await prisma.case.findUnique({ where: { id: req.params.id } });
  if (!caseRecord) {
    throw new HttpError(404, "Case not found");
  }
  const latest = await reconciliationService.getLatestReconciliation(req.params.id);
  const result = await reconciliationService.evaluateCase(req.params.id);
  res.json({
    data: {
      caseId: req.params.id,
      caseNo: caseRecord.caseNo,
      // 旧案件从没对过账：保持未对账，不能把账单金额当成已收
      reconciliationStatus: latest?.status ?? "unreconciled",
      latestRecord: latest,
      result
    }
  });
}

/** 正式对账：落库一条对账记录，并更新案件对账状态（待核 / 相符）。 */
export async function run(req: Request, res: Response) {
  const caseRecord = await prisma.case.findUnique({ where: { id: req.params.id } });
  if (!caseRecord) {
    throw new HttpError(404, "Case not found");
  }
  const data = await reconciliationService.runReconciliation(req.params.id, req.user!.id);
  res.status(201).json({ data });
}

export async function history(req: Request, res: Response) {
  const data = await reconciliationService.listReconciliations({ caseId: req.params.id });
  res.json({ data });
}
