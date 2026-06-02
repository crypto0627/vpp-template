"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/home/navbar";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useAuthStore } from "@/stores/auth-store";
import { PageLoading } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthGuard();
  const { user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "請填寫所有欄位" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "新密碼長度至少需要 6 個字元" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "新密碼與確認密碼不符" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/update-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "密碼更新失敗" });
        setIsSubmitting(false);
        return;
      }

      setMessage({ type: "success", text: "密碼更新成功！" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setMessage({ type: "error", text: "發生錯誤，請稍後再試" });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoading text="載入中..." className="h-screen" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            返回首頁
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">個人設定</h1>
          <p className="text-gray-600 mt-2">管理您的帳戶設定和密碼</p>
        </div>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                帳戶資訊
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">電子郵件</Label>
                  <div className="mt-1 text-lg font-medium text-gray-900">
                    {user?.email}
                  </div>
                </div>
                {user?.createdAt && (
                  <div>
                    <Label className="text-gray-600">註冊日期</Label>
                    <div className="mt-1 text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString("zh-TW", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Update Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                更改密碼
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">目前密碼</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="請輸入目前密碼"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密碼</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="請輸入新密碼（至少 6 個字元）"
                    disabled={isSubmitting}
                    required
                    minLength={6}
                  />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">確認新密碼</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="請再次輸入新密碼"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                {/* Message */}
                {message && (
                  <div
                    className={`flex items-center gap-2 p-4 rounded-md ${
                      message.type === "success"
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : "bg-red-50 text-red-800 border border-red-200"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 shrink-0" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "更新中..." : "更新密碼"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
