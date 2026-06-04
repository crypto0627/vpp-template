import React from "react";
import type { LucideIcon } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon: LucideIcon;
  renderRightElement?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, icon: Icon, renderRightElement, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        <label htmlFor={props.id} className="block text-sm font-medium text-white/70">
          {label}
        </label>
        <div className="relative">
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            {...props}
            ref={ref}
            className={`w-full bg-[#1E1208] border border-[#3A2415] rounded-xl py-2.5 pl-10 ${renderRightElement ? "pr-10" : "pr-4"} text-white placeholder-white/20 text-sm focus:outline-none focus:border-[#E8883E] focus:ring-1 focus:ring-[#E8883E] transition-colors ${props.className ?? ""}`}
          />
          {renderRightElement}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  },
);
FormInput.displayName = "FormInput";
