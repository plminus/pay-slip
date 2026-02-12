import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  updateEmail,
  updateProfile,
} from "firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { getUserByFirebaseUid, updateUserProfile } from "@/lib/db-client";
import {
  userProfileSchema,
  passwordChangeSchema,
  type UserProfileValues,
  type PasswordChangeValues,
} from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export default function UserSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <ProfileForm user={user} />
      <PasswordForm user={user} />
    </div>
  );
}

function ProfileForm({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const [saving, setSaving] = useState(false);

  const form = useForm<UserProfileValues>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
    },
  });

  const onSubmit = async (values: UserProfileValues) => {
    if (!user) return;
    setSaving(true);
    try {
      // Firebase Auth のプロフィール更新
      await updateProfile(user, { displayName: values.displayName });

      if (values.email !== user.email) {
        await updateEmail(user, values.email);
      }

      // DB側のプロフィール更新
      const dbUser = await getUserByFirebaseUid(user.uid);
      if (dbUser) {
        await updateUserProfile(dbUser.id, {
          displayName: values.displayName,
          email: values.email,
        });
      }

      toast.success("プロフィールを更新しました");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "更新に失敗しました";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">アカウント情報</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-md space-y-4"
          >
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示名</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>メールアドレス</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "更新中..." : "更新"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PasswordForm({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const [saving, setSaving] = useState(false);

  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordChangeValues) => {
    if (!user || !user.email) return;
    setSaving(true);
    try {
      // 現在のパスワードで再認証
      const credential = EmailAuthProvider.credential(
        user.email,
        values.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // パスワード更新
      await updatePassword(user, values.newPassword);

      toast.success("パスワードを変更しました");
      form.reset();
    } catch (error) {
      const firebaseError = error as { code?: string };
      if (firebaseError.code === "auth/wrong-password") {
        toast.error("現在のパスワードが正しくありません");
      } else {
        toast.error("パスワードの変更に失敗しました");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">パスワード変更</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-w-md space-y-4"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>現在のパスワード</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新しいパスワード</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード確認</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "変更中..." : "パスワードを変更"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
