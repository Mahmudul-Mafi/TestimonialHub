import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

export function Field({ label, htmlFor, hint, error, children, required }: FieldProps) {
  const id = htmlFor;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </label>
      <div data-hint-id={hintId} data-error-id={errorId}>
        {children}
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm",
          "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
          "disabled:opacity-60 disabled:bg-gray-100",
          "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
          "aria-[invalid=true]:border-red-500",
          className
        )}
        {...props}
      />
    );
  }
);

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm",
        "focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500",
        "disabled:opacity-60 disabled:bg-gray-100",
        "dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100",
        "aria-[invalid=true]:border-red-500",
        className
      )}
      {...props}
    />
  );
});

export function Alert({
  variant = "info",
  children,
}: {
  variant?: "info" | "success" | "error" | "warning";
  children: React.ReactNode;
}) {
  const styles: Record<typeof variant, string> = {
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-100 dark:border-blue-900",
    success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-100 dark:border-green-900",
    error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-100 dark:border-red-900",
    warning: "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-100 dark:border-yellow-900",
  };
  return (
    <div
      role="alert"
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        styles[variant]
      )}
    >
      {children}
    </div>
  );
}
