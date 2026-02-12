import { Badge } from "@/components/ui/badge";
import { PAYSLIP_STATUSES, YEAR_END_STATUSES } from "@/lib/constants";

interface StatusBadgeProps {
  status: string;
  type: "payslip" | "yearEnd";
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const config =
    type === "payslip"
      ? PAYSLIP_STATUSES[status as keyof typeof PAYSLIP_STATUSES]
      : YEAR_END_STATUSES[status as keyof typeof YEAR_END_STATUSES];

  if (!config) {
    return <Badge variant="secondary">{status}</Badge>;
  }

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
