# 給与明細管理システム 開発ガイド

## 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [実装フェーズと優先順位](#2-実装フェーズと優先順位)
3. [Phase 0: 共通基盤整備](#3-phase-0-共通基盤整備)
4. [Phase 1: 従業員管理](#4-phase-1-従業員管理)
5. [Phase 2: 給与明細作成](#5-phase-2-給与明細作成)
6. [Phase 3: 給与明細一覧](#6-phase-3-給与明細一覧)
7. [Phase 4: ダッシュボード改善](#7-phase-4-ダッシュボード改善)
8. [Phase 5: 年末調整](#8-phase-5-年末調整)
9. [Phase 6: 設定](#9-phase-6-設定)
10. [ディレクトリ構成](#10-ディレクトリ構成)
11. [ルーティング設計](#11-ルーティング設計)
12. [データベース操作仕様](#12-データベース操作仕様)
13. [バリデーションスキーマ](#13-バリデーションスキーマ)
14. [状態管理設計](#14-状態管理設計)
15. [ユーティリティ](#15-ユーティリティ)

---

## 1. プロジェクト概要

### 技術スタック

| カテゴリ | 技術 | バージョン |
|----------|------|-----------|
| フロントエンド | React + TypeScript | 19.2.0 / ~5.9.3 |
| ビルドツール | Vite | 7.3.1 |
| UI コンポーネント | shadcn/ui (New York style) | - |
| CSS フレームワーク | Tailwind CSS | 4.1.18 |
| アイコン | Lucide React | 0.563.0 |
| ORM | Drizzle ORM + Turso (SQLite) | 0.45.1 |
| 認証 | Firebase Auth | 12.9.0 |
| フォーム | React Hook Form + Zod v4 | 7.71.1 / 4.3.6 |
| データ取得 | TanStack React Query | 5.90.20 |
| ルーティング | React Router DOM | 7.13.0 |

### 現在の実装状況

| 画面 | パス | ステータス |
|------|------|-----------|
| ダッシュボード | `/` | 実装済み（プレースホルダーデータ） |
| 従業員管理 | `/employees` | スタブ |
| 給与明細一覧 | `/payslips` | スタブ |
| 給与明細作成 | `/payslips/create` | スタブ |
| 年末調整 | `/year-end-adjustment` | スタブ |
| 設定 | `/settings` | スタブ |

### 実装済みの基盤

- **DBスキーマ** (`src/db/schema.ts`): 5テーブル（users, employees, payslips, insuranceRates, yearEndAdjustments）
- **給与計算ロジック** (`src/lib/payroll-calculator.ts`): 標準報酬月額、社会保険料、所得税、各種手当の計算
- **DB操作** (`src/lib/db-client.ts`): ユーザーCRUD（createUser, getUserByFirebaseUid, getUserByEmail）
- **認証** (`src/hooks/useAuth.tsx`): Firebase Auth連携（signIn, signUp, signOut）
- **レイアウト** (`src/components/AppLayout.tsx`): サイドバー付きレイアウト

---

## 2. 実装フェーズと優先順位

依存関係に基づく実装順序:

| Phase | 画面 | 優先度 | 依存 | 理由 |
|-------|------|--------|------|------|
| **0** | 共通基盤整備 | 必須 | なし | 全フェーズの前提 |
| **1** | 従業員管理 | 高 | Phase 0 | 他画面の前提データ |
| **2** | 給与明細作成 | 高 | Phase 1 | 計算ロジック実装済み。従業員データが必要 |
| **3** | 給与明細一覧 | 高 | Phase 2 | 作成した明細の管理 |
| **4** | ダッシュボード改善 | 中 | Phase 1-3 | 実データの統計表示 |
| **5** | 年末調整 | 中 | Phase 3 | 年間給与データを集計 |
| **6** | 設定 | 低 | Phase 0 | 独立して実装可能 |

---

## 3. Phase 0: 共通基盤整備

### 3.1 shadcn/ui コンポーネント追加

以下のコンポーネントを追加インストールする:

```bash
npx shadcn@latest add table dialog select dropdown-menu badge tabs alert toast pagination textarea switch popover command scroll-area avatar alert-dialog
```

| コンポーネント | 用途 |
|---------------|------|
| `table` | 従業員一覧、給与明細一覧、年末調整一覧 |
| `dialog` | 従業員登録/編集 |
| `alert-dialog` | 削除確認、ステータス変更確認 |
| `select` | 部署選択、雇用形態選択、年月選択、ステータスフィルタ |
| `dropdown-menu` | テーブル行のアクションメニュー |
| `badge` | ステータス表示（draft/approved/paid） |
| `tabs` | 設定画面のセクション切替、給与明細の詳細表示 |
| `alert` | 操作結果通知 |
| `toast` | 非同期操作の成功/失敗通知 |
| `pagination` | 一覧画面のページネーション |
| `textarea` | 備考欄 |
| `switch` | アクティブ/非アクティブ切替 |
| `popover` | 日付ピッカー用 |
| `command` | 従業員検索コンボボックス |
| `scroll-area` | 長いフォームのスクロール |
| `avatar` | ユーザーアイコン |

### 3.2 TanStack React Query の有効化

`src/main.tsx` に `QueryClientProvider` を追加:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
```

### 3.3 共有コンポーネント

`src/components/shared/` に以下を作成:

#### DataTable

汎用データテーブルコンポーネント（ソート・ページネーション対応）。

```tsx
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
}

interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}
```

#### PageHeader

ページタイトルとアクションボタンの統一レイアウト。

```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}
```

#### StatusBadge

ステータスを色分け表示するバッジ。

```tsx
interface StatusBadgeProps {
  status: string;
  type: "payslip" | "yearEnd";
}
```

#### ConfirmDialog

汎用確認ダイアログ（削除・ステータス変更用）。

```tsx
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}
```

#### EmployeeCombobox

従業員選択用の検索可能なコンボボックス（`Command` + `Popover` で構成）。

```tsx
interface EmployeeComboboxProps {
  value?: number;
  onSelect: (employeeId: number) => void;
  placeholder?: string;
  disabled?: boolean;
}
```

#### EmptyState / LoadingState

データなし・読み込み中の表示コンポーネント。

#### CurrencyDisplay

金額を `¥300,000` 形式でフォーマット表示するコンポーネント。

---

## 4. Phase 1: 従業員管理

### 4.1 ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-E1 | 管理者として、全従業員の一覧を閲覧でき、社員番号・名前・部署・雇用形態・在籍状況で検索/フィルタできる |
| US-E2 | 管理者として、新しい従業員を登録できる（基本情報、給与情報、社会保険情報） |
| US-E3 | 管理者として、既存の従業員情報を編集できる |
| US-E4 | 管理者として、従業員を無効化（退職処理）できる（論理削除: `isActive = false`） |

### 4.2 画面構成

#### EmployeeList (`src/pages/employees/EmployeeList.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ 従業員管理                              [+ 新規登録]    │
│ 従業員情報の管理を行います                              │
├─────────────────────────────────────────────────────────┤
│ [検索: 名前・社員番号] [部署 ▼] [在籍状況 ▼]          │
├─────────────────────────────────────────────────────────┤
│ 社員番号 │ 氏名    │ フリガナ │ 部署 │ 雇用形態 │ 基本給  │ 状態 │ 操作 │
│ E001    │ 山田太郎 │ ヤマダタロウ│ 開発部│ 正社員  │ ¥300,000│ 在籍 │ ⋮  │
│ E002    │ 鈴木花子 │ スズキハナコ│ 営業部│ 正社員  │ ¥280,000│ 在籍 │ ⋮  │
├─────────────────────────────────────────────────────────┤
│                    < 1 2 3 ... >                        │
└─────────────────────────────────────────────────────────┘
```

- 操作メニュー（DropdownMenu）: 編集 / 退職処理
- 退職処理は ConfirmDialog で確認後、`isActive = false` に更新

#### EmployeeForm (`src/pages/employees/EmployeeForm.tsx`)

Dialog内に配置。4セクションのフォーム:

```
┌─ 従業員登録 ────────────────────────────────────────────┐
│                                                         │
│ ■ 基本情報                                              │
│   社員番号: [        ]                                  │
│   姓: [        ]  名: [        ]                        │
│   姓（カナ）: [        ]  名（カナ）: [        ]         │
│   生年月日: [        ]  入社日: [        ]               │
│                                                         │
│ ■ 所属情報                                              │
│   部署: [選択 ▼]  役職: [選択 ▼]  雇用形態: [選択 ▼]    │
│                                                         │
│ ■ 給与情報                                              │
│   基本給（円）: [        ]                               │
│                                                         │
│ ■ 社会保険情報                                          │
│   健康保険証番号: [        ]                             │
│   年金手帳番号: [        ]                               │
│   雇用保険被保険者番号: [        ]                       │
│   扶養人数: [  0  ]                                     │
│                                                         │
│                    [キャンセル] [保存]                    │
└─────────────────────────────────────────────────────────┘
```

### 4.3 DB操作関数

`src/lib/db-client.ts` に追加:

```typescript
// 従業員一覧取得（フィルタ・ページネーション対応）
getEmployees(options?: {
  department?: string;
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: Employee[]; total: number }>

// 従業員詳細取得
getEmployeeById(id: number): Promise<Employee | null>

// 社員番号の重複チェック
getEmployeeByNumber(employeeNumber: string): Promise<Employee | null>

// 従業員登録
createEmployee(params: CreateEmployeeParams): Promise<Employee>

// 従業員更新
updateEmployee(id: number, params: UpdateEmployeeParams): Promise<Employee>

// 従業員無効化（論理削除）
deactivateEmployee(id: number): Promise<void>

// アクティブ従業員数
getActiveEmployeeCount(): Promise<number>
```

### 4.4 カスタムフック

`src/hooks/useEmployees.ts`:

```typescript
useEmployees(filters?)     // 一覧取得 (useQuery)
useEmployee(id)            // 詳細取得 (useQuery)
useCreateEmployee()        // 登録 (useMutation → invalidate employees.all, dashboard.stats)
useUpdateEmployee()        // 更新 (useMutation → invalidate employees.all)
useDeactivateEmployee()    // 無効化 (useMutation → invalidate employees.all, dashboard.stats)
```

---

## 5. Phase 2: 給与明細作成

### 5.1 ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-PC1 | 管理者として、従業員を選択して給与明細を新規作成できる |
| US-PC2 | 対象年月を指定し、勤怠情報（出勤日数、残業時間等）を入力できる |
| US-PC3 | 基本給は従業員マスタから自動取得され、各種手当を入力できる |
| US-PC4 | 社会保険料・所得税が `payroll-calculator.ts` により自動計算される |
| US-PC5 | 計算結果をリアルタイムでプレビューしながら作成できる |
| US-PC6 | 下書き保存と承認の2段階で管理できる |

### 5.2 画面構成

#### PayslipCreate (`src/pages/payslips/PayslipCreate.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ 給与明細作成                                            │
│ 新しい給与明細を作成します                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─ 従業員・対象期間 ──────────────────────────────────┐ │
│ │ 従業員: [検索して選択...]                           │ │
│ │ 対象年: [2025 ▼]  対象月: [1 ▼]  支給日: [____]    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ 勤怠情報 ──────────────────────────────────────────┐ │
│ │ 出勤日数: [20]  有給休暇: [0]  欠勤日数: [0]       │ │
│ │ 残業時間: [10]  深夜時間: [0]  休日労働: [0]        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ 支給項目 ─────────────────┬─ 控除項目 ────────────┐ │
│ │ 基本給:       ¥300,000     │ 健康保険:    ¥15,045  │ │
│ │ 残業手当:      ¥23,430 (*)│ 厚生年金:    ¥27,450  │ │
│ │ 深夜手当:           ¥0 (*)│ 雇用保険:     ¥1,940  │ │
│ │ 休日手当:           ¥0 (*)│ 所得税:      ¥8,420   │ │
│ │ 通勤手当:     [      ]    │ 住民税:     [      ]   │ │
│ │ 住宅手当:     [      ]    │ その他控除: [      ]   │ │
│ │ 家族手当:     [      ]    │                        │ │
│ │ その他手当:   [      ]    │ 控除合計:    ¥52,855   │ │
│ │ 支給合計:     ¥323,430    │                        │ │
│ └────────────────────────────┴────────────────────────┘ │
│                                                         │
│ ┌─ 差引支給額 ────────────────────────────────────────┐ │
│ │             ¥270,575                                │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ 備考: [                                              ]  │
│                                                         │
│              [下書き保存]  [承認して保存]                │
└─────────────────────────────────────────────────────────┘

(*) = payroll-calculator.ts による自動計算値（読取専用）
```

### 5.3 リアルタイム計算ロジック

`react-hook-form` の `watch()` で入力値を監視し、`calculatePayroll()` をリアルタイム実行:

```typescript
const watchedValues = form.watch();

const calculationResult = useMemo(() => {
  if (!selectedEmployee) return null;
  return calculatePayroll({
    baseSalary: selectedEmployee.baseSalary,
    overtimeHours: watchedValues.overtimeHours,
    nighttimeHours: watchedValues.nighttimeHours,
    holidayWorkHours: watchedValues.holidayWorkHours,
    transportAllowance: watchedValues.transportAllowance,
    housingAllowance: watchedValues.housingAllowance,
    familyAllowance: watchedValues.familyAllowance,
    otherAllowances: watchedValues.otherAllowances,
    residentTax: watchedValues.residentTax,
    otherDeductions: watchedValues.otherDeductions,
    dependents: selectedEmployee.dependents,
  });
}, [watchedValues, selectedEmployee]);
```

`calculatePayroll()` は `src/lib/payroll-calculator.ts` に実装済み。以下を自動計算:
- 時給 → 残業手当(1.25倍)・深夜手当(1.5倍)・休日手当(1.35倍)
- 標準報酬月額 → 健康保険料・厚生年金保険料
- 総支給額 → 雇用保険料
- 課税所得（総支給額 - 社会保険料）→ 所得税
- 差引支給額 = 総支給額 - 総控除額

### 5.4 DB操作関数

```typescript
// 給与明細登録
createPayslip(params: CreatePayslipParams): Promise<Payslip>

// 重複チェック（同一従業員・同一年月）
checkDuplicatePayslip(employeeId: number, workYear: number, workMonth: number): Promise<boolean>
```

### 5.5 カスタムフック

`src/hooks/usePayslips.ts`:

```typescript
useCreatePayslip()  // 登録 (useMutation → invalidate payslips.all, dashboard.stats)
```

---

## 6. Phase 3: 給与明細一覧

### 6.1 ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-PL1 | 管理者として、全給与明細を一覧で閲覧でき、年月・従業員・ステータスでフィルタできる |
| US-PL2 | 給与明細の詳細を閲覧し、印刷用プレビューを確認できる |
| US-PL3 | 下書き状態の明細を承認に変更できる |
| US-PL4 | 承認済みの明細を支給済みに変更できる |
| US-PL5 | 下書き状態の明細を削除できる |
| US-PL6 | 既存の下書き明細を編集できる |

### 6.2 画面構成

#### PayslipList (`src/pages/payslips/PayslipList.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ 給与明細                                  [+ 新規作成]  │
│ 給与明細の管理を行います                                │
├─────────────────────────────────────────────────────────┤
│ [年 ▼] [月 ▼] [従業員 ▼] [ステータス ▼]               │
├─────────────────────────────────────────────────────────┤
│ 対象年月 │ 従業員名  │ 社員番号 │ 総支給額  │ 総控除額  │ 差引支給額│ 状態   │ 操作│
│ 2025/01 │ 山田太郎  │ E001    │ ¥323,430│ ¥52,855 │ ¥270,575│ 下書き │  ⋮ │
│ 2025/01 │ 鈴木花子  │ E002    │ ¥308,000│ ¥49,200 │ ¥258,800│ 承認済 │  ⋮ │
├─────────────────────────────────────────────────────────┤
│                    < 1 2 3 ... >                        │
├─────────────────────────────────────────────────────────┤
│ ┌─ 月別集計サマリー ──────────────────────────────────┐ │
│ │ 合計支給額: ¥631,430  合計控除額: ¥102,055         │ │
│ │ 合計手取り: ¥529,375  明細数: 2件                  │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- 操作メニュー: 詳細表示 / 編集（下書きのみ）/ ステータス変更 / 削除（下書きのみ）
- ステータスバッジの色分け: 下書き(gray) / 承認済(blue) / 支給済(green)

#### PayslipDetail (`src/pages/payslips/PayslipDetail.tsx`)

Dialog または別ページ。Tabsで表示を切替:

```
┌─ 給与明細詳細 ─────────────────────────────────────────┐
│ 山田太郎 (E001) ── 2025年1月分                         │
├─────────────────────────────────────────────────────────┤
│ [支給項目] [控除項目] [勤怠情報]                        │
│                                                         │
│ Tab: 支給項目                                           │
│ ┌───────────────┬────────────┐                          │
│ │ 基本給        │   ¥300,000 │                          │
│ │ 残業手当      │    ¥23,430 │                          │
│ │ 通勤手当      │         ¥0 │                          │
│ │ ...           │            │                          │
│ │ 支給合計      │   ¥323,430 │                          │
│ └───────────────┴────────────┘                          │
│                                                         │
│ ┌─ 差引支給額 ───────────────┐                          │
│ │         ¥270,575           │                          │
│ └────────────────────────────┘                          │
│                                                         │
│              [印刷]  [ステータス変更]  [閉じる]         │
└─────────────────────────────────────────────────────────┘
```

印刷機能: `@media print` CSS + `window.print()` で実現。

### 6.3 DB操作関数

```typescript
// 給与明細一覧取得（従業員名JOINつき）
getPayslips(options?: {
  employeeId?: number;
  workYear?: number;
  workMonth?: number;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: PayslipWithEmployee[]; total: number }>

// 給与明細詳細取得
getPayslipById(id: number): Promise<PayslipWithEmployee | null>

// 給与明細更新
updatePayslip(id: number, params: UpdatePayslipParams): Promise<Payslip>

// ステータス変更
updatePayslipStatus(id: number, status: "draft" | "approved" | "paid"): Promise<void>

// 給与明細削除（下書きのみ）
deletePayslip(id: number): Promise<void>

// 月別集計
getMonthlyPayslipSummary(workYear: number, workMonth: number): Promise<{
  totalPayment: number;
  totalDeduction: number;
  totalNetPayment: number;
  count: number;
}>
```

**Drizzle ORM JOIN操作の例**:

```typescript
const result = await db
  .select({
    payslip: payslips,
    employee: {
      employeeNumber: employees.employeeNumber,
      lastName: employees.lastName,
      firstName: employees.firstName,
    },
  })
  .from(payslips)
  .innerJoin(employees, eq(payslips.employeeId, employees.id))
  .where(/* filters */)
  .orderBy(desc(payslips.paymentDate))
  .limit(limit)
  .offset(offset);
```

### 6.4 カスタムフック

`src/hooks/usePayslips.ts` に追加:

```typescript
usePayslips(filters?)        // 一覧取得
usePayslip(id)               // 詳細取得
useUpdatePayslip()           // 更新
useUpdatePayslipStatus()     // ステータス変更
useDeletePayslip()           // 削除
```

---

## 7. Phase 4: ダッシュボード改善

### 7.1 ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-D1 | ログイン後、システムの概要統計を実データで確認できる |
| US-D2 | 最近作成された給与明細を確認できる |
| US-D3 | クイックアクションから主要機能に遷移できる |

### 7.2 改善内容

現在の `Dashboard.tsx` のハードコードされたプレースホルダーデータを実データに置き換える。

**統計カード（4枚）**:

| カード | データソース |
|--------|-------------|
| 従業員数 | `getActiveEmployeeCount()` |
| 今月の給与明細 | 今月の payslips 件数 |
| 未処理明細 | status="draft" の payslips 件数 |
| 今月の総支給額 | 今月の payslips.totalPayment 合計 |

**最近の給与明細カード**: 直近5件の給与明細を簡易テーブルで表示（従業員名、対象月、差引支給額、ステータス）。

**クイックアクションカード**: 既存の `<a>` タグを `<Link>` コンポーネントに修正し、SPA遷移にする。

### 7.3 DB操作関数

```typescript
getDashboardStats(): Promise<{
  activeEmployeeCount: number;
  currentMonthPayslipCount: number;
  draftPayslipCount: number;
  currentMonthTotalPayment: number;
}>

getRecentPayslips(limit?: number): Promise<PayslipWithEmployee[]>
```

### 7.4 カスタムフック

`src/hooks/useDashboardStats.ts`:

```typescript
useDashboardStats()    // 統計取得 (useQuery)
useRecentPayslips()    // 最近の明細取得 (useQuery)
```

---

## 8. Phase 5: 年末調整

### 8.1 ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-YE1 | 管理者として、対象年度を選択し、従業員ごとの年末調整データを登録できる |
| US-YE2 | 1年間の社会保険料控除合計が自動計算される（payslipsテーブルから集計） |
| US-YE3 | 各種控除（配偶者・扶養・生命保険料・地震保険料）を入力できる |
| US-YE4 | 調整額が自動計算され、還付/追徴の結果を確認できる |
| US-YE5 | ステータス管理（下書き → 提出済 → 完了）ができる |

### 8.2 画面構成

#### YearEndAdjustmentList (`src/pages/year-end-adjustment/YearEndAdjustmentList.tsx`)

```
┌─────────────────────────────────────────────────────────┐
│ 年末調整                                  [+ 新規作成]  │
│ 年末調整の管理を行います                                │
├─────────────────────────────────────────────────────────┤
│ [年度 ▼] [ステータス ▼]                                │
├─────────────────────────────────────────────────────────┤
│ 従業員名 │ 年度 │ 社会保険料控除 │ 各種控除合計 │ 調整額  │ 状態  │ 操作 │
│ 山田太郎 │ 2025 │    ¥534,600  │   ¥480,000 │ +¥12,400│ 下書き│  ⋮  │
│ 鈴木花子 │ 2025 │    ¥502,800  │   ¥518,000 │  -¥3,200│ 提出済│  ⋮  │
├─────────────────────────────────────────────────────────┤
│                    < 1 2 3 ... >                        │
└─────────────────────────────────────────────────────────┘
```

- 調整額が正の場合は「還付」（従業員にお金が戻る）、負の場合は「追徴」

#### YearEndAdjustmentForm (`src/pages/year-end-adjustment/YearEndAdjustmentForm.tsx`)

```
┌─ 年末調整登録 ─────────────────────────────────────────┐
│                                                         │
│ ┌─ 従業員・年度選択 ─────────────────────────────────┐ │
│ │ 従業員: [検索して選択...]                           │ │
│ │ 対象年度: [2025 ▼]                                 │ │
│ │ [社会保険料を自動集計]                              │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ 所得控除 ─────────────────────────────────────────┐ │
│ │ 基礎控除:           ¥480,000 (デフォルト)          │ │
│ │ 配偶者控除:       [        ]                       │ │
│ │ 扶養控除:         [        ]                       │ │
│ │ 社会保険料控除:     ¥534,600 (自動集計)            │ │
│ │ 生命保険料控除:   [        ] (上限 ¥120,000)       │ │
│ │ 地震保険料控除:   [        ] (上限 ¥50,000)        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ 計算結果 ─────────────────────────────────────────┐ │
│ │ 年間所得税合計（源泉徴収済み）:  ¥XXX,XXX          │ │
│ │ 控除合計:                        ¥XXX,XXX          │ │
│ │ 調整額:                         +¥XX,XXX（還付）   │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│                    [下書き保存]  [提出]                  │
└─────────────────────────────────────────────────────────┘
```

### 8.3 自動集計ロジック

「社会保険料を自動集計」ボタンで、対象従業員の対象年度の全payslipsから社会保険料合計を算出:

```typescript
// 年間社会保険料集計
getAnnualSocialInsurance(employeeId: number, year: number): Promise<number>
// = SUM(healthInsurance + pensionInsurance + employmentInsurance) WHERE workYear = year

// 年間所得税集計
getAnnualIncomeTax(employeeId: number, year: number): Promise<number>
// = SUM(incomeTax) WHERE workYear = year
```

### 8.4 DB操作関数

```typescript
getYearEndAdjustments(options?: {
  adjustmentYear?: number;
  status?: string;
}): Promise<YearEndAdjustmentWithEmployee[]>

getYearEndAdjustmentById(id: number): Promise<YearEndAdjustmentWithEmployee | null>

createYearEndAdjustment(params: CreateYearEndAdjustmentParams): Promise<YearEndAdjustment>

updateYearEndAdjustment(id: number, params: UpdateYearEndAdjustmentParams): Promise<YearEndAdjustment>

getAnnualSocialInsurance(employeeId: number, year: number): Promise<number>

getAnnualIncomeTax(employeeId: number, year: number): Promise<number>
```

### 8.5 カスタムフック

`src/hooks/useYearEndAdjustments.ts`:

```typescript
useYearEndAdjustments(filters?)     // 一覧取得
useYearEndAdjustment(id)            // 詳細取得
useCreateYearEndAdjustment()        // 登録
useUpdateYearEndAdjustment()        // 更新
useAnnualSocialInsurance(employeeId, year)  // 年間社会保険料
useAnnualIncomeTax(employeeId, year)        // 年間所得税
```

---

## 9. Phase 6: 設定

### 9.1 ユーザーストーリー

| ID | ストーリー |
|----|-----------|
| US-S1 | 管理者として、社会保険料率を年度ごとに設定・管理できる |
| US-S2 | 管理者として、現在有効な保険料率を確認できる |
| US-S3 | 管理者として、自身のプロフィール情報を変更できる |
| US-S4 | 管理者として、パスワードを変更できる |

### 9.2 画面構成

#### Settings (`src/pages/settings/Settings.tsx`)

Tabsで3つのセクションに分割:

```
┌─────────────────────────────────────────────────────────┐
│ 設定                                                    │
│ システム設定の管理を行います                            │
├─────────────────────────────────────────────────────────┤
│ [保険料率設定] [プロフィール] [パスワード変更]           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Tab: 保険料率設定                                       │
│ ┌─ 現在有効な保険料率 ───────────────────────────────┐ │
│ │ 適用期間: 2025/04/01 〜                            │ │
│ │ 健康保険料率: 10.03% (従業員負担: 5.015%)          │ │
│ │ 厚生年金保険料率: 18.3% (従業員負担: 9.15%)        │ │
│ │ 雇用保険料率: 従業員 0.6% / 事業主 0.95%           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─ 料率履歴 ─────────────────────── [+ 新規登録] ────┐ │
│ │ 適用開始 │ 適用終了 │ 健康保険 │ 厚生年金 │ 雇用保険│ │
│ │ 2025/04 │    —    │ 10.03% │  18.3%  │  0.6%  │ │
│ │ 2024/04 │ 2025/03 │  9.98% │  18.3%  │  0.6%  │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ Tab: プロフィール                                       │
│ ┌─ アカウント情報 ───────────────────────────────────┐ │
│ │ 表示名: [        ]                                 │ │
│ │ メールアドレス: [        ]                         │ │
│ │                                      [更新]        │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ Tab: パスワード変更                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 現在のパスワード: [        ]                        │ │
│ │ 新しいパスワード: [        ]                        │ │
│ │ パスワード確認:   [        ]                        │ │
│ │                              [パスワードを変更]     │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 9.3 DB操作関数

```typescript
// 保険料率一覧取得
getInsuranceRates(): Promise<InsuranceRate[]>

// 現在有効な保険料率取得
getCurrentInsuranceRate(): Promise<InsuranceRate | null>

// 保険料率登録
createInsuranceRate(params: CreateInsuranceRateParams): Promise<InsuranceRate>

// 保険料率更新
updateInsuranceRate(id: number, params: UpdateInsuranceRateParams): Promise<InsuranceRate>

// ユーザープロフィール更新
updateUserProfile(id: number, params: { displayName?: string; email?: string }): Promise<void>
```

### 9.4 パスワード変更

Firebase Auth の `updatePassword` を利用。`reauthenticateWithCredential` で現在のパスワードを検証後に更新:

```typescript
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
```

### 9.5 カスタムフック

`src/hooks/useInsuranceRates.ts`:

```typescript
useInsuranceRates()            // 一覧取得
useCurrentInsuranceRate()      // 現在有効な料率取得
useCreateInsuranceRate()       // 登録
useUpdateInsuranceRate()       // 更新
```

---

## 10. ディレクトリ構成

Phase 0〜6 完了後の最終ディレクトリ構成:

```
src/
├── App.tsx                          # ルーティング定義（修正）
├── main.tsx                         # エントリーポイント（修正: QueryClientProvider追加）
├── index.css                        # グローバルスタイル
│
├── components/
│   ├── AppLayout.tsx                # サイドバー付きレイアウト
│   ├── ui/                          # shadcn/ui コンポーネント（既存+追加）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── sidebar.tsx
│   │   ├── sheet.tsx
│   │   ├── tooltip.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── table.tsx               # 新規
│   │   ├── dialog.tsx              # 新規
│   │   ├── alert-dialog.tsx        # 新規
│   │   ├── select.tsx              # 新規
│   │   ├── dropdown-menu.tsx       # 新規
│   │   ├── badge.tsx               # 新規
│   │   ├── tabs.tsx                # 新規
│   │   ├── alert.tsx               # 新規
│   │   ├── sonner.tsx              # 新規 (toast)
│   │   ├── pagination.tsx          # 新規
│   │   ├── textarea.tsx            # 新規
│   │   ├── switch.tsx              # 新規
│   │   ├── popover.tsx             # 新規
│   │   ├── command.tsx             # 新規
│   │   ├── scroll-area.tsx         # 新規
│   │   ├── avatar.tsx              # 新規
│   │   └── ...
│   └── shared/                      # 共有カスタムコンポーネント
│       ├── DataTable.tsx            # 新規
│       ├── PageHeader.tsx           # 新規
│       ├── StatusBadge.tsx          # 新規
│       ├── ConfirmDialog.tsx        # 新規
│       ├── EmployeeCombobox.tsx     # 新規
│       ├── EmptyState.tsx           # 新規
│       ├── LoadingState.tsx         # 新規
│       └── CurrencyDisplay.tsx      # 新規
│
├── pages/
│   ├── Login.tsx                    # 既存
│   ├── SignUp.tsx                   # 既存
│   ├── Dashboard.tsx                # 修正（実データ連携）
│   ├── employees/
│   │   ├── EmployeeList.tsx         # 新規
│   │   └── EmployeeForm.tsx         # 新規
│   ├── payslips/
│   │   ├── PayslipList.tsx          # 新規
│   │   ├── PayslipCreate.tsx        # 新規
│   │   └── PayslipDetail.tsx        # 新規
│   ├── year-end-adjustment/
│   │   ├── YearEndAdjustmentList.tsx # 新規
│   │   └── YearEndAdjustmentForm.tsx # 新規
│   └── settings/
│       ├── Settings.tsx             # 新規
│       ├── InsuranceRateSettings.tsx # 新規
│       └── UserSettings.tsx         # 新規
│
├── hooks/
│   ├── useAuth.tsx                  # 既存
│   ├── use-mobile.ts               # 既存
│   ├── useEmployees.ts             # 新規
│   ├── usePayslips.ts              # 新規
│   ├── useYearEndAdjustments.ts    # 新規
│   ├── useInsuranceRates.ts        # 新規
│   └── useDashboardStats.ts        # 新規
│
├── lib/
│   ├── turso.ts                     # 既存
│   ├── firebase.ts                  # 既存
│   ├── utils.ts                     # 既存
│   ├── db-client.ts                 # 修正（CRUD関数拡張）
│   ├── payroll-calculator.ts        # 既存
│   ├── formatters.ts                # 新規
│   ├── constants.ts                 # 新規
│   ├── query-keys.ts                # 新規
│   └── validators.ts                # 新規
│
└── db/
    └── schema.ts                    # 既存
```

---

## 11. ルーティング設計

`src/App.tsx` の最終ルート構成:

| パス | コンポーネント | 認証 | 説明 |
|------|---------------|------|------|
| `/login` | Login | 不要 | ログイン |
| `/signup` | SignUp | 不要 | 新規登録 |
| `/` | Dashboard | 必要 | ダッシュボード |
| `/employees` | EmployeeList | 必要 | 従業員一覧 |
| `/payslips` | PayslipList | 必要 | 給与明細一覧 |
| `/payslips/create` | PayslipCreate | 必要 | 給与明細作成 |
| `/payslips/:id` | PayslipDetail | 必要 | 給与明細詳細 |
| `/payslips/:id/edit` | PayslipCreate | 必要 | 給与明細編集（作成フォーム再利用）|
| `/year-end-adjustment` | YearEndAdjustmentList | 必要 | 年末調整一覧 |
| `/year-end-adjustment/create` | YearEndAdjustmentForm | 必要 | 年末調整登録 |
| `/year-end-adjustment/:id/edit` | YearEndAdjustmentForm | 必要 | 年末調整編集 |
| `/settings` | Settings | 必要 | 設定 |

全保護ルートは既存の `ProtectedRoute` + `AppLayout` パターンを踏襲:

```tsx
<Route
  path="/employees"
  element={
    <ProtectedRoute>
      <AppLayout>
        <EmployeeList />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

---

## 12. データベース操作仕様

### 型定義

Drizzle ORM の型推論を活用:

```typescript
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { employees, payslips, insuranceRates, yearEndAdjustments } from "@/db/schema";

// Select型（読み取り用）
export type Employee = InferSelectModel<typeof employees>;
export type Payslip = InferSelectModel<typeof payslips>;
export type InsuranceRate = InferSelectModel<typeof insuranceRates>;
export type YearEndAdjustment = InferSelectModel<typeof yearEndAdjustments>;

// Insert型（書き込み用）
export type CreateEmployeeParams = InferInsertModel<typeof employees>;
export type CreatePayslipParams = InferInsertModel<typeof payslips>;
export type CreateInsuranceRateParams = InferInsertModel<typeof insuranceRates>;
export type CreateYearEndAdjustmentParams = InferInsertModel<typeof yearEndAdjustments>;

// JOIN結果型
export type PayslipWithEmployee = Payslip & {
  employee: Pick<Employee, "employeeNumber" | "lastName" | "firstName">;
};

export type YearEndAdjustmentWithEmployee = YearEndAdjustment & {
  employee: Pick<Employee, "employeeNumber" | "lastName" | "firstName">;
};
```

### db-client.ts 全関数一覧

| 関数名 | Phase | テーブル | 操作 |
|--------|-------|---------|------|
| `createUser` | 既存 | users | INSERT |
| `getUserByFirebaseUid` | 既存 | users | SELECT |
| `getUserByEmail` | 既存 | users | SELECT |
| `getEmployees` | 1 | employees | SELECT (フィルタ・ページネーション) |
| `getEmployeeById` | 1 | employees | SELECT (単一) |
| `getEmployeeByNumber` | 1 | employees | SELECT (重複チェック) |
| `createEmployee` | 1 | employees | INSERT |
| `updateEmployee` | 1 | employees | UPDATE |
| `deactivateEmployee` | 1 | employees | UPDATE (isActive=false) |
| `getActiveEmployeeCount` | 1 | employees | COUNT |
| `createPayslip` | 2 | payslips | INSERT |
| `checkDuplicatePayslip` | 2 | payslips | SELECT (重複チェック) |
| `getPayslips` | 3 | payslips + employees | SELECT JOIN |
| `getPayslipById` | 3 | payslips + employees | SELECT JOIN (単一) |
| `updatePayslip` | 3 | payslips | UPDATE |
| `updatePayslipStatus` | 3 | payslips | UPDATE (status) |
| `deletePayslip` | 3 | payslips | DELETE |
| `getMonthlyPayslipSummary` | 3 | payslips | SELECT (集計) |
| `getDashboardStats` | 4 | employees + payslips | SELECT (集計) |
| `getRecentPayslips` | 4 | payslips + employees | SELECT JOIN (LIMIT) |
| `getYearEndAdjustments` | 5 | yearEndAdjustments + employees | SELECT JOIN |
| `getYearEndAdjustmentById` | 5 | yearEndAdjustments + employees | SELECT JOIN (単一) |
| `createYearEndAdjustment` | 5 | yearEndAdjustments | INSERT |
| `updateYearEndAdjustment` | 5 | yearEndAdjustments | UPDATE |
| `getAnnualSocialInsurance` | 5 | payslips | SELECT (SUM) |
| `getAnnualIncomeTax` | 5 | payslips | SELECT (SUM) |
| `getInsuranceRates` | 6 | insuranceRates | SELECT |
| `getCurrentInsuranceRate` | 6 | insuranceRates | SELECT (現在有効) |
| `createInsuranceRate` | 6 | insuranceRates | INSERT |
| `updateInsuranceRate` | 6 | insuranceRates | UPDATE |
| `updateUserProfile` | 6 | users | UPDATE |

---

## 13. バリデーションスキーマ

`src/lib/validators.ts` に定義する全Zodスキーマ:

### 従業員フォーム

```typescript
export const employeeFormSchema = z.object({
  employeeNumber: z.string()
    .min(1, "社員番号は必須です")
    .max(20, "社員番号は20文字以内で入力してください")
    .regex(/^[A-Za-z0-9-]+$/, "社員番号は半角英数字とハイフンのみ使用できます"),
  lastName: z.string().min(1, "姓は必須です").max(50),
  firstName: z.string().min(1, "名は必須です").max(50),
  lastNameKana: z.string()
    .min(1, "姓（カナ）は必須です")
    .max(50)
    .regex(/^[\u30A0-\u30FF]+$/, "カタカナで入力してください"),
  firstNameKana: z.string()
    .min(1, "名（カナ）は必須です")
    .max(50)
    .regex(/^[\u30A0-\u30FF]+$/, "カタカナで入力してください"),
  birthDate: z.string().min(1, "生年月日は必須です"),
  hireDate: z.string().min(1, "入社日は必須です"),
  department: z.string().optional(),
  position: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract"]),
  baseSalary: z.number()
    .min(0, "基本給は0以上で入力してください")
    .max(99999999, "基本給の上限を超えています"),
  healthInsuranceNumber: z.string().optional(),
  pensionInsuranceNumber: z.string().optional(),
  employmentInsuranceNumber: z.string().optional(),
  dependents: z.number().min(0).max(20).default(0),
});
```

### 給与明細作成フォーム

```typescript
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
```

### 年末調整フォーム

```typescript
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
```

### 保険料率フォーム

```typescript
export const insuranceRateSchema = z.object({
  effectiveFrom: z.string().min(1, "適用開始日は必須です"),
  effectiveTo: z.string().optional(),
  healthInsuranceRate: z.number().min(0).max(1),
  healthInsuranceEmployeeRate: z.number().min(0).max(1),
  pensionInsuranceRate: z.number().min(0).max(1),
  pensionInsuranceEmployeeRate: z.number().min(0).max(1),
  employmentInsuranceEmployeeRate: z.number().min(0).max(1),
  employmentInsuranceEmployerRate: z.number().min(0).max(1),
});
```

### プロフィール / パスワード変更

```typescript
export const userProfileSchema = z.object({
  displayName: z.string().min(1, "表示名は必須です").max(100),
  email: z.string().email("正しいメールアドレスを入力してください"),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(6, "現在のパスワードを入力してください"),
  newPassword: z.string().min(6, "新しいパスワードは6文字以上で入力してください"),
  confirmPassword: z.string().min(6),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "新しいパスワードが一致しません",
  path: ["confirmPassword"],
});
```

---

## 14. 状態管理設計

### サーバー状態: TanStack React Query

全てのDB由来データは React Query で管理する。

#### クエリキー設計

`src/lib/query-keys.ts`:

```typescript
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
```

#### キャッシュ無効化戦略

| 操作 | 無効化するキー |
|------|---------------|
| 従業員 作成/更新/無効化 | `employees.all`, `dashboard.stats` |
| 給与明細 作成/更新/削除 | `payslips.all`, `dashboard.stats` |
| 給与明細 ステータス変更 | `payslips.all`, `dashboard.stats` |
| 年末調整 作成/更新 | `yearEndAdjustments.all` |
| 保険料率 作成/更新 | `insuranceRates.all` |

### クライアント状態

| 状態 | 管理方法 |
|------|---------|
| フォーム入力値 | React Hook Form |
| ダイアログ開閉 | `useState` (ローカル) |
| フィルタ選択値 | `useState` (ローカル) |
| 認証情報 | `useAuth` Context (既存) |
| サイドバー状態 | `useSidebar` (既存) |

---

## 15. ユーティリティ

### フォーマッター (`src/lib/formatters.ts`)

```typescript
// 金額フォーマット: 300000 → "¥300,000"
formatCurrency(amount: number): string

// 日付フォーマット: "2025-01-15" → "2025年1月15日"
formatDate(dateStr: string): string

// 対象月表示: (2025, 1) → "2025年1月分"
formatPayPeriod(year: number, month: number): string

// 雇用形態: "full_time" → "正社員"
formatEmploymentType(type: string): string

// 給与明細ステータス: "draft" → "下書き"
formatPayslipStatus(status: string): string

// 年末調整ステータス: "submitted" → "提出済"
formatYearEndStatus(status: string): string
```

### 定数 (`src/lib/constants.ts`)

```typescript
// 部署一覧
DEPARTMENTS: ["総務部", "人事部", "経理部", "営業部", "開発部", "企画部", "製造部"]

// 役職一覧
POSITIONS: ["部長", "課長", "係長", "主任", "一般"]

// 雇用形態
EMPLOYMENT_TYPES: { full_time: "正社員", part_time: "パートタイム", contract: "契約社員" }

// 給与明細ステータス（ラベル + バッジカラー）
PAYSLIP_STATUSES: {
  draft: { label: "下書き", variant: "secondary" },
  approved: { label: "承認済", variant: "default" },
  paid: { label: "支給済", variant: "outline" },
}

// 年末調整ステータス
YEAR_END_STATUSES: {
  draft: { label: "下書き", variant: "secondary" },
  submitted: { label: "提出済", variant: "default" },
  completed: { label: "完了", variant: "outline" },
}
```
