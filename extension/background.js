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
  console.log(
    `[Background] Saving state for tab ${tabId}:`,
    tabData.get(tabId)
  );
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
  return data;
};

// Notify content script of state changes
const notifyContentScript = (tabId, message) => {
  chrome.tabs.sendMessage(tabId, message).catch((error) => {
    console.error(
      `[Background] Could not notify content script (tab might not be loaded yet):`,
      error
    );
  });
};

// Notify extension popup of state changes
const notifyExtension = (message) => {
  chrome.runtime.sendMessage(message).catch((error) => {
    console.error(
      `[Background] Could not notify extension popup (might not be open):`,
      error
    );
  });
};

// Clean up tab data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log(`[Background] Cleaning up data for closed tab ${tabId}`);
  tabData.delete(tabId);
  chrome.storage.local.remove([`tab_${tabId}`]);
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.setOptions({
    path: "index.html",
    enabled: true,
  });
  chrome.sidePanel.open({ windowId: tab.windowId }).catch((error) => {
    console.error("[Background] Error opening side panel:", error);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!chrome.runtime?.id) {
    console.error("[Background] No runtime ID found");
    sendResponse({ success: false, error: "No runtime ID found" });
    return;
  }

  const tabId = sender.tab?.id || message.tabId;

  console.log(
    "[Background] Received message:",
    message,
    "from",
    sender,
    "using tabId:",
    tabId
  );

  switch (message.type) {
    case "CLOSE_SIDE_PANEL": {
      chrome.sidePanel
        .setOptions({
          enabled: false,
        })
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error });
        });
      return true; // Required for async response
    }

    case "TOGGLE_ACTIVATION":
      {
        if (!tabId) {
          console.error("[Background] No tab ID for toggle activation");
          sendResponse({ success: false, error: "No tab ID found" });
          return;
        }

        const data = tabData.get(tabId) || getDefaultTabState();
        data.isActive = !data.isActive;
        tabData.set(tabId, data);
        saveTabState(tabId);

        notifyContentScript(tabId, {
          type: "ACTIVATION_CHANGED",
          isActive: data.isActive,
        });

        notifyExtension({
          type: "ACTIVATION_CHANGED",
          isActive: data.isActive,
          tabId: tabId,
        });

        sendResponse({ success: true });
      }
      break;

    case "GET_STATE": {
      if (!tabId) {
        console.error("[Background] No tab ID for get state");
        sendResponse(getDefaultTabState());
        return;
      }

      loadTabState(tabId).then((data) => {
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

        notifyExtension({
          type: "HIGHLIGHTS_UPDATED",
          highlights: data.highlights,
          tabId: tabId,
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

        const data = tabData.get(tabId) || getDefaultTabState();
        data.highlights = data.highlights.filter((h) => h.id !== message.id);
        tabData.set(tabId, data);
        saveTabState(tabId);

        notifyContentScript(tabId, {
          type: "REMOVE_HIGHLIGHT_CONTENT_SCRIPT",
          id: message.id,
        });

        notifyExtension({
          type: "HIGHLIGHTS_UPDATED",
          highlights: data.highlights,
          tabId: tabId,
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

        const data = tabData.get(tabId) || getDefaultTabState();
        data.highlights = [];
        tabData.set(tabId, data);
        saveTabState(tabId);

        notifyExtension({
          type: "HIGHLIGHTS_UPDATED",
          highlights: data.highlights,
          tabId: tabId,
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
