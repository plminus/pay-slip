# 給与明細管理システム (Payslip Admin)

日本の法令に準拠した給与明細管理システムです。

## 機能

- **従業員管理**: 従業員情報の登録・編集・管理
- **給与明細作成**: 自動計算による給与明細の作成
- **控除計算**: 健康保険料、厚生年金保険料、雇用保険料、所得税の自動計算
- **年末調整**: 年末調整データの管理
- **PDF出力**: 給与明細のPDF出力（実装予定）
- **認証**: Firebase Authenticationによる安全なログイン

## 法令対応

本システムは以下の日本の法令に準拠しています：

- 労働基準法
- 所得税法
- 健康保険法
- 厚生年金保険法
- 雇用保険法
- 2025年度の社会保険料率に対応

## 技術スタック

| 項目 | 技術 |
|------|------|
| フレームワーク | React 19 + Vite |
| ルーティング | React Router |
| UI | shadcn/ui + Tailwind CSS |
| データベース | Turso (libSQL) |
| ORM | Drizzle ORM |
| 認証 | Firebase Authentication |
| 言語 | TypeScript |

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env` にコピーして、必要な値を設定してください。

```bash
cp .env.example .env
```

#### Tursoの設定

1. [Turso](https://turso.tech/)でアカウントを作成
2. データベースを作成：
   ```bash
   turso db create payslip-admin
   ```
3. データベースURLを取得：
   ```bash
   turso db show payslip-admin --url
   ```
4. 認証トークンを作成：
   ```bash
   turso db tokens create payslip-admin
   ```
5. `.env` ファイルに設定：
   ```
   VITE_TURSO_DATABASE_URL=libsql://your-database.turso.io
   VITE_TURSO_AUTH_TOKEN=your-auth-token
   ```

#### Firebaseの設定

1. [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
2. Authenticationを有効化し、メール/パスワード認証を有効にする
3. プロジェクト設定から以下の情報を取得：
   - API Key
   - Auth Domain
   - Project ID
   - Storage Bucket
   - Messaging Sender ID
   - App ID
4. `.env` ファイルに設定：
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
   VITE_FIREBASE_APP_ID=1:000000000000:web:abcdef1234567890
   ```

### 3. データベースのマイグレーション

スキーマをTursoデータベースにプッシュします：

```bash
npx drizzle-kit push
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## データベーススキーマ

### テーブル一覧

- **users**: 認証ユーザー情報
- **employees**: 従業員マスタ
- **payslips**: 給与明細
- **insurance_rates**: 社会保険料率マスタ
- **year_end_adjustments**: 年末調整データ

### 主要なフィールド

#### employees（従業員）
- 基本情報：氏名、カナ、生年月日、入社日
- 雇用情報：社員番号、部署、役職、雇用形態
- 給与情報：基本給
- 社会保険情報：各種保険番号
- 控除情報：扶養人数

#### payslips（給与明細）
- 支給項目：基本給、残業手当、深夜手当、休日手当、各種手当
- 控除項目：健康保険料、厚生年金保険料、雇用保険料、所得税、住民税
- 勤怠情報：出勤日数、有給休暇日数、残業時間等
- 計算結果：総支給額、総控除額、差引支給額

## 給与計算の仕組み

給与計算は [src/lib/payroll-calculator.ts](src/lib/payroll-calculator.ts) で実装されています。

### 計算の流れ

1. **標準報酬月額の計算**: 基本給から健康保険・厚生年金の標準報酬月額を決定
2. **各種手当の計算**:
   - 残業手当：時給 × 残業時間 × 1.25
   - 深夜手当：時給 × 深夜時間 × 1.5
   - 休日手当：時給 × 休日労働時間 × 1.35
3. **総支給額の計算**: 基本給 + 各種手当の合計
4. **社会保険料の計算**:
   - 健康保険料：標準報酬月額 × 健康保険料率（従業員負担分）
   - 厚生年金保険料：標準報酬月額 × 厚生年金保険料率（従業員負担分）
   - 雇用保険料：総支給額 × 雇用保険料率（従業員負担分）
5. **所得税の計算**: 課税所得（総支給額 - 社会保険料）から源泉徴収税額を計算
6. **総控除額の計算**: 社会保険料 + 所得税 + 住民税 + その他控除
7. **差引支給額の計算**: 総支給額 - 総控除額

### 社会保険料率（2025年度デフォルト値）

- 健康保険料率：10.03%（従業員負担：5.015%）
- 厚生年金保険料率：18.3%（従業員負担：9.15%）
- 雇用保険料率：0.6%（従業員負担）

## 使用方法

### 初回セットアップ

1. Firebase Consoleで管理者ユーザーを作成
2. システムにログイン
3. 従業員情報を登録
4. 社会保険料率を設定（必要に応じて）

### 給与明細の作成

1. 「給与明細作成」ページで従業員を選択
2. 対象年月、勤怠情報、各種手当を入力
3. 自動計算された給与明細を確認
4. 保存してPDF出力

## セキュリティ

- Firebase Authenticationによる認証
- 環境変数による機密情報の管理
- ロールベースのアクセス制御（admin/employee）

## 開発ロードマップ

現在実装済み：
- ✅ プロジェクト構成とセットアップ
- ✅ データベーススキーマ設計
- ✅ 給与計算ロジック
- ✅ 認証機能
- ✅ 基本的なUI/レイアウト

今後実装予定：
- 従業員管理CRUD機能
- 給与明細作成フォーム
- 給与明細一覧・詳細表示
- PDF出力機能
- 年末調整機能
- データのバックアップ・復元

## ライセンス

本システムは社内利用を目的としています。

## サポート

問題が発生した場合は、社内の担当者にお問い合わせください。
