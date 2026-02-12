import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createPayslip,
  getPayslips,
  getPayslipById,
  updatePayslipStatus,
  deletePayslip,
  getMonthlyPayslipSummary,
  type CreatePayslipParams,
} from "@/lib/db-client";

interface PayslipFilters {
  employeeId?: number;
  workYear?: number;
  workMonth?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function usePayslips(filters?: PayslipFilters) {
  const { page = 1, pageSize = 20, ...rest } = filters ?? {};

  return useQuery({
    queryKey: queryKeys.payslips.list({ year: rest.workYear, month: rest.workMonth, status: rest.status }),
    queryFn: () =>
      getPayslips({
        ...rest,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });
}

export function usePayslip(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.payslips.detail(id!),
    queryFn: () => getPayslipById(id!),
    enabled: !!id,
  });
}

export function useMonthlyPayslipSummary(workYear?: number, workMonth?: number) {
  return useQuery({
    queryKey: ["payslips", "summary", workYear, workMonth],
    queryFn: () => getMonthlyPayslipSummary(workYear!, workMonth!),
    enabled: !!workYear && !!workMonth,
  });
}

export function useCreatePayslip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreatePayslipParams) => createPayslip(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payslips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useUpdatePayslipStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: "draft" | "approved" | "paid" }) =>
      updatePayslipStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payslips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useDeletePayslip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deletePayslip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payslips.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}
