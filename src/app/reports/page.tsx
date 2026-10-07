'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  UploadCloud,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  Edit2,
  Eye,
  Building2,
  Calendar,
  Layers,
  Clock,
  X,
  Sparkles,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { BatchUploadModal } from '@/components/common/BatchUploadModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { Report } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ReportsPage() {
  const { activeDealership, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [totalTrackedRevenue, setTotalTrackedRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');

  // Batch upload modal state
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Edit metadata modal
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editName, setEditName] = useState('');
  const [editCampaign, setEditCampaign] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation modal
  const [deletingReport, setDeletingReport] = useState<Report | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeDealership) params.append('dealershipId', activeDealership._id);
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (dateFromFilter) params.append('dateFrom', dateFromFilter);
      if (dateToFilter) params.append('dateTo', dateToFilter);

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.data?.success) {
        setReports(res.data.data || []);
        if (res.data.meta?.totalTrackedRevenue !== undefined) {
          setTotalTrackedRevenue(res.data.meta.totalTrackedRevenue);
        }
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeDealership, searchTerm, statusFilter, dateFromFilter, dateToFilter]);

  const handleUpdateMetadata = async () => {
    if (!editingReport) return;
    setIsSaving(true);
    try {
      await api.patch(`/reports/${editingReport._id}`, {
        name: editName,
        campaignName: editCampaign,
      });
      setEditingReport(null);
      fetchReports();
    } catch (err) {
      console.error('Update failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!deletingReport) return;
    setIsDeleting(true);
    try {
      await api.delete(`/reports/${deletingReport._id}`);
      setDeletingReport(null);
      fetchReports();
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await api.post(`/reports/${id}/duplicate`);
      fetchReports();
    } catch (err) {
      console.error('Duplicate failed', err);
    }
  };

  const handleQuickDatePreset = (
    preset: 'all' | '2025' | '2026' | 'q1_2025' | 'q2_2025' | 'q3_2025' | 'q4_2025'
  ) => {
    if (preset === 'all') {
      setDateFromFilter('');
      setDateToFilter('');
    } else if (preset === '2025') {
      setDateFromFilter('2025-01-01');
      setDateToFilter('2025-12-31');
    } else if (preset === '2026') {
      setDateFromFilter('2026-01-01');
      setDateToFilter('2026-12-31');
    } else if (preset === 'q1_2025') {
      setDateFromFilter('2025-01-01');
      setDateToFilter('2025-03-31');
    } else if (preset === 'q2_2025') {
      setDateFromFilter('2025-04-01');
      setDateToFilter('2025-06-30');
    } else if (preset === 'q3_2025') {
      setDateFromFilter('2025-07-01');
      setDateToFilter('2025-09-30');
    } else if (preset === 'q4_2025') {
      setDateFromFilter('2025-10-01');
      setDateToFilter('2025-12-31');
    }
  };

  return (
    <AppLayout
      title="Campaign Reports"
      subtitle="Ingested DealerSocket reports and service RO batches distinguished by coverage period"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBatchModalOpen(true)}
            icon={<Layers className="w-4 h-4 text-blue-600" />}
          >
            Batch Upload PDFs
          </Button>
          <Link href="/imports/new">
            <Button size="sm" icon={<UploadCloud className="w-4 h-4" />}>
              Upload Single Report
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search report title, file, or campaign..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Date Range Inputs */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-slate-600 font-medium">From:</span>
                <input
                  type="date"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                  className="px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white text-slate-800"
                />
                <span className="text-slate-600 font-medium ml-1">To:</span>
                <input
                  type="date"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                  className="px-1.5 py-0.5 border border-slate-300 rounded text-xs bg-white text-slate-800"
                />
                {(dateFromFilter || dateToFilter) && (
                  <button
                    onClick={() => handleQuickDatePreset('all')}
                    className="p-1 text-slate-400 hover:text-rose-600 ml-1"
                    title="Clear Date Filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 font-medium"
              >
                <option value="">All Statuses</option>
                <option value="IMPORTED">Imported</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          {/* Quick Date Range Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-medium text-[11px] mr-1">Quick Date Presets:</span>
            <button
              onClick={() => handleQuickDatePreset('all')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                !dateFromFilter && !dateToFilter
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleQuickDatePreset('2025')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                dateFromFilter === '2025-01-01' && dateToFilter === '2025-12-31'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Year 2025
            </button>
            <button
              onClick={() => handleQuickDatePreset('2026')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                dateFromFilter === '2026-01-01' && dateToFilter === '2026-12-31'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Year 2026
            </button>
            <button
              onClick={() => handleQuickDatePreset('q1_2025')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                dateFromFilter === '2025-01-01' && dateToFilter === '2025-03-31'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Q1 2025
            </button>
            <button
              onClick={() => handleQuickDatePreset('q2_2025')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                dateFromFilter === '2025-04-01' && dateToFilter === '2025-06-30'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Q2 2025
            </button>
            <button
              onClick={() => handleQuickDatePreset('q3_2025')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                dateFromFilter === '2025-07-01' && dateToFilter === '2025-09-30'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Q3 2025
            </button>
            <button
              onClick={() => handleQuickDatePreset('q4_2025')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                dateFromFilter === '2025-10-01' && dateToFilter === '2025-12-31'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Q4 2025
            </button>
          </div>
        </div>

        {/* Aggregate Revenue & Batch Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase">Filtered Reports</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">{reports.length} Reports</div>
            </div>
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              {reports.length}
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-emerald-200 bg-emerald-50/20 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase">Total Tracked Revenue</span>
              <div className="text-lg font-black text-emerald-700 font-mono mt-0.5">
                {formatCurrency(totalTrackedRevenue)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase">Total Repair Order Rows</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {reports.reduce((acc, r) => acc + (r.recordCount || 0), 0).toLocaleString()} Records
              </div>
            </div>
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Reports Data Table with Scroller */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-auto max-h-[620px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-xs">
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Report &amp; Source Document</th>
                  <th className="py-3 px-4">Service Coverage Period</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4 text-right">Tracked Revenue</th>
                  <th className="py-3 px-4 text-right">Records</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Loading reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center">
                      <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <div className="text-sm font-medium text-slate-700">No reports found</div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Upload single reports or use Batch Upload to process multiple PDFs together
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Button size="sm" onClick={() => setIsBatchModalOpen(true)} icon={<Layers className="w-3.5 h-3.5" />}>
                          Batch Upload PDFs
                        </Button>
                        <Link href="/imports/new">
                          <Button variant="outline" size="sm">
                            Single Upload
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => {
                    const hasPeriod = r.reportDateFrom && r.reportDateTo;
                    return (
                      <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex flex-col gap-0.5">
                            <Link
                              href={`/reports/${r._id}`}
                              className="hover:text-blue-600 font-semibold text-slate-900 flex items-center gap-1.5"
                            >
                              <span>{r.name}</span>
                              {r.version && r.version > 1 && (
                                <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  v{r.version}
                                </span>
                              )}
                            </Link>
                            <div className="text-[11px] text-slate-400 font-normal font-mono flex items-center gap-1.5">
                              <span>{r.sourceFileName}</span>
                              <span>·</span>
                              <span className="uppercase">{r.sourceFileType}</span>
                            </div>
                          </div>
                        </td>

                        {/* Prominent Visual Date Badge */}
                        <td className="py-3 px-4">
                          {hasPeriod ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
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

                        {/* Tracked Revenue Column */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            {formatCurrency(r.totalRevenue || 0)}
                          </div>
                          {r.avgRoAmount ? (
                            <div className="text-[11px] text-slate-400 font-mono">
                              avg {formatCurrency(r.avgRoAmount)}
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900 text-right">
                          {r.recordCount.toLocaleString()}
                        </td>

                        <td className="py-3 px-4 text-slate-500">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
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
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                            </Link>

                            <a href={`/api/reports/${r._id}/pdf`} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-600" title="Export PDF">
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                            </a>

                            <button
                              onClick={() => {
                                setEditingReport(r);
                                setEditName(r.name);
                                setEditCampaign(r.campaignName || '');
                              }}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Edit metadata"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicate(r._id)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Duplicate as new version"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingReport(r)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Delete report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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
      </div>

      {/* Batch Upload Modal */}
      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={fetchReports}
      />

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={!!editingReport}
        onClose={() => setEditingReport(null)}
        title="Edit Report Details"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={editCampaign}
              onChange={(e) => setEditCampaign(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setEditingReport(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleUpdateMetadata} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingReport}
        onClose={() => setDeletingReport(null)}
        title="Delete Report"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Are you sure you want to delete <strong>{deletingReport?.name}</strong>? This will permanently
            remove the report and all {deletingReport?.recordCount} associated closed RO records.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeletingReport(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteReport}
              isLoading={isDeleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
