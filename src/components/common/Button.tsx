import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      icon,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 shadow-xs border border-slate-900 focus:ring-2 focus:ring-slate-900/20',
      secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 shadow-2xs border border-slate-200/90',
      outline: 'bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 border border-slate-300/90 shadow-2xs hover:border-slate-400/80',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 border-transparent',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs border border-rose-600',
    };

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
      md: 'text-sm px-3.5 py-2 h-9 gap-2',
      lg: 'text-base px-4 py-2.5 h-11 gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
