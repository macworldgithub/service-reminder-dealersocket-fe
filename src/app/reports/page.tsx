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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { Report } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function ReportsPage() {
  const { activeDealership, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.data?.success) {
        setReports(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeDealership, searchTerm, statusFilter]);

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

  return (
    <AppLayout
      title="Campaign Reports"
      subtitle="Ingested DealerSocket reports and service RO batches"
      actions={
        <Link href="/imports/new">
          <Button icon={<UploadCloud className="w-4 h-4" />}>
            Upload Report
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports or campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="IMPORTED">Imported</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Reports Data Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Report Name</th>
                  <th className="py-3 px-4">Dealership</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Report Period</th>
                  <th className="py-3 px-4">Records</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded At</th>
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
                      <p className="text-xs text-slate-400 mt-0.5">Upload a DealerSocket report to get started</p>
                      <Link href="/imports/new" className="mt-3 inline-block">
                        <Button size="sm">Upload Report</Button>
                      </Link>
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <Link href={`/reports/${r._id}`} className="hover:text-blue-600 font-semibold flex items-center gap-1.5">
                          {r.name}
                        </Link>
                        <div className="text-[11px] text-slate-400 font-normal font-mono">
                          {r.sourceFileName}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {typeof r.dealershipId === 'object' ? (r.dealershipId as any)?.name : 'Dealership'}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {r.campaignName || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.reportDateFrom && r.reportDateTo
                          ? `${formatDate(r.reportDateFrom)} - ${formatDate(r.reportDateTo)}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.recordCount}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" size="sm">
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/reports/${r._id}`}>
                            <Button variant="outline" size="sm" className="h-7 px-2">
                              <Eye className="w-3.5 h-3.5 mr-1" /> View
                            </Button>
                          </Link>
                          <a href={`/api/reports/${r._id}/pdf`} target="_blank" rel="noreferrer" title="Download PDF">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-slate-600">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <button
                            onClick={() => {
                              setEditingReport(r);
                              setEditName(r.name);
                              setEditCampaign(r.campaignName || '');
                            }}
                            title="Edit metadata"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(r._id)}
                            title="Duplicate report"
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button
                              onClick={() => setDeletingReport(r)}
                              title="Delete report"
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <Modal
        isOpen={!!editingReport}
        onClose={() => setEditingReport(null)}
        title="Edit Report Metadata"
        description="Update report title and associated campaign identifier"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Report Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={editCampaign}
              onChange={(e) => setEditCampaign(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setEditingReport(null)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={handleUpdateMetadata}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingReport}
        onClose={() => setDeletingReport(null)}
        title="Confirm Report Deletion"
        description="Destructive action: this will permanently remove this report and its imported records."
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Are you sure you want to delete <strong className="text-slate-900">{deletingReport?.name}</strong> containing{' '}
            <strong>{deletingReport?.recordCount}</strong> records? This action will be logged in the audit trail.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setDeletingReport(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={handleDeleteReport}>
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
