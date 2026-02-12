# セットアップガイド

給与明細管理システムのセットアップ手順を説明します。

## 前提条件

- Node.js 18以上がインストールされていること
- npmまたはyarnがインストールされていること
- Turso CLIがインストールされていること（オプション）

## ステップ1: プロジェクトのクローン

```bash
cd payslip-admin
npm install
```

## ステップ2: Tursoデータベースのセットアップ

### Turso CLIのインストール

```bash
# macOS / Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (PowerShell)
iwr -useb https://get.tur.so/install.ps1 | iex
```

### Tursoにログイン

```bash
turso auth login
```

### データベースの作成

```bash
turso db create payslip-admin
```

### データベース情報の取得

```bash
# データベースURLの取得
turso db show payslip-admin --url

# 認証トークンの作成
turso db tokens create payslip-admin
```

出力例：
```
Database URL: libsql://payslip-admin-yourname.turso.io
Auth Token: eyJhbGc...（長い文字列）
```

## ステップ3: Firebase プロジェクトのセットアップ

### 1. Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: `payslip-admin`）
4. Google Analyticsは任意で設定
5. プロジェクトを作成

### 2. Authenticationを設定

1. Firebase Consoleのサイドメニューから「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「メール/パスワード」を有効化
5. 保存

### 3. Firebase設定情報を取得

1. プロジェクトの設定（歯車アイコン）→「プロジェクトの設定」
2. 「全般」タブの下部「マイアプリ」セクション
3. ウェブアプリを追加（`</>`アイコン）
4. アプリのニックネームを入力（例: `payslip-admin-web`）
5. 「Firebase Hosting」はスキップ可能
6. 「アプリを登録」をクリック
7. 表示されるFirebase SDKスニペットから以下の情報をコピー：
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

## ステップ4: 環境変数の設定

`.env.example`を`.env`にコピー：

```bash
cp .env.example .env
```

`.env`ファイルを編集して、取得した情報を設定：

```env
# Turso Database
VITE_TURSO_DATABASE_URL=libsql://payslip-admin-yourname.turso.io
VITE_TURSO_AUTH_TOKEN=eyJhbGc...（取得したトークン）

# Firebase
VITE_FIREBASE_API_KEY=AIzaSy...（取得したAPIキー）
VITE_FIREBASE_AUTH_DOMAIN=payslip-admin.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=payslip-admin
VITE_FIREBASE_STORAGE_BUCKET=payslip-admin.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

## ステップ5: データベーススキーマのプッシュ

```bash
npx drizzle-kit push
```

コマンド実行時に表示される変更内容を確認し、`y`を入力して適用します。

## ステップ6: 管理者ユーザーの作成

### Firebase Consoleで作成

1. Firebase Console → Authentication → Users
2. 「ユーザーを追加」をクリック
3. メールアドレスとパスワードを入力
4. 「ユーザーを追加」

### または、開発サーバー起動後にサインアップ機能を実装

現在のシステムにはサインアップ機能が実装されていないため、Firebase Consoleでユーザーを作成してください。

## ステップ7: 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスします。

## ステップ8: ログインテスト

1. ログインページが表示されます
2. Firebase Consoleで作成したメールアドレスとパスワードを入力
3. 「ログイン」をクリック
4. ダッシュボードが表示されれば成功です

## トラブルシューティング

### エラー: "Failed to fetch"

- `.env`ファイルの設定を確認
- Tursoデータベースが正しく作成されているか確認
- Firebase設定が正しいか確認

### ログインできない

- Firebase Consoleでユーザーが正しく作成されているか確認
- メール/パスワード認証が有効になっているか確認
- ブラウザのコンソールでエラーを確認

### データベース接続エラー

```bash
# Tursoデータベースの状態を確認
turso db show payslip-admin

# 新しいトークンを生成
turso db tokens create payslip-admin
```

## 次のステップ

1. 従業員情報の登録
2. 社会保険料率の設定（必要に応じて）
3. 給与明細の作成

## 本番環境へのデプロイ

### Vercelへのデプロイ（推奨）

```bash
# Vercel CLIをインストール
npm install -g vercel

# デプロイ
vercel
```

環境変数は Vercel のダッシュボードで設定してください。

### その他のホスティングサービス

- Netlify
- Cloudflare Pages
- Firebase Hosting

いずれのサービスでも、環境変数を適切に設定する必要があります。

## セキュリティに関する注意事項

1. `.env`ファイルは絶対にGitにコミットしないでください
2. 本番環境では強力なパスワードポリシーを設定してください
3. Firebase Security Rulesを適切に設定してください
4. 定期的にバックアップを取得してください

## サポート

問題が発生した場合は、以下を確認してください：

1. Node.jsのバージョン（18以上）
2. 環境変数の設定
3. Firebase Consoleの設定
4. ブラウザのコンソールログ

それでも解決しない場合は、社内の担当者にお問い合わせください。
