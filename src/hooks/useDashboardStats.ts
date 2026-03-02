import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { getDashboardStats, getRecentPayslips } from "@/lib/db-client";

export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: () => getDashboardStats(),
  });
}

export function useRecentPayslips(limit: number = 5) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.stats, "recent", limit],
    queryFn: () => getRecentPayslips(limit),
  });
}
