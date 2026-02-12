import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Users, Receipt, Calendar, TrendingUp } from "lucide-react";
import { useDashboardStats, useRecentPayslips } from "../hooks/useDashboardStats";
import { LoadingState } from "../components/shared/LoadingState";
import { StatusBadge } from "../components/shared/StatusBadge";
import { formatCurrency, formatPayPeriod } from "../lib/formatters";
import { Skeleton } from "../components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: recentPayslips, isLoading: isLoadingRecent } = useRecentPayslips();

  const statCards = [
    {
      title: "従業員数",
      value: stats ? stats.activeEmployeeCount.toString() : "-",
      icon: Users,
      description: "登録済み従業員",
    },
    {
      title: "今月の給与明細",
      value: stats ? stats.currentMonthPayslipCount.toString() : "-",
      icon: Receipt,
      description: "作成済み",
    },
    {
      title: "未処理明細",
      value: stats ? stats.draftPayslipCount.toString() : "-",
      icon: Calendar,
      description: "下書き状態",
    },
    {
      title: "今月の総支給額",
      value: stats ? formatCurrency(stats.currentMonthTotalPayment) : "-",
      icon: TrendingUp,
      description: "全従業員合計",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600 mt-2">給与明細管理システムの概要</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
              <p className="text-xs text-gray-600 mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>最近の給与明細</CardTitle>
            <CardDescription>直近で作成された給与明細</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <LoadingState />
            ) : !recentPayslips || recentPayslips.length === 0 ? (
              <p className="text-sm text-gray-600">給与明細がまだありません</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>従業員名</TableHead>
                    <TableHead>対象月</TableHead>
                    <TableHead className="text-right">差引支給額</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayslips.map((payslip) => (
                    <TableRow key={payslip.id}>
                      <TableCell>
                        <Link
                          to={`/payslips/${payslip.id}`}
                          className="hover:underline"
                        >
                          {payslip.employeeName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {formatPayPeriod(payslip.workYear, payslip.workMonth)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(payslip.netPayment)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payslip.status} type="payslip" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能へのショートカット</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/employees" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">従業員を登録する</p>
              <p className="text-sm text-gray-600">新しい従業員情報を追加</p>
            </Link>
            <Link to="/payslips/create" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="font-medium">給与明細を作成する</p>
              <p className="text-sm text-gray-600">新しい給与明細を作成</p>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
