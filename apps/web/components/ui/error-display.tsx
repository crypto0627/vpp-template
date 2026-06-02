"use client";

import { cn } from "@/lib/utils";
import { AlertCircle, X, Info, CheckCircle, AlertTriangle } from "lucide-react";

// 錯誤類型
export type ErrorType = "error" | "warning" | "info" | "success";

// 基礎錯誤顯示組件
interface ErrorDisplayProps {
  message: string;
  type?: ErrorType;
  className?: string;
  onClose?: () => void;
  closable?: boolean;
}

export function ErrorDisplay({
  message,
  type = "error",
  className,
  onClose,
  closable = false,
}: ErrorDisplayProps) {
  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      default:
        return "bg-red-50 border-red-200 text-red-800";
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-md border text-sm",
        getStyles(),
        className,
      )}
    >
      <div className="shrink-0 mt-0.5">{getIcon()}</div>
      <div className="flex-1">{message}</div>
      {closable && onClose && (
        <button
          onClick={onClose}
          className="shrink-0 ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// 表單錯誤顯示組件
interface FormErrorProps {
  error: string | null;
  className?: string;
}

export function FormError({ error, className }: FormErrorProps) {
  if (!error) return null;

  return <ErrorDisplay message={error} type="error" className={className} />;
}

// 表單成功顯示組件
interface FormSuccessProps {
  message: string | null;
  className?: string;
}

export function FormSuccess({ message, className }: FormSuccessProps) {
  if (!message) return null;

  return (
    <ErrorDisplay message={message} type="success" className={className} />
  );
}

// 內聯錯誤顯示組件（用於表單欄位）
interface InlineErrorProps {
  error: string | null | undefined;
  className?: string;
}

export function InlineError({ error, className }: InlineErrorProps) {
  if (!error) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-sm text-red-600 mt-1",
        className,
      )}
    >
      <AlertCircle className="h-3 w-3" />
      <span>{error}</span>
    </div>
  );
}

// 錯誤訊息映射函數
export function getErrorMessage(error: string): string {
  const errorMessages: Record<string, string> = {
    // 註冊相關錯誤
    "User already exists": "此電子郵件已被註冊，請使用其他電子郵件或直接登入",
    "Email and password are required": "請填寫電子郵件和密碼",
    "Invalid email": "請輸入有效的電子郵件地址",
    "Password too short": "密碼長度至少需要 8 個字元",
    "Invalid email, please call website manager 'jake.kuo@fortune.com.tw'":
      "此電子郵件不在允許名單中，請聯繫管理員 jake.kuo@fortune.com.tw",

    // 登入相關錯誤
    "Invalid credentials": "電子郵件或密碼錯誤，請重新輸入",
    "Invalid credentials, cannot find user":
      "找不到此用戶，請檢查電子郵件是否正確或先註冊帳號",
    "No authentication token": "請先登入",
    "Invalid token": "登入已過期，請重新登入",
    "User not found": "用戶不存在",

    // 網路相關錯誤
    "Network error": "網路連線錯誤，請檢查網路連線後重試",
    "Failed to sign in": "登入失敗，請稍後重試",
    "Failed to sign up": "註冊失敗，請稍後重試",
    "Failed to create account": "建立帳號失敗，請稍後重試",

    // 伺服器錯誤
    "Internal server error": "伺服器錯誤，請稍後重試",
    "Service unavailable": "服務暫時無法使用，請稍後重試",
  };

  return errorMessages[error] || error || "發生未知錯誤，請稍後重試";
}

// 錯誤類型判斷函數
export function getErrorType(error: string): ErrorType {
  const warningErrors = [
    "User already exists",
    "Invalid email, please call website manager",
  ];

  const infoErrors = ["Email and password are required", "Password too short"];

  if (warningErrors.some((e) => error.includes(e))) {
    return "warning";
  }

  if (infoErrors.some((e) => error.includes(e))) {
    return "info";
  }

  return "error";
}
