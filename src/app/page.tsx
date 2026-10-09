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
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { BatchUploadModal } from '@/components/common/BatchUploadModal';
import { api } from '@/lib/api';
import { downloadAuthenticatedFile } from '@/lib/download';
import { useAuth } from '@/lib/authContext';
import { Report, ImportSession } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { activeDealership } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [imports, setImports] = useState<ImportSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const reportParams = new URLSearchParams();
      if (activeDealership?._id) reportParams.set('dealershipId', activeDealership._id);
      const reportQuery = reportParams.toString() ? `?${reportParams.toString()}` : '';

      const importParams = new URLSearchParams();
      if (activeDealership?._id) importParams.set('dealershipId', activeDealership._id);
      importParams.set('limit', '5');
      const importQuery = `?${importParams.toString()}`;

      const [reportsRes, importsRes] = await Promise.all([
        api.get(`/reports${reportQuery}`),
        api.get(`/imports${importQuery}`),
      ]);

      if (reportsRes.data?.success) setReports(reportsRes.data.data || []);
      if (importsRes.data?.success) setImports(importsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeDealership]);

  // Operational metrics
  const totalReports = reports.length;
  const totalRecords = reports.reduce((acc, r) => acc + (r.recordCount || 0), 0);
  const successfulImports = imports.filter((i) => i.status === 'COMPLETED').length;

  // Compute date span across ingested reports
  const datePeriods = reports
    .filter((r) => r.reportDateFrom && r.reportDateTo)
    .map((r) => ({ from: new Date(r.reportDateFrom!), to: new Date(r.reportDateTo!) }))
    .sort((a, b) => b.to.getTime() - a.to.getTime());

  const latestPeriodText =
    datePeriods.length > 0
      ? `${formatDate(datePeriods[0].from)} – ${formatDate(datePeriods[0].to)}`
      : 'Active Ingestion';

  return (
    <AppLayout
      title="Operations Dashboard"
      subtitle="Overview of campaign report ingestion, record validation, and activity"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchModalOpen(true)}
            icon={<Layers className="w-4 h-4 text-slate-700" strokeWidth={1.75} />}
          >
            Batch Upload PDFs
          </Button>
          <Link href="/imports/new">
            <Button size="sm" icon={<UploadCloud className="w-4 h-4" strokeWidth={1.75} />}>
              Upload Single Report
            </Button>
          </Link>
        </div>
      }
    >
      {/* 4 Clean Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ingested Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
              <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalReports}</div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span className="text-emerald-600 font-medium">Live</span>
            <span className="mx-1">·</span>
            <span>Across all campaigns</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Records Managed
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-2xs">
              <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {totalRecords.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Validated &amp; preserved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Latest Service Coverage
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {latestPeriodText}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>{datePeriods.length} distinct report period(s)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Dealership
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shadow-2xs">
              <Building2 className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-2 text-base font-bold text-slate-900 truncate">
            {activeDealership?.name || 'All Dealerships'}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500 font-mono">
            {activeDealership?.code || 'SYSTEM'}
          </div>
        </div>
      </div>

      {/* Recent Reports Table (Full Width) */}
      <div className="w-full bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Campaign Reports</h2>
            <p className="text-xs text-slate-500">
              DealerSocket closed ROs identified by service date range and batch timestamp
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" strokeWidth={1.75} /> Batch Upload
            </button>
            <span className="text-slate-300">·</span>
            <Link href="/reports" className="text-xs font-medium text-slate-700 hover:text-slate-900 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>

        <div className="overflow-auto max-h-[460px] flex-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px] shadow-xs">
                <th className="py-2.5 px-4">Report Details</th>
                <th className="py-2.5 px-4">Service Date Period</th>
                <th className="py-2.5 px-4">Campaign</th>
                <th className="py-2.5 px-4">Records</th>
                <th className="py-2.5 px-4">Uploaded</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No reports uploaded for this dealership yet.
                  </td>
                </tr>
              ) : (
                reports.slice(0, 10).map((r) => {
                  const hasDate = r.reportDateFrom && r.reportDateTo;
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex flex-col gap-0.5">
                          <Link href={`/reports/${r._id}`} className="hover:text-slate-600 font-semibold text-slate-900 flex items-center gap-1.5">
                            <span>{r.name}</span>
                            {r.version && r.version > 1 && (
                              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                v{r.version}
                              </span>
                            )}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                            <span>{r.sourceFileName}</span>
                            <span>·</span>
                            <span className="uppercase">{r.sourceFileType}</span>
                          </div>
                        </div>
                      </td>

                      {/* Prominent Visual Date Badge */}
                      <td className="py-3 px-4">
                        {hasDate ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100/90 text-slate-800 border border-slate-200/90 shadow-2xs font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" strokeWidth={1.75} />
                            {`${formatDate(r.reportDateFrom)} – ${formatDate(r.reportDateTo)}`}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Date Unspecified
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {r.campaignName || '—'}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.recordCount}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.75} />
                          <span>{formatDate(r.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">
                          {r.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/reports/${r._id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Eye className="w-3.5 h-3.5 mr-1" strokeWidth={1.75} /> View
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-slate-600"
                            onClick={() => {
                              downloadAuthenticatedFile({
                                url: `/api/reports/${r._id}/pdf`,
                                filename: `${r.name || 'DealerSocket_Report'}.pdf`,
                                method: 'GET',
                              }).catch((err) => alert('Failed to export PDF: ' + err.message));
                            }}
                          >
                            <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Upload Multi-PDF Modal */}
      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </AppLayout>
  );
}

