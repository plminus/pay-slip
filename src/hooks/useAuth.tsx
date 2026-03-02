import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { createUser } from "../lib/db-client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Firebaseでユーザーを作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // データベースにユーザー情報を保存
    try {
      await createUser({
        email,
        displayName,
        firebaseUid: userCredential.user.uid,
        role: "employee", // デフォルトは一般従業員
      });
    } catch (error) {
      console.error("Failed to save user to database:", error);
      // Firebase認証は成功しているが、DB保存に失敗した場合
      // エラーをスローして呼び出し元で処理
      throw new Error("アカウントは作成されましたが、データベースへの保存に失敗しました");
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
