import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ユーザー（管理者・従業員）
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  role: text("role", { enum: ["admin", "employee"] })
    .notNull()
    .default("employee"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 従業員マスタ
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  employeeNumber: text("employee_number").notNull().unique(), // 社員番号
  lastName: text("last_name").notNull(), // 姓
  firstName: text("first_name").notNull(), // 名
  lastNameKana: text("last_name_kana").notNull(), // 姓（カナ）
  firstNameKana: text("first_name_kana").notNull(), // 名（カナ）
  birthDate: text("birth_date").notNull(), // 生年月日
  hireDate: text("hire_date").notNull(), // 入社日
  department: text("department"), // 部署
  position: text("position"), // 役職
  employmentType: text("employment_type", {
    enum: ["full_time", "part_time", "contract"]
  }).notNull().default("full_time"), // 雇用形態

  // 給与基本情報
  baseSalary: integer("base_salary").notNull(), // 基本給（円）

  // 社会保険情報
  healthInsuranceNumber: text("health_insurance_number"), // 健康保険証番号
  pensionInsuranceNumber: text("pension_insurance_number"), // 年金手帳番号
  employmentInsuranceNumber: text("employment_insurance_number"), // 雇用保険被保険者番号

  // 控除関連
  dependents: integer("dependents").notNull().default(0), // 扶養人数

  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 給与明細
export const payslips = sqliteTable("payslips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  paymentDate: text("payment_date").notNull(), // 支給日
  workYear: integer("work_year").notNull(), // 対象年
  workMonth: integer("work_month").notNull(), // 対象月

  // 支給項目
  baseSalary: integer("base_salary").notNull(), // 基本給
  overtimePay: integer("overtime_pay").notNull().default(0), // 残業手当
  nighttimePay: integer("night_time_pay").notNull().default(0), // 深夜手当
  holidayPay: integer("holiday_pay").notNull().default(0), // 休日手当
  transportAllowance: integer("transport_allowance").notNull().default(0), // 通勤手当
  housingAllowance: integer("housing_allowance").notNull().default(0), // 住宅手当
  familyAllowance: integer("family_allowance").notNull().default(0), // 家族手当
  otherAllowances: integer("other_allowances").notNull().default(0), // その他手当
  totalPayment: integer("total_payment").notNull(), // 支給合計

  // 控除項目
  healthInsurance: integer("health_insurance").notNull().default(0), // 健康保険料
  pensionInsurance: integer("pension_insurance").notNull().default(0), // 厚生年金保険料
  employmentInsurance: integer("employment_insurance").notNull().default(0), // 雇用保険料
  incomeTax: integer("income_tax").notNull().default(0), // 所得税
  residentTax: integer("resident_tax").notNull().default(0), // 住民税
  otherDeductions: integer("other_deductions").notNull().default(0), // その他控除
  totalDeduction: integer("total_deduction").notNull(), // 控除合計

  // 差引支給額
  netPayment: integer("net_payment").notNull(), // 差引支給額

  // 勤怠情報
  workDays: real("work_days").notNull(), // 出勤日数
  paidLeaveDays: real("paid_leave_days").notNull().default(0), // 有給休暇日数
  absentDays: real("absent_days").notNull().default(0), // 欠勤日数
  overtimeHours: real("overtime_hours").notNull().default(0), // 残業時間
  nighttimeHours: real("nighttime_hours").notNull().default(0), // 深夜労働時間
  holidayWorkHours: real("holiday_work_hours").notNull().default(0), // 休日労働時間

  // メモ・備考
  notes: text("notes"), // 備考

  // ステータス
  status: text("status", {
    enum: ["draft", "approved", "paid"]
  }).notNull().default("draft"),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 社会保険料率マスタ（年度ごとの料率管理）
export const insuranceRates = sqliteTable("insurance_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  effectiveFrom: text("effective_from").notNull(), // 適用開始日
  effectiveTo: text("effective_to"), // 適用終了日

  // 健康保険料率（労使折半）
  healthInsuranceRate: real("health_insurance_rate").notNull(), // 例: 0.0998 (9.98%)
  healthInsuranceEmployeeRate: real("health_insurance_employee_rate").notNull(), // 従業員負担率

  // 厚生年金保険料率（労使折半）
  pensionInsuranceRate: real("pension_insurance_rate").notNull(), // 例: 0.183 (18.3%)
  pensionInsuranceEmployeeRate: real("pension_insurance_employee_rate").notNull(), // 従業員負担率

  // 雇用保険料率
  employmentInsuranceEmployeeRate: real("employment_insurance_employee_rate").notNull(), // 従業員負担率
  employmentInsuranceEmployerRate: real("employment_insurance_employer_rate").notNull(), // 事業主負担率

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 年末調整データ
export const yearEndAdjustments = sqliteTable("year_end_adjustments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  adjustmentYear: integer("adjustment_year").notNull(), // 調整年度

  // 所得控除
  basicDeduction: integer("basic_deduction").notNull().default(480000), // 基礎控除
  spouseDeduction: integer("spouse_deduction").notNull().default(0), // 配偶者控除
  dependentDeduction: integer("dependent_deduction").notNull().default(0), // 扶養控除
  socialInsuranceDeduction: integer("social_insurance_deduction").notNull(), // 社会保険料控除
  lifeInsuranceDeduction: integer("life_insurance_deduction").notNull().default(0), // 生命保険料控除
  earthquakeInsuranceDeduction: integer("earthquake_insurance_deduction").notNull().default(0), // 地震保険料控除

  // 調整額
  adjustmentAmount: integer("adjustment_amount").notNull(), // 年末調整額

  status: text("status", {
    enum: ["draft", "submitted", "completed"]
  }).notNull().default("draft"),

  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
