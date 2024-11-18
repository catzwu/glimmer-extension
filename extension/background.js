// Store tab-specific data
const tabData = new Map();

// Default state for new tabs
const getDefaultTabState = () => ({
  highlights: [],
  cards: [],
  isActive: false,
});

// Save state for a specific tab
const saveTabState = (tabId) => {
  console.log(`[Background] Saving state for tab ${tabId}:`, tabData.get(tabId));
  const data = tabData.get(tabId) || getDefaultTabState();
  chrome.storage.local.set({
    [`tab_${tabId}`]: data,
  });
};

// Load state for a specific tab
const loadTabState = async (tabId) => {
  console.log(`[Background] Loading state for tab ${tabId}`);
  const result = await chrome.storage.local.get([`tab_${tabId}`]);
  const data = result[`tab_${tabId}`] || getDefaultTabState();
  tabData.set(tabId, data);
  console.log(`[Background] Loaded state:`, data);
  return data;
};

// Notify content script of state changes
const notifyContentScript = (tabId, message) => {
  console.log(`[Background] Notifying content script in tab ${tabId}:`, message);
  chrome.tabs.sendMessage(tabId, message).catch(error => {
    console.log(`[Background] Could not notify content script (tab might not be loaded yet):`, error);
  });
};

// Notify extension popup of state changes
const notifyExtension = (message) => {
  console.log(`[Background] Notifying extension popup:`, message);
  chrome.runtime.sendMessage(message).catch(error => {
    console.log(`[Background] Could not notify extension popup (might not be open):`, error);
  });
};

// Clean up tab data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log(`[Background] Cleaning up data for closed tab ${tabId}`);
  tabData.delete(tabId);
  chrome.storage.local.remove([`tab_${tabId}`]);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Background] Received message:", message);
  console.log("[Background] From sender:", sender);
  
  // Get tabId either from sender.tab or message.tabId
  const tabId = sender.tab?.id || message.tabId;
  console.log("[Background] Using tabId:", tabId);

  switch (message.type) {
    case "GET_CURRENT_TAB_ID":
      // If the message comes from content script, we already have the tab ID
      if (sender.tab?.id) {
        console.log("[Background] Returning current tab ID from sender:", sender.tab.id);
        sendResponse({ tabId: sender.tab.id });
        return;
      }
      // Otherwise, we need to query for the active tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTabId = tabs[0]?.id;
        console.log("[Background] Returning current tab ID from query:", currentTabId);
        sendResponse({ tabId: currentTabId });
      });
      return true; // Required for async response

    case "TOGGLE_ACTIVATION":
      {
        if (!tabId) {
          console.error("[Background] No tab ID for toggle activation");
          sendResponse({ success: false, error: "No tab ID found" });
          return;
        }

        console.log(`[Background] Toggling activation for tab ${tabId}`);
        const data = tabData.get(tabId) || getDefaultTabState();
        data.isActive = !data.isActive;
        tabData.set(tabId, data);
        saveTabState(tabId);

        console.log(`[Background] New activation state for tab ${tabId}:`, data.isActive);
        
        // Notify both content script and extension popup
        notifyContentScript(tabId, {
          type: "ACTIVATION_CHANGED",
          isActive: data.isActive
        });
        
        notifyExtension({
          type: "ACTIVATION_CHANGED",
          isActive: data.isActive,
          tabId: tabId
        });

        sendResponse({ success: true });
      }
      break;

    case "GET_STATE":
      {
        if (!tabId) {
          console.error("[Background] No tab ID for get state");
          sendResponse(getDefaultTabState());
          return;
        }

        console.log(`[Background] Getting state for tab ${tabId}`);
        loadTabState(tabId).then((data) => {
          console.log(`[Background] Sending state for tab ${tabId}:`, data);
          sendResponse(data);
        });
        return true; // Required for async response
      }

    case "ADD_HIGHLIGHT":
      {
        if (!tabId) {
          console.error("[Background] No tab ID for add highlight");
          sendResponse({ success: false, error: "No tab ID found" });
          return;
        }

        console.log(`[Background] Adding highlight for tab ${tabId}`);
        const data = tabData.get(tabId) || getDefaultTabState();
        const newHighlight = {
          id: message.id,
          text: message.text,
          url: sender.tab?.url || "",
          timestamp: Date.now(),
        };
        data.highlights = [...data.highlights, newHighlight];
        tabData.set(tabId, data);
        saveTabState(tabId);

        console.log(`[Background] New highlights for tab ${tabId}:`, data.highlights);
        
        // Notify extension popup
        notifyExtension({
          type: "HIGHLIGHTS_UPDATED",
          highlights: data.highlights,
          tabId: tabId
        });

        sendResponse({ success: true });
      }
      break;

    case "REMOVE_HIGHLIGHT":
      {
        if (!tabId) {
          console.error("[Background] No tab ID for remove highlight");
          sendResponse({ success: false, error: "No tab ID found" });
          return;
        }

        console.log(`[Background] Removing highlight for tab ${tabId}`);
        const data = tabData.get(tabId) || getDefaultTabState();
        data.highlights = data.highlights.filter((h) => h.id !== message.id);
        tabData.set(tabId, data);
        saveTabState(tabId);

        // Notify both content script and extension popup
        notifyContentScript(tabId, {
          type: "REMOVE_HIGHLIGHT_CONTENT_SCRIPT",
          id: message.id
        });
        
        notifyExtension({
          type: "HIGHLIGHTS_UPDATED",
          highlights: data.highlights,
          tabId: tabId
        });

        sendResponse({ success: true });
      }
      break;

    case "CLEAR_HIGHLIGHTS":
      {
        if (!tabId) {
          console.error("[Background] No tab ID for clear highlights");
          sendResponse({ success: false, error: "No tab ID found" });
          return;
        }

        console.log(`[Background] Clearing highlights for tab ${tabId}`);
        const data = tabData.get(tabId) || getDefaultTabState();
        data.highlights = [];
        tabData.set(tabId, data);
        saveTabState(tabId);

        // Notify extension popup
        notifyExtension({
          type: "HIGHLIGHTS_UPDATED",
          highlights: data.highlights,
          tabId: tabId
        });

        sendResponse({ success: true });
      }
      break;

    case "ADD_CARDS":
    case "REMOVE_CARD":
    case "CLEAR_CARDS":
      {
        if (!tabId) {
          console.error(`[Background] No tab ID for ${message.type}`);
          sendResponse({ success: false, error: "No tab ID found" });
          return;
        }

        console.log(`[Background] Processing ${message.type} for tab ${tabId}`);
        const data = tabData.get(tabId) || getDefaultTabState();
        
        switch (message.type) {
          case "ADD_CARDS":
            data.cards = [...data.cards, ...message.cards];
            break;
          case "REMOVE_CARD":
            data.cards = data.cards.filter((_, i) => i !== message.index);
            break;
          case "CLEAR_CARDS":
            data.cards = [];
            break;
        }

        tabData.set(tabId, data);
        saveTabState(tabId);
        sendResponse({ success: true });
      }
      break;
  }
});
