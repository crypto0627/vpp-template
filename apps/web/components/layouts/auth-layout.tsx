import type { ReactNode } from "react";
import Image from "next/image";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary via-primary/90 to-accent p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-cover bg-center" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Image src={`/ess-logo.png`} alt="Logo" width={300} height={100} />
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight text-balance">
            表後儲能
            <br />
            管理與分析平台
          </h1>
          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            為企業提供全方位的儲能解決方案、數據分析系統
          </p>

          <div className="flex gap-8 pt-8">
            <div>
              <div className="text-3xl font-bold text-white">2+</div>
              <div className="text-sm text-white/80">企業用戶</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-white/80">技術支援</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <Image src={`/ess-logo.png`} alt="Logo" width={300} height={100} />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
