import { Button, DatePicker, Form, Input, InputNumber, Modal, Typography, message } from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import * as receiptApi from "../../api/receipt";
import type { PaymentReceipt } from "../../types";

type FormValues = {
  receiptNo: string;
  amount: number;
  receivedAt: Dayjs;
  payerName?: string;
  payChannel?: string;
  remark?: string;
};

/** 财务到账流水登记表单。更正走 CorrectReceiptModal。 */
export function ReceiptForm({
  onSubmit
}: {
  onSubmit: (payload: receiptApi.ReceiptPayload) => Promise<void>;
}) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      await onSubmit({
        receiptNo: values.receiptNo,
        amount: String(values.amount),
        receivedAt: values.receivedAt.toISOString(),
        payerName: values.payerName,
        payChannel: values.payChannel,
        remark: values.remark
      });
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <Form form={form} layout="inline" style={{ rowGap: 8 }}>
        <Form.Item name="receiptNo" rules={[{ required: true, message: "请输入流水编号" }]}>
          <Input placeholder="流水编号" style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="amount" rules={[{ required: true, message: "请输入金额" }]}>
          <InputNumber min={0.01} precision={2} placeholder="到账金额" style={{ width: 130 }} />
        </Form.Item>
        <Form.Item name="receivedAt" rules={[{ required: true, message: "请选择到账日期" }]}>
          <DatePicker style={{ width: 150 }} />
        </Form.Item>
        <Form.Item name="payerName">
          <Input placeholder="付款方" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="payChannel">
          <Input placeholder="收款渠道" style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="remark">
          <Input placeholder="备注" style={{ width: 180 }} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" loading={submitting} onClick={() => void handleSubmit()}>
            登记到账
          </Button>
        </Form.Item>
      </Form>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        到账流水独立于账单记账：登记不会改动任何账单金额。
      </Typography.Text>
    </div>
  );
}

/** 到账流水更正弹窗（财务角色）。 */
export function CorrectReceiptModal({
  receipt,
  open,
  onClose,
  onSaved
}: {
  receipt: PaymentReceipt | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && receipt) {
      form.setFieldsValue({
        receiptNo: receipt.receiptNo,
        amount: Number(receipt.amount),
        receivedAt: dayjs(receipt.receivedAt),
        payerName: receipt.payerName ?? undefined,
        payChannel: receipt.payChannel ?? undefined,
        remark: receipt.remark ?? undefined
      });
    }
  }, [open, receipt, form]);

  async function handleCorrect() {
    if (!receipt) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      await receiptApi.correctReceipt(receipt.id, {
        amount: String(values.amount),
        receivedAt: values.receivedAt.toISOString(),
        payerName: values.payerName,
        payChannel: values.payChannel,
        remark: values.remark
      });
      message.success("到账流水已更正");
      form.resetFields();
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title={`更正到账流水 ${receipt?.receiptNo ?? ""}`}
      open={open}
      onCancel={onClose}
      onOk={() => void handleCorrect()}
      okText="保存更正"
      cancelText="取消"
      confirmLoading={saving}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
          <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="receivedAt" label="到账时间" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="payerName" label="付款方">
          <Input />
        </Form.Item>
        <Form.Item name="payChannel" label="收款渠道">
          <Input />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
