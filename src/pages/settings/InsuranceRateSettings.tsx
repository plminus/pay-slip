import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Pencil } from "lucide-react";
import {
  useInsuranceRates,
  useCurrentInsuranceRate,
  useCreateInsuranceRate,
  useUpdateInsuranceRate,
} from "@/hooks/useInsuranceRates";
import type { InsuranceRate } from "@/lib/db-client";
import { insuranceRateSchema, type InsuranceRateValues } from "@/lib/validators";
import { formatDate } from "@/lib/formatters";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

export default function InsuranceRateSettings() {
  const { data: rates, isLoading: ratesLoading } = useInsuranceRates();
  const { data: currentRate, isLoading: currentLoading } = useCurrentInsuranceRate();
  const createMutation = useCreateInsuranceRate();
  const updateMutation = useUpdateInsuranceRate();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InsuranceRate | null>(null);

  const form = useForm<InsuranceRateValues>({
    resolver: zodResolver(insuranceRateSchema),
    defaultValues: {
      effectiveFrom: "",
      effectiveTo: "",
      healthInsuranceRate: 0,
      healthInsuranceEmployeeRate: 0,
      pensionInsuranceRate: 0,
      pensionInsuranceEmployeeRate: 0,
      employmentInsuranceEmployeeRate: 0,
      employmentInsuranceEmployerRate: 0,
    },
  });

  const openCreateDialog = () => {
    setEditTarget(null);
    form.reset({
      effectiveFrom: "",
      effectiveTo: "",
      healthInsuranceRate: 0,
      healthInsuranceEmployeeRate: 0,
      pensionInsuranceRate: 0,
      pensionInsuranceEmployeeRate: 0,
      employmentInsuranceEmployeeRate: 0,
      employmentInsuranceEmployerRate: 0,
    });
    setDialogOpen(true);
  };

  const toPercent = (v: number) => parseFloat((v * 100).toFixed(4));

  const openEditDialog = (rate: InsuranceRate) => {
    setEditTarget(rate);
    form.reset({
      effectiveFrom: rate.effectiveFrom,
      effectiveTo: rate.effectiveTo ?? "",
      healthInsuranceRate: toPercent(rate.healthInsuranceRate),
      healthInsuranceEmployeeRate: toPercent(rate.healthInsuranceEmployeeRate),
      pensionInsuranceRate: toPercent(rate.pensionInsuranceRate),
      pensionInsuranceEmployeeRate: toPercent(rate.pensionInsuranceEmployeeRate),
      employmentInsuranceEmployeeRate: toPercent(rate.employmentInsuranceEmployeeRate),
      employmentInsuranceEmployerRate: toPercent(rate.employmentInsuranceEmployerRate),
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: InsuranceRateValues) => {
    try {
      const toDecimal = (v: number) => parseFloat((v / 100).toFixed(6));
      const params = {
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo || null,
        healthInsuranceRate: toDecimal(values.healthInsuranceRate),
        healthInsuranceEmployeeRate: toDecimal(values.healthInsuranceEmployeeRate),
        pensionInsuranceRate: toDecimal(values.pensionInsuranceRate),
        pensionInsuranceEmployeeRate: toDecimal(values.pensionInsuranceEmployeeRate),
        employmentInsuranceEmployeeRate: toDecimal(values.employmentInsuranceEmployeeRate),
        employmentInsuranceEmployerRate: toDecimal(values.employmentInsuranceEmployerRate),
      };

      if (editTarget) {
        await updateMutation.mutateAsync({ id: editTarget.id, params });
        toast.success("保険料率を更新しました");
      } else {
        await createMutation.mutateAsync(params);
        toast.success("保険料率を登録しました");
      }
      setDialogOpen(false);
    } catch {
      toast.error(editTarget ? "更新に失敗しました" : "登録に失敗しました");
    }
  };

  const isLoading = ratesLoading || currentLoading;
  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      {/* 現在有効な保険料率 */}
      {currentRate ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">現在有効な保険料率</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">適用期間</dt>
                <dd className="font-medium">
                  {formatDate(currentRate.effectiveFrom)} 〜{" "}
                  {currentRate.effectiveTo
                    ? formatDate(currentRate.effectiveTo)
                    : ""}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">健康保険料率</dt>
                <dd className="font-medium">
                  {formatPercent(currentRate.healthInsuranceRate)}（従業員負担:{" "}
                  {formatPercent(currentRate.healthInsuranceEmployeeRate)}）
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">
                  厚生年金保険料率
                </dt>
                <dd className="font-medium">
                  {formatPercent(currentRate.pensionInsuranceRate)}（従業員負担:{" "}
                  {formatPercent(currentRate.pensionInsuranceEmployeeRate)}）
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">雇用保険料率</dt>
                <dd className="font-medium">
                  従業員{" "}
                  {formatPercent(currentRate.employmentInsuranceEmployeeRate)} /
                  事業主{" "}
                  {formatPercent(currentRate.employmentInsuranceEmployerRate)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="有効な保険料率がありません"
              description="保険料率を登録してください"
            />
          </CardContent>
        </Card>
      )}

      {/* 料率履歴 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">料率履歴</CardTitle>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        </CardHeader>
        <CardContent>
          {rates && rates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>適用開始</TableHead>
                  <TableHead>適用終了</TableHead>
                  <TableHead className="text-right">健康保険</TableHead>
                  <TableHead className="text-right">厚生年金</TableHead>
                  <TableHead className="text-right">雇用保険（従業員）</TableHead>
                  <TableHead className="w-[60px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>{formatDate(rate.effectiveFrom)}</TableCell>
                    <TableCell>
                      {rate.effectiveTo ? formatDate(rate.effectiveTo) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(rate.healthInsuranceRate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(rate.pensionInsuranceRate)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercent(rate.employmentInsuranceEmployeeRate)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(rate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="料率履歴がありません"
              description="「新規登録」から保険料率を追加してください"
            />
          )}
        </CardContent>
      </Card>

      {/* 登録 / 編集ダイアログ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? "保険料率の編集" : "保険料率の登録"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>適用開始日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>適用終了日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="healthInsuranceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>健康保険料率（全体）%</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="例: 10.03"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="healthInsuranceEmployeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>健康保険料率（従業員）%</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="例: 5.015"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pensionInsuranceRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>厚生年金保険料率（全体）%</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="例: 18.3"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pensionInsuranceEmployeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>厚生年金保険料率（従業員）%</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="例: 9.15"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employmentInsuranceEmployeeRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>雇用保険料率（従業員）%</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="例: 0.6"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentInsuranceEmployerRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>雇用保険料率（事業主）%</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="例: 0.95"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "保存中..."
                    : editTarget
                      ? "更新"
                      : "登録"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
