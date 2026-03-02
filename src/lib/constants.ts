/** 部署一覧 */
export const DEPARTMENTS = [
  "総務部",
  "人事部",
  "経理部",
  "営業部",
  "開発部",
  "企画部",
  "製造部",
] as const;

/** 役職一覧 */
export const POSITIONS = ["部長", "課長", "係長", "主任", "一般"] as const;

/** 雇用形態 */
export const EMPLOYMENT_TYPES = {
  full_time: "正社員",
  part_time: "パートタイム",
  contract: "契約社員",
} as const;

/** 給与明細ステータス */
export const PAYSLIP_STATUSES = {
  draft: { label: "下書き", variant: "secondary" as const },
  approved: { label: "承認済", variant: "default" as const },
  paid: { label: "支給済", variant: "outline" as const },
} as const;

/** 年末調整ステータス */
export const YEAR_END_STATUSES = {
  draft: { label: "下書き", variant: "secondary" as const },
  submitted: { label: "提出済", variant: "default" as const },
  completed: { label: "完了", variant: "outline" as const },
} as const;
