/** 金額フォーマット: 300000 → "¥300,000" */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/** 日付フォーマット: "2025-01-15" → "2025年1月15日" */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

/** 対象月表示: (2025, 1) → "2025年1月分" */
export function formatPayPeriod(year: number, month: number): string {
  return `${year}年${month}月分`;
}

/** 雇用形態: "full_time" → "正社員" */
export function formatEmploymentType(type: string): string {
  const map: Record<string, string> = {
    full_time: "正社員",
    part_time: "パートタイム",
    contract: "契約社員",
  };
  return map[type] ?? type;
}

/** 給与明細ステータス: "draft" → "下書き" */
export function formatPayslipStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "下書き",
    approved: "承認済",
    paid: "支給済",
  };
  return map[status] ?? status;
}

/** 年末調整ステータス: "submitted" → "提出済" */
export function formatYearEndStatus(status: string): string {
  const map: Record<string, string> = {
    draft: "下書き",
    submitted: "提出済",
    completed: "完了",
  };
  return map[status] ?? status;
}
