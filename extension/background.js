let isExtensionActive = true;
let highlights = [];
let cards = [];

// Load initial state from storage
chrome.storage.local.get(["highlights", "cards", "isActive"], (result) => {
  highlights = result.highlights || [];
  cards = result.cards || [];
  isExtensionActive = result.isActive ?? true;
});

// Save state to storage
const saveState = () => {
  chrome.storage.local.set({
    highlights,
    cards,
    isActive: isExtensionActive,
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received:", message.type);

  switch (message.type) {
    case "TOGGLE_ACTIVATION":
      isExtensionActive = message.isActive;
      saveState();

      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs
              .sendMessage(tab.id, {
                type: "EXTENSION_STATE",
                isActive: isExtensionActive,
              })
              .catch(() => {
                // Ignore errors for tabs without content script
              });
          }
        });
      });
      sendResponse({ success: true });
      break;

    case "GET_EXTENSION_STATE":
      sendResponse({
        isActive: isExtensionActive,
        highlights,
        cards,
      });
      break;

    case "ADD_HIGHLIGHT":
      if (message.text) {
        const newHighlight = {
          id: message.id,
          text: message.text,
          url: sender.tab?.url || "",
          timestamp: Date.now(),
        };
        highlights = [...highlights, newHighlight];
        saveState();
        // Notify popup of new highlight
        chrome.runtime
          .sendMessage({
            type: "HIGHLIGHTS_UPDATED",
            highlights,
          })
          .catch(() => {
            // Ignore errors if popup is not open
          });
      }
      sendResponse({ success: true });
      break;

    case "REMOVE_HIGHLIGHT":
      console.log("Removing highlight (background):", message.id);
      if (message.id) {
        highlights = highlights.filter(
          (highlight) => highlight.id !== message.id
        );
        saveState();
        sendResponse({ success: true });

        // Notify popup of removed highlight if the sender is the content script
        console.log("Notifying popup of removed highlight:", message.id);
        chrome.runtime
          .sendMessage({
            type: "HIGHLIGHTS_UPDATED",
            highlights,
          })
          .catch(() => {
            // Ignore errors if popup is not open
          });

        // Notify content script of removed highlight if the sender is the popup
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            if (tab.id) {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "REMOVE_HIGHLIGHT_CONTENT_SCRIPT",
                  id: message.id,
                })
                .catch(() => {
                  // Ignore errors for tabs without content script
                });
            }
          });
        });
      } else {
        sendResponse({ error: "Invalid highlight ID" });
      }
      break;

    case "ADD_CARDS":
      if (message.cards) {
        console.log("Background adding cards:", message.cards);
        cards = message.cards;
        saveState();
        sendResponse({ success: true });
      } else {
        sendResponse({ error: "Invalid card data" });
      }
      break;

    case "CLEAR_HIGHLIGHTS":
      highlights = [];
      saveState();
      sendResponse({ success: true });
      break;

    case "CLEAR_CARDS":
      cards = [];
      saveState();
      sendResponse({ success: true });
      break;

    case "GET_HIGHLIGHTS":
      sendResponse({ highlights });
      break;

    case "GET_CARDS":
      sendResponse({ cards });
      break;

    default:
      sendResponse({ error: "Unknown message type" });
  }
  return true; // Keep the message channel open for async response
});
