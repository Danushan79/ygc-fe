"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  labelExtra?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

export function FormField({
  id,
  label,
  error,
  labelExtra,
  className,
  type = "text",
  disabled,
  ...inputProps
}: FormFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-semibold text-slate-900">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword && isPasswordVisible ? "text" : type}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-xl border px-4 py-3 text-slate-900 placeholder:text-slate-400 transition-shadow focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
            isPassword ? "pr-11" : ""
          } ${
            error
              ? "border-red-300 focus:ring-red-500"
              : "border-slate-300 focus:border-transparent focus:ring-blue-600"
          } ${className ?? ""}`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            disabled={disabled}
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-4.5 w-4.5" strokeWidth={2} />
            ) : (
              <Eye className="h-4.5 w-4.5" strokeWidth={2} />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
