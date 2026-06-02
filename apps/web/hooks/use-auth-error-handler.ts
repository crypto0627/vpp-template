"use client";

import { useErrorToast } from "@/components/ui";
import { getErrorMessage, getErrorType } from "@/components/ui";

export function useAuthErrorHandler() {
  const { showError, showSuccess, showWarning, showInfo } = useErrorToast();

  const handleAuthError = (
    error: string | null | undefined,
    context: "signin" | "signup" = "signin",
  ) => {
    if (!error) return;

    const message = getErrorMessage(error);
    const type = getErrorType(error);

    const contextTitles = {
      signin: "登入失敗",
      signup: "註冊失敗",
    };

    switch (type) {
      case "error":
        showError({
          title: contextTitles[context],
          description: message,
          duration: 6000,
        });
        break;
      case "warning":
        showWarning(message, "注意");
        break;
      case "info":
        showInfo(message, "提示");
        break;
      default:
        showError({
          title: contextTitles[context],
          description: message,
        });
    }
  };

  const handleAuthSuccess = (context: "signin" | "signup" = "signin") => {
    const messages = {
      signin: "歡迎回來！正在為您跳轉...",
      signup: "帳戶建立成功！正在為您跳轉...",
    };

    const titles = {
      signin: "登入成功",
      signup: "註冊成功",
    };

    showSuccess(messages[context], titles[context]);
  };

  return {
    handleAuthError,
    handleAuthSuccess,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
