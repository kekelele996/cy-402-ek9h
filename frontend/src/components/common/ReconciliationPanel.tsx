import { Alert, Button, Descriptions, Divider, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";
import * as caseApi from "../../api/case";
import * as reconciliationApi from "../../api/reconciliation";
import * as receiptApi from "../../api/receipt";
import { PermissionGate } from "../../directives/permission";
import { useUserStore } from "../../stores/user";
import type { PaymentReceipt, ReconciliationPreview } from "../../types";
import { BillingTypeLabels, ReconciliationStatusLabels } from "../../types/enums";
import { formatDate, formatDateTime, formatMoney } from "../../utils/format";
import { CorrectReceiptModal, ReceiptForm } from "./ReceiptForm";

type Props = {
  caseId: string;
  caseStatus: string;
  /** 案件当前对账状态（可能来自案件详情；旧案件为 undefined/unreconciled） */
  status?: string;
  pendingNote?: string | null;
  receipts: PaymentReceipt[];
  onChanged: () => void;
};

export function ReconciliationPanel({ caseId, caseStatus, status, pendingNote, receipts, onChanged }: Props) {
  const hasRole = useUserStore((state) => state.hasRole);
  const [preview, setPreview] = useState<ReconciliationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [correcting, setCorrecting] = useState<PaymentReceipt | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPreview(await reconciliationApi.previewReconciliation(caseId));
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const effectiveStatus = preview?.reconciliationStatus ?? status ?? "unreconciled";
  const result = preview?.result;
  const closed = caseStatus === "closed" || caseStatus === "archived";

  async function run() {
    setRunning(true);
    try {
      await reconciliationApi.runReconciliation(caseId);
      message.success("对账已完成并记录");
      await load();
      onChanged();
    } finally {
      setRunning(false);
    }
  }

  async function closeCase() {
    try {
      await caseApi.updateCaseStatus(caseId, "closed");
      message.success("对账相符，案件已结案");
      onChanged();
    } catch (error) {
      if (extractReconciliationError(error)) {
        message.error("对账未通过，案件已标为待核，不能结案");
      } else {
        message.error("结案失败，请稍后重试");
      }
      await load();
      onChanged();
    }
  }

  async function registerReceipt(payload: receiptApi.ReceiptPayload) {
    await receiptApi.createReceipt({ ...payload, caseId });
    message.success("到账流水已登记");
    onChanged();
    await load();
  }

  const unmatchedBillColumns: ColumnsType<ReconciliationPreview["result"]["unmatchedBillings"][number]> = [
    { title: "账单编号", dataIndex: "billNo" },
    {
      title: "费用类型",
      dataIndex: "type",
      render: (value: keyof typeof BillingTypeLabels) => BillingTypeLabels[value]
    },
    { title: "未到账金额", dataIndex: "amount", render: formatMoney }
  ];

  const unmatchedReceiptColumns: ColumnsType<ReconciliationPreview["result"]["unmatchedReceipts"][number]> = [
    { title: "流水编号", dataIndex: "receiptNo" },
    { title: "到账日期", dataIndex: "receivedAt", render: formatDate },
    { title: "多出金额", dataIndex: "amount", render: formatMoney }
  ];

  const receiptColumns: ColumnsType<PaymentReceipt> = [
    { title: "流水编号", dataIndex: "receiptNo" },
    { title: "金额", dataIndex: "amount", render: formatMoney },
    { title: "到账时间", dataIndex: "receivedAt", render: formatDateTime },
    { title: "付款方", dataIndex: "payerName", render: (value) => value ?? "-" },
    {
      title: "状态",
      render: (_, record) => (record.correctedById ? <Tag color="orange">已更正</Tag> : <Tag>正常</Tag>)
    },
    ...(hasRole("finance")
      ? [
          {
            title: "操作",
            render: (_: unknown, record: PaymentReceipt) => (
              <Button size="small" type="link" onClick={() => setCorrecting(record)}>
                更正
              </Button>
            )
          }
        ]
      : [])
  ];

  return (
    <section className="work-band">
      <Space style={{ justifyContent: "space-between", width: "100%" }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          结案对账
        </Typography.Title>
        <Tag
          color={
            effectiveStatus === "matched" ? "green" : effectiveStatus === "pending_check" ? "red" : "default"
          }
        >
          {ReconciliationStatusLabels[effectiveStatus as keyof typeof ReconciliationStatusLabels] ?? "未对账"}
        </Tag>
      </Space>

      {pendingNote ? (
        <Alert style={{ marginTop: 12 }} type="warning" showIcon message="案件待核" description={pendingNote} />
      ) : null}

      {result ? (
        <Descriptions column={{ xs: 1, md: 2 }} size="small" bordered style={{ marginTop: 12 }}>
          <Descriptions.Item label="账单合计（办案端）">{formatMoney(result.billingTotal)}</Descriptions.Item>
          <Descriptions.Item label="到账合计（财务室）">{formatMoney(result.receiptTotal)}</Descriptions.Item>
          <Descriptions.Item label="待收差额（账单多出）">
            <span style={{ color: Number(result.shortfallAmount) > 0 ? "#cf1322" : undefined }}>
              {formatMoney(result.shortfallAmount)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="财务多出（单独列示，不改账单）">
            <span style={{ color: Number(result.surplusAmount) > 0 ? "#d46b08" : undefined }}>
              {formatMoney(result.surplusAmount)}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="逐笔匹配数">{result.matchedCount}</Descriptions.Item>
        </Descriptions>
      ) : null}

      {result && result.status === "pending_check" ? (
        <>
          {result.unmatchedBillings.length > 0 ? (
            <>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                账单多出 · 待收差额（哪几笔没收）
              </Divider>
              <Table
                size="small"
                rowKey="billNo"
                loading={loading}
                pagination={false}
                columns={unmatchedBillColumns}
                dataSource={result.unmatchedBillings}
              />
            </>
          ) : null}
          {result.unmatchedReceipts.length > 0 ? (
            <>
              <Divider orientation="left" style={{ fontSize: 13 }}>
                财务多出 · 单独列示（不得据此改写账单金额）
              </Divider>
              <Table
                size="small"
                rowKey="receiptNo"
                loading={loading}
                pagination={false}
                columns={unmatchedReceiptColumns}
                dataSource={result.unmatchedReceipts}
              />
            </>
          ) : null}
        </>
      ) : null}

      {result && result.status === "matched" ? (
        <Alert style={{ marginTop: 12 }} type="success" showIcon message={result.note} />
      ) : null}

      <Divider />
      <Space wrap>
        <PermissionGate permission="reconciliation:run">
          <Button loading={running} onClick={() => void run()}>
            执行对账
          </Button>
        </PermissionGate>
        {!closed && caseStatus === "hearing" ? (
          <PermissionGate permission="case:write">
            <Button
              type="primary"
              onClick={() => void closeCase()}
              disabled={effectiveStatus !== "matched"}
              title={effectiveStatus !== "matched" ? "需先完成对账且逐笔相符才能结案" : undefined}
            >
              对账通过后结案
            </Button>
          </PermissionGate>
        ) : null}
      </Space>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        本案到账流水（财务室登记）
      </Divider>
      {hasRole("finance") ? (
        <ReceiptForm onSubmit={registerReceipt} />
      ) : (
        <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
          到账流水仅由财务角色登记和更正；办案端可查看，但无权写入财务到账账。
        </Typography.Paragraph>
      )}
      <Table
        style={{ marginTop: 8 }}
        size="small"
        rowKey="id"
        loading={loading}
        pagination={false}
        columns={receiptColumns}
        dataSource={receipts}
      />

      <CorrectReceiptModal
        receipt={correcting}
        open={Boolean(correcting)}
        onClose={() => setCorrecting(null)}
        onSaved={() => {
          onChanged();
          void load();
        }}
      />
    </section>
  );
}

function extractReconciliationError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 409
  ) {
    return (error as { response?: { data?: { details?: unknown } } }).response?.data?.details ?? null;
  }
  return null;
}
