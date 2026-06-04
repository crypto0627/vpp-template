"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, AlertTriangle } from "lucide-react";
import HomeSidebar from "@/components/layout/sidebar";
import { useAuthStore } from "@/stores/auth-store";
import { FormInput } from "@/components/auth/form-input";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "請輸入目前密碼"),
    newPassword: z.string().min(6, "新密碼至少 6 個字元"),
    confirmPassword: z.string().min(1, "請確認新密碼"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "兩次密碼不一致",
    path: ["confirmPassword"],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

const SITES = [
  { id: "neihu", name: "內湖充電站", desc: "EV 充電站 + 370 kWh BESS" },
  { id: "etai", name: "億泰電纜", desc: "高壓工業廠房 + 10 MWh BESS" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const initial = user?.email?.[0]?.toUpperCase() ?? "?";

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    mode: "onBlur",
  });

  const onChangePassword = async (data: PasswordForm) => {
    setPwError("");
    setPwSuccess("");
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPwError(json.error || "更新失敗");
      } else {
        setPwSuccess("密碼已成功更新");
        reset();
      }
    } catch {
      setPwError("網路錯誤，請稍後再試");
    } finally {
      setPwLoading(false);
    }
  };

  const onDeleteAccount = async () => {
    setDeleteError("");
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setDeleteError(json.error || "刪除失敗");
        setDeleteLoading(false);
        return;
      }
      clearAuth();
      router.push("/auth/signin");
    } catch {
      setDeleteError("網路錯誤，請稍後再試");
      setDeleteLoading(false);
    }
  };

  const roleLabel: Record<string, string> = {
    admin: "管理員",
    worker: "工程師",
    viewer: "觀覽者",
  };

  const hasAccess = (siteId: string) =>
    user?.role === "admin" ||
    (user?.sitePermissions ?? []).includes(siteId);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#1E1208] lg:gap-4 lg:p-4">
      <HomeSidebar />

      <main className="flex-1 flex flex-col lg:flex-row gap-4 text-white p-4 pb-24 lg:p-0 lg:pb-0">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-4 w-full lg:w-80 shrink-0">
          {/* Identity */}
          <div className="bg-[#241508] rounded-2xl border border-[#3A2415] p-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E8883E] flex items-center justify-center text-2xl font-bold shadow-lg shadow-[#E8883E]/30 shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold truncate">{user?.email ?? "—"}</p>
              <span className="text-sm text-white/50">
                {user?.role ? (roleLabel[user.role] ?? user.role) : "—"}
              </span>
            </div>
          </div>

          {/* Account info */}
          <section className="flex-1 bg-[#241508] rounded-2xl border border-[#3A2415] p-6">
            <h2 className="text-base font-semibold text-[#E8883E] mb-4">帳號資訊</h2>
            <div className="space-y-1">
              <InfoRow label="電子郵件" value={user?.email ?? "—"} />
              <InfoRow label="角色" value={user?.role ? (roleLabel[user.role] ?? user.role) : "—"} />
              {user?.createdAt && (
                <InfoRow
                  label="加入日期"
                  value={new Date(user.createdAt).toLocaleDateString("zh-TW", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              )}
            </div>
          </section>

          {/* Danger zone */}
          <section className="bg-[#241508] rounded-2xl border border-[#3A2415] p-6">
            <h2 className="text-base font-semibold text-[#E8883E] mb-2">危險區域</h2>
            <p className="text-sm text-white/40 mb-4">
              刪除帳號後，所有資料將永久移除且無法復原。
            </p>
            <button
              onClick={() => setDeleteModal(true)}
              className="w-full rounded-xl border border-[#E8883E]/40 bg-[#E8883E]/5 px-4 py-2.5 text-sm font-semibold text-[#E8883E] hover:bg-[#E8883E]/10 transition-all"
            >
              刪除帳號
            </button>
          </section>
        </div>

        {/* ── Right column ── */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Site access */}
          <section className="bg-[#241508] rounded-2xl border border-[#3A2415] p-6">
            <h2 className="text-base font-semibold text-[#E8883E] mb-4">場站權限</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              {SITES.map(({ id, name, desc }) => {
                const allowed = hasAccess(id);
                return (
                  <div
                    key={id}
                    className={`rounded-xl border p-4 flex flex-col gap-3 transition-all ${
                      allowed
                        ? "border-[#E8883E]/30 bg-[#E8883E]/5"
                        : "border-[#3A2415] bg-[#1B0D06] opacity-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{desc}</p>
                    </div>
                    <span className={`text-xs font-medium ${
                      allowed ? "text-[#E8883E]" : "text-white/30"
                    }`}>
                      {allowed ? "已授權" : "無權限"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Change password */}
          <section className="flex-1 bg-[#241508] rounded-2xl border border-[#3A2415] p-6">
            <h2 className="text-base font-semibold text-[#E8883E] mb-6">修改密碼</h2>

            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4 max-w-md">
              {pwError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div className="rounded-xl border border-[#E8883E]/30 bg-[#E8883E]/10 px-4 py-3 text-sm text-[#E8883E]">
                  {pwSuccess}
                </div>
              )}

              <FormInput
                label="目前密碼"
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                placeholder="••••••••"
                icon={Lock}
                error={errors.currentPassword?.message}
                {...register("currentPassword")}
                renderRightElement={
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <FormInput
                label="新密碼"
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="••••••••"
                icon={Lock}
                error={errors.newPassword?.message}
                {...register("newPassword")}
                renderRightElement={
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <FormInput
                label="確認新密碼"
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                icon={Lock}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
                renderRightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full rounded-xl bg-[#E8883E] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#d4762e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwLoading ? "更新中..." : "更新密碼"}
              </button>
            </form>
          </section>
        </div>
      </main>

      {/* Delete confirmation modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 bg-[#241508] rounded-2xl border border-[#3A2415] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">確認刪除帳號</h3>
            </div>

            <p className="text-sm text-white/60">
              您確定要刪除帳號{" "}
              <span className="font-semibold text-white">{user?.email}</span> 嗎？
              此操作無法復原。
            </p>

            {deleteError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setDeleteModal(false); setDeleteError(""); }}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-[#3A2415] bg-transparent py-2.5 text-sm font-semibold text-white/60 hover:text-white hover:border-[#4A3020] transition-all disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={onDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-500/80 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "刪除中..." : "確認刪除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#3A2415]/60 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
