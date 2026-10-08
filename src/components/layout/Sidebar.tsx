'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  UploadCloud,
  FileText,
  Workflow,
  Settings,
  LogOut,
  Building2,
  User,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { cn } from '@/lib/utils';
import { DealerSocketLogo } from '@/components/common/DealerSocketLogo';

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobile, onClose }) => {
  const pathname = usePathname();
  const { user, activeDealership, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Reports', href: '/reports', icon: FileSpreadsheet },
    { name: 'Import Report', href: '/imports/new', icon: UploadCloud },
    { name: 'Templates & PDF', href: '/templates', icon: FileText },
    { name: 'Campaign Engine', href: '/campaigns', icon: Workflow },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className={cn('bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-screen select-none', isMobile ? 'w-full' : 'w-64')}>
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/90 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <DealerSocketLogo size="md" withGlow />
          <div>
            <div className="text-sm font-semibold text-white tracking-tight leading-none group-hover:text-blue-200 transition-colors">
              DealerSocket
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1 flex items-center gap-1">
              <span>Operations Hub</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </div>
          </div>
        </Link>
      </div>

      {/* Active Dealership */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5 flex items-center justify-between">
          <span>Active Dealership</span>
          <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/50 px-1 py-0.2 rounded">LIVE</span>
        </div>
        <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-slate-600/80 transition-colors">
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={1.75} />
            </div>
            <span className="text-xs font-medium text-white truncate">
              {activeDealership?.name || 'South Morang Hyundai'}
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded border border-slate-600/40">
            {activeDealership?.code || 'SMH-01'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1">
          Platform Modules
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                )}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  strokeWidth={isActive ? 2 : 1.75}
                />
              </div>
              <span className="truncate">{item.name}</span>
              {isActive && (
                <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-slate-800/90 bg-slate-950/50">
        <div className="px-2 py-1.5 mb-1 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <User className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white truncate">{user?.name || 'Devs'}</div>
            <div className="text-[11px] text-slate-400 truncate font-mono">{user?.email || 'devs@neximet.com'}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-1.5 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium border border-rose-900/30 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
