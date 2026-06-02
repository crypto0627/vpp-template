"use server";

import {
  FormState,
  validateSignIn,
  validateSignUp,
  SignInFormData,
  SignUpFormData,
} from "./validation";

// 登入 action
export async function signInAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const data: SignInFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // 驗證表單數據
  const validation = validateSignIn(data);

  if (!validation.success) {
    return {
      success: false,
      message: "表單驗證失敗",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    // 這裡會在客戶端組件中處理實際的登入邏輯
    // Server Action 主要負責驗證
    return {
      success: true,
      message: "驗證通過",
    };
  } catch {
    return {
      success: false,
      message: "登入失敗",
    };
  }
}

// 註冊 action
export async function signUpAction(
  prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const data: SignUpFormData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  // 驗證表單數據
  const validation = validateSignUp(data);

  if (!validation.success) {
    return {
      success: false,
      message: "表單驗證失敗",
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    // 這裡會在客戶端組件中處理實際的註冊邏輯
    // Server Action 主要負責驗證
    return {
      success: true,
      message: "驗證通過",
    };
  } catch {
    return {
      success: false,
      message: "註冊失敗",
    };
  }
}
