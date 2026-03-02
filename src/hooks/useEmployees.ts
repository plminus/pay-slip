import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  type CreateEmployeeParams,
  type UpdateEmployeeParams,
} from "@/lib/db-client";

interface EmployeeFilters {
  department?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useEmployees(filters?: EmployeeFilters) {
  const { page = 1, pageSize = 20, ...rest } = filters ?? {};

  return useQuery({
    queryKey: queryKeys.employees.list({ ...rest }),
    queryFn: () =>
      getEmployees({
        ...rest,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      }),
  });
}

export function useEmployee(id: number | undefined) {
  return useQuery({
    queryKey: queryKeys.employees.detail(id!),
    queryFn: () => getEmployeeById(id!),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateEmployeeParams) => createEmployee(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, params }: { id: number; params: UpdateEmployeeParams }) =>
      updateEmployee(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deactivateEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats });
    },
  });
}
