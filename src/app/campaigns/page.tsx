'use client';

import React, { useState, useEffect } from 'react';
import {
  Workflow,
  MessageSquare,
  Mail,
  PhoneCall,
  Clock,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

export default function CampaignsPage() {
  const { activeDealership } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setIsLoading(true);
      try {
        const param = activeDealership ? `?dealershipId=${activeDealership._id}` : '';
        const res = await api.get(`/campaigns${param}`);
        if (res.data?.success) {
          setCampaigns(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load campaigns', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [activeDealership]);

  return (
    <AppLayout
      title="Automated Campaign Architecture"
      subtitle="Section 20 decoupled campaign automation fed by DealerSocket Closed RO reports"
      actions={
        <Button icon={<Plus className="w-4 h-4" />}>
          New Campaign Flow
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Architecture Flow Explanation Banner */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              DealerSocket Report Ingestion → Automation Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Ingested reports retain stable, immutable references (<code>dealershipId</code>, <code>reportId</code>, <code>recordId</code>, and <code>externalEntityId</code>) which directly trigger customer nurture journeys.
          </p>

          {/* Step Sequence Flow Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Trigger Event</span>
              <div className="font-semibold text-slate-900 mt-1">Closed RO Ingested</div>
              <p className="text-[11px] text-slate-500 mt-0.5">DealerSocket PDF/CSV uploaded</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 1 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> SMS Follow-Up
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Post-service thank you</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 3 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Email Survey
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Inspection breakdown</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 7 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Car Wash SMS
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Loyalty perk reminder</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 12 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> VA Task Queue
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Concierge phone call</p>
            </div>
          </div>
        </div>

        {/* Existing Campaigns List */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Active Campaign Sequences</h3>

          {campaigns.map((c) => (
            <div key={c._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                    <Badge variant="success" size="sm">{c.status}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    Configure Steps
                  </Button>
                </div>
              </div>

              {/* Step Sequence Timeline */}
              <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/70 space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Workflow Steps:
                </span>
                <div className="space-y-2">
                  {c.steps?.map((step: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {step.stepNumber}
                        </span>
                        <Badge variant="default" size="sm">{step.channel}</Badge>
                        <span className="font-medium text-slate-800">{step.description}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        +{step.delayDays} Days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
