import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  message
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { AxiosError } from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import * as caseApi from "../api/case";
import * as documentApi from "../api/document";
import * as paymentApi from "../api/payment";
import { DocumentList } from "../components/common/DocumentList";
import { StatusBadge } from "../components/common/StatusBadge";
import { TimelineItem } from "../components/common/TimelineItem";
import { PermissionGate } from "../directives/permission";
import { useCaseStore } from "../stores/case";
import type { Payment, Reconciliation } from "../types";
import { BillingTypeLabels, CaseStatusLabels, CaseTypeLabels } from "../types/enums";
import type { CaseStatus } from "../types/enums";
import { formatDate, formatMoney } from "../utils/format";

const unmatchedPaymentReasonLabels: Record<string, string> = {
  no_bill_reference: "未关联账单",
  bill_not_found: "账单号不存在",
  excess_over_bill: "超出账单金额"
};

function ReconciliationDetail({ reconciliation }: { reconciliation: Reconciliation }) {
  const unmatchedBills = reconciliation.unmatchedBills ?? [];
  const unmatchedPayments = reconciliation.unmatchedPayments ?? [];
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {unmatchedBills.length ? (
        <div>
          <Typography.Text strong>待收差额（账单未收齐）</Typography.Text>
          <Table
            rowKey="billNo"
            size="small"
            pagination={false}
            style={{ marginTop: 8 }}
            dataSource={unmatchedBills}
            columns={[
              { title: "账单编号", dataIndex: "billNo" },
              { title: "费用类型", dataIndex: "type", render: (value) => BillingTypeLabels[value as keyof typeof BillingTypeLabels] ?? value },
              { title: "账单金额", dataIndex: "amount", render: formatMoney },
              { title: "已到账", dataIndex: "received", render: formatMoney },
              { title: "待收差额", dataIndex: "difference", render: formatMoney }
            ]}
          />
        </div>
      ) : null}
      {unmatchedPayments.length ? (
        <div>
          <Typography.Text strong>财务多出的到账（单独列出，不改写账单金额）</Typography.Text>
          <Table
            rowKey={(row) => row.paymentNo ?? `excess-${row.billNo}`}
            size="small"
            pagination={false}
            style={{ marginTop: 8 }}
            dataSource={unmatchedPayments}
            columns={[
              { title: "到账编号", dataIndex: "paymentNo", render: (value) => value ?? "-" },
              { title: "关联账单", dataIndex: "billNo", render: (value) => value ?? "-" },
              { title: "金额", dataIndex: "amount", render: formatMoney },
              { title: "到账日期", dataIndex: "receivedAt", render: formatDate },
              { title: "原因", dataIndex: "reason", render: (value) => unmatchedPaymentReasonLabels[value] ?? value }
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

export function CaseDetailPage() {
  const { id } = useParams();
  const { selectedCase, fetchCase } = useCaseStore();
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<CaseStatus | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    if (id) void fetchCase(id);
  }, [id, fetchCase]);

  const billings = useMemo(() => selectedCase?.billings ?? [], [selectedCase]);
  const payments = useMemo(() => selectedCase?.payments ?? [], [selectedCase]);

  if (!selectedCase) {
    return <main className="page-shell">正在加载案件详情...</main>;
  }

  const finance = selectedCase.finance ?? {
    billedTotal: 0,
    receivedTotal: 0,
    receivableDiff: 0,
    reconciliationStatus: "unreconciled" as const
  };
  const reconciliation = selectedCase.reconciliation ?? null;

  async function removeDocument(documentId: string) {
    await documentApi.deleteDocument(documentId);
    message.success("文档已删除");
    if (id) void fetchCase(id);
  }

  async function runReconcile() {
    if (!id) return;
    try {
      const result = await caseApi.reconcileCase(id);
      if (result.status === "matched") {
        message.success("对账通过：账单与到账流水逐笔相符");
      } else {
        message.warning("对账存在差异，请查看待收差额与未匹配到账");
      }
      void fetchCase(id);
    } catch (error) {
      message.error((error as AxiosError<{ message?: string }>).response?.data?.message ?? "对账失败");
    }
  }

  function showReconciliationFailure(serverMessage: string, detail?: Reconciliation) {
    Modal.warning({
      title: "对账未通过，案件已标记为待核",
      width: 720,
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <Typography.Text>{serverMessage}</Typography.Text>
          {detail ? <ReconciliationDetail reconciliation={detail} /> : null}
        </div>
      )
    });
  }

  async function submitStatusChange() {
    if (!id || !nextStatus) return;
    try {
      await caseApi.updateCaseStatus(id, nextStatus);
      message.success(`案件状态已流转为「${CaseStatusLabels[nextStatus]}」`);
      setStatusModalOpen(false);
      setNextStatus(null);
      void fetchCase(id);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; details?: { reconciliation?: Reconciliation } }>;
      if (axiosError.response?.status === 409) {
        // 结案对账未通过：说明差额明细，案件已被标记为待核
        showReconciliationFailure(
          axiosError.response.data?.message ?? "对账未通过",
          axiosError.response.data?.details?.reconciliation
        );
        setStatusModalOpen(false);
        setNextStatus(null);
        void fetchCase(id);
        return;
      }
      message.error(axiosError.response?.data?.message ?? "状态流转失败");
    }
  }

  function openPaymentModal(payment?: Payment) {
    setEditingPayment(payment ?? null);
    paymentForm.setFieldsValue(
      payment
        ? {
            paymentNo: payment.paymentNo,
            billNo: payment.billNo ?? undefined,
            amount: Number(payment.amount),
            receivedAt: dayjs(payment.receivedAt),
            note: payment.note ?? undefined
          }
        : { paymentNo: undefined, billNo: undefined, amount: undefined, receivedAt: dayjs(), note: undefined }
    );
    setPaymentModalOpen(true);
  }

  async function submitPayment() {
    if (!id) return;
    const values = await paymentForm.validateFields();
    const payload = {
      billNo: values.billNo ?? null,
      amount: String(values.amount),
      receivedAt: (values.receivedAt as dayjs.Dayjs).format("YYYY-MM-DD"),
      note: values.note ?? null
    };
    try {
      if (editingPayment) {
        await paymentApi.correctPayment(editingPayment.id, payload);
        message.success("到账流水已更正");
      } else {
        await paymentApi.createPayment({ ...payload, paymentNo: values.paymentNo, caseId: id });
        message.success("到账流水已登记");
      }
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      void fetchCase(id);
    } catch (error) {
      // 律师等非财务角色写入会被后端 403 拒绝，这里把权限说明原样展示
      message.error((error as AxiosError<{ message?: string }>).response?.data?.message ?? "到账流水保存失败");
    }
  }

  const paymentColumns: ColumnsType<Payment> = [
    { title: "到账编号", dataIndex: "paymentNo" },
    { title: "关联账单", dataIndex: "billNo", render: (value) => value ?? "-" },
    { title: "金额", dataIndex: "amount", render: formatMoney },
    { title: "到账日期", dataIndex: "receivedAt", render: formatDate },
    { title: "状态", dataIndex: "status", render: (value) => <StatusBadge status={value} /> },
    { title: "备注", dataIndex: "note", render: (value) => value ?? "-" },
    {
      title: "操作",
      key: "actions",
      render: (_, record) => (
        <PermissionGate permission="payment:write">
          <Button size="small" type="link" onClick={() => openPaymentModal(record)}>
            更正
          </Button>
        </PermissionGate>
      )
    }
  ];

  return (
    <main className="page-shell">
      <Space align="start" style={{ justifyContent: "space-between", width: "100%" }}>
        <div>
          <h1 className="page-title">{selectedCase.title}</h1>
          <div className="page-subtitle">{selectedCase.caseNo}</div>
        </div>
        <Space>
          <StatusBadge status={selectedCase.status} />
          <PermissionGate permission="case:write">
            <Button onClick={() => void runReconcile()}>发起对账</Button>
            <Button type="primary" onClick={() => setStatusModalOpen(true)}>
              状态流转
            </Button>
          </PermissionGate>
        </Space>
      </Space>

      <div className="work-band" style={{ marginTop: 18 }}>
        <Descriptions column={{ xs: 1, md: 2, xl: 3 }} bordered size="small">
          <Descriptions.Item label="案件类型">{CaseTypeLabels[selectedCase.type]}</Descriptions.Item>
          <Descriptions.Item label="客户">{selectedCase.client?.name}</Descriptions.Item>
          <Descriptions.Item label="主办律师">{selectedCase.mainLawyer?.name}</Descriptions.Item>
          <Descriptions.Item label="协办律师">
            {selectedCase.collaborators?.map((item) => item.user.name).join("、") || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="受理日期">{formatDate(selectedCase.acceptedAt)}</Descriptions.Item>
          <Descriptions.Item label="结案日期">{formatDate(selectedCase.closedAt)}</Descriptions.Item>
          <Descriptions.Item label="案情摘要" span={3}>
            {selectedCase.summary}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div className="work-band" style={{ marginTop: 18 }}>
        <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            费用对账
          </Typography.Title>
          <Space>
            <span className="summary-label">对账状态</span>
            <StatusBadge status={finance.reconciliationStatus} />
            {reconciliation ? (
              <span className="summary-label">最近对账：{formatDate(reconciliation.updatedAt)}</span>
            ) : null}
          </Space>
        </Space>
        <div className="summary-strip" style={{ marginTop: 12 }}>
          <div className="summary-item">
            <div className="summary-label">应收合计（账单）</div>
            <div className="summary-value">{formatMoney(finance.billedTotal)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">到账合计（财务流水）</div>
            <div className="summary-value">{formatMoney(finance.receivedTotal)}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">待收差额</div>
            <div className="summary-value">{formatMoney(finance.receivableDiff)}</div>
          </div>
        </div>
        {finance.reconciliationStatus === "unreconciled" ? (
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="该案件尚未对账：到账合计仅统计财务登记的到账流水，不会把账单金额当作已收。结案前必须先对账。"
          />
        ) : null}
        {reconciliation && reconciliation.status === "discrepancy" ? (
          <div style={{ marginTop: 12 }}>
            <Alert type="warning" showIcon message="对账存在差异：账单与到账流水未逐笔相符，案件已标记为待核。" />
            <div style={{ marginTop: 12 }}>
              <ReconciliationDetail reconciliation={reconciliation} />
            </div>
          </div>
        ) : null}
      </div>

      <div className="work-grid" style={{ marginTop: 18 }}>
        <section className="work-band">
          <Typography.Title level={4}>文档归档</Typography.Title>
          <DocumentList documents={selectedCase.documents ?? []} onDelete={removeDocument} />
          <Divider />
          <Typography.Title level={4}>账单列表</Typography.Title>
          <div style={{ marginTop: 12 }}>
            {billings.map((billing) => (
              <div className="meta-row" key={billing.id} style={{ justifyContent: "space-between", padding: "8px 0" }}>
                <span>{billing.billNo}</span>
                <span>{formatMoney(billing.amount)}</span>
                <StatusBadge status={billing.status} />
              </div>
            ))}
            {!billings.length ? <div className="summary-label">暂无账单</div> : null}
          </div>
          <Divider />
          <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              到账流水
            </Typography.Title>
            <PermissionGate permission="payment:write">
              <Button size="small" type="primary" onClick={() => openPaymentModal()}>
                登记到账
              </Button>
            </PermissionGate>
          </Space>
          <div className="summary-label" style={{ margin: "4px 0 8px" }}>
            到账流水仅财务角色可登记与更正
          </div>
          <Table rowKey="id" size="small" pagination={false} dataSource={payments} columns={paymentColumns} />
        </section>
        <aside className="work-band">
          <Typography.Title level={4}>案件时间线</Typography.Title>
          <TimelineItem title="案件受理" time={selectedCase.acceptedAt}>
            客户 {selectedCase.client?.name} 建立委托关系。
          </TimelineItem>
          <TimelineItem title="最近更新" time={selectedCase.updatedAt}>
            当前状态：<StatusBadge status={selectedCase.status} />
          </TimelineItem>
          {selectedCase.closedAt ? <TimelineItem title="结案" time={selectedCase.closedAt} /> : null}
        </aside>
      </div>

      <Modal
        title="案件状态流转"
        open={statusModalOpen}
        onOk={() => void submitStatusChange()}
        onCancel={() => {
          setStatusModalOpen(false);
          setNextStatus(null);
        }}
        okButtonProps={{ disabled: !nextStatus }}
      >
        <Typography.Paragraph>
          选择目标状态。流转为「结案」前系统会自动按案件编号逐笔核对账单与到账流水，对得上才准结案。
        </Typography.Paragraph>
        <Select
          style={{ width: "100%" }}
          placeholder="选择目标状态"
          value={nextStatus ?? undefined}
          options={(Object.entries(CaseStatusLabels) as Array<[CaseStatus, string]>)
            .filter(([value]) => value !== selectedCase.status)
            .map(([value, label]) => ({ value, label }))}
          onChange={(value) => setNextStatus(value)}
        />
      </Modal>

      <Modal
        title={editingPayment ? "更正到账流水" : "登记到账流水"}
        open={paymentModalOpen}
        onOk={() => void submitPayment()}
        onCancel={() => {
          setPaymentModalOpen(false);
          paymentForm.resetFields();
        }}
        destroyOnClose
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item
            name="paymentNo"
            label="到账编号"
            rules={[{ required: true, min: 3, message: "请输入到账编号（至少 3 个字符）" }]}
          >
            <Input placeholder="如 PAY-2026-0002" disabled={Boolean(editingPayment)} />
          </Form.Item>
          <Form.Item name="billNo" label="关联账单编号">
            <Select
              allowClear
              placeholder="选择该笔到账对应的账单"
              options={billings.map((billing) => ({ value: billing.billNo, label: `${billing.billNo}（${formatMoney(billing.amount)}）` }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="到账金额" rules={[{ required: true, message: "请输入到账金额" }]}>
            <InputNumber style={{ width: "100%" }} min={0.01} precision={2} />
          </Form.Item>
          <Form.Item name="receivedAt" label="到账日期" rules={[{ required: true, message: "请选择到账日期" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </main>
  );
}
