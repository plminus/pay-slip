import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // バリデーション
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上である必要があります");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, displayName);
      navigate("/");
    } catch (err: any) {
      let errorMessage = "アカウントの作成に失敗しました";

      if (err.code === "auth/email-already-in-use") {
        errorMessage = "このメールアドレスは既に使用されています";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "メールアドレスの形式が正しくありません";
      } else if (err.code === "auth/weak-password") {
        errorMessage = "パスワードが弱すぎます";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("Sign up error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">アカウント登録</CardTitle>
          <CardDescription>給与明細管理システムへの登録</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">表示名</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="山田 太郎"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                placeholder="6文字以上"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="パスワードを再入力"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登録中..." : "アカウントを作成"}
            </Button>
            <div className="text-center text-sm">
              <span className="text-gray-600">既にアカウントをお持ちですか？ </span>
              <Link to="/login" className="text-blue-600 hover:underline">
                ログイン
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
