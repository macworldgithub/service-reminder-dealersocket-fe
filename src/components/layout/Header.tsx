'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Bell, Menu, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/authContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  onToggleMobileMenu,
}) => {
  const { activeDealership } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-0.5 truncate">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.75} />}
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-blue-600 transition-colors truncate">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-slate-700 font-medium truncate">{bc.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          {title && <h1 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight truncate">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block truncate mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200/80 shadow-2xs">
          <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-slate-900 truncate max-w-[150px] md:max-w-[220px]">
            {activeDealership?.name || 'South Morang Hyundai'}
          </span>
          {activeDealership?.code && (
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
              {activeDealership.code}
            </span>
          )}
        </div>
        <button
          type="button"
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors relative hidden sm:flex items-center justify-center"
          title="System Online"
        >
          <Bell className="w-4 h-4" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
};
