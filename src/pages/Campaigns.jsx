import React, { useEffect, useState } from 'react';
import { Send, Sparkles, AlertCircle, FileText, ChevronRight, CheckCircle, HelpCircle, Layers } from 'lucide-react';
import api from '../utils/api';

export default function Campaigns({ setActivePage }) {
  const [segments, setSegments] = useState([]);
  const [campaignsList, setCampaignsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Compose State
  const [name, setName] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [subjectLine, setSubjectLine] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [sendLogs, setSendLogs] = useState(null);

  // Copywriter AI Drawer
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiIdeaPrompt, setAiIdeaPrompt] = useState('');
  const [aiTone, setAiTone] = useState('excited');
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [copyOptions, setCopyOptions] = useState([]);

  // Errors and Success
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const segRes = await api.getSegments();
      setSegments(segRes.data.segments || []);

      const campRes = await api.getCampaigns();
      setCampaignsList(campRes.data.campaigns || []);
    } catch (err) {
      console.error('Error loading campaigns page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleInsertToken = (token) => {
    setMessageTemplate(prev => prev + ` {{${token}}}`);
  };

  const handleAiCopywrite = async (e) => {
    e.preventDefault();
    if (!aiIdeaPrompt.trim() || !selectedSegmentId) return;

    try {
      setGeneratingCopy(true);
      setCopyOptions([]);
      const res = await api.aiGenerateCopy({
        prompt: aiIdeaPrompt,
        segmentId: selectedSegmentId,
        tone: aiTone
      });
      // Variations can be array or single object
      setCopyOptions(Array.isArray(res.data.variations) ? res.data.variations : [res.data.variations]);
    } catch (err) {
      console.error('AI copywriting failed:', err);
    } finally {
      setGeneratingCopy(false);
    }
  };

  const handleApplyCopy = (option) => {
    setSubjectLine(option.subject_line || '');
    setMessageTemplate(option.message_template || '');
    setShowAiHelper(false);
  };

  const handleSaveAndSend = async (e) => {
    e.preventDefault();
    if (!name || !selectedSegmentId || !subjectLine || !messageTemplate) {
      setErrorMsg('Please populate all campaign fields');
      return;
    }

    try {
      setErrorMsg('');
      setSuccessMsg('');
      setSavingCampaign(true);
      setSendLogs('Saving campaign configurations...');

      // 1. Create campaign draft
      const saveRes = await api.createCampaign({
        name,
        segment_id: parseInt(selectedSegmentId),
        subject_line: subjectLine,
        message_template: messageTemplate
      });

      const campaignId = saveRes.data.campaign.id;
      setSendLogs('Parsing segment customer targets & personalizing copies...');

      // 2. Dispatch Campaign sends
      const sendRes = await api.sendCampaign(campaignId);
      
      setSuccessMsg(`Campaign dispatched! Sent to ${sendRes.data.sentCount} customers.`);
      setSendLogs(null);
      
      // Clean forms
      setName('');
      setSelectedSegmentId('');
      setSubjectLine('');
      setMessageTemplate('');
      loadInitialData(); // reload campaign list
    } catch (err) {
      console.error('Campaign execution failed:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to execute campaign send. Verify services are online.');
      setSendLogs(null);
    } finally {
      setSavingCampaign(false);
    }
  };

  const variableTokens = ['first_name', 'last_name', 'location', 'loyalty_tier', 'gender'];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
      {/* Campaign Composition Panel */}
      <div className="xl:col-span-3 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-base text-white">Campaign Composer</h3>
            </div>

            <button
              type="button"
              disabled={!selectedSegmentId}
              onClick={() => { setShowAiHelper(true); setCopyOptions([]); setAiIdeaPrompt(''); }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/25 transition-all disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Message Assistant</span>
            </button>
          </div>

          <form onSubmit={handleSaveAndSend} className="space-y-4">
            {/* Row 1: Name & Segment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campaign Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Clearance Sale"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Audience Segment</label>
                <select
                  value={selectedSegmentId}
                  onChange={(e) => setSelectedSegmentId(e.target.value)}
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="">Select Segment...</option>
                  {segments.map(seg => (
                    <option key={seg.id} value={seg.id}>{seg.name} ({seg.customerCount} customers)</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Subject Line */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Line</label>
              <input
                type="text"
                value={subjectLine}
                onChange={(e) => setSubjectLine(e.target.value)}
                placeholder="e.g. Hello {{first_name}}, check out our summer clearance deals!"
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            {/* Row 3: Message Template & Helpers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Message Copy Template</span>
                <span className="text-[10px] text-slate-500 capitalize font-medium">Use curly brackets for personalization tokens</span>
              </div>

              {/* Tokens Shortcut helper bar */}
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950/50 border border-slate-850 rounded-xl">
                <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold px-1.5">INSERT TOKEN:</span>
                {variableTokens.map(token => (
                  <button
                    key={token}
                    type="button"
                    onClick={() => handleInsertToken(token)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-all"
                  >
                    +{token}
                  </button>
                ))}
              </div>

              <textarea
                rows="6"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                placeholder="Write your email body template. E.g.: Hi {{first_name}},\n\nWe noticed you are shopping from {{location}}! In appreciation, enjoy 20% off your next purchase using code SUMMER20..."
                className="w-full bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
              />
            </div>

            {/* Actions / Status Reports */}
            {sendLogs && (
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <span>Executing Campaign: {sendLogs}</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center space-x-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2 text-xs text-emerald-400">
                <div className="flex items-center space-x-2 font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>Success!</span>
                </div>
                <p className="text-slate-300">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => setActivePage('analytics')}
                  className="mt-1 flex items-center space-x-1 underline font-semibold hover:text-white"
                >
                  <span>Go to Analytics Panel</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={savingCampaign || !name || !selectedSegmentId}
              className="w-full flex items-center justify-center space-x-2 gradient-btn py-3.5 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
              <span>Send Campaign Dispatch</span>
            </button>
          </form>
        </div>
      </div>

      {/* Campaigns list panel */}
      <div className="xl:col-span-2 space-y-6">
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-4">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Campaign Logs</h3>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {campaignsList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">No campaign configurations created yet.</div>
            ) : (
              campaignsList.map(camp => (
                <div key={camp.id} className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/10 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white leading-tight">{camp.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5">Audience: <span className="font-semibold text-slate-350">{camp.segment_name}</span></p>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      camp.status === 'completed' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : camp.status === 'sending'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {camp.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-850/60 pt-2 text-[10px] text-slate-500">
                    <span>{new Date(camp.created_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => setActivePage('analytics')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center space-x-0.5"
                    >
                      <span>View Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* AI Copywriter Sidebar Drawer */}
      {showAiHelper && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-950/20">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              <h4 className="font-bold text-base text-white">AI Copywriter Assistant</h4>
            </div>
            <button
              onClick={() => setShowAiHelper(false)}
              className="text-slate-500 hover:text-white font-bold text-sm bg-slate-800 px-3 py-1.5 rounded-lg"
            >
              Close
            </button>
          </div>

          {/* Prompt Form & Suggested copy results */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <form onSubmit={handleAiCopywrite} className="space-y-4 bg-slate-950/25 border border-slate-850 p-4 rounded-xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What is the focus of this campaign?</label>
                <textarea
                  rows="3"
                  value={aiIdeaPrompt}
                  onChange={(e) => setAiIdeaPrompt(e.target.value)}
                  placeholder="e.g. Announce a 20% discount on shoes code SHOE20"
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Voice Tone</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-350 focus:outline-none focus:border-indigo-500/50"
                >
                  <option value="excited">🎉 Excited / Promotional</option>
                  <option value="professional">💼 Professional / Corporate</option>
                  <option value="urgent">⏳ Urgent / Scarcity</option>
                  <option value="friendly">👋 Friendly / Conversational</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generatingCopy || !aiIdeaPrompt.trim()}
                className="w-full flex items-center justify-center space-x-2 gradient-btn py-2.5 rounded-lg text-xs font-bold text-white shadow-md disabled:opacity-40"
              >
                {generatingCopy ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Gemini copywriting ideas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Copy Suggestions</span>
                  </>
                )}
              </button>
            </form>

            {/* Generated Variations */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Copies</span>

              {copyOptions.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs italic">Enter focus details above to see suggestions.</div>
              ) : (
                copyOptions.map((opt, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/20 space-y-3.5 hover:border-slate-700/80 transition-all">
                    <div className="space-y-1">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Subject Line suggestion</span>
                      <p className="text-xs font-semibold text-white">{opt.subject_line}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Body Copy suggestion</span>
                      <pre className="p-3 bg-slate-950/60 border border-slate-850 rounded-lg text-[10px] text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                        {opt.message_template}
                      </pre>
                    </div>

                    <button
                      onClick={() => handleApplyCopy(opt)}
                      className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow shadow-indigo-600/20"
                    >
                      Use This Template Copy
                    </button>
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
