import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, ArrowRightLeft } from "lucide-react";
import { useYearEndAdjustments, useUpdateYearEndAdjustment } from "@/hooks/useYearEndAdjustments";
import type { YearEndAdjustmentWithEmployee } from "@/lib/db-client";
import { formatCurrency } from "@/lib/formatters";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE = 20;

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

export default function YearEndAdjustmentList() {
  const navigate = useNavigate();

  const [adjustmentYear, setAdjustmentYear] = useState<number | undefined>(currentYear);
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    adjustment: YearEndAdjustmentWithEmployee;
    newStatus: "submitted" | "completed";
  } | null>(null);

  const { data, isLoading } = useYearEndAdjustments({
    adjustmentYear,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const updateMutation = useUpdateYearEndAdjustment();

  const handleStatusChange = async (
    id: number,
    newStatus: "submitted" | "completed"
  ) => {
    try {
      await updateMutation.mutateAsync({ id, params: { status: newStatus } });
      toast.success(
        newStatus === "submitted"
          ? "年末調整を提出済にしました"
          : "年末調整を完了にしました"
      );
      setStatusChangeTarget(null);
    } catch {
      toast.error("ステータスの変更に失敗しました");
    }
  };

  const columns: ColumnDef<YearEndAdjustmentWithEmployee>[] = useMemo(
    () => [
      {
        id: "employeeName",
        header: "従業員名",
        accessorKey: "employeeName",
      },
      {
        id: "adjustmentYear",
        header: "年度",
        cell: (row) => `${row.adjustmentYear}年`,
        className: "w-[80px]",
      },
      {
        id: "socialInsuranceDeduction",
        header: "社会保険料控除",
        cell: (row) => formatCurrency(row.socialInsuranceDeduction),
        className: "text-right",
      },
      {
        id: "deductionsTotal",
        header: "各種控除合計",
        cell: (row) =>
          formatCurrency(
            row.basicDeduction +
              row.spouseDeduction +
              row.dependentDeduction +
              row.lifeInsuranceDeduction +
              row.earthquakeInsuranceDeduction
          ),
        className: "text-right",
      },
      {
        id: "adjustmentAmount",
        header: "調整額",
        cell: (row) => {
          const amount = row.adjustmentAmount;
          const prefix = amount >= 0 ? "+" : "";
          const label = amount >= 0 ? "還付" : "追徴";
          return (
            <span className={amount >= 0 ? "text-green-600" : "text-red-600"}>
              {prefix}
              {formatCurrency(amount)}（{label}）
            </span>
          );
        },
        className: "text-right",
      },
      {
        id: "status",
        header: "状態",
        cell: (row) => <StatusBadge status={row.status} type="yearEnd" />,
      },
      {
        id: "actions",
        header: "操作",
        className: "w-[60px]",
        cell: (row) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {row.status === "draft" && (
                <DropdownMenuItem
                  onClick={() =>
                    navigate(`/year-end-adjustment/${row.id}/edit`)
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  編集
                </DropdownMenuItem>
              )}
              {row.status === "draft" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      setStatusChangeTarget({
                        adjustment: row,
                        newStatus: "submitted",
                      })
                    }
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    提出済にする
                  </DropdownMenuItem>
                </>
              )}
              {row.status === "submitted" && (
                <DropdownMenuItem
                  onClick={() =>
                    setStatusChangeTarget({
                      adjustment: row,
                      newStatus: "completed",
                    })
                  }
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  完了にする
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [navigate]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="年末調整"
        description="年末調整の管理を行います"
        actions={
          <Button onClick={() => navigate("/year-end-adjustment/create")}>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        }
      />

      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={adjustmentYear !== undefined ? String(adjustmentYear) : "all"}
          onValueChange={(v) => {
            setAdjustmentYear(v === "all" ? undefined : Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="年度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての年度</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status ?? "all"}
          onValueChange={(v) => {
            setStatus(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="draft">下書き</SelectItem>
            <SelectItem value="submitted">提出済</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="年末調整データがありません"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />

      <ConfirmDialog
        open={!!statusChangeTarget}
        onOpenChange={(open) => {
          if (!open) setStatusChangeTarget(null);
        }}
        title="ステータス変更の確認"
        description={
          statusChangeTarget
            ? `${statusChangeTarget.adjustment.employeeName}（${statusChangeTarget.adjustment.adjustmentYear}年度）のステータスを${statusChangeTarget.newStatus === "submitted" ? "提出済" : "完了"}に変更します。`
            : ""
        }
        confirmLabel={
          statusChangeTarget?.newStatus === "submitted"
            ? "提出済にする"
            : "完了にする"
        }
        onConfirm={() => {
          if (statusChangeTarget) {
            return handleStatusChange(
              statusChangeTarget.adjustment.id,
              statusChangeTarget.newStatus
            );
          }
        }}
        loading={updateMutation.isPending}
      />
    </div>
  );
}
