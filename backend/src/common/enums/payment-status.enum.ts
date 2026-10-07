export enum PaymentStatus {
  registered = "registered",
  corrected = "corrected",
  voided = "voided"
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.registered]: "已登记",
  [PaymentStatus.corrected]: "已更正",
  [PaymentStatus.voided]: "已作废"
};
