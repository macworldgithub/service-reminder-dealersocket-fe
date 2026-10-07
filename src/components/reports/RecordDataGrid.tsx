'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  Mail,
  DollarSign,
} from 'lucide-react';
import { ReportRecord } from '@/lib/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { RecordDrawer } from './RecordDrawer';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface RecordDataGridProps {
  reportId: string;
  initialDateFrom?: string;
  initialDateTo?: string;
}

export const RecordDataGrid: React.FC<RecordDataGridProps> = ({
  reportId,
  initialDateFrom = '',
  initialDateTo = '',
}) => {
  const [records, setRecords] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [filteredRevenue, setFilteredRevenue] = useState<number | null>(null);
  const [filteredAvgRo, setFilteredAvgRo] = useState<number | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);

  // Update dates if initial props change
  useEffect(() => {
    if (initialDateFrom) setDateFrom(initialDateFrom);
    if (initialDateTo) setDateTo(initialDateTo);
  }, [initialDateFrom, initialDateTo]);

  // Selected rows
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Row Drawer
  const [selectedRecord, setSelectedRecord] = useState<ReportRecord | null>(null);

  // Add Record Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newEntityId, setNewEntityId] = useState('');
  const [newEventNumber, setNewEventNumber] = useState('');
  const [newYear, setNewYear] = useState('2023');
  const [newModel, setNewModel] = useState('Hyundai Tucson');
  const [newRoAmount, setNewRoAmount] = useState('350.00');
  const [newCloseDate, setNewCloseDate] = useState('2026-10-01');
  const [isCreating, setIsCreating] = useState(false);

  // Inline editing state
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [inlineValues, setInlineValues] = useState<Record<string, any>>({});

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    entityId: true,
    customer: true,
    email: true,
    vehicle: true,
    campaign: true,
    eventNumber: true,
    closeDate: true,
    roAmount: true,
    status: true,
  });
  const [showColMenu, setShowColMenu] = useState(false);

  // Load saved column visibility on mount & listen to changes from Live Area
  useEffect(() => {
    const applySync = () => {
      try {
        const recordSaved = localStorage.getItem(`dealersocket_record_columns_${reportId}`);
        if (recordSaved) {
          setVisibleColumns(JSON.parse(recordSaved));
          return;
        }

        const pdfSaved = localStorage.getItem(`dealersocket_pdf_columns_${reportId}`);
        if (pdfSaved) {
          const pdfCols: Array<{ key: string; visible: boolean }> = JSON.parse(pdfSaved);
          if (Array.isArray(pdfCols)) {
            const activeKeys = new Set(pdfCols.filter((c) => c.visible).map((c) => c.key));
            setVisibleColumns({
              entityId: activeKeys.has('externalEntityId'),
              customer: activeKeys.has('customerName'),
              email: activeKeys.has('customerEmail') || activeKeys.has('email'),
              vehicle: Array.from(activeKeys).some((k) => k.startsWith('vehicle')),
              campaign: activeKeys.has('campaignName'),
              eventNumber: activeKeys.has('eventNumber'),
              closeDate: activeKeys.has('closeDate'),
              roAmount: activeKeys.has('roAmount'),
              status: true,
            });
          }
        }
      } catch (e) {}
    };

    applySync();

    const handleUpdate = (e: any) => {
      if (e.detail) {
        setVisibleColumns(e.detail);
      } else {
        applySync();
      }
    };

    window.addEventListener('columns-updated', handleUpdate);
    return () => window.removeEventListener('columns-updated', handleUpdate);
  }, [reportId]);

  const toggleColumnVisibility = (col: string, isVis: boolean) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [col]: isVis };
      try {
        localStorage.setItem(`dealersocket_record_columns_${reportId}`, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (search) params.append('search', search);
      if (statusFilter) params.append('recordStatus', statusFilter);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const res = await api.get(`/reports/${reportId}/records?${params.toString()}`);
      if (res.data?.success) {
        setRecords(res.data.data || []);
        if (res.data.meta) {
          setTotalCount(res.data.meta.total);
          setTotalPages(res.data.meta.totalPages);
          if (res.data.meta.filteredRevenue !== undefined) {
            setFilteredRevenue(res.data.meta.filteredRevenue);
            setFilteredAvgRo(res.data.meta.filteredAvgRo);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load records', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [reportId, page, limit, search, statusFilter, sortBy, sortOrder, dateFrom, dateTo]);

  // Bulk actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(records.map((r) => r._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} records?`)) return;

    try {
      await api.post(`/reports/${reportId}/records/bulk-delete`, { recordIds: selectedIds });
      setSelectedIds([]);
      fetchRecords();
    } catch (err) {
      console.error('Bulk delete failed', err);
    }
  };

  const handleBulkStatus = async (status: 'VALID' | 'WARNING' | 'ERROR') => {
    if (selectedIds.length === 0) return;
    try {
      await api.post(`/reports/${reportId}/records/bulk-status`, {
        recordIds: selectedIds,
        status,
      });
      setSelectedIds([]);
      fetchRecords();
    } catch (err) {
      console.error('Bulk status failed', err);
    }
  };

  // Inline editing save
  const handleStartInlineEdit = (rec: ReportRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRowId(rec._id);
    setInlineValues({
      customerName: rec.customerName || '',
      customerEmail: rec.customerEmail || rec.customFields?.email || '',
      externalEntityId: rec.externalEntityId || '',
      eventNumber: rec.eventNumber || '',
      roAmount: rec.roAmount !== undefined ? String(rec.roAmount) : '',
    });
  };

  const handleSaveInlineEdit = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/reports/${reportId}/records/${id}`, {
        customerName: inlineValues.customerName,
        customerEmail: inlineValues.customerEmail,
        externalEntityId: inlineValues.externalEntityId,
        eventNumber: inlineValues.eventNumber,
        roAmount: inlineValues.roAmount ? parseFloat(inlineValues.roAmount) : undefined,
      });
      setEditingRowId(null);
      fetchRecords();
    } catch (err) {
      console.error('Inline edit save failed', err);
    }
  };

  const handleCreateRecord = async () => {
    setIsCreating(true);
    try {
      await api.post(`/reports/${reportId}/records`, {
        customerName: newCustomerName,
        customerEmail: newCustomerEmail || undefined,
        externalEntityId: newEntityId,
        eventNumber: newEventNumber,
        vehicle: {
          year: parseInt(newYear, 10),
          model: newModel,
          make: 'Hyundai',
        },
        roAmount: parseFloat(newRoAmount),
        closeDate: new Date(newCloseDate),
        recordStatus: 'VALID',
      });
      setIsAddModalOpen(false);
      setNewCustomerName('');
      setNewCustomerEmail('');
      setNewEntityId('');
      fetchRecords();
    } catch (err) {
      console.error('Create record failed', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Action Toolbar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search customer, entity ID, event#..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="VALID">Valid</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1 bg-white text-xs">
            <span className="text-slate-500 font-medium text-[11px]">Date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-transparent focus:outline-none text-slate-800"
              title="Close Date From"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="text-xs bg-transparent focus:outline-none text-slate-800"
              title="Close Date To"
            />
            {(dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
                className="text-slate-400 hover:text-rose-600 text-xs ml-1 font-bold"
                title="Reset date filter"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtered Revenue Display */}
          {filteredRevenue !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 shadow-2xs font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Filtered RO: <strong>{formatCurrency(filteredRevenue)}</strong>
              </span>
              {filteredAvgRo !== null && filteredAvgRo > 0 && (
                <span className="text-emerald-700 font-mono text-[11px]">
                  (avg {formatCurrency(filteredAvgRo)})
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-xs">
              <span className="font-semibold text-blue-700">{selectedIds.length} selected</span>
              <button
                onClick={() => handleBulkStatus('VALID')}
                className="text-blue-600 hover:underline font-medium text-[11px] ml-1"
              >
                Mark Valid
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-rose-600 hover:underline font-medium text-[11px] ml-1"
              >
                Delete
              </button>
            </div>
          )}

          {/* Column Visibility Selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColMenu(!showColMenu)}
              icon={<SlidersHorizontal className="w-3.5 h-3.5" />}
            >
              Columns
            </Button>
            {showColMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg p-2.5 z-30 text-xs space-y-1.5">
                <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider mb-1">
                  Toggle Columns
                </span>
                {Object.entries(visibleColumns).map(([col, isVis]) => (
                  <label key={col} className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isVis}
                      onChange={() => toggleColumnVisibility(col, !isVis)}
                      className="rounded text-blue-600"
                    />
                    <span className="capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <a href={`/api/reports/${reportId}/export/csv`} download>
            <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
              CSV
            </Button>
          </a>
          <a href={`/api/reports/${reportId}/export/xlsx`} download>
            <Button variant="outline" size="sm" icon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
              Excel
            </Button>
          </a>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Add Record
          </Button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-auto max-h-[580px] relative divide-y divide-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-20 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px] tracking-wider select-none shadow-xs">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={records.length > 0 && selectedIds.length === records.length}
                    className="rounded text-blue-600"
                  />
                </th>
                {visibleColumns.entityId && (
                  <th
                    onClick={() => {
                      setSortBy('externalEntityId');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10 cursor-pointer hover:bg-slate-200/60"
                  >
                    Entity ID
                  </th>
                )}
                {visibleColumns.customer && (
                  <th
                    onClick={() => {
                      setSortBy('customerName');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60"
                  >
                    Customer Name
                  </th>
                )}
                {visibleColumns.email && <th className="py-2.5 px-3">Email</th>}
                {visibleColumns.vehicle && <th className="py-2.5 px-3">Vehicle (Year/Model)</th>}
                {visibleColumns.campaign && <th className="py-2.5 px-3">Campaign</th>}
                {visibleColumns.eventNumber && <th className="py-2.5 px-3">Event#</th>}
                {visibleColumns.closeDate && (
                  <th
                    onClick={() => {
                      setSortBy('closeDate');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60"
                  >
                    Close Date
                  </th>
                )}
                {visibleColumns.roAmount && (
                  <th
                    onClick={() => {
                      setSortBy('roAmount');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 text-right"
                  >
                    RO Amount
                  </th>
                )}
                {visibleColumns.status && <th className="py-2.5 px-3 text-center">Status</th>}
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    Loading records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No records matching your search or filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const isInline = editingRowId === r._id;
                  const isSelected = selectedIds.includes(r._id);

                  return (
                    <tr
                      key={r._id}
                      onClick={() => setSelectedRecord(r)}
                      className={`hover:bg-slate-50/90 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-3 text-center"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(r._id)}
                          className="rounded text-blue-600"
                        />
                      </td>

                      {/* Sticky First Column: Entity ID */}
                      {visibleColumns.entityId && (
                        <td className="py-2 px-3 sticky left-0 bg-white font-mono font-semibold text-slate-900 border-r border-slate-100">
                          {isInline ? (
                            <input
                              type="text"
                              value={inlineValues.externalEntityId}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineValues({ ...inlineValues, externalEntityId: e.target.value })
                              }
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs w-24 bg-white"
                            />
                          ) : (
                            r.externalEntityId || '—'
                          )}
                        </td>
                      )}

                      {/* Customer Name */}
                      {visibleColumns.customer && (
                        <td className="py-2 px-3 text-slate-900 font-medium">
                          {isInline ? (
                            <input
                              type="text"
                              value={inlineValues.customerName}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineValues({ ...inlineValues, customerName: e.target.value })
                              }
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs w-40 bg-white"
                            />
                          ) : (
                            r.customerName || '—'
                          )}
                        </td>
                      )}

                      {/* Customer Email */}
                      {visibleColumns.email && (
                        <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                          {isInline ? (
                            <input
                              type="email"
                              value={inlineValues.customerEmail || ''}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineValues({ ...inlineValues, customerEmail: e.target.value })
                              }
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs w-44 bg-white"
                              placeholder="e.g. name@gmail.com"
                            />
                          ) : (
                            r.customerEmail || r.customFields?.email || r.sourceData?.Email || '—'
                          )}
                        </td>
                      )}

                      {/* Vehicle */}
                      {visibleColumns.vehicle && (
                        <td className="py-2 px-3 text-slate-600">
                          {[r.vehicle?.year, r.vehicle?.model].filter(Boolean).join(' ') || '—'}
                        </td>
                      )}

                      {/* Campaign */}
                      {visibleColumns.campaign && (
                        <td className="py-2 px-3 text-slate-600">{r.campaignName || '—'}</td>
                      )}

                      {/* Event# */}
                      {visibleColumns.eventNumber && (
                        <td className="py-2 px-3 font-mono text-slate-600">
                          {isInline ? (
                            <input
                              type="text"
                              value={inlineValues.eventNumber}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineValues({ ...inlineValues, eventNumber: e.target.value })
                              }
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs w-24 bg-white"
                            />
                          ) : (
                            r.eventNumber || '—'
                          )}
                        </td>
                      )}

                      {/* Close Date */}
                      {visibleColumns.closeDate && (
                        <td className="py-2 px-3 text-slate-600">
                          {r.closeDate ? formatDate(r.closeDate) : '—'}
                        </td>
                      )}

                      {/* RO Amount */}
                      {visibleColumns.roAmount && (
                        <td className="py-2 px-3 text-right font-semibold text-slate-900 font-mono">
                          {isInline ? (
                            <input
                              type="number"
                              step="0.01"
                              value={inlineValues.roAmount}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                setInlineValues({ ...inlineValues, roAmount: e.target.value })
                              }
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs w-20 text-right bg-white"
                            />
                          ) : r.roAmount !== undefined ? (
                            formatCurrency(r.roAmount)
                          ) : (
                            '—'
                          )}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="py-2 px-3 text-center">
                          <Badge
                            variant={
                              r.recordStatus === 'VALID'
                                ? 'success'
                                : r.recordStatus === 'WARNING'
                                ? 'warning'
                                : 'error'
                            }
                            size="sm"
                          >
                            {r.recordStatus}
                          </Badge>
                        </td>
                      )}

                      {/* Action buttons */}
                      <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        {isInline ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleSaveInlineEdit(r._id, e)}
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              title="Save inline edit"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingRowId(null)}
                              className="p-1 rounded text-slate-400 hover:bg-slate-100"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleStartInlineEdit(r, e)}
                              className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                              title="Inline edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedRecord(r)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="View detail drawer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <strong className="text-slate-800">{(page - 1) * limit + 1}</strong> to{' '}
            <strong className="text-slate-800">{Math.min(page * limit, totalCount)}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> records
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>Per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="py-1 px-2 border border-slate-300 rounded bg-white text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-medium">
                {page} / {totalPages || 1}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row Detail Drawer */}
      <RecordDrawer
        record={selectedRecord}
        reportId={reportId}
        onClose={() => setSelectedRecord(null)}
        onSaved={(updated) => {
          setRecords(records.map((r) => (r._id === updated._id ? updated : r)));
          setSelectedRecord(updated);
        }}
      />

      {/* Add Record Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Single Record"
        description="Insert an operational service record into this report batch"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name</label>
            <input
              type="text"
              required
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="e.g. Jack Taylor"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Email</label>
            <input
              type="email"
              value={newCustomerEmail}
              onChange={(e) => setNewCustomerEmail(e.target.value)}
              placeholder="e.g. jack.taylor@gmail.com"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Entity ID</label>
              <input
                type="text"
                value={newEntityId}
                onChange={(e) => setNewEntityId(e.target.value)}
                placeholder="e.g. E10599"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Event#</label>
              <input
                type="text"
                value={newEventNumber}
                onChange={(e) => setNewEventNumber(e.target.value)}
                placeholder="e.g. EV-99120"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Year</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Make / Model</label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">RO Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={newRoAmount}
                onChange={(e) => setNewRoAmount(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Close Date</label>
              <input
                type="date"
                value={newCloseDate}
                onChange={(e) => setNewCloseDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isCreating} onClick={handleCreateRecord}>
              Save Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
