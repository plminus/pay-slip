import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getCompanySettings, upsertCompanySettings } from "@/lib/db-client";

export function useCompanySettings() {
  return useQuery({
    queryKey: queryKeys.companySettings.all,
    queryFn: () => getCompanySettings(),
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { paymentDay: number }) =>
      upsertCompanySettings(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.companySettings.all,
      });
    },
  });
}
