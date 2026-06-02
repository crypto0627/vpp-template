// Re-export validation schemas and types from centralized type file
export {
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
  type FormState,
} from "@/types/validation-type";

import {
  signInSchema,
  signUpSchema,
  type SignInFormData,
  type SignUpFormData,
  type FormState,
} from "@/types/validation-type";

// 驗證函數
export const validateSignIn = (data: SignInFormData) => {
  return signInSchema.safeParse(data);
};

export const validateSignUp = (data: SignUpFormData) => {
  return signUpSchema.safeParse(data);
};

// 初始表單狀態
export const initialFormState: FormState = {
  success: false,
  message: "",
  errors: {},
};
