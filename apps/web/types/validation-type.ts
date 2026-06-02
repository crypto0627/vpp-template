/**
 * Form Validation Type Definitions
 *
 * Type definitions for form validation and form state management.
 */

import { z } from "zod";

// 基礎驗證 schema
export const emailSchema = z
  .string()
  .min(1, "請輸入電子郵件")
  .email("請輸入有效的電子郵件格式");

export const passwordSchema = z
  .string()
  .min(1, "請輸入密碼")
  .min(8, "密碼至少需要 8 個字元");

// 登入表單驗證 schema
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "請輸入密碼"),
});

// 註冊表單驗證 schema
export const signUpSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "請確認密碼"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密碼確認不符",
    path: ["confirmPassword"],
  });

// 表單數據類型
export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;

/**
 * Form state interface
 * Defines the shape of form validation state
 */
export interface FormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}
