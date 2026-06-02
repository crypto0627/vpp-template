"use client";

import { SignInForm } from "@/components/auth/signinform";
import { AuthLayout } from "@/components/layouts/auth-layout";

export default function SignInPage() {
  return (
    <AuthLayout>
      <SignInForm />
    </AuthLayout>
  );
}
