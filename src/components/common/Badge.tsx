import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'neutral' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200/90',
    blue: 'bg-slate-100 text-slate-800 border-slate-200/90',
    purple: 'bg-slate-100 text-slate-800 border-slate-200/90',
    success: 'bg-emerald-50/90 text-emerald-800 border-emerald-200/80',
    warning: 'bg-amber-50/90 text-amber-800 border-amber-200/80',
    error: 'bg-rose-50/90 text-rose-800 border-rose-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/90',
    outline: 'bg-transparent text-slate-600 border-slate-300',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-md leading-none select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};
