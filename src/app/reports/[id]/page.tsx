'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Clock,
  BarChart3,
  ArrowRight,
  Filter,
  ChevronRight,
  X,
  Percent,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { RecordDataGrid } from '@/components/reports/RecordDataGrid';
import dynamic from 'next/dynamic';
const LivePdfViewer = dynamic(() => import('@/components/reports/LivePdfViewer').then((mod) => mod.LivePdfViewer), {
  ssr: false,
  loading: () => (
    <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
      Loading PDF preview engine...
    </div>
  ),
});
import { api } from '@/lib/api';
import { Report, ReportRecord, AuditLog, RevenueLookupResult } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { downloadAuthenticatedFile } from '@/lib/download';

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

  // Individual Report Revenue Lookup State
  const [lookupDateFrom, setLookupDateFrom] = useState('');
  const [lookupDateTo, setLookupDateTo] = useState('');
  const [revenueLookup, setRevenueLookup] = useState<RevenueLookupResult | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [gridDateFrom, setGridDateFrom] = useState('');
  const [gridDateTo, setGridDateTo] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Dynamic Year Presets state
  const [selectedPresetYear, setSelectedPresetYear] = useState<number>(() => new Date().getFullYear());

  // Derive available years from report coverage, records, or upload date
  const reportYears = useMemo(() => {
    const years = new Set<number>();
    if (report?.reportDateFrom) {
      const y = new Date(report.reportDateFrom).getFullYear();
      if (!isNaN(y)) years.add(y);
    }
    if (report?.reportDateTo) {
      const y = new Date(report.reportDateTo).getFullYear();
      if (!isNaN(y)) years.add(y);
    }
    if (revenueLookup?.monthlyBreakdown) {
      revenueLookup.monthlyBreakdown.forEach((m) => {
        if (m.year) years.add(m.year);
      });
    }
    if (report?.createdAt) {
      const y = new Date(report.createdAt).getFullYear();
      if (!isNaN(y)) years.add(y);
    }
    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [report, revenueLookup]);

  useEffect(() => {
    if (reportYears.length > 0 && !reportYears.includes(selectedPresetYear)) {
      setSelectedPresetYear(reportYears[0]);
    }
  }, [reportYears, selectedPresetYear]);

  const handleExportPdf = async () => {
    if (!report) return;
    setIsExportingPdf(true);
    try {
      await downloadAuthenticatedFile({
        url: `/api/reports/${id}/pdf`,
        filename: `${report.name || 'DealerSocket_Report'}.pdf`,
        method: 'GET',
      });
    } catch (err: any) {
      alert('Failed to export PDF: ' + (err.message || 'Please check connection.'));
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    if (!report) return;
    setIsExportingExcel(true);
    try {
      await downloadAuthenticatedFile({
        url: `/api/reports/${id}/export/xlsx`,
        filename: `${report.name || 'DealerSocket_Report'}.xlsx`,
        method: 'GET',
      });
    } catch (err: any) {
      alert('Failed to export Excel: ' + (err.message || 'Please check connection.'));
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'pdf' | 'mappings' | 'audit'>('records');

  const fetchRevenueLookup = async (fromVal?: string, toVal?: string) => {
    setIsLookupLoading(true);
    try {
      const qFrom = fromVal !== undefined ? fromVal : lookupDateFrom;
      const qTo = toVal !== undefined ? toVal : lookupDateTo;
      const params = new URLSearchParams();
      if (qFrom) params.append('dateFrom', qFrom);
      if (qTo) params.append('dateTo', qTo);

      const res = await api.get(`/reports/${id}/revenue-lookup?${params.toString()}`);
      if (res.data?.success) {
        setRevenueLookup(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load revenue lookup', err);
    } finally {
      setIsLookupLoading(false);
    }
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const [reportRes, recordsRes, auditRes, lookupRes] = await Promise.all([
        api.get(`/reports/${id}`),
        api.get(`/reports/${id}/records?limit=100`),
        api.get(`/audit-logs?entityId=${id}`),
        api.get(`/reports/${id}/revenue-lookup`),
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
      if (lookupRes.data?.success) {
        setRevenueLookup(lookupRes.data.data);
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

  const applyDatePreset = (preset: 'entire' | 'year' | 'q1' | 'q2' | 'q3' | 'q4', targetYear = selectedPresetYear) => {
    let f = '';
    let t = '';
    if (preset === 'entire') {
      f = '';
      t = '';
    } else if (preset === 'year') {
      f = `${targetYear}-01-01`;
      t = `${targetYear}-12-31`;
    } else if (preset === 'q1') {
      f = `${targetYear}-01-01`;
      t = `${targetYear}-03-31`;
    } else if (preset === 'q2') {
      f = `${targetYear}-04-01`;
      t = `${targetYear}-06-30`;
    } else if (preset === 'q3') {
      f = `${targetYear}-07-01`;
      t = `${targetYear}-09-30`;
    } else if (preset === 'q4') {
      f = `${targetYear}-10-01`;
      t = `${targetYear}-12-31`;
    }
    setLookupDateFrom(f);
    setLookupDateTo(t);
    fetchRevenueLookup(f, t);
  };

  const handleApplySingleMonth = (monthStr: string) => {
    // monthStr is "YYYY-MM"
    const [y, m] = monthStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    const f = `${y}-${String(m).padStart(2, '0')}-01`;
    const t = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    setLookupDateFrom(f);
    setLookupDateTo(t);
    fetchRevenueLookup(f, t);
  };

  const handleViewRecordsInGrid = (fromVal?: string, toVal?: string) => {
    const f = fromVal !== undefined ? fromVal : lookupDateFrom;
    const t = toVal !== undefined ? toVal : lookupDateTo;
    setGridDateFrom(f);
    setGridDateTo(t);
    setActiveTab('records');
  };

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

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                {dealershipName}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" strokeWidth={1.75} />
                {report.reportDateFrom && report.reportDateTo
                  ? `${formatDate(report.reportDateFrom)} – ${formatDate(report.reportDateTo)}`
                  : 'Date Unspecified'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.75} />
                Uploaded {formatDate(report.createdAt)}
              </span>
              <span>·</span>
              <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                {report.recordCount} records
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              isLoading={isExportingPdf}
              onClick={handleExportPdf}
              icon={<Download className="w-3.5 h-3.5" strokeWidth={1.75} />}
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              isLoading={isExportingExcel}
              onClick={handleExportExcel}
              icon={<FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.75} />}
            >
              Export Excel
            </Button>
          </div>
        </div>

        {/* 5 Tab Navigation Bar */}
        <div className="flex border-b border-slate-200 bg-white rounded-t-lg px-2 sm:px-4 text-xs font-medium overflow-x-auto scrollbar-thin">
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
              className={`py-3 px-4 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
            {/* Summary Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>

            {/* Individual Report Revenue Lookup & Date Filter Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="bg-slate-50/70 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Individual Report Revenue Lookup</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Date Range Filter
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Filter by date to calculate exact RO revenue and repair order volume in this report
                    </p>
                  </div>
                </div>

                {revenueLookup && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs"
                    onClick={() => handleViewRecordsInGrid()}
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    View {revenueLookup.filteredCount} Records in Grid
                  </Button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Date Filter Controls */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-slate-700">From Date:</span>
                    <input
                      type="date"
                      value={lookupDateFrom}
                      onChange={(e) => {
                        setLookupDateFrom(e.target.value);
                        fetchRevenueLookup(e.target.value, lookupDateTo);
                      }}
                      className="px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-800 shadow-2xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    <span className="font-semibold text-slate-700 ml-1">To Date:</span>
                    <input
                      type="date"
                      value={lookupDateTo}
                      onChange={(e) => {
                        setLookupDateTo(e.target.value);
                        fetchRevenueLookup(lookupDateFrom, e.target.value);
                      }}
                      className="px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-800 shadow-2xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    {(lookupDateFrom || lookupDateTo) && (
                      <button
                        onClick={() => applyDatePreset('entire')}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        title="Clear Date Filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto text-xs">
                    <span className="text-slate-400 text-[11px] font-medium mr-1">Presets:</span>
                    <button
                      onClick={() => applyDatePreset('entire')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        !lookupDateFrom && !lookupDateTo
                          ? 'bg-slate-900 text-white font-semibold shadow-xs border border-slate-900'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Entire Period
                    </button>

                    {/* Year dropdown if report touches multiple years */}
                    {reportYears.length > 1 && (
                      <select
                        value={selectedPresetYear}
                        onChange={(e) => {
                          const y = Number(e.target.value);
                          setSelectedPresetYear(y);
                          applyDatePreset('year', y);
                        }}
                        className="bg-white border border-slate-200 text-slate-700 text-[11px] font-semibold rounded px-1.5 py-0.5 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        {reportYears.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={() => applyDatePreset('year', selectedPresetYear)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        lookupDateFrom === `${selectedPresetYear}-01-01` && lookupDateTo === `${selectedPresetYear}-12-31`
                          ? 'bg-slate-900 text-white font-semibold shadow-xs border border-slate-900'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Year {selectedPresetYear}
                    </button>
                    <button
                      onClick={() => applyDatePreset('q1', selectedPresetYear)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        lookupDateFrom === `${selectedPresetYear}-01-01` && lookupDateTo === `${selectedPresetYear}-03-31`
                          ? 'bg-slate-900 text-white font-semibold shadow-xs border border-slate-900'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Q1 {selectedPresetYear}
                    </button>
                    <button
                      onClick={() => applyDatePreset('q2', selectedPresetYear)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        lookupDateFrom === `${selectedPresetYear}-04-01` && lookupDateTo === `${selectedPresetYear}-06-30`
                          ? 'bg-slate-900 text-white font-semibold shadow-xs border border-slate-900'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Q2 {selectedPresetYear}
                    </button>
                    <button
                      onClick={() => applyDatePreset('q3', selectedPresetYear)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        lookupDateFrom === `${selectedPresetYear}-07-01` && lookupDateTo === `${selectedPresetYear}-09-30`
                          ? 'bg-slate-900 text-white font-semibold shadow-xs border border-slate-900'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Q3 {selectedPresetYear}
                    </button>
                    <button
                      onClick={() => applyDatePreset('q4', selectedPresetYear)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        lookupDateFrom === `${selectedPresetYear}-10-01` && lookupDateTo === `${selectedPresetYear}-12-31`
                          ? 'bg-slate-900 text-white font-semibold shadow-xs border border-slate-900'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Q4 {selectedPresetYear}
                    </button>
                  </div>
                </div>

                {/* Lookup Metrics Display */}
                {revenueLookup && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* Filtered Revenue Card */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Period Tracked Revenue
                      </span>
                      <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                        {formatCurrency(revenueLookup.filteredRevenue)}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>Share of Total:</span>
                        <strong className="font-semibold text-slate-900">{revenueLookup.percentageOfTotal}%</strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, revenueLookup.percentageOfTotal)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Report Total: {formatCurrency(revenueLookup.totalRevenue)}
                      </span>
                    </div>

                    {/* Filtered Orders Card */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Closed Repair Orders (ROs)
                      </span>
                      <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                        {revenueLookup.filteredCount}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>Share of Records:</span>
                        <strong className="font-semibold text-slate-900">
                          {revenueLookup.totalRecords > 0
                            ? Math.round((revenueLookup.filteredCount / revenueLookup.totalRecords) * 1000) / 10
                            : 0}
                          %
                        </strong>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-slate-900 h-1.5 rounded-full"
                          style={{
                            width: `${
                              revenueLookup.totalRecords > 0
                                ? Math.min(100, (revenueLookup.filteredCount / revenueLookup.totalRecords) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Total Report Rows: {revenueLookup.totalRecords}
                      </span>
                    </div>

                    {/* Period Average RO Card */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Period Average RO Amount
                      </span>
                      <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                        {formatCurrency(revenueLookup.filteredAvgRoAmount)}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                        <span>Overall Report Avg:</span>
                        <strong className="font-semibold text-slate-900">{formatCurrency(revenueLookup.overallAvgRo)}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                        <span>RO Range:</span>
                        <span className="font-mono font-medium text-slate-800">
                          {formatCurrency(revenueLookup.minRoAmount)} – {formatCurrency(revenueLookup.maxRoAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Revenue & RO Breakdown */}
            {revenueLookup?.monthlyBreakdown && revenueLookup.monthlyBreakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-slate-700" />
                      <span>Monthly Revenue Distribution</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Breakdown of Closed RO revenue and order counts month-by-month in this report
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/70">
                    {revenueLookup.monthlyBreakdown.length} Active Months
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                        <th className="py-2.5 px-4">Month</th>
                        <th className="py-2.5 px-4 text-right">Closed ROs</th>
                        <th className="py-2.5 px-4 text-right">Revenue Tracked</th>
                        <th className="py-2.5 px-4 text-right">Avg RO</th>
                        <th className="py-2.5 px-4 w-48">Share of Report Revenue</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {revenueLookup.monthlyBreakdown.map((m) => {
                        const pct =
                          revenueLookup.totalRevenue > 0
                            ? Math.round((m.revenue / revenueLookup.totalRevenue) * 1000) / 10
                            : 0;
                        return (
                          <tr key={m.month} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-4 font-semibold text-slate-800">
                              {m.label}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                              {m.count}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold font-mono text-slate-900">
                              {formatCurrency(m.revenue)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                              {formatCurrency(m.avgRo)}
                            </td>
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-slate-900 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-slate-500 w-10 text-right">
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleApplySingleMonth(m.month)}
                                className="px-2 py-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                              >
                                Filter Month
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
          <RecordDataGrid
            reportId={report._id}
            initialDateFrom={gridDateFrom}
            initialDateTo={gridDateTo}
          />
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
