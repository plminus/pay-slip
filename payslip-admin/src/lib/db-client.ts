import { db } from "./turso";
import { users, employees, payslips, yearEndAdjustments, insuranceRates } from "../db/schema";
import { eq, and, like, or, count, desc, sum, lte, gte, isNull } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// ========== 型定義 ==========

export type Employee = InferSelectModel<typeof employees>;
export type CreateEmployeeParams = Omit<
  InferInsertModel<typeof employees>,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateEmployeeParams = Partial<CreateEmployeeParams>;

export type Payslip = InferSelectModel<typeof payslips>;
export type CreatePayslipParams = Omit<
  InferInsertModel<typeof payslips>,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdatePayslipParams = Partial<CreatePayslipParams>;

export interface PayslipWithEmployee extends Payslip {
  employeeName: string;
  employeeNumber: string;
}

export type YearEndAdjustment = InferSelectModel<typeof yearEndAdjustments>;

export type InsuranceRate = InferSelectModel<typeof insuranceRates>;
export type CreateInsuranceRateParams = Omit<
  InferInsertModel<typeof insuranceRates>,
  "id" | "createdAt"
>;
export type UpdateInsuranceRateParams = Partial<CreateInsuranceRateParams>;
export type CreateYearEndAdjustmentParams = Omit<
  InferInsertModel<typeof yearEndAdjustments>,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateYearEndAdjustmentParams = Partial<CreateYearEndAdjustmentParams>;

export interface YearEndAdjustmentWithEmployee extends YearEndAdjustment {
  employeeName: string;
  employeeNumber: string;
}

export interface CreateUserParams {
  email: string;
  displayName: string;
  firebaseUid: string;
  role?: "admin" | "employee";
}

// ========== ユーザー操作 ==========

/**
 * 新しいユーザーをデータベースに作成
 */
export async function createUser(params: CreateUserParams) {
  const { email, displayName, firebaseUid, role = "employee" } = params;

  try {
    const result = await db
      .insert(users)
      .values({
        email,
        displayName,
        firebaseUid,
        role,
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to create user in database:", error);
    throw error;
  }
}

/**
 * Firebase UIDでユーザーを取得
 */
export async function getUserByFirebaseUid(firebaseUid: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.firebaseUid, firebaseUid))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user from database:", error);
    throw error;
  }
}

/**
 * メールアドレスでユーザーを取得
 */
export async function getUserByEmail(email: string) {
  try {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Failed to get user by email:", error);
    throw error;
  }
}

// ========== 従業員操作 ==========

/**
 * 従業員一覧取得（フィルタ・ページネーション対応）
 */
export async function getEmployees(options?: {
  department?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Employee[]; total: number }> {
  const { department, isActive, search, limit = 20, offset = 0 } = options ?? {};

  const conditions = [];

  if (department) {
    conditions.push(eq(employees.department, department));
  }

  if (isActive !== undefined) {
    conditions.push(eq(employees.isActive, isActive));
  }

  if (search) {
    const pattern = `%${search}%`;
    conditions.push(
      or(
        like(employees.employeeNumber, pattern),
        like(employees.lastName, pattern),
        like(employees.firstName, pattern),
        like(employees.lastNameKana, pattern),
        like(employees.firstNameKana, pattern)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select()
      .from(employees)
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(employees.employeeNumber),
    db
      .select({ count: count() })
      .from(employees)
      .where(where),
  ]);

  return { data, total: totalResult[0].count };
}

/**
 * 従業員詳細取得
 */
export async function getEmployeeById(id: number): Promise<Employee | null> {
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);

  return result[0] || null;
}

/**
 * 社員番号の重複チェック
 */
export async function getEmployeeByNumber(
  employeeNumber: string
): Promise<Employee | null> {
  const result = await db
    .select()
    .from(employees)
    .where(eq(employees.employeeNumber, employeeNumber))
    .limit(1);

  return result[0] || null;
}

/**
 * 従業員登録
 */
export async function createEmployee(
  params: CreateEmployeeParams
): Promise<Employee> {
  const result = await db
    .insert(employees)
    .values({
      ...params,
    })
    .returning();

  return result[0];
}

/**
 * 従業員更新
 */
export async function updateEmployee(
  id: number,
  params: UpdateEmployeeParams
): Promise<Employee> {
  const result = await db
    .update(employees)
    .set({
      ...params,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(employees.id, id))
    .returning();

  return result[0];
}

/**
 * 従業員無効化（論理削除）
 */
export async function deactivateEmployee(id: number): Promise<void> {
  await db
    .update(employees)
    .set({
      isActive: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(employees.id, id));
}

/**
 * アクティブ従業員数
 */
export async function getActiveEmployeeCount(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(employees)
    .where(eq(employees.isActive, true));

  return result[0].count;
}

// ========== 給与明細操作 ==========

/**
 * 給与明細登録
 */
export async function createPayslip(
  params: CreatePayslipParams
): Promise<Payslip> {
  const result = await db
    .insert(payslips)
    .values({
      ...params,
    })
    .returning();

  return result[0];
}

/**
 * 重複チェック（同一従業員・同一年月）
 */
export async function checkDuplicatePayslip(
  employeeId: number,
  workYear: number,
  workMonth: number
): Promise<boolean> {
  const result = await db
    .select({ count: count() })
    .from(payslips)
    .where(
      and(
        eq(payslips.employeeId, employeeId),
        eq(payslips.workYear, workYear),
        eq(payslips.workMonth, workMonth)
      )
    );

  return result[0].count > 0;
}

/**
 * 給与明細一覧取得（従業員名JOINつき）
 */
export async function getPayslips(options?: {
  employeeId?: number;
  workYear?: number;
  workMonth?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: PayslipWithEmployee[]; total: number }> {
  const {
    employeeId,
    workYear,
    workMonth,
    status,
    limit = 20,
    offset = 0,
  } = options ?? {};

  const conditions = [];

  if (employeeId) {
    conditions.push(eq(payslips.employeeId, employeeId));
  }
  if (workYear) {
    conditions.push(eq(payslips.workYear, workYear));
  }
  if (workMonth) {
    conditions.push(eq(payslips.workMonth, workMonth));
  }
  if (status) {
    conditions.push(eq(payslips.status, status as "draft" | "approved" | "paid"));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: payslips.id,
        employeeId: payslips.employeeId,
        paymentDate: payslips.paymentDate,
        workYear: payslips.workYear,
        workMonth: payslips.workMonth,
        baseSalary: payslips.baseSalary,
        overtimePay: payslips.overtimePay,
        nighttimePay: payslips.nighttimePay,
        holidayPay: payslips.holidayPay,
        transportAllowance: payslips.transportAllowance,
        housingAllowance: payslips.housingAllowance,
        familyAllowance: payslips.familyAllowance,
        otherAllowances: payslips.otherAllowances,
        totalPayment: payslips.totalPayment,
        healthInsurance: payslips.healthInsurance,
        pensionInsurance: payslips.pensionInsurance,
        employmentInsurance: payslips.employmentInsurance,
        incomeTax: payslips.incomeTax,
        residentTax: payslips.residentTax,
        otherDeductions: payslips.otherDeductions,
        totalDeduction: payslips.totalDeduction,
        netPayment: payslips.netPayment,
        workDays: payslips.workDays,
        paidLeaveDays: payslips.paidLeaveDays,
        absentDays: payslips.absentDays,
        overtimeHours: payslips.overtimeHours,
        nighttimeHours: payslips.nighttimeHours,
        holidayWorkHours: payslips.holidayWorkHours,
        notes: payslips.notes,
        status: payslips.status,
        createdAt: payslips.createdAt,
        updatedAt: payslips.updatedAt,
        employeeName: employees.lastName,
        employeeFirstName: employees.firstName,
        employeeNumber: employees.employeeNumber,
      })
      .from(payslips)
      .innerJoin(employees, eq(payslips.employeeId, employees.id))
      .where(where)
      .orderBy(desc(payslips.workYear), desc(payslips.workMonth), desc(payslips.id))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(payslips).where(where),
  ]);

  return {
    data: data.map((row) => ({
      ...row,
      employeeName: `${row.employeeName} ${row.employeeFirstName}`,
    })),
    total: totalResult[0].count,
  };
}

/**
 * 給与明細詳細取得
 */
export async function getPayslipById(
  id: number
): Promise<PayslipWithEmployee | null> {
  const result = await db
    .select({
      id: payslips.id,
      employeeId: payslips.employeeId,
      paymentDate: payslips.paymentDate,
      workYear: payslips.workYear,
      workMonth: payslips.workMonth,
      baseSalary: payslips.baseSalary,
      overtimePay: payslips.overtimePay,
      nighttimePay: payslips.nighttimePay,
      holidayPay: payslips.holidayPay,
      transportAllowance: payslips.transportAllowance,
      housingAllowance: payslips.housingAllowance,
      familyAllowance: payslips.familyAllowance,
      otherAllowances: payslips.otherAllowances,
      totalPayment: payslips.totalPayment,
      healthInsurance: payslips.healthInsurance,
      pensionInsurance: payslips.pensionInsurance,
      employmentInsurance: payslips.employmentInsurance,
      incomeTax: payslips.incomeTax,
      residentTax: payslips.residentTax,
      otherDeductions: payslips.otherDeductions,
      totalDeduction: payslips.totalDeduction,
      netPayment: payslips.netPayment,
      workDays: payslips.workDays,
      paidLeaveDays: payslips.paidLeaveDays,
      absentDays: payslips.absentDays,
      overtimeHours: payslips.overtimeHours,
      nighttimeHours: payslips.nighttimeHours,
      holidayWorkHours: payslips.holidayWorkHours,
      notes: payslips.notes,
      status: payslips.status,
      createdAt: payslips.createdAt,
      updatedAt: payslips.updatedAt,
      employeeName: employees.lastName,
      employeeFirstName: employees.firstName,
      employeeNumber: employees.employeeNumber,
    })
    .from(payslips)
    .innerJoin(employees, eq(payslips.employeeId, employees.id))
    .where(eq(payslips.id, id))
    .limit(1);

  if (!result[0]) return null;

  const row = result[0];
  return {
    ...row,
    employeeName: `${row.employeeName} ${row.employeeFirstName}`,
  };
}

/**
 * 給与明細更新
 */
export async function updatePayslip(
  id: number,
  params: UpdatePayslipParams
): Promise<Payslip> {
  const result = await db
    .update(payslips)
    .set({
      ...params,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(payslips.id, id))
    .returning();

  return result[0];
}

/**
 * ステータス変更
 */
export async function updatePayslipStatus(
  id: number,
  status: "draft" | "approved" | "paid"
): Promise<void> {
  await db
    .update(payslips)
    .set({
      status,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(payslips.id, id));
}

/**
 * 給与明細削除（下書きのみ）
 */
export async function deletePayslip(id: number): Promise<void> {
  await db.delete(payslips).where(and(eq(payslips.id, id), eq(payslips.status, "draft")));
}

/**
 * 月別集計
 */
export async function getMonthlyPayslipSummary(
  workYear: number,
  workMonth: number
): Promise<{
  totalPayment: number;
  totalDeduction: number;
  totalNetPayment: number;
  count: number;
}> {
  const where = and(
    eq(payslips.workYear, workYear),
    eq(payslips.workMonth, workMonth)
  );

  const [summaryResult, countResult] = await Promise.all([
    db
      .select({
        totalPayment: sum(payslips.totalPayment),
        totalDeduction: sum(payslips.totalDeduction),
        totalNetPayment: sum(payslips.netPayment),
      })
      .from(payslips)
      .where(where),
    db.select({ count: count() }).from(payslips).where(where),
  ]);

  const summary = summaryResult[0];
  return {
    totalPayment: Number(summary.totalPayment ?? 0),
    totalDeduction: Number(summary.totalDeduction ?? 0),
    totalNetPayment: Number(summary.totalNetPayment ?? 0),
    count: countResult[0].count,
  };
}

// ========== ダッシュボード操作 ==========

/**
 * ダッシュボード統計取得
 */
export async function getDashboardStats(): Promise<{
  activeEmployeeCount: number;
  currentMonthPayslipCount: number;
  draftPayslipCount: number;
  currentMonthTotalPayment: number;
}> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [activeCount, currentMonthResult, draftCount, totalPaymentResult] =
    await Promise.all([
      db
        .select({ count: count() })
        .from(employees)
        .where(eq(employees.isActive, true)),
      db
        .select({ count: count() })
        .from(payslips)
        .where(
          and(
            eq(payslips.workYear, currentYear),
            eq(payslips.workMonth, currentMonth)
          )
        ),
      db
        .select({ count: count() })
        .from(payslips)
        .where(eq(payslips.status, "draft")),
      db
        .select({ total: sum(payslips.totalPayment) })
        .from(payslips)
        .where(
          and(
            eq(payslips.workYear, currentYear),
            eq(payslips.workMonth, currentMonth)
          )
        ),
    ]);

  return {
    activeEmployeeCount: activeCount[0].count,
    currentMonthPayslipCount: currentMonthResult[0].count,
    draftPayslipCount: draftCount[0].count,
    currentMonthTotalPayment: Number(totalPaymentResult[0].total ?? 0),
  };
}

/**
 * 最近の給与明細取得
 */
export async function getRecentPayslips(
  limit: number = 5
): Promise<PayslipWithEmployee[]> {
  const data = await db
    .select({
      id: payslips.id,
      employeeId: payslips.employeeId,
      paymentDate: payslips.paymentDate,
      workYear: payslips.workYear,
      workMonth: payslips.workMonth,
      baseSalary: payslips.baseSalary,
      overtimePay: payslips.overtimePay,
      nighttimePay: payslips.nighttimePay,
      holidayPay: payslips.holidayPay,
      transportAllowance: payslips.transportAllowance,
      housingAllowance: payslips.housingAllowance,
      familyAllowance: payslips.familyAllowance,
      otherAllowances: payslips.otherAllowances,
      totalPayment: payslips.totalPayment,
      healthInsurance: payslips.healthInsurance,
      pensionInsurance: payslips.pensionInsurance,
      employmentInsurance: payslips.employmentInsurance,
      incomeTax: payslips.incomeTax,
      residentTax: payslips.residentTax,
      otherDeductions: payslips.otherDeductions,
      totalDeduction: payslips.totalDeduction,
      netPayment: payslips.netPayment,
      workDays: payslips.workDays,
      paidLeaveDays: payslips.paidLeaveDays,
      absentDays: payslips.absentDays,
      overtimeHours: payslips.overtimeHours,
      nighttimeHours: payslips.nighttimeHours,
      holidayWorkHours: payslips.holidayWorkHours,
      notes: payslips.notes,
      status: payslips.status,
      createdAt: payslips.createdAt,
      updatedAt: payslips.updatedAt,
      employeeName: employees.lastName,
      employeeFirstName: employees.firstName,
      employeeNumber: employees.employeeNumber,
    })
    .from(payslips)
    .innerJoin(employees, eq(payslips.employeeId, employees.id))
    .orderBy(desc(payslips.createdAt))
    .limit(limit);

  return data.map((row) => ({
    ...row,
    employeeName: `${row.employeeName} ${row.employeeFirstName}`,
  }));
}

// ========== 年末調整操作 ==========

/**
 * 年末調整一覧取得（従業員名JOINつき）
 */
export async function getYearEndAdjustments(options?: {
  adjustmentYear?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: YearEndAdjustmentWithEmployee[]; total: number }> {
  const { adjustmentYear, status, limit = 20, offset = 0 } = options ?? {};

  const conditions = [];

  if (adjustmentYear) {
    conditions.push(eq(yearEndAdjustments.adjustmentYear, adjustmentYear));
  }
  if (status) {
    conditions.push(
      eq(yearEndAdjustments.status, status as "draft" | "submitted" | "completed")
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, totalResult] = await Promise.all([
    db
      .select({
        id: yearEndAdjustments.id,
        employeeId: yearEndAdjustments.employeeId,
        adjustmentYear: yearEndAdjustments.adjustmentYear,
        basicDeduction: yearEndAdjustments.basicDeduction,
        spouseDeduction: yearEndAdjustments.spouseDeduction,
        dependentDeduction: yearEndAdjustments.dependentDeduction,
        socialInsuranceDeduction: yearEndAdjustments.socialInsuranceDeduction,
        lifeInsuranceDeduction: yearEndAdjustments.lifeInsuranceDeduction,
        earthquakeInsuranceDeduction: yearEndAdjustments.earthquakeInsuranceDeduction,
        adjustmentAmount: yearEndAdjustments.adjustmentAmount,
        status: yearEndAdjustments.status,
        createdAt: yearEndAdjustments.createdAt,
        updatedAt: yearEndAdjustments.updatedAt,
        employeeName: employees.lastName,
        employeeFirstName: employees.firstName,
        employeeNumber: employees.employeeNumber,
      })
      .from(yearEndAdjustments)
      .innerJoin(employees, eq(yearEndAdjustments.employeeId, employees.id))
      .where(where)
      .orderBy(desc(yearEndAdjustments.adjustmentYear), desc(yearEndAdjustments.id))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(yearEndAdjustments).where(where),
  ]);

  return {
    data: data.map((row) => ({
      ...row,
      employeeName: `${row.employeeName} ${row.employeeFirstName}`,
    })),
    total: totalResult[0].count,
  };
}

/**
 * 年末調整詳細取得
 */
export async function getYearEndAdjustmentById(
  id: number
): Promise<YearEndAdjustmentWithEmployee | null> {
  const result = await db
    .select({
      id: yearEndAdjustments.id,
      employeeId: yearEndAdjustments.employeeId,
      adjustmentYear: yearEndAdjustments.adjustmentYear,
      basicDeduction: yearEndAdjustments.basicDeduction,
      spouseDeduction: yearEndAdjustments.spouseDeduction,
      dependentDeduction: yearEndAdjustments.dependentDeduction,
      socialInsuranceDeduction: yearEndAdjustments.socialInsuranceDeduction,
      lifeInsuranceDeduction: yearEndAdjustments.lifeInsuranceDeduction,
      earthquakeInsuranceDeduction: yearEndAdjustments.earthquakeInsuranceDeduction,
      adjustmentAmount: yearEndAdjustments.adjustmentAmount,
      status: yearEndAdjustments.status,
      createdAt: yearEndAdjustments.createdAt,
      updatedAt: yearEndAdjustments.updatedAt,
      employeeName: employees.lastName,
      employeeFirstName: employees.firstName,
      employeeNumber: employees.employeeNumber,
    })
    .from(yearEndAdjustments)
    .innerJoin(employees, eq(yearEndAdjustments.employeeId, employees.id))
    .where(eq(yearEndAdjustments.id, id))
    .limit(1);

  if (!result[0]) return null;

  const row = result[0];
  return {
    ...row,
    employeeName: `${row.employeeName} ${row.employeeFirstName}`,
  };
}

/**
 * 年末調整登録
 */
export async function createYearEndAdjustment(
  params: CreateYearEndAdjustmentParams
): Promise<YearEndAdjustment> {
  const result = await db
    .insert(yearEndAdjustments)
    .values({ ...params })
    .returning();

  return result[0];
}

/**
 * 年末調整更新
 */
export async function updateYearEndAdjustment(
  id: number,
  params: UpdateYearEndAdjustmentParams
): Promise<YearEndAdjustment> {
  const result = await db
    .update(yearEndAdjustments)
    .set({
      ...params,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(yearEndAdjustments.id, id))
    .returning();

  return result[0];
}

/**
 * 年間社会保険料集計（対象従業員・対象年度の全payslipsから）
 */
export async function getAnnualSocialInsurance(
  employeeId: number,
  year: number
): Promise<number> {
  const result = await db
    .select({
      total: sum(payslips.healthInsurance),
      totalPension: sum(payslips.pensionInsurance),
      totalEmployment: sum(payslips.employmentInsurance),
    })
    .from(payslips)
    .where(
      and(eq(payslips.employeeId, employeeId), eq(payslips.workYear, year))
    );

  const row = result[0];
  return (
    Number(row.total ?? 0) +
    Number(row.totalPension ?? 0) +
    Number(row.totalEmployment ?? 0)
  );
}

/**
 * 年間所得税集計
 */
export async function getAnnualIncomeTax(
  employeeId: number,
  year: number
): Promise<number> {
  const result = await db
    .select({ total: sum(payslips.incomeTax) })
    .from(payslips)
    .where(
      and(eq(payslips.employeeId, employeeId), eq(payslips.workYear, year))
    );

  return Number(result[0].total ?? 0);
}

// ========== 保険料率操作 ==========

/**
 * 保険料率一覧取得（適用開始日の降順）
 */
export async function getInsuranceRates(): Promise<InsuranceRate[]> {
  return db
    .select()
    .from(insuranceRates)
    .orderBy(desc(insuranceRates.effectiveFrom));
}

/**
 * 現在有効な保険料率取得
 */
export async function getCurrentInsuranceRate(): Promise<InsuranceRate | null> {
  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .select()
    .from(insuranceRates)
    .where(
      and(
        lte(insuranceRates.effectiveFrom, today),
        or(
          isNull(insuranceRates.effectiveTo),
          gte(insuranceRates.effectiveTo!, today)
        )
      )
    )
    .orderBy(desc(insuranceRates.effectiveFrom))
    .limit(1);

  return result[0] || null;
}

/**
 * 保険料率登録
 */
export async function createInsuranceRate(
  params: CreateInsuranceRateParams
): Promise<InsuranceRate> {
  const result = await db
    .insert(insuranceRates)
    .values({ ...params })
    .returning();

  return result[0];
}

/**
 * 保険料率更新
 */
export async function updateInsuranceRate(
  id: number,
  params: UpdateInsuranceRateParams
): Promise<InsuranceRate> {
  const result = await db
    .update(insuranceRates)
    .set({ ...params })
    .where(eq(insuranceRates.id, id))
    .returning();

  return result[0];
}

/**
 * ユーザープロフィール更新
 */
export async function updateUserProfile(
  id: number,
  params: { displayName?: string; email?: string }
): Promise<void> {
  await db
    .update(users)
    .set(params)
    .where(eq(users.id, id));
}
