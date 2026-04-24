// Background service worker for Nexora
chrome.runtime.onInstalled.addListener(() => {
  console.log('Nexora Extension Installed');
  // Initialize storage if needed
  chrome.storage.local.get(['sessions'], (result) => {
    if (!result.sessions) {
      chrome.storage.local.set({ sessions: [] });
    }
  });
});

// Future Phase: Auto-save sessions when closing a window
chrome.windows.onRemoved.addListener((windowId) => {
  // To be implemented in Phase 4
  console.log('Window closed, potential auto-save in the future');
});
