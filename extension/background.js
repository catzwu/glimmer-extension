let isExtensionActive = true;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received:', message.type);

  switch (message.type) {
    case "TOGGLE_ACTIVATION":
      isExtensionActive = message.isActive ?? !isExtensionActive;
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: "EXTENSION_STATE",
              isActive: isExtensionActive,
            }).catch(() => {
              // Ignore errors for tabs without content script
            });
          }
        });
      });
      sendResponse({ success: true });
      break;

    case "GET_EXTENSION_STATE":
      sendResponse({ isActive: isExtensionActive });
      break;

    case "ADD_HIGHLIGHT":
      if (sender.tab) {
        // Only forward messages from content scripts
        chrome.runtime.sendMessage(message).catch(() => {
          // Ignore errors if popup is not open
        });
      }
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }
  return true; // Keep the message channel open for async response
});
