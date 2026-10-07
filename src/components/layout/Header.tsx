'use client';

import React from 'react';
import Link from 'next/link';
import { UploadCloud, Building2, Bell, Menu } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/common/Button';

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
            className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-1.5 text-xs text-slate-500 mb-0.5 truncate">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-400">/</span>}
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
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {actions}
        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate max-w-[140px] md:max-w-[200px]">{activeDealership?.name || 'All Dealerships'}</span>
        </div>
      </div>
    </header>
  );
};
