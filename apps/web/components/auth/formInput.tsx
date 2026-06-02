import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InlineError } from "@/components/ui";
import { LucideIcon } from "lucide-react";
import React from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon: LucideIcon;
  renderRightElement?: React.ReactNode; // 用於顯示/隱藏密碼的按鈕
}

// 使用 forwardRef 確保 react-hook-form 的 register 能正確運作
export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon: Icon, renderRightElement, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={props.id}>{label}</Label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            {...props}
            ref={ref}
            className={`${props.className} pl-10 ${renderRightElement ? "pr-10" : ""}`}
          />
          {renderRightElement}
        </div>
        <InlineError error={error} />
      </div>
    );
  },
);
FormInput.displayName = "FormInput";
