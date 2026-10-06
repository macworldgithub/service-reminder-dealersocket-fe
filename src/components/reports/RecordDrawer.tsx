'use client';

import React, { useState } from 'react';
import { X, Save, Clock, History, AlertCircle, CheckCircle2, ShieldCheck, Car } from 'lucide-react';
import { ReportRecord } from '@/lib/types';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface RecordDrawerProps {
  record: ReportRecord | null;
  reportId: string;
  onClose: () => void;
  onSaved: (updatedRecord: ReportRecord) => void;
}

export const RecordDrawer: React.FC<RecordDrawerProps> = ({
  record,
  reportId,
  onClose,
  onSaved,
}) => {
  if (!record) return null;

  const [activeTab, setActiveTab] = useState<'details' | 'comparison' | 'history'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Editable fields state
  const [customerName, setCustomerName] = useState(record.customerName || '');
  const [externalEntityId, setExternalEntityId] = useState(record.externalEntityId || '');
  const [eventNumber, setEventNumber] = useState(record.eventNumber || '');
  const [vehicleYear, setVehicleYear] = useState(record.vehicle?.year ? String(record.vehicle.year) : '');
  const [vehicleModel, setVehicleModel] = useState(record.vehicle?.model || '');
  const [roAmount, setRoAmount] = useState(record.roAmount !== undefined ? String(record.roAmount) : '');
  const [closeDate, setCloseDate] = useState(
    record.closeDate ? new Date(record.closeDate).toISOString().split('T')[0] : ''
  );
  const [recordStatus, setRecordStatus] = useState(record.recordStatus);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await api.patch(`/reports/${reportId}/records/${record._id}`, {
        customerName,
        externalEntityId,
        eventNumber,
        vehicle: {
          year: vehicleYear ? parseInt(vehicleYear, 10) : undefined,
          model: vehicleModel,
          make: record.vehicle?.make || 'Hyundai',
        },
        roAmount: roAmount ? parseFloat(roAmount) : undefined,
        closeDate: closeDate ? new Date(closeDate) : undefined,
        recordStatus,
      });

      if (res.data?.success && res.data.data) {
        onSaved(res.data.data);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update record', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              {record.customerName || 'Customer Record'}
            </h2>
            <Badge variant={record.recordStatus === 'VALID' ? 'success' : 'warning'} size="sm">
              {record.recordStatus}
            </Badge>
          </div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            Entity ID: {record.externalEntityId || '—'} · Event: {record.eventNumber || '—'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-5 bg-white text-xs font-medium">
        <button
          onClick={() => setActiveTab('details')}
          className={`py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Record Details
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`py-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'comparison'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Original vs Edited
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === 'details' && (
          <>
            {/* Quick Status banner */}
            {record.validationNotes && record.validationNotes.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Validation Notice:
                </div>
                {record.validationNotes.map((note, i) => (
                  <div key={i} className="pl-5">• {note}</div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Entity ID</label>
                  <input
                    type="text"
                    value={externalEntityId}
                    onChange={(e) => setExternalEntityId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Event Number</label>
                  <input
                    type="text"
                    value={eventNumber}
                    onChange={(e) => setEventNumber(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Vehicle Year</label>
                  <input
                    type="number"
                    value={vehicleYear}
                    onChange={(e) => setVehicleYear(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Make / Model</label>
                  <input
                    type="text"
                    value={vehicleModel}
                    onChange={(e) => setVehicleModel(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">RO Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={roAmount}
                    onChange={(e) => setRoAmount(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Close Date</label>
                  <input
                    type="date"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Record Status</label>
                <select
                  value={recordStatus}
                  onChange={(e) => setRecordStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white"
                >
                  <option value="VALID">VALID</option>
                  <option value="WARNING">WARNING</option>
                  <option value="ERROR">ERROR</option>
                </select>
              </div>

              {/* Custom fields & metadata */}
              {record.customFields && Object.keys(record.customFields).length > 0 && (
                <div className="pt-3 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Custom Preserved Fields
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-1 text-xs">
                    {Object.entries(record.customFields).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-500 font-mono">{k}:</span>
                        <span className="text-slate-800 font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Comparison Tab: Section 12 Requirement */}
        {activeTab === 'comparison' && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
              <span className="font-semibold">Original DealerSocket Source Preservation:</span>
              <p className="text-[11px] mt-0.5">
                The imported row is kept untouched in MongoDB. Below is a side-by-side comparison of the raw ingested value vs the current edited field.
              </p>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                    <th className="py-2 px-3">Field</th>
                    <th className="py-2 px-3">Original Ingested</th>
                    <th className="py-2 px-3">Current Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-500">Customer Name</td>
                    <td className="py-2 px-3 text-slate-600 font-mono bg-amber-50/40">
                      {record.sourceData?.['Customer Name'] || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {record.customerName || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-500">Entity ID</td>
                    <td className="py-2 px-3 text-slate-600 font-mono bg-amber-50/40">
                      {record.sourceData?.['Entity ID'] || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                      {record.externalEntityId || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-500">Event Number</td>
                    <td className="py-2 px-3 text-slate-600 font-mono bg-amber-50/40">
                      {record.sourceData?.['Event#'] || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                      {record.eventNumber || '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-500">RO Amount</td>
                    <td className="py-2 px-3 text-slate-600 font-mono bg-amber-50/40">
                      {record.sourceData?.['RO Amount'] || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {record.roAmount !== undefined ? formatCurrency(record.roAmount) : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-medium text-slate-500">Close Date</td>
                    <td className="py-2 px-3 text-slate-600 font-mono bg-amber-50/40">
                      {record.sourceData?.['Close Date'] || '—'}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {record.closeDate ? formatDate(record.closeDate) : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Raw Source JSON Dump:</span>
              <pre className="text-[10px] text-slate-600 font-mono overflow-x-auto p-2 bg-white rounded border border-slate-200">
                {JSON.stringify(record.sourceData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" isLoading={isSaving} onClick={handleSave} icon={<Save className="w-4 h-4" />}>
          Save Record Changes
        </Button>
      </div>
    </div>
  );
};
