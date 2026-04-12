import { type ButtonHTMLAttributes, useState, useEffect } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "whatsapp";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  success?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-gradient text-white hover:brightness-[0.92] active:brightness-[0.85] active:scale-[0.98]",
  secondary:
    "bg-transparent border-2 border-primary text-primary hover:bg-primary/5 active:bg-primary/10 active:scale-[0.98]",
  ghost:
    "bg-transparent text-primary hover:bg-primary/5 active:bg-primary/10",
  destructive:
    "bg-error text-white hover:brightness-[0.92] active:brightness-[0.85] active:scale-[0.98]",
  whatsapp:
    "bg-whatsapp text-white hover:brightness-[0.92] active:brightness-[0.85] active:scale-[0.98]",
};

export default function Button({
  variant = "primary",
  loading = false,
  success: successProp = false,
  disabled,
  children,
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (successProp) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [successProp]);

  const isDisabled = disabled || loading;
  const minWidth = variant === "ghost" ? "min-w-[120px]" : "min-w-[160px]";

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        h-[52px] md:h-[48px] ${minWidth}
        px-6 rounded-md
        text-base font-semibold
        transition-all duration-150
        focus-visible:outline-3 focus-visible:outline-primary focus-visible:outline-offset-2
        ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
        ${!isDisabled ? variantStyles[variant] : "bg-[#CCCCCC] text-white"}
        ${className}
      `}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : showSuccess ? (
        <span className="material-symbols-outlined text-[20px]">check_circle</span>
      ) : (
        children
      )}
    </button>
  );
}
