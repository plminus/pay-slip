import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  createPayslip,
  type CreatePayslipParams,
} from "@/lib/db-client";

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
