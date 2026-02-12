import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getInsuranceRates,
  getCurrentInsuranceRate,
  createInsuranceRate,
  updateInsuranceRate,
  type CreateInsuranceRateParams,
  type UpdateInsuranceRateParams,
} from "@/lib/db-client";

export function useInsuranceRates() {
  return useQuery({
    queryKey: queryKeys.insuranceRates.all,
    queryFn: () => getInsuranceRates(),
  });
}

export function useCurrentInsuranceRate() {
  return useQuery({
    queryKey: queryKeys.insuranceRates.current,
    queryFn: () => getCurrentInsuranceRate(),
  });
}

export function useCreateInsuranceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateInsuranceRateParams) =>
      createInsuranceRate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceRates.all,
      });
    },
  });
}

export function useUpdateInsuranceRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: number; params: UpdateInsuranceRateParams }) =>
      updateInsuranceRate(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceRates.all,
      });
    },
  });
}
