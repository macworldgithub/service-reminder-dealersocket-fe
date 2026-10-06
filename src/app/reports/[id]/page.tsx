'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  History,
  Table,
  Sliders,
  FileText,
  Copy,
  Trash2,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { RecordDataGrid } from '@/components/reports/RecordDataGrid';
import { LivePdfViewer } from '@/components/reports/LivePdfViewer';
import { api } from '@/lib/api';
import { Report, ReportRecord, AuditLog } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ReportDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'pdf' | 'mappings' | 'audit'>('records');

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [reportRes, recordsRes, auditRes] = await Promise.all([
        api.get(`/reports/${id}`),
        api.get(`/reports/${id}/records?limit=100`),
        api.get(`/audit-logs?entityId=${id}`),
      ]);

      if (reportRes.data?.success) {
        setReport(reportRes.data.data.report);
        setVersions(reportRes.data.data.versions || []);
        setStats(reportRes.data.data.stats || null);
      }
      if (recordsRes.data?.success) {
        setRecords(recordsRes.data.data || []);
      }
      if (auditRes.data?.success) {
        setAuditLogs(auditRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load report detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReportData();
  }, [id]);

  if (isLoading || !report) {
    return (
      <AppLayout title="Loading Report...">
        <div className="py-20 text-center text-xs text-slate-400">
          Loading report details and operational records...
        </div>
      </AppLayout>
    );
  }

  const dealershipName =
    typeof report.dealershipId === 'object' ? (report.dealershipId as any).name : 'Dealership';

  return (
    <AppLayout
      breadcrumbs={[
        { label: 'Reports', href: '/reports' },
        { label: report.name },
      ]}
    >
      <div className="space-y-5">
        {/* Top Header Card matching Section 9 requirement */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{report.name}</h1>
              <Badge variant="success" size="sm">
                {report.status}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                {dealershipName}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {report.reportDateFrom && report.reportDateTo
                  ? `${formatDate(report.reportDateFrom)} - ${formatDate(report.reportDateTo)}`
                  : '9/28/2026 - 10/5/2026'}
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-900">
                {report.recordCount} records
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <a href={`/api/reports/${id}/pdf`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                Export PDF
              </Button>
            </a>
            <a href={`/api/reports/${id}/export/xlsx`} download>
              <Button variant="outline" size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
                Export Excel
              </Button>
            </a>
          </div>
        </div>

        {/* 5 Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-4 text-xs font-medium">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'records', label: `Records (${report.recordCount})` },
            { key: 'pdf', label: 'Live PDF Document & Template' },
            { key: 'mappings', label: 'Column Mapping' },
            { key: 'audit', label: `Audit Log (${auditLogs.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-3 px-4 border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 uppercase font-medium">Total Revenue Tracked</span>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatCurrency(stats?.totalRoRevenue || 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Sum of all Closed RO Amounts</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 uppercase font-medium">Average RO Amount</span>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatCurrency(stats?.avgRoAmount || 0)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Average repair order spend</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 uppercase font-medium">Validated Clean Records</span>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {stats?.validRecords || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Passing all business rules</div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-xs text-slate-500 uppercase font-medium">Warnings / Flags</span>
                <div className="text-xl font-bold text-amber-600 mt-1">
                  {stats?.warningRecords || 0}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Potential duplicate/date checks</div>
              </div>
            </div>

            {/* Source Ingestion Summary */}
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
              <h2 className="text-sm font-semibold text-slate-900 mb-1">Source Ingestion Summary</h2>
              <p className="text-xs text-slate-500 mb-3">
                File and batch metadata recorded during DealerSocket report ingestion.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Original File</span>
                  <span className="font-semibold text-slate-800">{report.sourceFileName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Format Type</span>
                  <span className="font-semibold text-slate-800 uppercase">{report.sourceFileType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ingested On</span>
                  <span className="font-semibold text-slate-800">{formatDate(report.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Rows Loaded</span>
                  <span className="font-semibold text-slate-800">{report.recordCount} rows</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RECORDS DATA GRID */}
        {activeTab === 'records' && (
          <RecordDataGrid reportId={report._id} />
        )}

        {/* TAB 3: LIVE PDF VIEWER & TEMPLATE CUSTOMIZER */}
        {activeTab === 'pdf' && (
          <LivePdfViewer report={report} records={records} />
        )}

        {/* TAB 4: COLUMN MAPPINGS */}
        {activeTab === 'mappings' && (
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Ingested Column Mappings</h2>
              <p className="text-xs text-slate-500">
                DealerSocket source headers mapped to internal database properties for this report
              </p>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold text-[11px] uppercase">
                    <th className="py-2.5 px-4">DealerSocket Source Column</th>
                    <th className="py-2.5 px-4">Internal Field</th>
                    <th className="py-2.5 px-4">Data Type</th>
                    <th className="py-2.5 px-4">Transformation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.columnMappings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{m.sourceColumn}</td>
                      <td className="py-2.5 px-4 font-mono text-blue-600">{m.targetField}</td>
                      <td className="py-2.5 px-4 capitalize">{m.dataType}</td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {m.transformation || 'none'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Report Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Immutable change tracking and operational events for this report and records
              </p>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No modifications logged yet.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log._id} className="p-3 rounded-md border border-slate-200 bg-slate-50/50 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-900 font-semibold">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      User: {typeof log.userId === 'object' ? (log.userId as any)?.name : 'System User'}
                    </div>
                    {log.before && log.after && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] bg-white p-2 rounded border border-slate-200">
                        <div>
                          <strong className="text-rose-600 block">Before:</strong>
                          <pre className="text-[10px] text-slate-600 overflow-x-auto">
                            {JSON.stringify(log.before, null, 1)}
                          </pre>
                        </div>
                        <div>
                          <strong className="text-emerald-600 block">After:</strong>
                          <pre className="text-[10px] text-slate-600 overflow-x-auto">
                            {JSON.stringify(log.after, null, 1)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
