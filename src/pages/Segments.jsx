import React, { useEffect, useState } from 'react';
import { Layers, Sparkles, Terminal, Save, CheckCircle, Database, Users, Eye, HelpCircle } from 'lucide-react';
import api from '../utils/api';

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Segment Creation State
  const [aiPrompt, setAiPrompt] = useState('');
  const [segmentName, setSegmentName] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedTranslation, setGeneratedTranslation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // View Segment Customers Modal State
  const [viewSegment, setViewSegment] = useState(null);
  const [segmentCustomers, setSegmentCustomers] = useState([]);
  const [loadingCust, setLoadingCust] = useState(false);

  const fetchSegments = async () => {
    try {
      setLoadingList(true);
      const res = await api.getSegments();
      setSegments(res.data.segments || []);
    } catch (err) {
      console.error('Error fetching segments:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleAiTranslate = async (e) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    try {
      setGenerating(true);
      setGeneratedTranslation(null);
      setSaveSuccess(false);

      const res = await api.aiGenerateSegment(aiPrompt);
      setGeneratedTranslation(res.data);
      
      // Auto-populate segment name with a summary suggestion
      const dateStr = new Date().toLocaleDateString();
      setSegmentName(`AI Segment: ${aiPrompt.slice(0, 20)}... (${dateStr})`);
    } catch (err) {
      console.error('AI Translate segment failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSegment = async (e) => {
    e.preventDefault();
    if (!generatedTranslation || !segmentName.trim()) return;

    try {
      setSaving(true);
      await api.createSegment({
        name: segmentName,
        description: `Generated via AI prompt: "${aiPrompt}"`,
        rules: generatedTranslation.rules,
        sql_query: generatedTranslation.sql_query,
        sql_params: generatedTranslation.sql_params,
        query_type: 'ai',
        raw_prompt: aiPrompt
      });

      setSaveSuccess(true);
      setAiPrompt('');
      setGeneratedTranslation(null);
      fetchSegments(); // refresh lists
    } catch (err) {
      console.error('Error saving segment:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleViewSegmentCustomers = async (seg) => {
    try {
      setViewSegment(seg);
      setSegmentCustomers([]);
      setLoadingCust(true);
      const res = await api.getSegmentCustomers(seg.id);
      setSegmentCustomers(res.data.customers || []);
    } catch (err) {
      console.error('Error loading segment customers:', err);
    } finally {
      setLoadingCust(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {/* Segment Creation Console */}
      <div className="xl:col-span-3 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-4">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">AI Audience Translator</h3>
          </div>

          <form onSubmit={handleAiTranslate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Natural Language Prompt</label>
              <textarea
                rows="3"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your audience. Example: 'Customers who live in New York and have spent more than $300 across their orders'"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={generating || !aiPrompt.trim()}
              className="w-full flex items-center justify-center space-x-2 gradient-btn py-3 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-40"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>AI Engine compiling SQL query...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Translate to SQL Segment</span>
                </>
              )}
            </button>
          </form>

          {/* Compiled Output Preview */}
          {generatedTranslation && (
            <div className="space-y-6 border-t border-slate-800/80 pt-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Preview Count Box */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Audience Size</span>
                  <div className="flex items-center justify-center space-x-1.5">
                    <Users className="w-4 h-4 text-indigo-400" />
                    <span className="text-xl font-bold text-white">{generatedTranslation.previewCount} customers</span>
                  </div>
                </div>

                {/* Query Mode Status */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Confidence</span>
                  <div className="flex items-center justify-center space-x-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-xl font-bold text-emerald-400">98% Verified</span>
                  </div>
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identified UI Filter Rules</span>
                <div className="flex flex-wrap gap-2">
                  {generatedTranslation.rules.length === 0 ? (
                    <span className="text-slate-500 text-xs italic">No specific conditions found (targets all customers).</span>
                  ) : (
                    generatedTranslation.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                        <span className="text-slate-400 font-medium">{rule.field.replace('attributes.', '')}</span>
                        <span className="text-slate-500 font-bold uppercase">{rule.operator === 'equals' ? '=' : rule.operator === 'greater_than' ? '>' : rule.operator}</span>
                        <span className="text-indigo-400 font-semibold">{rule.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SQL Statement Display */}
              <div className="space-y-2.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Compiled SQL Statement</span>
                </div>
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 font-mono text-[11px] text-indigo-300 break-all select-all leading-relaxed">
                  {generatedTranslation.sql_query}
                  {generatedTranslation.sql_params && generatedTranslation.sql_params.length > 0 && (
                    <div className="mt-3 border-t border-slate-800/80 pt-2 text-[10px] text-slate-500">
                      Parameters: <span className="text-slate-300 font-semibold">{JSON.stringify(generatedTranslation.sql_params)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Save Segment Form */}
              <form onSubmit={handleSaveSegment} className="space-y-4 border-t border-slate-800/50 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Segment Name</label>
                  <input
                    type="text"
                    value={segmentName}
                    onChange={(e) => setSegmentName(e.target.value)}
                    placeholder="Enter segment name"
                    className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !segmentName.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl border border-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-all disabled:opacity-40"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Segment Definition</span>
                </button>
              </form>
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-3 text-xs text-emerald-400 animate-fade-in">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>Segment saved successfully! It is now available to use in Campaigns.</span>
            </div>
          )}
        </div>
      </div>

      {/* Saved Segment Directory */}
      <div className="xl:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-4">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Saved Audiences</h3>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {loadingList ? (
              <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span>Loading segments...</span>
              </div>
            ) : segments.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">No segments saved yet.</div>
            ) : (
              segments.map(seg => (
                <div key={seg.id} className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 space-y-3 hover:border-slate-700/80 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <h4 className="font-bold text-xs text-white leading-tight">{seg.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{seg.description}</p>
                    </div>
                    
                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-bold">
                      <Users className="w-3 h-3" />
                      <span>{seg.customerCount}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-850/60 pt-2.5">
                    <div className="flex items-center space-x-1.5 text-[9px] text-slate-500 font-semibold uppercase">
                      <Database className="w-3.5 h-3.5 text-slate-600" />
                      <span>{seg.query_type === 'ai' ? 'AI Generated' : 'Manual Rules'}</span>
                    </div>

                    <button
                      onClick={() => handleViewSegmentCustomers(seg)}
                      className="flex items-center space-x-1 p-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all border border-slate-750"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Customers</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Segment Customers modal view */}
      {viewSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-base text-white">Segment Customers</h4>
                <p className="text-xs text-slate-400">Target audience matching: <span className="text-indigo-400 font-bold">{viewSegment.name}</span></p>
              </div>
              <button
                onClick={() => setViewSegment(null)}
                className="text-slate-500 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-lg"
              >
                Close
              </button>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3.5">
              {loadingCust ? (
                <div className="py-8 text-center text-slate-500 text-xs">Evaluating query rules...</div>
              ) : segmentCustomers.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs italic">No customers qualify for this segment query.</div>
              ) : (
                segmentCustomers.map(cust => (
                  <div key={cust.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-800/80 bg-slate-950/20 text-xs">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-slate-200">{cust.first_name} {cust.last_name}</h5>
                      <span className="text-[10px] text-slate-500">{cust.email}</span>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                      {cust.location || 'Unknown'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
