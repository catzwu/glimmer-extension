// Make this a module by adding an export
export {};

console.log('Content script loaded');
let isExtensionActive = true;

// Function to initialize the content script
const initialize = async () => {
  try {
    // Get initial state
    const response = await chrome.runtime.sendMessage({ type: "GET_EXTENSION_STATE" });
    if (response) {
      isExtensionActive = response.isActive;
      console.log('Content script initialized with state:', isExtensionActive);
    }
  } catch (error) {
    console.error('Error initializing content script:', error);
  }
};

// Initialize when the script loads
initialize();

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('Content script received message:', message);
  if (message.type === "EXTENSION_STATE") {
    isExtensionActive = message.isActive;
    console.log('Extension state updated:', isExtensionActive);
  }
  sendResponse({ received: true });
  return true;
});

// Setup highlight listener
document.addEventListener("mouseup", () => {
  if (!isExtensionActive) return;

  const selection = window.getSelection();
  if (selection) {
    const selectedText = selection.toString().trim();
    if (selectedText.length > 0) {
      console.log('Sending highlight:', selectedText);
      try {
        chrome.runtime.sendMessage({
          type: "ADD_HIGHLIGHT",
          text: selectedText,
        });
      } catch (error) {
        console.error("Error sending highlight:", error);
      }
    }
  }
});
