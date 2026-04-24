import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';

const PM_TOOLS = [
  { name: 'Jira', url: 'jira.com' },
  { name: 'Confluence', url: 'atlassian.net/wiki' },
  { name: 'Figma', url: 'figma.com' },
  { name: 'Analytics', url: 'analytics.google.com' },
  { name: 'Slack', url: 'slack.com' },
  { name: 'Notion', url: 'notion.so' }
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

  const formatSessionDate = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return 'Today';
    }
    return format(date, 'MMM d');
  };

  return (
    <div className="flex flex-col h-screen p-5 box-border bg-[#0F172A] text-slate-100 font-sans antialiased">
      {/* Header */}
      <header className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800">
        <div className="bg-[#1E293B] w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 5C6 4.44772 6.44772 4 7 4H8.5C9.05228 4 9.5 4.44772 9.5 5V19C9.5 19.5523 9.05228 20 8.5 20H7C6.44772 20 6 19.5523 6 19V5Z" fill="currentColor" opacity="0.8"/>
            <path d="M14.5 5C14.5 4.44772 14.9477 4 15.5 4H17C17.5523 4 18 4.44772 18 5V19C18 19.5523 17.5523 20 17 20H15.5C14.9477 20 14.5 19.5523 14.5 19V5Z" fill="currentColor"/>
            <path d="M7 5.5L16.5 18.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-xl font-medium text-white tracking-wide">
          Nexora
        </h1>
      </header>

      {/* Notification Area */}
      {notification && (
        <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 text-sm transition-all animate-in fade-in slide-in-from-top-2 ${
          notification.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#1E293B] text-slate-200 border border-slate-700'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Save Session Area */}
      <section className="mb-6 space-y-3">
        <input
          type="text"
          placeholder="Name your session..."
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full bg-[#1E293B]/50 border border-indigo-500/30 rounded-lg px-4 h-[42px] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
        />

        <button
          onClick={handleSaveSession}
          disabled={currentTabs.length === 0}
          className="w-full flex items-center justify-center bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-medium h-[42px] rounded-lg transition-all active:scale-[0.98]"
        >
          Save Current Session
        </button>
      </section>

      {/* Saved Sessions List */}
      <section className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-500">
            <p className="text-sm">No saved sessions yet</p>
          </div>
        ) : (
          sessions.map(session => (
            <div 
              key={session.id} 
              className="bg-[#1E293B] rounded-[14px] p-4 border border-slate-700/40 hover:border-slate-600 transition-colors"
            >
              <h3 className="text-[15px] font-semibold text-white mb-2 truncate" title={session.name}>
                {session.name}
              </h3>
              
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-slate-400">
                  {session.tabs.length} tabs • {formatSessionDate(session.createdAt)}
                </span>
                
                <div className="flex items-center gap-4 text-[13px] font-medium text-slate-400">
                  <button
                    onClick={() => handleRestoreSession(session)}
                    className="hover:text-white transition-colors"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="hover:text-white transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
      
    </div>
  );
}

export default App;
