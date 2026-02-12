export const queryKeys = {
  employees: {
    all: ["employees"] as const,
    list: (filters?: { department?: string; isActive?: boolean }) =>
      ["employees", "list", filters] as const,
    detail: (id: number) => ["employees", "detail", id] as const,
  },
  payslips: {
    all: ["payslips"] as const,
    list: (filters?: { year?: number; month?: number; status?: string }) =>
      ["payslips", "list", filters] as const,
    detail: (id: number) => ["payslips", "detail", id] as const,
    byEmployee: (employeeId: number) =>
      ["payslips", "employee", employeeId] as const,
  },
  yearEndAdjustments: {
    all: ["yearEndAdjustments"] as const,
    list: (year?: number) => ["yearEndAdjustments", "list", year] as const,
    detail: (id: number) => ["yearEndAdjustments", "detail", id] as const,
  },
  insuranceRates: {
    all: ["insuranceRates"] as const,
    current: ["insuranceRates", "current"] as const,
  },
  dashboard: {
    stats: ["dashboard", "stats"] as const,
  },
} as const;
