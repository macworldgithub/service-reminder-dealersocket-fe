'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Filter, Clock, User, FileText, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { AuditLog } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AuditTrailPage() {
  const { activeDealership } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeDealership) params.append('dealershipId', activeDealership._id);
      if (actionFilter) params.append('action', actionFilter);
      params.append('limit', '50');

      const res = await api.get(`/audit-logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeDealership, actionFilter]);

  return (
    <AppLayout
      title="Audit Trail &amp; Compliance"
      subtitle="Complete operational change history and compliance logs"
    >
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Filter Event Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
            >
              <option value="">All Audit Actions</option>
              <option value="REPORT_UPLOADED">REPORT_UPLOADED</option>
              <option value="REPORT_EDITED">REPORT_EDITED</option>
              <option value="RECORD_CREATED">RECORD_CREATED</option>
              <option value="RECORD_UPDATED">RECORD_UPDATED</option>
              <option value="RECORD_DELETED">RECORD_DELETED</option>
              <option value="COLUMN_MAPPING_UPDATED">COLUMN_MAPPING_UPDATED</option>
              <option value="IMPORT_COMPLETED">IMPORT_COMPLETED</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Showing {logs.length} audit entries
          </span>
        </div>

        {/* Audit Log Timeline */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading audit log...</div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">No audit events found.</div>
            ) : (
              logs.map((log) => (
                <div key={log._id} className="p-4 hover:bg-slate-50/70 transition-colors text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <Badge variant="default" size="sm" className="font-mono">
                        {log.action}
                      </Badge>
                      <span className="font-semibold text-slate-800">{log.entityType}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <div>
                      Operator: <strong className="text-slate-700">
                        {typeof log.userId === 'object' ? (log.userId as any)?.name : 'System Operator'}
                      </strong>
                    </div>
                    <div className="font-mono text-slate-400">ID: {log.entityId}</div>
                  </div>

                  {log.before && log.after && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 bg-slate-50 p-2.5 rounded border border-slate-200 text-[11px]">
                      <div>
                        <span className="font-semibold text-rose-600 block mb-0.5">Prior State:</span>
                        <pre className="text-[10px] text-slate-600 overflow-x-auto bg-white p-2 rounded border border-slate-200">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="font-semibold text-emerald-600 block mb-0.5">Updated State:</span>
                        <pre className="text-[10px] text-slate-600 overflow-x-auto bg-white p-2 rounded border border-slate-200">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
