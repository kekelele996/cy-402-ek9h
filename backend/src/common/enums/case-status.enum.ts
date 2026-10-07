export enum CaseStatus {
  filed = "filed",
  investigating = "investigating",
  hearing = "hearing",
  closed = "closed",
  archived = "archived"
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  [CaseStatus.filed]: "立案",
  [CaseStatus.investigating]: "调查",
  [CaseStatus.hearing]: "开庭",
  [CaseStatus.closed]: "结案",
  [CaseStatus.archived]: "归档"
};

