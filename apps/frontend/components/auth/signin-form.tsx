"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { FormInput } from "./form-input";

const schema = z.object({
  email: z.string().email("請輸入有效的電子郵件"),
  password: z.string().min(6, "密碼至少 6 個字元"),
});
type FormData = z.infer<typeof schema>;

export function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");

  const router = useRouter();
  const { signIn, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    setServerSuccess("");

    const result = await signIn(data.email, data.password);
    if (result.success) {
      setServerSuccess("登入成功！正在跳轉...");
      setTimeout(() => router.push("/"), 1000);
    } else {
      setServerError(result.error || "登入失敗");
      if (result.error === "Invalid credentials, cannot find user") {
        setTimeout(() => router.push("/auth/signup"), 2500);
      }
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-white">歡迎回來</h1>
        <p className="text-sm text-white/40">登入您的帳戶以存取 VPP 系統</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {serverError}
          </div>
        )}
        {serverSuccess && (
          <div className="rounded-xl border border-[#E8883E]/30 bg-[#E8883E]/10 px-4 py-3 text-sm text-[#E8883E]">
            {serverSuccess}
          </div>
        )}

        <FormInput
          label="電子郵件"
          id="email"
          type="email"
          placeholder="name@fortune.com.tw"
          icon={Mail}
          error={errors.email?.message}
          {...register("email")}
        />

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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#E8883E] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#d4762e] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "登入中..." : "登入"}
        </button>
      </form>

      <p className="text-center text-sm text-white/40">
        還沒有帳戶？{" "}
        <Link href="/auth/signup" className="font-semibold text-[#E8883E] hover:underline">
          立即註冊
        </Link>
      </p>
    </div>
  );
}
