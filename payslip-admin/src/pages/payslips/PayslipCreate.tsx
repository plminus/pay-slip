import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { payslipCreateSchema } from "@/lib/validators";
import type { z } from "zod/v4";
import { useEmployees } from "@/hooks/useEmployees";
import { useCreatePayslip } from "@/hooks/usePayslips";
import { checkDuplicatePayslip, type Employee } from "@/lib/db-client";
import {
  calculatePayroll,
  type PayrollCalculationResult,
} from "@/lib/payroll-calculator";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmployeeCombobox } from "@/components/shared/EmployeeCombobox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

type PayslipFormInput = z.input<typeof payslipCreateSchema>;
type PayslipFormOutput = z.output<typeof payslipCreateSchema>;

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function PayslipCreate() {
  const navigate = useNavigate();
  const createPayslip = useCreatePayslip();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const { data: employeesData } = useEmployees({
    isActive: true,
    pageSize: 1000,
  });

  const form = useForm<PayslipFormInput, unknown, PayslipFormOutput>({
    resolver: zodResolver(payslipCreateSchema),
    defaultValues: {
      employeeId: 0,
      paymentDate: "",
      workYear: currentYear,
      workMonth: currentMonth,
      workDays: 20,
      paidLeaveDays: 0,
      absentDays: 0,
      overtimeHours: 0,
      nighttimeHours: 0,
      holidayWorkHours: 0,
      transportAllowance: 0,
      housingAllowance: 0,
      familyAllowance: 0,
      otherAllowances: 0,
      residentTax: 0,
      otherDeductions: 0,
      notes: "",
      status: "draft",
    },
  });

  const watchedValues = form.watch();

  const calculationResult: PayrollCalculationResult | null = useMemo(() => {
    if (!selectedEmployee) return null;
    return calculatePayroll({
      baseSalary: selectedEmployee.baseSalary,
      overtimeHours: watchedValues.overtimeHours || 0,
      nighttimeHours: watchedValues.nighttimeHours || 0,
      holidayWorkHours: watchedValues.holidayWorkHours || 0,
      transportAllowance: watchedValues.transportAllowance || 0,
      housingAllowance: watchedValues.housingAllowance || 0,
      familyAllowance: watchedValues.familyAllowance || 0,
      otherAllowances: watchedValues.otherAllowances || 0,
      residentTax: watchedValues.residentTax || 0,
      otherDeductions: watchedValues.otherDeductions || 0,
      dependents: selectedEmployee.dependents,
    });
  }, [
    selectedEmployee,
    watchedValues.overtimeHours,
    watchedValues.nighttimeHours,
    watchedValues.holidayWorkHours,
    watchedValues.transportAllowance,
    watchedValues.housingAllowance,
    watchedValues.familyAllowance,
    watchedValues.otherAllowances,
    watchedValues.residentTax,
    watchedValues.otherDeductions,
  ]);

  const handleEmployeeSelect = (employeeId: number) => {
    form.setValue("employeeId", employeeId);
    const employee = employeesData?.data.find((e) => e.id === employeeId);
    setSelectedEmployee(employee ?? null);
  };

  const handleSubmit = async (
    values: PayslipFormOutput,
    status: "draft" | "approved"
  ) => {
    if (!calculationResult || !selectedEmployee) return;

    const isDuplicate = await checkDuplicatePayslip(
      values.employeeId,
      values.workYear,
      values.workMonth
    );
    if (isDuplicate) {
      toast.error(
        `${values.workYear}年${values.workMonth}月分の給与明細は既に存在します`
      );
      return;
    }

    try {
      await createPayslip.mutateAsync({
        employeeId: values.employeeId,
        paymentDate: values.paymentDate,
        workYear: values.workYear,
        workMonth: values.workMonth,
        baseSalary: selectedEmployee.baseSalary,
        overtimePay: calculationResult.overtimePay,
        nighttimePay: calculationResult.nighttimePay,
        holidayPay: calculationResult.holidayPay,
        transportAllowance: values.transportAllowance,
        housingAllowance: values.housingAllowance,
        familyAllowance: values.familyAllowance,
        otherAllowances: values.otherAllowances,
        totalPayment: calculationResult.totalPayment,
        healthInsurance: calculationResult.healthInsurance,
        pensionInsurance: calculationResult.pensionInsurance,
        employmentInsurance: calculationResult.employmentInsurance,
        incomeTax: calculationResult.incomeTax,
        residentTax: values.residentTax,
        otherDeductions: values.otherDeductions,
        totalDeduction: calculationResult.totalDeduction,
        netPayment: calculationResult.netPayment,
        workDays: values.workDays,
        paidLeaveDays: values.paidLeaveDays,
        absentDays: values.absentDays,
        overtimeHours: values.overtimeHours,
        nighttimeHours: values.nighttimeHours,
        holidayWorkHours: values.holidayWorkHours,
        notes: values.notes ?? null,
        status,
      });
      toast.success(
        status === "draft"
          ? "給与明細を下書き保存しました"
          : "給与明細を承認して保存しました"
      );
      navigate("/payslips");
    } catch {
      toast.error("給与明細の保存に失敗しました");
    }
  };

  const onDraftSave = form.handleSubmit((values) =>
    handleSubmit(values, "draft")
  );
  const onApprove = form.handleSubmit((values) =>
    handleSubmit(values, "approved")
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="給与明細作成"
        description="新しい給与明細を作成します"
        actions={
          <Button variant="outline" onClick={() => navigate("/payslips")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Button>
        }
      />

      <Form {...form}>
        <form className="space-y-6">
          {/* 従業員・対象期間 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">従業員・対象期間</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={() => (
                  <FormItem>
                    <FormLabel>従業員</FormLabel>
                    <FormControl>
                      <EmployeeCombobox
                        value={watchedValues.employeeId || undefined}
                        onSelect={handleEmployeeSelect}
                        employees={employeesData?.data ?? []}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="workYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>対象年</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}年
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>対象月</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {m}月
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>支給日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 勤怠情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">勤怠情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="workDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>出勤日数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={31}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paidLeaveDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>有給休暇</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={31}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="absentDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>欠勤日数</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={31}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="overtimeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>残業時間</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nighttimeHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>深夜時間</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="holidayWorkHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>休日労働</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.5}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* 支給項目・控除項目 */}
          <div className="grid grid-cols-2 gap-6">
            {/* 支給項目 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">支給項目</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">基本給</span>
                  <span className="font-medium tabular-nums">
                    {selectedEmployee
                      ? formatCurrency(selectedEmployee.baseSalary)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    残業手当{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.overtimePay)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    深夜手当{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.nighttimePay)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    休日手当{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.holidayPay)
                      : "—"}
                  </span>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="transportAllowance"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="text-sm font-normal text-muted-foreground min-w-24">
                        通勤手当
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="housingAllowance"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="text-sm font-normal text-muted-foreground min-w-24">
                        住宅手当
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="familyAllowance"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="text-sm font-normal text-muted-foreground min-w-24">
                        家族手当
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherAllowances"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="text-sm font-normal text-muted-foreground min-w-24">
                        その他手当
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex items-center justify-between font-semibold">
                  <span>支給合計</span>
                  <span className="tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.totalPayment)
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 控除項目 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">控除項目</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    健康保険{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.healthInsurance)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    厚生年金{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.pensionInsurance)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    雇用保険{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.employmentInsurance)
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    所得税{" "}
                    <span className="text-xs text-muted-foreground/60">
                      (自動計算)
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.incomeTax)
                      : "—"}
                  </span>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="residentTax"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="text-sm font-normal text-muted-foreground min-w-24">
                        住民税
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="otherDeductions"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between gap-4">
                      <FormLabel className="text-sm font-normal text-muted-foreground min-w-24">
                        その他控除
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          className="w-32 text-right"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="flex items-center justify-between font-semibold">
                  <span>控除合計</span>
                  <span className="tabular-nums">
                    {calculationResult
                      ? formatCurrency(calculationResult.totalDeduction)
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 差引支給額 */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">差引支給額</span>
                <span className="text-2xl font-bold tabular-nums">
                  {calculationResult
                    ? formatCurrency(calculationResult.netPayment)
                    : "—"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 備考 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">備考</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="備考を入力..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/payslips")}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDraftSave}
              disabled={createPayslip.isPending}
            >
              {createPayslip.isPending ? "保存中..." : "下書き保存"}
            </Button>
            <Button
              type="button"
              onClick={onApprove}
              disabled={createPayslip.isPending}
            >
              {createPayslip.isPending ? "保存中..." : "承認して保存"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
