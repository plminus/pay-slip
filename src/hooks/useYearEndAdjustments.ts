import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getYearEndAdjustments,
  getYearEndAdjustmentById,
  createYearEndAdjustment,
  updateYearEndAdjustment,
  getAnnualSocialInsurance,
  getAnnualIncomeTax,
  type CreateYearEndAdjustmentParams,
  type UpdateYearEndAdjustmentParams,
} from "@/lib/db-client";

interface YearEndAdjustmentFilters {
  adjustmentYear?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useYearEndAdjustments(filters?: YearEndAdjustmentFilters) {
  const { page = 1, pageSize = 20, ...rest } = filters ?? {};

  return useQuery({
    queryKey: queryKeys.yearEndAdjustments.list(rest.adjustmentYear),
    queryFn: () =>
      getYearEndAdjustments({
        ...rest,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });
}

export function useYearEndAdjustment(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.yearEndAdjustments.detail(id!),
    queryFn: () => getYearEndAdjustmentById(id!),
    enabled: !!id,
  });
}

export function useCreateYearEndAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateYearEndAdjustmentParams) =>
      createYearEndAdjustment(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.yearEndAdjustments.all,
      });
    },
  });
}

export function useUpdateYearEndAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      params,
    }: {
      id: number;
      params: UpdateYearEndAdjustmentParams;
    }) => updateYearEndAdjustment(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.yearEndAdjustments.all,
      });
    },
  });
}

export function useAnnualSocialInsurance(
  employeeId: number | undefined,
  year: number | undefined
) {
  return useQuery({
    queryKey: ["annualSocialInsurance", employeeId, year],
    queryFn: () => getAnnualSocialInsurance(employeeId!, year!),
    enabled: !!employeeId && !!year,
  });
}

export function useAnnualIncomeTax(
  employeeId: number | undefined,
  year: number | undefined
) {
  return useQuery({
    queryKey: ["annualIncomeTax", employeeId, year],
    queryFn: () => getAnnualIncomeTax(employeeId!, year!),
    enabled: !!employeeId && !!year,
  });
}
