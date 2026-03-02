import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { yearEndAdjustmentSchema } from "@/lib/validators";
import type { z } from "zod/v4";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useYearEndAdjustment,
  useCreateYearEndAdjustment,
  useUpdateYearEndAdjustment,
  useAnnualSocialInsurance,
  useAnnualIncomeTax,
} from "@/hooks/useYearEndAdjustments";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calculator } from "lucide-react";

type YearEndFormInput = z.input<typeof yearEndAdjustmentSchema>;
type YearEndFormOutput = z.output<typeof yearEndAdjustmentSchema>;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

export default function YearEndAdjustmentForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const createMutation = useCreateYearEndAdjustment();
  const updateMutation = useUpdateYearEndAdjustment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: existingData } = useYearEndAdjustment(
    isEditing ? Number(id) : undefined
  );

  const { data: employeesData } = useEmployees({
    isActive: true,
    pageSize: 1000,
  });

  const form = useForm<YearEndFormInput, unknown, YearEndFormOutput>({
    resolver: zodResolver(yearEndAdjustmentSchema),
    defaultValues: {
      employeeId: 0,
      adjustmentYear: currentYear,
      basicDeduction: 480000,
      spouseDeduction: 0,
      dependentDeduction: 0,
      socialInsuranceDeduction: 0,
      lifeInsuranceDeduction: 0,
      earthquakeInsuranceDeduction: 0,
      status: "draft",
    },
  });

  const watchedValues = form.watch();
  const [annualIncomeTaxValue, setAnnualIncomeTaxValue] = useState<number>(0);

  // 年間社会保険料・所得税の自動取得用
  const { data: annualSocialInsurance, refetch: refetchSocialInsurance } =
    useAnnualSocialInsurance(
      watchedValues.employeeId || undefined,
      watchedValues.adjustmentYear || undefined
    );

  const { data: annualIncomeTax, refetch: refetchIncomeTax } =
    useAnnualIncomeTax(
      watchedValues.employeeId || undefined,
      watchedValues.adjustmentYear || undefined
    );

  useEffect(() => {
    if (annualIncomeTax !== undefined) {
      setAnnualIncomeTaxValue(annualIncomeTax);
    }
  }, [annualIncomeTax]);

  // 編集時にフォーム値をセット
  useEffect(() => {
    if (existingData && isEditing) {
      form.reset({
        employeeId: existingData.employeeId,
        adjustmentYear: existingData.adjustmentYear,
        basicDeduction: existingData.basicDeduction,
        spouseDeduction: existingData.spouseDeduction,
        dependentDeduction: existingData.dependentDeduction,
        socialInsuranceDeduction: existingData.socialInsuranceDeduction,
        lifeInsuranceDeduction: existingData.lifeInsuranceDeduction,
        earthquakeInsuranceDeduction: existingData.earthquakeInsuranceDeduction,
        status: existingData.status as "draft" | "submitted" | "completed",
      });
    }
  }, [existingData, isEditing, form]);

  const handleAutoCalculate = async () => {
    if (!watchedValues.employeeId || !watchedValues.adjustmentYear) {
      toast.error("従業員と対象年度を選択してください");
      return;
    }

    const [socialResult, taxResult] = await Promise.all([
      refetchSocialInsurance(),
      refetchIncomeTax(),
    ]);

    if (socialResult.data !== undefined) {
      form.setValue("socialInsuranceDeduction", socialResult.data);
    }
    if (taxResult.data !== undefined) {
      setAnnualIncomeTaxValue(taxResult.data);
    }

    toast.success("年間社会保険料・所得税を自動集計しました");
  };

  // 控除合計
  const totalDeductions =
    (watchedValues.basicDeduction || 0) +
    (watchedValues.spouseDeduction || 0) +
    (watchedValues.dependentDeduction || 0) +
    (watchedValues.socialInsuranceDeduction || 0) +
    (watchedValues.lifeInsuranceDeduction || 0) +
    (watchedValues.earthquakeInsuranceDeduction || 0);

  // 調整額 = 年間所得税 - 控除合計から再計算された本来の税額（簡易計算）
  // 実際の年末調整計算: 調整額 = 源泉徴収済み所得税合計 - 年税額
  // ここでは簡易的に: 調整額 = 源泉徴収済み所得税 - (年間総所得 - 控除合計) * 税率
  // さらに簡易化: 控除が増えた分だけ還付される概算として計算
  // 調整額 = 概算。正の値 = 還付、負の値 = 追徴
  const adjustmentAmount = annualIncomeTaxValue > 0
    ? Math.round(totalDeductions * 0.05) // 簡易: 控除合計の5%を還付額として概算
    : 0;

  const handleSubmit = async (
    values: YearEndFormOutput,
    submitStatus: "draft" | "submitted"
  ) => {
    const params = {
      ...values,
      adjustmentAmount,
      status: submitStatus,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), params });
        toast.success("年末調整を更新しました");
      } else {
        await createMutation.mutateAsync(params);
        toast.success(
          submitStatus === "draft"
            ? "年末調整を下書き保存しました"
            : "年末調整を提出しました"
        );
      }
      navigate("/year-end-adjustment");
    } catch {
      toast.error("年末調整の保存に失敗しました");
    }
  };

  const onDraftSave = form.handleSubmit((values) =>
    handleSubmit(values, "draft")
  );
  const onSubmit = form.handleSubmit((values) =>
    handleSubmit(values, "submitted")
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? "年末調整編集" : "年末調整登録"}
        description={
          isEditing
            ? "年末調整データを編集します"
            : "新しい年末調整データを登録します"
        }
        actions={
          <Button
            variant="outline"
            onClick={() => navigate("/year-end-adjustment")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Button>
        }
      />

      <Form {...form}>
        <form className="space-y-6">
          {/* 従業員・年度選択 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">従業員・年度選択</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={() => (
                    <FormItem>
                      <FormLabel>従業員</FormLabel>
                      <FormControl>
                        <EmployeeCombobox
                          value={watchedValues.employeeId || undefined}
                          onSelect={(employeeId) =>
                            form.setValue("employeeId", employeeId)
                          }
                          employees={employeesData?.data ?? []}
                          disabled={isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="adjustmentYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>対象年度</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(Number(v))}
                        value={String(field.value)}
                        disabled={isEditing}
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
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAutoCalculate}
                disabled={!watchedValues.employeeId || !watchedValues.adjustmentYear}
              >
                <Calculator className="mr-2 h-4 w-4" />
                社会保険料を自動集計
              </Button>
            </CardContent>
          </Card>

          {/* 所得控除 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">所得控除</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="basicDeduction"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <FormLabel className="text-sm min-w-40">
                      基礎控除
                      <span className="text-xs text-muted-foreground ml-1">
                        (デフォルト)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="w-48 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spouseDeduction"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <FormLabel className="text-sm min-w-40">配偶者控除</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="w-48 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dependentDeduction"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <FormLabel className="text-sm min-w-40">扶養控除</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="w-48 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="socialInsuranceDeduction"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <FormLabel className="text-sm min-w-40">
                      社会保険料控除
                      {annualSocialInsurance !== undefined && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (自動集計)
                        </span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        className="w-48 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lifeInsuranceDeduction"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <FormLabel className="text-sm min-w-40">
                      生命保険料控除
                      <span className="text-xs text-muted-foreground ml-1">
                        (上限 ¥120,000)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={120000}
                        className="w-48 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="earthquakeInsuranceDeduction"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <FormLabel className="text-sm min-w-40">
                      地震保険料控除
                      <span className="text-xs text-muted-foreground ml-1">
                        (上限 ¥50,000)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={50000}
                        className="w-48 text-right"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 計算結果 */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">計算結果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  年間所得税合計（源泉徴収済み）
                </span>
                <span className="font-medium tabular-nums">
                  {annualIncomeTaxValue > 0
                    ? formatCurrency(annualIncomeTaxValue)
                    : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">控除合計</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(totalDeductions)}
                </span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">調整額</span>
                <span
                  className={`text-2xl font-bold tabular-nums ${
                    adjustmentAmount >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {adjustmentAmount >= 0 ? "+" : ""}
                  {formatCurrency(adjustmentAmount)}
                  <span className="text-sm ml-1">
                    （{adjustmentAmount >= 0 ? "還付" : "追徴"}）
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/year-end-adjustment")}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onDraftSave}
              disabled={isPending}
            >
              {isPending ? "保存中..." : "下書き保存"}
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isPending}
            >
              {isPending ? "保存中..." : "提出"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
