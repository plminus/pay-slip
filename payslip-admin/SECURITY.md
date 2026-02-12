# セキュリティガイドライン

## 機密情報の管理

### 環境変数

このプロジェクトでは、以下の機密情報を環境変数で管理しています：

- **Turso データベースの認証情報**
  - `VITE_TURSO_DATABASE_URL`
  - `VITE_TURSO_AUTH_TOKEN`

- **Firebase 認証情報**
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`

### ⚠️ 重要な注意事項

1. **`.env`ファイルは絶対にGitにコミットしない**
   - `.gitignore`に`.env`が含まれていることを確認
   - 誤ってコミットした場合は、すぐに認証情報を再生成する

2. **`.env.example`のみをコミット**
   - 実際の値は含めず、プレースホルダーのみ
   - 他の開発者が必要な環境変数を把握できるようにする

3. **認証情報の共有方法**
   - Slackやメールで直接送信しない
   - 1Password、LastPass等のパスワード管理ツールを使用
   - または、セキュアなファイル共有サービスを使用

## Git運用のセキュリティ

### コミット前のチェックリスト

コミット前に必ず以下を確認してください：

- [ ] `.env`ファイルが含まれていないか
- [ ] APIキーやトークンがコードにハードコードされていないか
- [ ] パスワードや機密情報がコメントに含まれていないか
- [ ] データベースのダンプファイルが含まれていないか

### コミット前の確認コマンド

```bash
# ステージングされたファイルを確認
git status

# 変更内容を確認
git diff --staged

# 機密情報が含まれていないか検索
git diff --staged | grep -i "password\|secret\|key\|token"
```

## 既に機密情報をコミットしてしまった場合

1. **すぐに認証情報を無効化・再生成**
   ```bash
   # Tursoトークンの再生成
   turso db tokens create payslip-admin

   # Firebaseは管理画面から再生成
   ```

2. **Gitの履歴から削除**
   ```bash
   # 注意: これは履歴を書き換えるため、チームメンバーと調整が必要
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **強制プッシュ（既にリモートにプッシュしている場合）**
   ```bash
   git push origin --force --all
   ```

## Firebase セキュリティルール

Firebase Authenticationとデータベースのセキュリティルールを適切に設定してください。

### 推奨設定

1. **Authentication**
   - メール検証を有効化
   - 強力なパスワードポリシーを設定
   - レート制限を設定

2. **アクセス制御**
   - ロールベースのアクセス制御（admin/employee）
   - 最小権限の原則を適用

## データベースのセキュリティ

1. **Turso接続**
   - 認証トークンは定期的にローテーション
   - 本番環境とデベロップメント環境で異なるデータベースを使用

2. **データ保護**
   - 個人情報（給与情報）は適切に暗号化
   - アクセスログを記録
   - 定期的にバックアップを取得

## 本番環境へのデプロイ

### 環境変数の設定

本番環境では、ホスティングサービスの環境変数機能を使用：

- **Vercel**: プロジェクト設定 → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Cloudflare Pages**: Settings → Environment variables

### チェックリスト

- [ ] 本番用のFirebaseプロジェクトを作成
- [ ] 本番用のTursoデータベースを作成
- [ ] すべての環境変数を設定
- [ ] HTTPSを有効化
- [ ] CORS設定を適切に設定
- [ ] セキュリティヘッダーを設定

## 定期的なセキュリティチェック

### 月次チェック

- [ ] 依存パッケージの脆弱性チェック
  ```bash
  npm audit
  ```
- [ ] 未使用の認証情報を削除
- [ ] アクセスログの確認

### 四半期チェック

- [ ] 認証トークンのローテーション
- [ ] セキュリティポリシーの見直し
- [ ] バックアップの復元テスト

## 脆弱性の報告

セキュリティ上の問題を発見した場合は、公開のIssueではなく、直接担当者に連絡してください。

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase セキュリティルール](https://firebase.google.com/docs/rules)
- [Turso セキュリティ](https://turso.tech/docs/security)
