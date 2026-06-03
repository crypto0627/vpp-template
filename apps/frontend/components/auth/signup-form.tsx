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
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "兩次密碼不一致",
  path: ["confirmPassword"],
});
type FormData = z.infer<typeof schema>;

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");

  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    setServerSuccess("");

    const result = await signUp(data.email, data.password);
    if (result.success) {
      setServerSuccess("註冊成功！正在跳轉...");
      setTimeout(() => router.push("/"), 1000);
    } else {
      if (result.error === "User already exists") {
        setServerError("此帳號已存在，請直接登入");
        setTimeout(() => router.push("/auth/signin"), 2500);
      } else {
        setServerError(result.error || "註冊失敗");
      }
    }
  };

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-white">建立帳戶</h1>
        <p className="text-sm text-white/40">註冊以存取 VPP 系統</p>
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
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <FormInput
          label="確認密碼"
          id="confirmPassword"
          type={showConfirm ? "text" : "password"}
          placeholder="••••••••"
          icon={Lock}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
          renderRightElement={
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[#E8883E] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#d4762e] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "註冊中..." : "建立帳戶"}
        </button>
      </form>

      <p className="text-center text-sm text-white/40">
        已有帳戶？{" "}
        <Link href="/auth/signin" className="font-semibold text-[#E8883E] hover:underline">
          立即登入
        </Link>
      </p>
    </div>
  );
}
