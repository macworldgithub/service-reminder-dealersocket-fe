'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Download,
  Eye,
  Building2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { Report, ImportSession, AuditLog } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { activeDealership } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [imports, setImports] = useState<ImportSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const dealershipParam = activeDealership ? `?dealershipId=${activeDealership._id}` : '';
        const [reportsRes, importsRes, auditRes] = await Promise.all([
          api.get(`/reports${dealershipParam}`),
          api.get(`/imports${dealershipParam}&limit=5`),
          api.get(`/audit-logs${dealershipParam}&limit=6`),
        ]);

        if (reportsRes.data?.success) setReports(reportsRes.data.data || []);
        if (importsRes.data?.success) setImports(importsRes.data.data || []);
        if (auditRes.data?.success) setAuditLogs(auditRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [activeDealership]);

  // Operational metrics
  const totalReports = reports.length;
  const totalRecords = reports.reduce((acc, r) => acc + (r.recordCount || 0), 0);
  const successfulImports = imports.filter((i) => i.status === 'COMPLETED').length;
  const failedImports = imports.filter((i) => i.status === 'FAILED').length;

  return (
    <AppLayout
      title="Operations Dashboard"
      subtitle="Overview of campaign report ingestion, record validation, and activity"
      actions={
        <Link href="/imports/new">
          <Button icon={<UploadCloud className="w-4 h-4" />}>
            Upload Report
          </Button>
        </Link>
      }
    >
      {/* 4 Clean Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Ingested Reports
            </span>
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalReports}</div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">Live</span>
            <span className="mx-1">·</span>
            <span>Across all campaigns</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Records Managed
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {totalRecords.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Validated &amp; preserved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Successful Ingestions
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{successfulImports}</div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Automated bulk ingestion</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Dealership
            </span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {activeDealership?.name || 'All Dealerships'}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 font-mono">
            {activeDealership?.code || 'SYSTEM'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent Campaign Reports</h2>
              <p className="text-xs text-slate-500">DealerSocket closed ROs and customer service batches</p>
            </div>
            <Link href="/reports" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Report Name</th>
                  <th className="py-2.5 px-4">Campaign</th>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4">Records</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No reports uploaded for this dealership yet.
                    </td>
                  </tr>
                ) : (
                  reports.slice(0, 5).map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <Link href={`/reports/${r._id}`} className="hover:text-blue-600">
                          {r.name}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-normal">
                          {r.sourceFileType?.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{r.campaignName || '—'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.reportDateFrom && r.reportDateTo
                          ? `${formatDate(r.reportDateFrom)} - ${formatDate(r.reportDateTo)}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {r.recordCount}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/reports/${r._id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          </Link>
                          <a href={`/api/reports/${r._id}/pdf`} target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-600">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Activity Stream (1 Col) */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/50">
            <h2 className="text-sm font-semibold text-slate-900">Recent Audit Activity</h2>
            <p className="text-xs text-slate-500">Live operational change tracking</p>
          </div>

          <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
            {auditLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No recent activity recorded.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log._id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800">
                      {log.action.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(log.createdAt)} · {typeof log.userId === 'object' ? (log.userId as any)?.name : 'System User'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <Link href="/audit" className="text-xs font-medium text-blue-600 hover:underline">
              View Full Audit Trail →
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
