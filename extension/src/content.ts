import './content.css';

// Make this a module by adding an export
export {};

console.log('[Content] Content script loaded');
let isExtensionActive = false;  // Start with inactive state by default

// Function to initialize the content script
const initialize = async () => {
  try {
    // Get initial state
    const response = await chrome.runtime.sendMessage({ 
      type: "GET_STATE"
    });

    if (response) {
      isExtensionActive = response.isActive;
      console.log('[Content] Content script initialized with state:', isExtensionActive);
    }
  } catch (error) {
    console.error('[Content] Error initializing content script:', error);
  }
};

// Initialize when the script loads
initialize();

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  console.log('[Content] Received message:', message);

  switch (message.type) {
    case "ACTIVATION_CHANGED":
      isExtensionActive = message.isActive;
      sendResponse({ received: true });
      break;

    case "REMOVE_HIGHLIGHT_CONTENT_SCRIPT":
      const element = document.querySelector(`[data-highlight-id="${message.id}"]`);
      if (!element) {
        console.error('[Content] Cannot find element with highlight id:', message.id);
        return;
      }
      deleteHighlight(element as HTMLElement);
      sendResponse({ received: true });
      break;
  }
  return true;
});

function showHighlightFeedback(x: number, y: number) {
  const feedback = document.createElement("div");
  feedback.textContent = "✓ Highlight saved!";
  feedback.className = "mochi-highlight-feedback";
  feedback.style.setProperty('top', `${y + 10}px`, 'important');
  feedback.style.setProperty('left', `${x + 10}px`, 'important');

  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 1500);
}

async function createHighlight(range: Range, x: number, y: number, selectedText: string) {
  if(chrome.runtime.id === undefined) {
    console.error('[Content] No runtime ID found');
    return;
  }

  try {
    if (range.collapsed) {
      console.error('[Content] Invalid range: Range is collapsed');
      return;
    }

    // Create a new range to avoid modifying the original
    const safeRange = range.cloneRange();
    const highlightId = crypto.randomUUID();

    try {
      const span = document.createElement('span');
      span.className = 'mochi-highlight-selection';
      span.dataset.highlightId = highlightId;
      safeRange.surroundContents(span);
      
      chrome.runtime.sendMessage({
        type: "ADD_HIGHLIGHT",
        text: selectedText,
        id: highlightId
      });

      showHighlightFeedback(x, y);

    } catch (e) {
      console.log('[Content] Falling back to alternative highlight method:', e);
      
      // Extract text nodes within the range
      const fragment = safeRange.cloneContents();
      const span = document.createElement('span');
      span.className = 'mochi-highlight-selection';
      span.dataset.highlightId = highlightId;
      span.appendChild(fragment);
      
      safeRange.deleteContents();
      safeRange.insertNode(span);
      
      chrome.runtime.sendMessage({
        type: "ADD_HIGHLIGHT",
        text: selectedText,
        id: highlightId
      });

      showHighlightFeedback(x, y);
    }
  } catch (error) {
    console.error('[Content] Error creating text highlight:', error);
  }
}

function deleteHighlight(element: HTMLElement) {
  
  const textNode = document.createTextNode(element.textContent || '');
  element.parentNode?.replaceChild(textNode, element);
  
}

// Setup highlight listener
document.addEventListener("mouseup", (e) => {
  if (!isExtensionActive) return;

  const target = e.target as HTMLElement;
  const highlightElement : HTMLElement | null = target.closest(".mochi-highlight-selection");
  
  // If clicking on an existing highlight, delete it
  if (highlightElement) {
    const highlightId = highlightElement.dataset.highlightId;
    console.log(`[Content] Deleting highlight from webpage:`, highlightId);
    chrome.runtime.sendMessage({
      type: "REMOVE_HIGHLIGHT",
      id: highlightId,
    });
    return;
  }

  const selection = window.getSelection();
  if (selection) {
  const selectedText = selection.toString().trim();
  if (selectedText.length > 0) {
      console.log('[Content] Sending highlight:', selectedText);
    try {
      
      const range = selection.getRangeAt(0);
      createHighlight(range, e.clientX, e.clientY, selectedText);
      selection.removeAllRanges();

    } catch (error) {
      console.error("[Content] Error creating highlight:", error);
    }
  }}
});

