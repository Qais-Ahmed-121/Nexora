import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Save, Play, Trash2, Box, Command, Layers, Layout,
  Activity, MessageSquare, AlertCircle, CheckCircle2
} from 'lucide-react';

const PM_TOOLS = [
  { name: 'Jira', url: 'jira.com', icon: Layout },
  { name: 'Confluence', url: 'atlassian.net/wiki', icon: Box },
  { name: 'Figma', url: 'figma.com', icon: Layers },
  { name: 'Analytics', url: 'analytics.google.com', icon: Activity },
  { name: 'Slack', url: 'slack.com', icon: MessageSquare },
  { name: 'Notion', url: 'notion.so', icon: Command }
];

function App() {
  const [sessions, setSessions] = useState([]);
  const [sessionName, setSessionName] = useState('');
  const [currentTabs, setCurrentTabs] = useState([]);
  const [suggestedName, setSuggestedName] = useState('');
  const [notification, setNotification] = useState(null);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    getCurrentTabs();
  }, []);

  const loadSessions = () => {
    if (chrome && chrome.storage) {
      chrome.storage.local.get(['sessions'], (result) => {
        if (result.sessions) {
          // Sort by most recent (Phase 2 UI/UX)
          const sortedSessions = result.sessions.sort((a, b) => b.createdAt - a.createdAt);
          setSessions(sortedSessions);
        }
      });
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Phase 3: Smart PM Features
  const detectPMTools = (tabs) => {
    const detectedTools = [];
    tabs.forEach(tab => {
      PM_TOOLS.forEach(tool => {
        if (tab.url && tab.url.includes(tool.url) && !detectedTools.includes(tool.name)) {
          detectedTools.push(tool.name);
        }
      });
    });

    if (detectedTools.length > 0) {
      if (detectedTools.includes('Jira') && detectedTools.includes('Confluence')) {
        return 'Sprint Planning Session';
      }
      return `${detectedTools.join(', ')} Session`;
    }
    return '';
  };

  const getCurrentTabs = () => {
    if (chrome && chrome.tabs) {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        // Filter out extension pages or chrome:// pages if desired
        const validTabs = tabs.filter(tab => !tab.url.startsWith('chrome://'));
        setCurrentTabs(validTabs);
        
        // Auto-suggest name
        const suggestion = detectPMTools(validTabs);
        if (suggestion) {
          setSuggestedName(suggestion);
        }
      });
    } else {
      // Mock data for local testing outside extension
      const mockTabs = [
        { title: 'Jira - Board', url: 'https://jira.com/board' },
        { title: 'Figma - Design', url: 'https://figma.com/file' }
      ];
      setCurrentTabs(mockTabs);
      setSuggestedName(detectPMTools(mockTabs));
    }
  };

  const handleSaveSession = () => {
    if (currentTabs.length === 0) {
      showNotification('No tabs to save!', 'error');
      return;
    }

    const nameToSave = sessionName.trim() || suggestedName || `Session ${format(new Date(), 'MMM d, h:mm a')}`;
    
    const newSession = {
      id: Date.now().toString(),
      name: nameToSave,
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
        showNotification('Session saved successfully!');
      });
    } else {
      setSessions(updatedSessions);
      setSessionName('');
      showNotification('Session saved (mock)!');
    }
  };

  const handleRestoreSession = (session) => {
    if (chrome && chrome.windows) {
      // Create a new window with the tabs
      const urls = session.tabs.map(tab => tab.url);
      chrome.windows.create({ url: urls }, () => {
        showNotification('Session restored!');
      });
    } else {
      showNotification('Restoring is not supported outside Chrome', 'error');
    }
  };

  const handleDeleteSession = (sessionId) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    if (chrome && chrome.storage) {
      chrome.storage.local.set({ sessions: updatedSessions }, () => {
        setSessions(updatedSessions);
        showNotification('Session deleted.');
      });
    } else {
      setSessions(updatedSessions);
    }
  };

  return (
    <div className="flex flex-col h-screen p-4 box-border">
      {/* Header */}
      <header className="flex items-center gap-3 pb-4 mb-4 border-b border-pm-border">
        <div className="bg-pm-accent p-2 rounded-lg shadow-lg shadow-pm-accent/20 flex items-center justify-center">
          {/* Abstract N Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="5" height="18" rx="2" fill="currentColor" opacity="0.8" />
            <rect x="16" y="3" width="5" height="18" rx="2" fill="currentColor" />
            <rect x="8.5" y="6" width="5" height="18" rx="2" fill="currentColor" opacity="0.6" transform="rotate(-35 8.5 6)" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-50 tracking-wide">
            Ne<span className="text-indigo-400">x</span>ora
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">PM Session Manager</p>
        </div>
      </header>

      {/* Notification Area */}
      {notification && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm transition-all animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {notification.message}
        </div>
      )}

      {/* Save Session Area */}
      <section className="bg-pm-card rounded-xl p-4 mb-4 border border-pm-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-200">Current Session</h2>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded-full text-slate-300">
            {currentTabs.length} tabs open
          </span>
        </div>
        
        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder={suggestedName ? `e.g. ${suggestedName}` : "Name your session..."}
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pm-accent focus:ring-1 focus:ring-pm-accent transition-all"
            />
            {suggestedName && !sessionName && (
              <p className="text-xs text-pm-accent mt-1.5 flex items-center gap-1 cursor-pointer hover:text-blue-400" onClick={() => setSessionName(suggestedName)}>
                <Activity size={12} /> Suggested: {suggestedName}
              </p>
            )}
          </div>

          <button
            onClick={handleSaveSession}
            disabled={currentTabs.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-pm-accent hover:bg-pm-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-pm-accent/20"
          >
            <Save size={16} />
            Save Current Session
          </button>
        </div>
      </section>

      {/* Saved Sessions List */}
      <section className="flex-1 overflow-y-auto pr-1">
        <h2 className="text-sm font-semibold text-slate-400 mb-3 sticky top-0 bg-pm-bg py-1 z-10">
          Saved Sessions
        </h2>
        
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500 space-y-2">
            <Box size={32} className="opacity-50" />
            <p className="text-sm">No saved sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => (
              <div 
                key={session.id} 
                className="group bg-pm-card rounded-lg p-3 border border-pm-border hover:border-slate-600 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="truncate pr-2">
                    <h3 className="text-sm font-medium text-slate-200 truncate" title={session.name}>
                      {session.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium bg-slate-700/50 px-2 py-0.5 rounded text-slate-400">
                    {session.tabs.length} tabs
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRestoreSession(session)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium py-1.5 px-3 rounded-md transition-colors"
                  >
                    <Play size={14} /> Restore
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="flex items-center justify-center bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/30 p-1.5 rounded-md transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Footer / Future Features Hook */}
      <footer className="mt-4 pt-3 border-t border-pm-border text-center text-xs text-slate-500">
        <p>Nexora Pro features coming soon ✨</p>
      </footer>
    </div>
  );
}

export default App;
