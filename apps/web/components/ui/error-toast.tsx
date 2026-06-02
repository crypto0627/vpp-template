"use client";

import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react";

export interface ErrorToastOptions {
  title?: string;
  description: string;
  variant?: "destructive" | "success" | "warning" | "default";
  duration?: number;
}

export function useErrorToast() {
  const { toast } = useToast();

  const showError = (options: ErrorToastOptions) => {
    const {
      title = "錯誤",
      description,
      variant = "destructive",
      duration = 5000,
    } = options;

    const getIcon = () => {
      switch (variant) {
        case "destructive":
          return <AlertCircle className="h-4 w-4" />;
        case "success":
          return <CheckCircle className="h-4 w-4" />;
        case "warning":
          return <AlertTriangle className="h-4 w-4" />;
        default:
          return <Info className="h-4 w-4" />;
      }
    };

    return toast({
      variant,
      title,
      description: (
        <div className="flex items-center gap-2">
          {getIcon()}
          <span>{description}</span>
        </div>
      ),
      duration,
    });
  };

  const showSuccess = (description: string, title = "成功") => {
    return showError({ title, description, variant: "success" });
  };

  const showWarning = (description: string, title = "警告") => {
    return showError({ title, description, variant: "warning" });
  };

  const showInfo = (description: string, title = "提示") => {
    return showError({ title, description, variant: "default" });
  };

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
}
