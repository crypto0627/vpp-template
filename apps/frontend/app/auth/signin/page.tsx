import Image from "next/image";
import { SignInForm } from "@/components/auth/signin-form";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#170C06] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Image src="/FE_logo.webp" alt="Fortune ESS" width={56} height={56} className="object-contain" />
        </div>
        <div className="bg-[#20160F] border border-[#2A1A0E] rounded-2xl p-8">
          <SignInForm />
        </div>
      </div>
    </div>
  );
}
