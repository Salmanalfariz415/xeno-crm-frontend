import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Layers, Send, BarChart2, Activity } from 'lucide-react';
import axios from 'axios';

export default function Layout({ children, activePage, setActivePage }) {
  const [crmStatus, setCrmStatus] = useState('offline');
  const [simStatus, setSimStatus] = useState('offline');

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', name: 'Customer Directory', icon: Users },
    { id: 'segments', name: 'Audience Segments', icon: Layers },
    { id: 'campaigns', name: 'Campaigns Builder', icon: Send },
    { id: 'analytics', name: 'Campaign Analytics', icon: BarChart2 }
  ];

  useEffect(() => {
    const checkServices = async () => {
      try {
        await axios.get('http://localhost:5000/ping');
        setCrmStatus('online');
      } catch (e) {
        setCrmStatus('offline');
      }

      try {
        await axios.get('http://localhost:5001/ping');
        setSimStatus('online');
      } catch (e) {
        setSimStatus('offline');
      }
    };

    checkServices();
    const interval = setInterval(checkServices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-base">X</span>
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none tracking-wide text-white">Xeno CRM</h1>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">AI-Native Portal</span>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Service Checkers */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-2">
            <span>SERVICE MONITOR</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 border border-slate-800/50 rounded-lg text-xs">
              <span className="text-slate-400">CRM Core API</span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${crmStatus === 'online' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'}`} />
                <span className={`font-medium ${crmStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>{crmStatus}</span>
              </div>
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/40 border border-slate-800/50 rounded-lg text-xs">
              <span className="text-slate-400">Channel Simulator</span>
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${simStatus === 'online' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-rose-500'}`} />
                <span className={`font-medium ${simStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}`}>{simStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0a0f1d] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-[#0a0f1d]">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/30 backdrop-blur-md flex items-center justify-between px-8">
          <h2 className="text-lg font-bold tracking-wide text-white capitalize">{activePage.replace('-', ' ')}</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-slate-300">Port 5000 Dashboard</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Page */}
        <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
