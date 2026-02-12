import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, UserX, Search } from "lucide-react";
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeactivateEmployee,
} from "@/hooks/useEmployees";
import type { Employee } from "@/lib/db-client";
import { employeeFormSchema } from "@/lib/validators";
import type { z } from "zod/v4";

type EmployeeFormOutput = z.output<typeof employeeFormSchema>;
import { DEPARTMENTS } from "@/lib/constants";
import { formatCurrency } from "@/lib/formatters";
import { formatEmploymentType } from "@/lib/formatters";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmployeeForm } from "./EmployeeForm";

const PAGE_SIZE = 20;

export default function EmployeeList() {
  // フィルタ状態
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean | undefined>(true);
  const [page, setPage] = useState(1);

  // ダイアログ状態
  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(
    null
  );

  // データ取得
  const { data, isLoading } = useEmployees({
    search: search || undefined,
    department: department || undefined,
    isActive,
    page,
    pageSize: PAGE_SIZE,
  });

  // ミューテーション
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deactivateMutation = useDeactivateEmployee();

  const handleFormSubmit = async (values: EmployeeFormOutput) => {
    try {
      if (editingEmployee) {
        await updateMutation.mutateAsync({
          id: editingEmployee.id,
          params: values,
        });
        toast.success("従業員情報を更新しました");
      } else {
        await createMutation.mutateAsync(values);
        toast.success("従業員を登録しました");
      }
      setFormOpen(false);
      setEditingEmployee(null);
    } catch (error) {
      toast.error(
        editingEmployee
          ? "従業員情報の更新に失敗しました"
          : "従業員の登録に失敗しました"
      );
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    try {
      await deactivateMutation.mutateAsync(deactivateTarget.id);
      toast.success("退職処理を完了しました");
      setDeactivateTarget(null);
    } catch (error) {
      toast.error("退職処理に失敗しました");
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormOpen(true);
  };

  const handleNew = () => {
    setEditingEmployee(null);
    setFormOpen(true);
  };

  const columns: ColumnDef<Employee>[] = useMemo(
    () => [
      {
        id: "employeeNumber",
        header: "社員番号",
        accessorKey: "employeeNumber",
        className: "w-[100px]",
      },
      {
        id: "name",
        header: "氏名",
        cell: (row) => `${row.lastName} ${row.firstName}`,
      },
      {
        id: "nameKana",
        header: "フリガナ",
        cell: (row) => `${row.lastNameKana} ${row.firstNameKana}`,
      },
      {
        id: "department",
        header: "部署",
        cell: (row) => row.department ?? "—",
      },
      {
        id: "employmentType",
        header: "雇用形態",
        cell: (row) => formatEmploymentType(row.employmentType),
      },
      {
        id: "baseSalary",
        header: "基本給",
        cell: (row) => formatCurrency(row.baseSalary),
        className: "text-right",
      },
      {
        id: "status",
        header: "状態",
        cell: (row) =>
          row.isActive ? (
            <Badge variant="default">在籍</Badge>
          ) : (
            <Badge variant="secondary">退職</Badge>
          ),
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
              <DropdownMenuItem onClick={() => handleEdit(row)}>
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </DropdownMenuItem>
              {row.isActive && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeactivateTarget(row)}
                >
                  <UserX className="mr-2 h-4 w-4" />
                  退職処理
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="従業員管理"
        description="従業員情報の管理を行います"
        actions={
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Button>
        }
      />

      {/* フィルタ */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="名前・社員番号で検索"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={department}
          onValueChange={(v) => {
            setDepartment(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="部署" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての部署</SelectItem>
            {DEPARTMENTS.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={isActive === undefined ? "all" : isActive ? "active" : "inactive"}
          onValueChange={(v) => {
            setIsActive(v === "all" ? undefined : v === "active");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="在籍状況" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">在籍</SelectItem>
            <SelectItem value="inactive">退職</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* テーブル */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        emptyMessage="従業員が登録されていません"
        pagination={{
          page,
          pageSize: PAGE_SIZE,
          total: data?.total ?? 0,
          onPageChange: setPage,
        }}
      />

      {/* 登録/編集フォーム */}
      <EmployeeForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEmployee(null);
        }}
        employee={editingEmployee}
        onSubmit={handleFormSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* 退職確認ダイアログ */}
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null);
        }}
        title="退職処理の確認"
        description={
          deactivateTarget
            ? `${deactivateTarget.lastName} ${deactivateTarget.firstName}（${deactivateTarget.employeeNumber}）を退職処理します。この操作は取り消せません。`
            : ""
        }
        confirmLabel="退職処理を実行"
        variant="destructive"
        onConfirm={handleDeactivate}
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}
