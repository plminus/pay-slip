import type { PayslipWithEmployee } from "@/lib/db-client";
import { formatCurrency, formatPayPeriod } from "@/lib/formatters";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer } from "lucide-react";

interface PayslipDetailProps {
  payslip: PayslipWithEmployee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (id: number, status: "approved" | "paid") => void;
  statusChangePending?: boolean;
}

export function PayslipDetail({
  payslip,
  open,
  onOpenChange,
  onStatusChange,
  statusChangePending,
}: PayslipDetailProps) {
  if (!payslip) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:max-w-none print:shadow-none print:border-none">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-lg">
                {payslip.employeeName} ({payslip.employeeNumber})
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {formatPayPeriod(payslip.workYear, payslip.workMonth)}
              </p>
            </div>
            <StatusBadge status={payslip.status} type="payslip" />
          </div>
        </DialogHeader>

        <Tabs defaultValue="payment" className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="payment" className="flex-1">
              支給項目
            </TabsTrigger>
            <TabsTrigger value="deduction" className="flex-1">
              控除項目
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex-1">
              勤怠情報
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-3 mt-4">
            <DetailRow label="基本給" amount={payslip.baseSalary} />
            <DetailRow label="残業手当" amount={payslip.overtimePay} />
            <DetailRow label="深夜手当" amount={payslip.nighttimePay} />
            <DetailRow label="休日手当" amount={payslip.holidayPay} />
            <DetailRow label="通勤手当" amount={payslip.transportAllowance} />
            <DetailRow label="住宅手当" amount={payslip.housingAllowance} />
            <DetailRow label="家族手当" amount={payslip.familyAllowance} />
            <DetailRow label="その他手当" amount={payslip.otherAllowances} />
            <Separator />
            <DetailRow
              label="支給合計"
              amount={payslip.totalPayment}
              bold
            />
          </TabsContent>

          <TabsContent value="deduction" className="space-y-3 mt-4">
            <DetailRow label="健康保険料" amount={payslip.healthInsurance} />
            <DetailRow label="厚生年金保険料" amount={payslip.pensionInsurance} />
            <DetailRow
              label="雇用保険料"
              amount={payslip.employmentInsurance}
            />
            <DetailRow label="所得税" amount={payslip.incomeTax} />
            <DetailRow label="住民税" amount={payslip.residentTax} />
            <DetailRow label="その他控除" amount={payslip.otherDeductions} />
            <Separator />
            <DetailRow
              label="控除合計"
              amount={payslip.totalDeduction}
              bold
            />
          </TabsContent>

          <TabsContent value="attendance" className="space-y-3 mt-4">
            <DetailRowText label="出勤日数" value={`${payslip.workDays}日`} />
            <DetailRowText
              label="有給休暇"
              value={`${payslip.paidLeaveDays}日`}
            />
            <DetailRowText
              label="欠勤日数"
              value={`${payslip.absentDays}日`}
            />
            <Separator />
            <DetailRowText
              label="残業時間"
              value={`${payslip.overtimeHours}時間`}
            />
            <DetailRowText
              label="深夜労働"
              value={`${payslip.nighttimeHours}時間`}
            />
            <DetailRowText
              label="休日労働"
              value={`${payslip.holidayWorkHours}時間`}
            />
            {payslip.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">備考</p>
                  <p className="text-sm">{payslip.notes}</p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* 差引支給額 */}
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">差引支給額</span>
            <span className="text-2xl font-bold tabular-nums">
              {formatCurrency(payslip.netPayment)}
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex justify-end gap-3 mt-4 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            印刷
          </Button>
          {payslip.status === "draft" && onStatusChange && (
            <Button
              onClick={() => onStatusChange(payslip.id, "approved")}
              disabled={statusChangePending}
            >
              {statusChangePending ? "処理中..." : "承認する"}
            </Button>
          )}
          {payslip.status === "approved" && onStatusChange && (
            <Button
              onClick={() => onStatusChange(payslip.id, "paid")}
              disabled={statusChangePending}
            >
              {statusChangePending ? "処理中..." : "支給済にする"}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  amount,
  bold,
}: {
  label: string;
  amount: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${bold ? "font-semibold" : ""}`}
    >
      <span className={bold ? "" : "text-sm text-muted-foreground"}>
        {label}
      </span>
      <span className="tabular-nums">{formatCurrency(amount)}</span>
    </div>
  );
}

function DetailRowText({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
