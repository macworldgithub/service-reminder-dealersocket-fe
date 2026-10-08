'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  History,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  RotateCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { ImportSession } from '@/lib/types';
import { formatDate, formatFileSize } from '@/lib/utils';

export default function ImportsHistoryPage() {
  const { activeDealership } = useAuth();
  const [imports, setImports] = useState<ImportSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectingImport, setInspectingImport] = useState<ImportSession | null>(null);

  const fetchImports = async () => {
    setIsLoading(true);
    try {
      const dealershipParam = activeDealership ? `?dealershipId=${activeDealership._id}` : '';
      const res = await api.get(`/imports${dealershipParam}`);
      if (res.data?.success) {
        setImports(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load imports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [activeDealership]);

  return (
    <AppLayout
      title="Ingestion History"
      subtitle="Audit log of DealerSocket file upload batches and parsing validation"
      actions={
        <Link href="/imports/new">
          <Button icon={<UploadCloud className="w-4 h-4" />}>
            New Report Import
          </Button>
        </Link>
      }
    >
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Source File</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Rows Detected</th>
                <th className="py-3 px-4">Imported</th>
                <th className="py-3 px-4">Failed / Skipped</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading ingestion batches...
                  </td>
                </tr>
              ) : imports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No import batches found.
                  </td>
                </tr>
              ) : (
                imports.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {item.fileName}
                    </td>
                    <td className="py-3 px-4 uppercase font-mono text-slate-600">
                      {item.fileType}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatFileSize(item.fileSize)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {item.totalRows}
                    </td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">
                      {item.successfulRows}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.failedRows}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={item.status === 'COMPLETED' ? 'success' : item.status === 'FAILED' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setInspectingImport(item)}
                          className="h-7 text-xs"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                        </Button>
                        {typeof item.reportId === 'object' && item.reportId && (
                          <Link href={`/reports/${(item.reportId as any)._id}`}>
                            <Button size="sm" className="h-7 text-xs">
                              Report
                            </Button>
                          </Link>
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

      {/* Inspect Errors & Headers Modal */}
      <Modal
        isOpen={!!inspectingImport}
        onClose={() => setInspectingImport(null)}
        title={`Import Details: ${inspectingImport?.fileName}`}
        description="Detected column headers and row-level validation log"
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Detected File Headers:
            </h4>
            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded border border-slate-200">
              {inspectingImport?.detectedHeaders?.map((h, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium font-mono text-[11px]">
                  {h}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Validation Errors &amp; Warnings:
            </h4>
            {inspectingImport?.validationErrors && inspectingImport.validationErrors.length > 0 ? (
              <div className="border border-slate-200 rounded max-h-48 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="py-1.5 px-3">Row</th>
                      <th className="py-1.5 px-3">Field</th>
                      <th className="py-1.5 px-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspectingImport.validationErrors.map((err, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 font-mono text-slate-500">{err.row}</td>
                        <td className="py-1.5 px-3 font-medium text-slate-800">{err.field}</td>
                        <td className="py-1.5 px-3 text-rose-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.75} />
                <span>All rows passed schema validation with 0 fatal errors.</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" size="sm" onClick={() => setInspectingImport(null)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
