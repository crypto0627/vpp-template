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
import { signUpSchema, type SignUpFormData } from "@/utils/validation";
import { FormInput } from "./formInput";

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverStatus, setServerStatus] = useState({ error: "", success: "" });

  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const { handleAuthError, handleAuthSuccess } = useAuthErrorHandler();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: SignUpFormData) => {
    setServerStatus({ error: "", success: "" });
    const result = await signUp(data.email, data.password);

    if (result.success) {
      setServerStatus({ error: "", success: "註冊成功！正在跳轉..." });
      handleAuthSuccess("signup");
      setTimeout(() => router.push("/auth/signin"), 1500);
    } else {
      setServerStatus({ error: result.error || "註冊失敗", success: "" });
      handleAuthError(result.error, "signup");
      if (result.error === "User already exists") {
        setTimeout(() => router.push("/auth/signin"), 2500);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          建立新帳戶
        </h1>
        <p className="text-muted-foreground">填寫資料開始使用能源財報系統</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormError error={serverStatus.error} />
        <FormSuccess message={serverStatus.success} />

        {/* Email */}
        <FormInput
          label="電子郵件 *"
          icon={Mail}
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Password */}
        <FormInput
          label="密碼 *"
          icon={Lock}
          type={showPassword ? "text" : "password"}
          placeholder="至少 8 個字元"
          error={errors.password?.message}
          {...register("password")}
          renderRightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        {/* Confirm Password */}
        <FormInput
          label="確認密碼 *"
          icon={Lock}
          type={showConfirmPassword ? "text" : "password"}
          placeholder="再次輸入密碼"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
          renderRightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <div className="flex items-start space-x-2">
          <Checkbox id="terms" className="mt-1" required />
          <label
            htmlFor="terms"
            className="text-sm text-muted-foreground cursor-pointer"
          >
            我同意{" "}
            <Link href="/terms" className="text-primary hover:underline">
              服務條款
            </Link>{" "}
            與{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              隱私政策
            </Link>
          </label>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          <ButtonLoading isLoading={isLoading} loadingText="建立中...">
            建立帳戶
          </ButtonLoading>
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        已經有帳戶了？{" "}
        <Link
          href="/auth/signin"
          className="text-primary font-semibold hover:underline"
        >
          立即登入
        </Link>
      </div>
    </div>
  );
}
