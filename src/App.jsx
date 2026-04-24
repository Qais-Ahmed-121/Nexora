import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';

const PM_TOOLS = [
  { name: 'Jira', url: 'jira.com', color: '#0052CC' },
  { name: 'Confluence', url: 'atlassian.net/wiki', color: '#172B4D' },
  { name: 'Figma', url: 'figma.com', color: '#F24E1E' },
  { name: 'Analytics', url: 'analytics.google.com', color: '#F9AB00' },
  { name: 'Slack', url: 'slack.com', color: '#4A154B' },
  { name: 'Notion', url: 'notion.so', color: '#EBEBEB' }
];

export default function App() {
  const [sessions, setSessions] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [currentTabs, setCurrentTabs] = useState([]);
  const [suggestedName, setSuggestedName] = useState('');
  const [detectedToolsState, setDetectedToolsState] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    getCurrentTabs();
  }, []);

  const loadSessions = () => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(['sessions'], (result) => {
        if (result.sessions) {
          // Sort by most recent
          const sortedSessions = result.sessions.sort((a, b) => b.createdAt - a.createdAt);
          setSessions(sortedSessions);
        }
      });
    }
  };

  // Phase 3: Smart PM Features
  const detectPMTools = (tabs) => {
    const detectedTools = [];
    tabs.forEach(tab => {
      PM_TOOLS.forEach(tool => {
        if (tab.url && tab.url.includes(tool.url) && !detectedTools.some(t => t.name === tool.name)) {
          detectedTools.push(tool);
        }
      });
    });

    if (detectedTools.length > 0) {
      const names = detectedTools.map(t => t.name);
      if (names.includes('Jira') && names.includes('Confluence')) {
        return { name: 'Sprint Planning Session', tools: detectedTools };
      }
      return { name: `${names.join(', ')} Session`, tools: detectedTools };
    }
    return { name: '', tools: [] };
  };

  const getCurrentTabs = () => {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        // Filter out extension pages or chrome:// pages if desired
        const validTabs = tabs.filter(tab => !tab.url.startsWith('chrome://'));
        setCurrentTabs(validTabs);
        
        // Auto-suggest name
        const suggestion = detectPMTools(validTabs);
        if (suggestion.name) {
          setSuggestedName(suggestion.name);
          setDetectedToolsState(suggestion.tools);
        }
        if (validTabs.length === 0) setShowEmptyWarning(true);
      });
    } else {
      // Mock data for local testing outside extension
      const mockTabs = [
        { title: 'Jira - Board', url: 'https://jira.com/board' },
        { title: 'Figma - Design', url: 'https://figma.com/file' }
      ];
      setCurrentTabs(mockTabs);
      const suggestion = detectPMTools(mockTabs);
      setSuggestedName(suggestion.name);
      setDetectedToolsState(suggestion.tools);
      if (mockTabs.length === 0) setShowEmptyWarning(true);
    }
  };

  const handleSave = () => {
    if (currentTabs.length === 0) {
      setShowEmptyWarning(true);
      return;
    }

    const nameToSave = sessionName.trim() || suggestedName || `Session ${format(new Date(), 'MMM d, h:mm a')}`;
    const primaryColor = detectedToolsState.length > 0 ? detectedToolsState[0].color : '#4F46E5';
    
    const newSession = {
      id: Date.now().toString(),
      name: nameToSave,
      note: sessionNote.trim(),
      color: primaryColor,
      createdAt: Date.now(),
      tabs: currentTabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        pinned: tab.pinned
      }))
    };

    const updatedSessions = [newSession, ...sessions];
    
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ sessions: updatedSessions }, () => {
        setSessions(updatedSessions);
        setSessionName('');
        setSessionNote('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      });
    } else {
      setSessions(updatedSessions);
      setSessionName('');
      setSessionNote('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleRestoreSession = (session) => {
    if (chrome && chrome.windows) {
      // Create a new window with the tabs
      const urls = session.tabs.map(tab => tab.url);
      chrome.windows.create({ url: urls });
    }
  };

  const handleDeleteSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ sessions: updatedSessions }, () => {
        setSessions(updatedSessions);
      });
    } else {
      setSessions(updatedSessions);
    }
  };

  const formatSessionDate = (timestamp) => {
    const date = new Date(timestamp);
    const timeString = format(date, 'h:mm a');
    if (isToday(date)) {
      return `Today, ${timeString}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  return (
    <div className="w-[360px] h-[500px] bg-gradient-to-b from-[#0F172A] to-[#020617] text-white p-5 font-sans flex flex-col box-border">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 shrink-0">
        <div className="w-9 h-9 bg-[#1E293B] rounded-xl flex items-center justify-center shadow-inner overflow-hidden">
          <img src="/logo.png" alt="Nexora Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-lg font-semibold tracking-wide">Nexora</h1>
      </div>

      {/* Input Group */}
      <div className="shrink-0 relative">
        <input
          type="text"
          placeholder={suggestedName ? `e.g. ${suggestedName}` : "Name your session..."}
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-[#1E293B]/80 border border-[#334155] 
          text-[#F8FAFC] placeholder-[#94A3B8] outline-none mb-2 text-sm
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
          transition-all duration-200"
        />
        
        <input
          type="text"
          placeholder="Optional note..."
          value={sessionNote}
          onChange={(e) => setSessionNote(e.target.value)}
          className="w-full p-2.5 rounded-xl bg-[#1E293B]/80 border border-[#334155] 
          text-[#F8FAFC] placeholder-[#64748B] outline-none mb-3 text-[13px]
          focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 
          transition-all duration-200"
        />

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={currentTabs.length === 0}
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 
          hover:from-indigo-600 hover:to-indigo-700
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          active:scale-[0.97] transition-all duration-200
          text-white py-2.5 rounded-xl text-sm font-medium mb-3 shadow-lg"
        >
          Save Current Session
        </button>
      </div>

      {/* Success/Warning Message Area */}
      <div className="h-6 mb-1 shrink-0 flex items-center justify-center">
        {saved && (
          <div className="text-emerald-400 text-xs animate-fadeIn flex items-center gap-1.5 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Session saved successfully
          </div>
        )}
        {showEmptyWarning && !saved && currentTabs.length === 0 && (
          <div className="text-amber-400 text-xs animate-fadeIn flex items-center gap-1.5 font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            No active tabs to save
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#334155] mb-4 shrink-0"></div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <p className="text-sm">No saved sessions yet</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className="bg-[#1E293B]/80 border border-[#334155] 
              rounded-xl p-3 shadow-md hover:shadow-lg relative overflow-hidden
              transition-all duration-200 hover:-translate-y-[2px]"
              style={{ borderLeft: `4px solid ${session.color || '#4F46E5'}` }}
            >
              <h2 className="font-semibold text-[#F8FAFC] truncate text-[15px]" title={session.name}>
                {session.name}
              </h2>
              
              {session.note && (
                <p className="text-[12px] text-[#94A3B8] mt-0.5 truncate italic">
                  {session.note}
                </p>
              )}

              <div className="flex justify-between items-center mt-2 text-[12px] text-[#64748B]">
                <span className="shrink-0 flex items-center gap-1.5">
                  <span className="bg-[#334155] text-white px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {session.tabs.length} tabs
                  </span>
                  <span>• {formatSessionDate(session.createdAt)}</span>
                </span>

                <div className="flex gap-2.5 font-medium">
                  <button 
                    onClick={() => handleRestoreSession(session)}
                    className="text-indigo-400 hover:text-indigo-300 transition duration-150 hover:scale-105"
                  >
                    Restore
                  </button>
                  <button 
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-red-400 hover:text-red-300 transition duration-150 hover:scale-105"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
