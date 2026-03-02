import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Eye, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import {
  usePayslips,
  useMonthlyPayslipSummary,
  useUpdatePayslipStatus,
  useDeletePayslip,
} from "@/hooks/usePayslips";
import { useEmployees } from "@/hooks/useEmployees";
import type { PayslipWithEmployee } from "@/lib/db-client";
import { formatCurrency, formatPayPeriod } from "@/lib/formatters";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PayslipDetail } from "./PayslipDetail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
const currentMonth = new Date().getMonth() + 1;
const YEARS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function PayslipList() {
  const navigate = useNavigate();

  // フィルタ状態
  const [workYear, setWorkYear] = useState<number | undefined>(currentYear);
  const [workMonth, setWorkMonth] = useState<number | undefined>(currentMonth);
  const [employeeId, setEmployeeId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  // ダイアログ状態
  const [detailPayslip, setDetailPayslip] = useState<PayslipWithEmployee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PayslipWithEmployee | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{
    payslip: PayslipWithEmployee;
    newStatus: "approved" | "paid";
  } | null>(null);

  // データ取得
  const { data, isLoading } = usePayslips({
    workYear,
    workMonth,
    employeeId,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  const { data: summary } = useMonthlyPayslipSummary(workYear, workMonth);

  const { data: employeesData } = useEmployees({
    isActive: true,
    pageSize: 1000,
  });

  // ミューテーション
  const updateStatusMutation = useUpdatePayslipStatus();
  const deleteMutation = useDeletePayslip();

  const handleStatusChange = async (id: number, newStatus: "approved" | "paid") => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success(
        newStatus === "approved"
          ? "給与明細を承認しました"
          : "給与明細を支給済にしました"
      );
      setStatusChangeTarget(null);
      setDetailPayslip(null);
    } catch {
      toast.error("ステータスの変更に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("給与明細を削除しました");
      setDeleteTarget(null);
    } catch {
      toast.error("給与明細の削除に失敗しました");
    }
  };

  const handleStatusChangeFromDetail = (id: number, newStatus: "approved" | "paid") => {
    const payslip = data?.data.find((p) => p.id === id);
    if (payslip) {
      setStatusChangeTarget({ payslip, newStatus });
    }
  };

  const columns: ColumnDef<PayslipWithEmployee>[] = useMemo(
    () => [
      {
        id: "period",
        header: "対象年月",
        cell: (row) => formatPayPeriod(row.workYear, row.workMonth),
      },
      {
        id: "employeeName",
        header: "従業員名",
        accessorKey: "employeeName",
      },
      {
        id: "employeeNumber",
        header: "社員番号",
        accessorKey: "employeeNumber",
        className: "w-[100px]",
      },
      {
        id: "totalPayment",
        header: "総支給額",
        cell: (row) => formatCurrency(row.totalPayment),
        className: "text-right",
      },
      {
        id: "totalDeduction",
        header: "総控除額",
        cell: (row) => formatCurrency(row.totalDeduction),
        className: "text-right",
      },
      {
        id: "netPayment",
        header: "差引支給額",
        cell: (row) => formatCurrency(row.netPayment),
        className: "text-right font-medium",
      },
      {
        id: "status",
        header: "状態",
        cell: (row) => <StatusBadge status={row.status} type="payslip" />,
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
              <DropdownMenuItem onClick={() => setDetailPayslip(row)}>
                <Eye className="mr-2 h-4 w-4" />
                詳細表示
              </DropdownMenuItem>
              {row.status === "draft" && (
                <DropdownMenuItem
                  onClick={() => navigate(`/payslips/edit/${row.id}`)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  編集
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {row.status === "draft" && (
                <DropdownMenuItem
                  onClick={() =>
                    setStatusChangeTarget({ payslip: row, newStatus: "approved" })
                  }
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  承認する
                </DropdownMenuItem>
              )}
              {row.status === "approved" && (
                <DropdownMenuItem
                  onClick={() =>
                    setStatusChangeTarget({ payslip: row, newStatus: "paid" })
                  }
                >
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  支給済にする
                </DropdownMenuItem>
              )}
              {row.status === "draft" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </>
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
        title="給与明細"
        description="給与明細の管理を行います"
        actions={
          <Button onClick={() => navigate("/payslips/create")}>
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        }
      />

      {/* フィルタ */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select
          value={workYear !== undefined ? String(workYear) : "all"}
          onValueChange={(v) => {
            setWorkYear(v === "all" ? undefined : Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="年" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての年</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}年
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={workMonth !== undefined ? String(workMonth) : "all"}
          onValueChange={(v) => {
            setWorkMonth(v === "all" ? undefined : Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="月" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての月</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}月
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={employeeId !== undefined ? String(employeeId) : "all"}
          onValueChange={(v) => {
            setEmployeeId(v === "all" ? undefined : Number(v));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="従業員" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての従業員</SelectItem>
            {employeesData?.data.map((emp) => (
              <SelectItem key={emp.id} value={String(emp.id)}>
                {emp.lastName} {emp.firstName}
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
            <SelectItem value="approved">承認済</SelectItem>
            <SelectItem value="paid">支給済</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="給与明細がありません"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />

      {/* 月別集計サマリー */}
      {summary && summary.count > 0 && workYear && workMonth && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              月別集計サマリー — {workYear}年{workMonth}月
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">合計支給額</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(summary.totalPayment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">合計控除額</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(summary.totalDeduction)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">合計手取り</p>
                <p className="text-lg font-semibold tabular-nums">
                  {formatCurrency(summary.totalNetPayment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">明細数</p>
                <p className="text-lg font-semibold">{summary.count}件</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 詳細ダイアログ */}
      <PayslipDetail
        payslip={detailPayslip}
        open={!!detailPayslip}
        onOpenChange={(open) => {
          if (!open) setDetailPayslip(null);
        }}
        onStatusChange={handleStatusChangeFromDetail}
        statusChangePending={updateStatusMutation.isPending}
      />

      {/* ステータス変更確認ダイアログ */}
      <ConfirmDialog
        open={!!statusChangeTarget}
        onOpenChange={(open) => {
          if (!open) setStatusChangeTarget(null);
        }}
        title="ステータス変更の確認"
        description={
          statusChangeTarget
            ? `${statusChangeTarget.payslip.employeeName}（${formatPayPeriod(statusChangeTarget.payslip.workYear, statusChangeTarget.payslip.workMonth)}）のステータスを${statusChangeTarget.newStatus === "approved" ? "承認済" : "支給済"}に変更します。`
            : ""
        }
        confirmLabel={
          statusChangeTarget?.newStatus === "approved"
            ? "承認する"
            : "支給済にする"
        }
        onConfirm={() => {
          if (statusChangeTarget) {
            return handleStatusChange(
              statusChangeTarget.payslip.id,
              statusChangeTarget.newStatus
            );
          }
        }}
        loading={updateStatusMutation.isPending}
      />

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="給与明細の削除"
        description={
          deleteTarget
            ? `${deleteTarget.employeeName}（${formatPayPeriod(deleteTarget.workYear, deleteTarget.workMonth)}）の給与明細を削除します。この操作は取り消せません。`
            : ""
        }
        confirmLabel="削除する"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
