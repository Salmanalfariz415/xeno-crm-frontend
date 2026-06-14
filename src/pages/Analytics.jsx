import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, Sparkles, CheckCircle2, AlertTriangle, TrendingUp, RefreshCw, Layers } from 'lucide-react';
import api from '../utils/api';

export default function Analytics() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  // Analytics Metrics State
  const [metrics, setMetrics] = useState(null);
  const [statusCounts, setStatusCounts] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // AI Insights State
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiReport, setAiReport] = useState(null);

  const fetchCampaignsList = async () => {
    try {
      setLoadingList(true);
      const res = await api.getCampaigns();
      const list = res.data.campaigns || [];
      setCampaigns(list);
      
      // Auto select first campaign if available
      if (list.length > 0 && !selectedCampId) {
        setSelectedCampId(String(list[0].id));
      }
    } catch (err) {
      console.error('Error loading campaigns list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadMetrics = async (campId) => {
    if (!campId) return;

    try {
      setLoadingMetrics(true);
      setAiReport(null); // Reset AI report
      const res = await api.getCampaignAnalytics(campId);
      setMetrics(res.data.analytics || null);
      setStatusCounts(res.data.statusBreakdown || null);
    } catch (err) {
      console.error('Error loading campaign metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const loadAIInsights = async () => {
    if (!selectedCampId) return;

    try {
      setLoadingInsights(true);
      const res = await api.getCampaignAIInsights(selectedCampId);
      setAiReport(res.data.insights || null);
    } catch (err) {
      console.error('AI Insights compilation failed:', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchCampaignsList();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      loadMetrics(selectedCampId);
    }
  }, [selectedCampId]);

  // Format Recharts Data
  const chartData = metrics ? [
    { name: 'Sent', count: metrics.sent, fill: '#6366f1' },
    { name: 'Delivered', count: metrics.delivered, fill: '#818cf8' },
    { name: 'Opened', count: metrics.opened, fill: '#38bdf8' },
    { name: 'Read', count: metrics.read, fill: '#06b6d4' },
    { name: 'Clicked', count: metrics.clicked, fill: '#06b6d4' },
    { name: 'Converted', count: metrics.converted, fill: '#10b981' }
  ] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Campaign Selector Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-white uppercase tracking-wide">Selected Campaign Analytics</h3>
          <p className="text-xs text-slate-400">View real-time communication funnel and click insights</p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedCampId}
            onChange={(e) => setSelectedCampId(e.target.value)}
            className="bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500/50"
          >
            {campaigns.length === 0 ? (
              <option value="">No campaigns available</option>
            ) : (
              campaigns.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.segment_name})</option>
              ))
            )}
          </select>

          <button
            onClick={() => loadMetrics(selectedCampId)}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-350 hover:text-white"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loadingMetrics ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Querying campaign aggregates & event logs...</p>
        </div>
      ) : !metrics ? (
        <div className="text-center py-16 text-slate-500 text-xs italic">
          Please build and launch a campaign to analyze reporting metrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Conversions Funnel Layout */}
          <div className="lg:col-span-3 space-y-6">
            {/* KPI Summaries Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Messages Sent</span>
                <h4 className="text-xl font-bold text-white">{metrics.sent}</h4>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conversions</span>
                <h4 className="text-xl font-bold text-emerald-400">{metrics.converted}</h4>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
                <div className="flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xl font-bold text-white">{metrics.conversion_rate}%</h4>
                </div>
              </div>
            </div>

            {/* Funnel Bar Chart */}
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Funnel Conversion Statistics</h4>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b/40" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                      labelStyle={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}
                      itemStyle={{ color: '#818cf8', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Simulated webhook state details */}
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <h4 className="font-bold text-xs text-white uppercase tracking-wider">Transmission Status Logs</h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg flex items-center justify-between">
                  <span className="text-slate-400">Sent</span>
                  <span className="font-bold text-white">{metrics.sent}</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg flex items-center justify-between">
                  <span className="text-slate-400">Delivered</span>
                  <span className="font-bold text-indigo-400">{metrics.delivered}</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg flex items-center justify-between">
                  <span className="text-slate-400">Failed</span>
                  <span className="font-bold text-rose-400">{metrics.failed}</span>
                </div>
                <div className="p-3 bg-slate-950/20 border border-slate-850 rounded-lg flex items-center justify-between">
                  <span className="text-slate-400">Clicked</span>
                  <span className="font-bold text-emerald-400">{metrics.clicked}</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Marketing performance Advisor Insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-sm text-white">AI Marketing Insights</h3>
                </div>

                <button
                  onClick={loadAIInsights}
                  disabled={loadingInsights || metrics.sent === 0}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/25 transition-all disabled:opacity-40"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Request Review</span>
                </button>
              </div>

              {loadingInsights ? (
                <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Gemini reviewing campaign metrics...</span>
                </div>
              ) : !aiReport ? (
                <div className="text-center py-12 text-slate-500 text-xs italic">
                  Click 'Request Review' to call the Gemini AI and review your marketing performance.
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in text-xs leading-relaxed">
                  {/* Key Insights */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                      <span>Key Performance Insights</span>
                    </span>
                    <ul className="space-y-2.5 pl-1.5">
                      {aiReport.insights.map((insight, idx) => (
                        <li key={idx} className="p-3 bg-slate-950/30 border border-slate-850 rounded-xl text-slate-300">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Recommendations */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>CMO Recommendations</span>
                    </span>
                    <ul className="space-y-2.5 pl-1.5">
                      {aiReport.recommendations.map((rec, idx) => (
                        <li key={idx} className="p-3 bg-amber-500/[0.03] border border-amber-500/15 rounded-xl text-amber-300">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
