"use client";

import { SignUpForm } from "@/components/auth/signupform";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { useGuestGuard } from "@/hooks/use-auth-guard";
import { PageLoading } from "@/components/ui";

export default function SignUpPage() {
  const { isAuthenticated, isLoading } = useGuestGuard();

  // 顯示載入狀態
  if (isLoading) {
    return <PageLoading text="檢查登入狀態..." />;
  }

  // 如果已認證，useGuestGuard 會自動重導向
  if (isAuthenticated) {
    return null;
  }

  return (
    <AuthLayout>
      <SignUpForm />
    </AuthLayout>
  );
}
