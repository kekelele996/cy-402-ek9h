export enum BillingType {
  attorney_fee = "attorney_fee",
  court_fee = "court_fee",
  travel_fee = "travel_fee",
  other = "other"
}

export const BILLING_TYPE_LABELS: Record<BillingType, string> = {
  [BillingType.attorney_fee]: "律师费",
  [BillingType.court_fee]: "诉讼费",
  [BillingType.travel_fee]: "差旅费",
  [BillingType.other]: "其他"
};

