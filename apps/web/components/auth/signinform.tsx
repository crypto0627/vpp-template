"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { ButtonLoading, FormError, FormSuccess } from "@/components/ui";
import { useAuthErrorHandler } from "@/hooks/use-auth-error-handler";
import { signInSchema, type SignInFormData } from "@/utils/validation";
import { FormInput } from "./formInput";
import { useGuestGuard } from "@/hooks/use-auth-guard";

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState({ error: "", success: "" });

  const router = useRouter();
  const { signIn } = useAuthStore();
  const { isLoading, isAuthenticated } = useGuestGuard();
  const { handleAuthError, handleAuthSuccess } = useAuthErrorHandler();
  // 初始化 Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormData) => {
    setServerStatus({ error: "", success: "" });

    const result = await signIn(data.email, data.password);

    if (result.success) {
      setServerStatus({ error: "", success: "登入成功！正在跳轉..." });
      handleAuthSuccess("signin");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } else {
      setServerStatus({ error: result.error || "登入失敗", success: "" });
      handleAuthError(result.error, "signin");

      // 特殊處理：找不到用戶，引導註冊
      if (result.error === "Invalid credentials, cannot find user") {
        setTimeout(() => {
          router.push("/auth/signup");
        }, 2500);
      }
    }
  };

  // Authentication protection
  if (isAuthenticated) return null;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          歡迎回來
        </h1>
        <p className="text-muted-foreground">登入您的帳戶以存取財報系統</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 全域錯誤顯示 */}
        {serverStatus.error && <FormError error={serverStatus.error} />}
        {serverStatus.success && <FormSuccess message={serverStatus.success} />}

        {/* 使用封裝後的 Email 欄位 */}
        <FormInput
          label="電子郵件"
          id="email"
          type="email"
          placeholder="name@company.com"
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* 使用封裝後的 Password 欄位 */}
        <div className="relative">
          <FormInput
            label="密碼"
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            icon={Lock}
            error={errors.password?.message}
            {...register("password")}
            renderRightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
          <Link
            href="/forgot-password"
            className="absolute right-0 top-0 text-sm text-primary hover:underline"
          >
            忘記密碼？
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <label
            htmlFor="remember"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            記住我的登入狀態
          </label>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <ButtonLoading isLoading={isLoading} loadingText="登入中...">
            登入
          </ButtonLoading>
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        還沒有帳戶？{" "}
        <Link
          href="/auth/signup"
          className="text-primary font-semibold hover:underline"
        >
          立即註冊
        </Link>
      </div>
    </div>
  );
}
