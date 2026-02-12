/**
 * 給与計算ユーティリティ
 * 日本の法令に準拠した給与・控除計算
 */

// 2025年度の社会保険料率（デフォルト値）
export const DEFAULT_INSURANCE_RATES = {
  // 健康保険料率（協会けんぽ全国平均）
  healthInsuranceRate: 0.1003, // 10.03%
  healthInsuranceEmployeeRate: 0.05015, // 従業員負担 5.015%

  // 厚生年金保険料率
  pensionInsuranceRate: 0.183, // 18.3%
  pensionInsuranceEmployeeRate: 0.0915, // 従業員負担 9.15%

  // 雇用保険料率（一般の事業）
  employmentInsuranceEmployeeRate: 0.006, // 従業員負担 0.6%
  employmentInsuranceEmployerRate: 0.0095, // 事業主負担 0.95%
};

/**
 * 標準報酬月額を計算
 * 健康保険・厚生年金の保険料計算のベースとなる
 */
export function calculateStandardMonthlyRemuneration(monthlySalary: number): number {
  // 標準報酬月額表に基づく（簡易版）
  const grades = [
    { min: 0, max: 63000, standard: 58000 },
    { min: 63000, max: 73000, standard: 68000 },
    { min: 73000, max: 83000, standard: 78000 },
    { min: 83000, max: 93000, standard: 88000 },
    { min: 93000, max: 101000, standard: 98000 },
    { min: 101000, max: 107000, standard: 104000 },
    { min: 107000, max: 114000, standard: 110000 },
    { min: 114000, max: 122000, standard: 118000 },
    { min: 122000, max: 130000, standard: 126000 },
    { min: 130000, max: 138000, standard: 134000 },
    { min: 138000, max: 146000, standard: 142000 },
    { min: 146000, max: 155000, standard: 150000 },
    { min: 155000, max: 165000, standard: 160000 },
    { min: 165000, max: 175000, standard: 170000 },
    { min: 175000, max: 185000, standard: 180000 },
    { min: 185000, max: 195000, standard: 190000 },
    { min: 195000, max: 210000, standard: 200000 },
    { min: 210000, max: 230000, standard: 220000 },
    { min: 230000, max: 250000, standard: 240000 },
    { min: 250000, max: 270000, standard: 260000 },
    { min: 270000, max: 290000, standard: 280000 },
    { min: 290000, max: 310000, standard: 300000 },
    { min: 310000, max: 330000, standard: 320000 },
    { min: 330000, max: 350000, standard: 340000 },
    { min: 350000, max: 370000, standard: 360000 },
    { min: 370000, max: 395000, standard: 380000 },
    { min: 395000, max: 425000, standard: 410000 },
    { min: 425000, max: 455000, standard: 440000 },
    { min: 455000, max: 485000, standard: 470000 },
    { min: 485000, max: 515000, standard: 500000 },
    { min: 515000, max: 545000, standard: 530000 },
    { min: 545000, max: 575000, standard: 560000 },
    { min: 575000, max: 605000, standard: 590000 },
    { min: 605000, max: 635000, standard: 620000 },
    { min: 635000, max: 665000, standard: 650000 },
    { min: 665000, max: 695000, standard: 680000 },
    { min: 695000, max: 730000, standard: 710000 },
    { min: 730000, max: 770000, standard: 750000 },
    { min: 770000, max: 810000, standard: 790000 },
    { min: 810000, max: 855000, standard: 830000 },
    { min: 855000, max: 905000, standard: 880000 },
    { min: 905000, max: 955000, standard: 930000 },
    { min: 955000, max: 1005000, standard: 980000 },
    { min: 1005000, max: 1055000, standard: 1030000 },
    { min: 1055000, max: 1115000, standard: 1090000 },
    { min: 1115000, max: 1175000, standard: 1150000 },
    { min: 1175000, max: 1235000, standard: 1210000 },
    { min: 1235000, max: 1295000, standard: 1270000 },
    { min: 1295000, max: Infinity, standard: 1330000 },
  ];

  const grade = grades.find(g => monthlySalary >= g.min && monthlySalary < g.max);
  return grade?.standard ?? 1330000;
}

/**
 * 健康保険料を計算（従業員負担分）
 */
export function calculateHealthInsurance(
  standardMonthlyRemuneration: number,
  employeeRate: number = DEFAULT_INSURANCE_RATES.healthInsuranceEmployeeRate
): number {
  return Math.floor(standardMonthlyRemuneration * employeeRate);
}

/**
 * 厚生年金保険料を計算（従業員負担分）
 */
export function calculatePensionInsurance(
  standardMonthlyRemuneration: number,
  employeeRate: number = DEFAULT_INSURANCE_RATES.pensionInsuranceEmployeeRate
): number {
  return Math.floor(standardMonthlyRemuneration * employeeRate);
}

/**
 * 雇用保険料を計算（従業員負担分）
 */
export function calculateEmploymentInsurance(
  totalPayment: number,
  employeeRate: number = DEFAULT_INSURANCE_RATES.employmentInsuranceEmployeeRate
): number {
  return Math.floor(totalPayment * employeeRate);
}

/**
 * 所得税を計算（源泉徴収税額）
 * 月額表（甲欄）による簡易計算
 */
export function calculateIncomeTax(
  taxableIncome: number,
  dependents: number = 0
): number {
  // 社会保険料控除後の課税所得
  // 扶養親族等の数に応じた源泉徴収税額表（甲欄）

  // 扶養人数0の場合の税額表（簡易版）
  if (dependents === 0) {
    if (taxableIncome < 88000) return 0;
    if (taxableIncome < 89000) return Math.floor((taxableIncome - 88000) * 1.021);
    if (taxableIncome < 90000) return Math.floor((taxableIncome - 88000) * 1.021);
    if (taxableIncome < 150000) return Math.floor((taxableIncome - 88000) * 0.05105);
    if (taxableIncome < 200000) return Math.floor((taxableIncome - 88000) * 0.05105);
    if (taxableIncome < 250000) return Math.floor((taxableIncome - 88000) * 0.05105 + 1020);
    if (taxableIncome < 300000) return Math.floor((taxableIncome - 88000) * 0.05105 + 2040);
    if (taxableIncome < 350000) return Math.floor((taxableIncome - 88000) * 0.1021 + 3060);
    if (taxableIncome < 400000) return Math.floor((taxableIncome - 88000) * 0.1021 + 6120);
    if (taxableIncome < 450000) return Math.floor((taxableIncome - 88000) * 0.1021 + 9180);
    if (taxableIncome < 550000) return Math.floor((taxableIncome - 88000) * 0.1021 + 12240);
    if (taxableIncome < 650000) return Math.floor((taxableIncome - 88000) * 0.2042 + 18360);
    if (taxableIncome < 750000) return Math.floor((taxableIncome - 88000) * 0.2042 + 30600);
    if (taxableIncome < 850000) return Math.floor((taxableIncome - 88000) * 0.2042 + 42840);
    return Math.floor((taxableIncome - 88000) * 0.2042 + 55080);
  }

  // 扶養人数1人以上の場合は控除額が増えるため税額が減少
  // 簡易的に扶養1人あたり38,000円の控除とする
  const adjustedIncome = taxableIncome - (dependents * 38000);
  return calculateIncomeTax(adjustedIncome, 0);
}

/**
 * 残業手当を計算
 * @param hourlyWage 時給
 * @param overtimeHours 残業時間
 * @param rate 割増率（通常1.25、深夜1.5、休日1.35など）
 */
export function calculateOvertimePay(
  hourlyWage: number,
  overtimeHours: number,
  rate: number = 1.25
): number {
  return Math.floor(hourlyWage * overtimeHours * rate);
}

/**
 * 時給を計算（月給から）
 * @param monthlySalary 月給
 * @param monthlyWorkHours 月間所定労働時間（デフォルト: 160時間）
 */
export function calculateHourlyWage(
  monthlySalary: number,
  monthlyWorkHours: number = 160
): number {
  return Math.floor(monthlySalary / monthlyWorkHours);
}

/**
 * 総支給額を計算
 */
export function calculateTotalPayment(params: {
  baseSalary: number;
  overtimePay?: number;
  nighttimePay?: number;
  holidayPay?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  familyAllowance?: number;
  otherAllowances?: number;
}): number {
  return (
    params.baseSalary +
    (params.overtimePay ?? 0) +
    (params.nighttimePay ?? 0) +
    (params.holidayPay ?? 0) +
    (params.transportAllowance ?? 0) +
    (params.housingAllowance ?? 0) +
    (params.familyAllowance ?? 0) +
    (params.otherAllowances ?? 0)
  );
}

/**
 * 総控除額を計算
 */
export function calculateTotalDeduction(params: {
  healthInsurance: number;
  pensionInsurance: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax?: number;
  otherDeductions?: number;
}): number {
  return (
    params.healthInsurance +
    params.pensionInsurance +
    params.employmentInsurance +
    params.incomeTax +
    (params.residentTax ?? 0) +
    (params.otherDeductions ?? 0)
  );
}

/**
 * 差引支給額（手取り）を計算
 */
export function calculateNetPayment(
  totalPayment: number,
  totalDeduction: number
): number {
  return totalPayment - totalDeduction;
}

/**
 * 給与明細の全計算を実行
 */
export interface PayrollCalculationParams {
  baseSalary: number;
  overtimeHours?: number;
  nighttimeHours?: number;
  holidayWorkHours?: number;
  transportAllowance?: number;
  housingAllowance?: number;
  familyAllowance?: number;
  otherAllowances?: number;
  residentTax?: number;
  otherDeductions?: number;
  dependents?: number;
  monthlyWorkHours?: number;
  insuranceRates?: {
    healthInsuranceEmployeeRate: number;
    pensionInsuranceEmployeeRate: number;
    employmentInsuranceEmployeeRate: number;
  };
}

export interface PayrollCalculationResult {
  // 支給
  baseSalary: number;
  overtimePay: number;
  nighttimePay: number;
  holidayPay: number;
  transportAllowance: number;
  housingAllowance: number;
  familyAllowance: number;
  otherAllowances: number;
  totalPayment: number;

  // 控除
  healthInsurance: number;
  pensionInsurance: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  otherDeductions: number;
  totalDeduction: number;

  // 差引支給額
  netPayment: number;
}

export function calculatePayroll(params: PayrollCalculationParams): PayrollCalculationResult {
  const {
    baseSalary,
    overtimeHours = 0,
    nighttimeHours = 0,
    holidayWorkHours = 0,
    transportAllowance = 0,
    housingAllowance = 0,
    familyAllowance = 0,
    otherAllowances = 0,
    residentTax = 0,
    otherDeductions = 0,
    dependents = 0,
    monthlyWorkHours = 160,
    insuranceRates,
  } = params;

  // 時給計算
  const hourlyWage = calculateHourlyWage(baseSalary, monthlyWorkHours);

  // 各種手当計算
  const overtimePay = calculateOvertimePay(hourlyWage, overtimeHours, 1.25);
  const nighttimePay = calculateOvertimePay(hourlyWage, nighttimeHours, 1.5);
  const holidayPay = calculateOvertimePay(hourlyWage, holidayWorkHours, 1.35);

  // 総支給額計算
  const totalPayment = calculateTotalPayment({
    baseSalary,
    overtimePay,
    nighttimePay,
    holidayPay,
    transportAllowance,
    housingAllowance,
    familyAllowance,
    otherAllowances,
  });

  // 標準報酬月額計算
  const standardMonthlyRemuneration = calculateStandardMonthlyRemuneration(baseSalary);

  // 社会保険料計算
  const healthInsurance = calculateHealthInsurance(
    standardMonthlyRemuneration,
    insuranceRates?.healthInsuranceEmployeeRate
  );
  const pensionInsurance = calculatePensionInsurance(
    standardMonthlyRemuneration,
    insuranceRates?.pensionInsuranceEmployeeRate
  );
  const employmentInsurance = calculateEmploymentInsurance(
    totalPayment,
    insuranceRates?.employmentInsuranceEmployeeRate
  );

  // 課税所得計算（総支給額 - 社会保険料）
  const taxableIncome = totalPayment - healthInsurance - pensionInsurance - employmentInsurance;

  // 所得税計算
  const incomeTax = calculateIncomeTax(taxableIncome, dependents);

  // 総控除額計算
  const totalDeduction = calculateTotalDeduction({
    healthInsurance,
    pensionInsurance,
    employmentInsurance,
    incomeTax,
    residentTax,
    otherDeductions,
  });

  // 差引支給額計算
  const netPayment = calculateNetPayment(totalPayment, totalDeduction);

  return {
    baseSalary,
    overtimePay,
    nighttimePay,
    holidayPay,
    transportAllowance,
    housingAllowance,
    familyAllowance,
    otherAllowances,
    totalPayment,
    healthInsurance,
    pensionInsurance,
    employmentInsurance,
    incomeTax,
    residentTax,
    otherDeductions,
    totalDeduction,
    netPayment,
  };
}
