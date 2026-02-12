import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "sonner";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import EmployeeList from "./pages/employees/EmployeeList";

// 認証が必要なルートを保護するコンポーネント
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ログイン済みの場合はダッシュボードにリダイレクト
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* 公開ルート */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignUp />
                </PublicRoute>
              }
            />

            {/* 保護されたルート */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
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
            <Route
              path="/payslips"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div>給与明細一覧ページ（実装予定）</div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payslips/create"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div>給与明細作成ページ（実装予定）</div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/year-end-adjustment"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div>年末調整ページ（実装予定）</div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <div>設定ページ（実装予定）</div>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
