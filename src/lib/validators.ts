import { z } from "zod/v4";

/** 従業員フォーム */
export const employeeFormSchema = z.object({
  employeeNumber: z
    .string()
    .min(1, "社員番号は必須です")
    .max(20, "社員番号は20文字以内で入力してください")
    .regex(
      /^[A-Za-z0-9-]+$/,
      "社員番号は半角英数字とハイフンのみ使用できます"
    ),
  lastName: z.string().min(1, "姓は必須です").max(50),
  firstName: z.string().min(1, "名は必須です").max(50),
  lastNameKana: z
    .string()
    .min(1, "姓（カナ）は必須です")
    .max(50)
    .regex(/^[\u30A0-\u30FF]+$/, "カタカナで入力してください"),
  firstNameKana: z
    .string()
    .min(1, "名（カナ）は必須です")
    .max(50)
    .regex(/^[\u30A0-\u30FF]+$/, "カタカナで入力してください"),
  birthDate: z.string().min(1, "生年月日は必須です"),
  hireDate: z.string().min(1, "入社日は必須です"),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract"]),
  baseSalary: z
    .number()
    .min(0, "基本給は0以上で入力してください")
    .max(99999999, "基本給の上限を超えています"),
  healthInsuranceNumber: z.string().optional(),
  pensionInsuranceNumber: z.string().optional(),
  employmentInsuranceNumber: z.string().optional(),
  dependents: z.number().min(0).max(20).default(0),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

/** 給与明細作成フォーム */
export const payslipCreateSchema = z.object({
  employeeId: z.number().min(1, "従業員を選択してください"),
  paymentDate: z.string().min(1, "支給日は必須です"),
  workYear: z.number().min(2020).max(2099),
  workMonth: z.number().min(1).max(12),
  workDays: z.number().min(0).max(31),
  paidLeaveDays: z.number().min(0).max(31).default(0),
  absentDays: z.number().min(0).max(31).default(0),
  overtimeHours: z.number().min(0).max(999).default(0),
  nighttimeHours: z.number().min(0).max(999).default(0),
  holidayWorkHours: z.number().min(0).max(999).default(0),
  transportAllowance: z.number().min(0).default(0),
  housingAllowance: z.number().min(0).default(0),
  familyAllowance: z.number().min(0).default(0),
  otherAllowances: z.number().min(0).default(0),
  residentTax: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
  notes: z.string().optional(),
  status: z.enum(["draft", "approved"]).default("draft"),
});

export type PayslipCreateValues = z.infer<typeof payslipCreateSchema>;

/** 年末調整フォーム */
export const yearEndAdjustmentSchema = z.object({
  employeeId: z.number().min(1, "従業員を選択してください"),
  adjustmentYear: z.number().min(2020).max(2099),
  basicDeduction: z.number().default(480000),
  spouseDeduction: z.number().min(0).default(0),
  dependentDeduction: z.number().min(0).default(0),
  socialInsuranceDeduction: z.number().min(0),
  lifeInsuranceDeduction: z.number().min(0).max(120000).default(0),
  earthquakeInsuranceDeduction: z.number().min(0).max(50000).default(0),
  status: z.enum(["draft", "submitted", "completed"]).default("draft"),
});

export type YearEndAdjustmentValues = z.infer<
  typeof yearEndAdjustmentSchema
>;

/** 保険料率フォーム（%入力: 0〜100） */
export const insuranceRateSchema = z.object({
  effectiveFrom: z.string().min(1, "適用開始日は必須です"),
  effectiveTo: z.string().optional(),
  healthInsuranceRate: z.number().min(0).max(100),
  healthInsuranceEmployeeRate: z.number().min(0).max(100),
  pensionInsuranceRate: z.number().min(0).max(100),
  pensionInsuranceEmployeeRate: z.number().min(0).max(100),
  employmentInsuranceEmployeeRate: z.number().min(0).max(100),
  employmentInsuranceEmployerRate: z.number().min(0).max(100),
});

export type InsuranceRateValues = z.infer<typeof insuranceRateSchema>;

/** プロフィール */
export const userProfileSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です").max(100),
  email: z.string().email("正しいメールアドレスを入力してください"),
});

export type UserProfileValues = z.infer<typeof userProfileSchema>;

/** パスワード変更 */
export const passwordChangeSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "現在のパスワードを入力してください"),
    newPassword: z
      .string()
      .min(6, "新しいパスワードは6文字以上で入力してください"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "新しいパスワードが一致しません",
    path: ["confirmPassword"],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
