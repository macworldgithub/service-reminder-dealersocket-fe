'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Check,
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
  const { user, activeDealership, dealerships, setActiveDealership, logout } = useAuth();
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setIsStoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <div className="text-base font-bold text-white tracking-tight leading-none group-hover:text-blue-300 transition-colors flex items-center">
              <span>Service</span>
              <span className="text-blue-400">Pulse</span>
            </div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-1">
              Campaign Intelligence
            </div>
          </div>
        </Link>
      </div>

      {/* Active Dealership Switcher */}
      <div className="p-3 border-b border-slate-800/80 relative" ref={storeDropdownRef}>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">Active Store</span>
          <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-950/70 border border-emerald-800/50 px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
          className="w-full text-left group rounded-xl bg-gradient-to-b from-slate-800/80 to-slate-900/90 border border-slate-700/70 hover:border-blue-500/50 p-2.5 transition-all shadow-sm cursor-pointer focus:outline-none"
          title="Click to switch store"
        >
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/25 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 text-blue-400 font-bold text-xs tracking-wider shadow-inner">
              {activeDealership?.code ? activeDealership.code.replace(/[^A-Za-z]/g, '').slice(0, 3) || 'SMH' : 'SMH'}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-xs font-semibold text-white tracking-tight leading-snug group-hover:text-blue-200 transition-colors break-words flex items-center justify-between"
                title={activeDealership?.name || 'South Morang Hyundai'}
              >
                <span className="truncate">{activeDealership?.name || 'South Morang Hyundai'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                    isStoreDropdownOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </div>
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center text-[10px] font-mono font-semibold text-blue-300 bg-blue-950/80 border border-blue-800/60 px-1.5 py-0.5 rounded tracking-wide shrink-0 whitespace-nowrap">
                  {activeDealership?.code || 'SMH-01'}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  Click to switch
                </span>
              </div>
            </div>
          </div>
        </button>

        {isStoreDropdownOpen && (
          <div className="absolute left-3 right-3 top-full mt-1.5 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
              <span>Available Stores</span>
              <span className="text-slate-400">{dealerships.length}</span>
            </div>
            <div className="max-h-56 overflow-y-auto py-1 space-y-0.5">
              {dealerships.map((d) => {
                const isSelected = activeDealership?._id === d._id;
                return (
                  <button
                    key={d._id}
                    type="button"
                    onClick={() => {
                      setActiveDealership(d);
                      setIsStoreDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="truncate font-medium">{d.name}</div>
                      {d.code && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {d.code}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" strokeWidth={2} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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
                if (item.href === '/reports' && typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('reset-reports-today'));
                }
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
