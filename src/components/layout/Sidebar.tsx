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
  Car,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { cn } from '@/lib/utils';

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
    <aside className={cn('bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 h-screen', isMobile ? 'w-full' : 'w-64')}>
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white tracking-tight leading-none">
              DealerSocket
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">
              Operations Hub
            </div>
          </div>
        </Link>
      </div>

      {/* Active Dealership (South Morang Hyundai only) */}
      <div className="p-3 border-b border-slate-800">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
          Active Dealership
        </div>
        <div className="w-full flex items-center justify-between px-2.5 py-2 rounded-md bg-slate-800/80 border border-slate-700/80">
          <div className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-xs font-medium text-white truncate">
              {activeDealership?.name || 'South Morang Hyundai'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded">
            {activeDealership?.code || 'SMH-01'}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1.5">
          Modules
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
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all group',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="px-2 py-1.5 mb-1">
          <div className="text-xs font-semibold text-white truncate">{user?.name || 'Devs'}</div>
          <div className="text-[11px] text-slate-400 truncate">{user?.email || 'devs@neximet.com'}</div>
        </div>
        <button
          onClick={logout}
          className="w-full mt-2 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors font-medium border border-rose-900/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
