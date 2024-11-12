// Initialize highlights array
let highlights = [];
console.log("Mochi Flashcard Creator: Content script loaded");

function createHighlight(selection) {
  try {
    const range = selection.getRangeAt(0);
    const highlightedText = selection.toString().trim();

    // Extract the text nodes within the range
    const textNodes = getTextNodesInRange(range);
    if (textNodes.length === 0) return false;

    // Create highlights for each text node
    const highlightId = Date.now().toString();
    textNodes.forEach((node) => {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);

      // Calculate the correct start and end offsets for this node
      let startOffset = 0;
      let endOffset = node.length;

      // If this is the start node, use the selection's start offset
      if (node === range.startContainer) {
        startOffset = range.startOffset;
      }

      // If this is the end node, use the selection's end offset
      if (node === range.endContainer) {
        endOffset = range.endOffset;
      }

      // Only highlight if we have a valid range
      if (startOffset < endOffset && startOffset >= 0 && endOffset <= node.length) {
        try {
          nodeRange.setStart(node, startOffset);
          nodeRange.setEnd(node, endOffset);

          // Create highlight span
          const span = document.createElement("span");
          span.className = "mochi-highlight-selection";
          span.dataset.highlightId = highlightId;

          nodeRange.surroundContents(span);
        } catch (e) {
          console.warn("Failed to highlight specific node:", e);
        }
      }
    });

    // Store the highlight
    const highlight = {
      id: highlightId,
      text: highlightedText,
      context: getContext(document.querySelector(`[data-highlight-id="${highlightId}"]`)),
      url: window.location.href,
      title: document.title,
    };

    highlights.push(highlight);

    // Notify popup of new highlight
    chrome.runtime.sendMessage({
      action: "addHighlight",
      highlight: highlight,
    });

    return true;
  } catch (error) {
    console.error("Error creating highlight:", error);
    return false;
  }
}

function getTextNodesInRange(range) {
  const textNodes = [];

  // If the selection is within a single text node
  if (
    range.startContainer === range.endContainer &&
    range.startContainer.nodeType === Node.TEXT_NODE
  ) {
    textNodes.push(range.startContainer);
    return textNodes;
  }

  // Get all text nodes between start and end containers
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    null
  );

  let node;
  while ((node = walker.nextNode())) {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    
    if (
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0 &&
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0
    ) {
      textNodes.push(node);
    }
  }

  // Make sure we include the start and end containers if they're text nodes
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    textNodes.unshift(range.startContainer);
  }
  if (range.endContainer.nodeType === Node.TEXT_NODE && range.endContainer !== range.startContainer) {
    textNodes.push(range.endContainer);
  }

  return textNodes;
}

function isNodeInRange(node, range) {
  const nodeRange = document.createRange();
  nodeRange.selectNode(node);

  const isAfterStart =
    range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0;
  const isBeforeEnd = range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0;

  return isAfterStart && isBeforeEnd;
}

function getContext(element) {
  const sentence = getSurroundingSentence(element);
  return sentence || element.parentElement.textContent.trim();
}

function getSurroundingSentence(element) {
  let text = "";
  let current = element;

  // Look backwards for sentence start
  while (current && current.previousSibling) {
    const prevText = current.previousSibling.textContent;
    if (prevText.includes(".")) {
      text = prevText.split(".").pop() + text;
      break;
    }
    text = prevText + text;
    current = current.previousSibling;
  }

  // Add highlighted text
  text += element.textContent;

  // Look forward for sentence end
  current = element;
  while (current && current.nextSibling) {
    const nextText = current.nextSibling.textContent;
    if (nextText.includes(".")) {
      text += nextText.split(".")[0] + ".";
      break;
    }
    text += nextText;
    current = current.nextSibling;
  }

  return text.trim();
}

function showHighlightFeedback(x, y) {
  const feedback = document.createElement("div");
  feedback.textContent = "✓ Highlight saved!";
  feedback.className = "mochi-highlight-feedback";
  feedback.style.top = `${y + 10}px`;
  feedback.style.left = `${x + 10}px`;
  
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 1500);
}

function removeHighlight(highlightId) {
  const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
  if (highlightElement) {
    const parent = highlightElement.parentNode;
    parent.replaceChild(document.createTextNode(highlightElement.textContent), highlightElement);
    highlights = highlights.filter(h => h.id !== highlightId);
    
    // Notify popup of removed highlight
    chrome.runtime.sendMessage({
      action: "removeHighlight",
      highlightId: highlightId
    });
  }
}

// Event Listeners
document.addEventListener("mouseup", function (e) {
  const selection = window.getSelection();
  if (!selection || !selection.toString().trim()) return;

  // Only proceed if we're not clicking inside the extension popup
  if (e.target.closest(".mochi-highlight-selection")) return;

  if (createHighlight(selection)) {
    showHighlightFeedback(e.clientX, e.clientY);
  }
});

document.addEventListener("click", function(e) {
  const highlightElement = e.target.closest(".mochi-highlight-selection");
  if (highlightElement) {
    removeHighlight(highlightElement.dataset.highlightId);
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse(true);
  } else if (request.action === "getHighlights") {
    sendResponse(highlights);
  } else if (request.action === "clearHighlights") {
    document.querySelectorAll(".mochi-highlight-selection").forEach((el) => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
    });
    highlights = [];
    sendResponse({ success: true });
  } else if (request.action === "removeHighlight") {
    removeHighlight(request.highlightId);
    sendResponse({ success: true });
  }
  return true;
});
