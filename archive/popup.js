import {
  hasClaudeKey,
  generateAIFlashcards,
  createAIFlashcardPreview,
  initAI,
} from "./ai.js";

// State
let currentHighlights = [];
let aiCards = [];
let hasApiKey = false;
let isExtensionActivated = false;

/**
 * Helper Functions
 */
function handleButtonState(buttonId, isError = false) {
  const button = document.getElementById(buttonId);
  if (isError) {
    button.classList.add("error");
    setTimeout(() => button.classList.remove("error"), 1000);
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById("status-message");
  statusEl.textContent = message;
  statusEl.className = type;

  if (type === "error") {
    statusEl.style.display = "block";
  } else {
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.className = "";
    }, 3000);
  }
}

async function canCommunicateWithTab(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: "ping" });
    return true;
  } catch {
    return false;
  }
}

function removeHighlight(highlightId) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      await chrome.tabs.sendMessage(tabs[0].id, {
        action: "removeHighlight",
        highlightId: highlightId,
      });

      currentHighlights = currentHighlights.filter((h) => h.id !== highlightId);
      updateHighlightsList();
      showStatus("Highlight removed", "success");
    } catch (error) {
      showStatus("Failed to remove highlight", "error");
    }
  });
}

async function removeCard(index) {
  try {
    // Remove card from array
    aiCards.splice(index, 1);

    // Update content script
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tabs[0].id, {
      action: "setAICards",
      cards: aiCards,
    });

    // Update display
    updateHighlightsList();
    showStatus("Card removed", "success");
  } catch (error) {
    showStatus("Failed to remove card", "error");
  }
}

async function updateHighlightsList() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }

    const canCommunicate = await canCommunicateWithTab(tabs[0].id);
    if (!canCommunicate) {
      throw new Error("Please refresh the page to use the highlighter");
    }

    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: "getHighlights",
    });

    if (response) {
      currentHighlights = response.highlights;
      aiCards = response.aiCards;

      const container = document.getElementById("highlights-list");
      const createCardsButton = document.getElementById("create-cards");
      const aiCardsContainer = document.getElementById("ai-cards-container");
      const aiCardsList = document.getElementById("ai-cards-list");

      // Handle create cards button visibility and state
      createCardsButton.style.display = aiCards.length > 0 ? "none" : "block";
      createCardsButton.disabled = currentHighlights.length === 0;

      // First show highlights
      container.innerHTML = currentHighlights.length
        ? ""
        : '<div class="no-highlights">Select text on the page to create highlights</div>';

      currentHighlights.forEach((highlight) => {
        const div = document.createElement("div");
        div.className = "highlight-item";

        const textDiv = document.createElement("div");
        textDiv.className = "highlight-text";
        textDiv.textContent = highlight.text;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-highlight";
        deleteButton.innerHTML = "×";
        deleteButton.setAttribute("aria-label", "Delete highlight");
        deleteButton.onclick = () => removeHighlight(highlight.id);

        div.appendChild(textDiv);
        div.appendChild(deleteButton);
        container.appendChild(div);
      });

      // Handle AI cards visibility and content
      aiCardsContainer.style.display = aiCards.length > 0 ? "block" : "none";
      if (aiCards.length > 0) {
        aiCardsList.innerHTML = "";
        aiCards.forEach((card, index) => {
          aiCardsList.appendChild(
            createAIFlashcardPreview(card, index, removeCard)
          );
        });
      }
    }
  } catch (error) {
    showStatus(
      error.message || "Unable to get highlights. Try refreshing the page.",
      "error"
    );
  }
}

/**
 * Event Listeners
 */

// Listen for new highlights from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "addHighlight") {
    currentHighlights.push(request.highlight);
    updateHighlightsList();
    showStatus("New highlight added!", "success");
  } else if (request.action === "removeHighlight") {
    currentHighlights = currentHighlights.filter(
      (h) => h.id !== request.highlightId
    );
    updateHighlightsList();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // Load API keys
  const result = await chrome.storage.local.get([
    "mochiApiKey",
    "extensionActivated",
  ]);
  if (result.mochiApiKey) {
    document.getElementById("mochi-api-key").value = result.mochiApiKey;
    hasApiKey = true;
  }

  isExtensionActivated = result.extensionActivated || false;
  updateActivationButton();

  // Initialize AI functionality
  await initAI();

  // Check tab communication
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length > 0) {
    const canCommunicate = await canCommunicateWithTab(tabs[0].id);
    if (!canCommunicate) {
      showStatus("Please refresh the page to use the highlighter", "error");
      document
        .querySelectorAll("button")
        .forEach((button) => (button.disabled = true));
      return;
    }

    // Send activation state to content script
    if (isExtensionActivated) {
      await chrome.tabs.sendMessage(tabs[0].id, { action: "activate" });
    }
  }

  updateHighlightsList();
});

// Add activation toggle button event listener
document
  .getElementById("toggle-activation")
  .addEventListener("click", async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) return;

    isExtensionActivated = !isExtensionActivated;
    await chrome.storage.local.set({
      extensionActivated: isExtensionActivated,
    });

    // Send activation state to content script
    await chrome.tabs.sendMessage(tabs[0].id, {
      action: isExtensionActivated ? "activate" : "deactivate",
    });

    updateActivationButton();
    showStatus(
      isExtensionActivated ? "Extension activated" : "Extension deactivated",
      "success"
    );
  });

function updateActivationButton() {
  const button = document.getElementById("toggle-activation");
  button.textContent = isExtensionActivated ? "On" : "Off";
  button.classList.toggle("activated", isExtensionActivated);
}

// Create AI flashcards
async function createCards() {
  const button = document.getElementById("create-cards");
  button.disabled = true;

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      throw new Error("No active tab found");
    }

    const canCommunicate = await canCommunicateWithTab(tabs[0].id);
    if (!canCommunicate) {
      throw new Error("Please refresh the page to use the highlighter");
    }

    if (currentHighlights.length === 0) {
      throw new Error("No highlights to create flashcards from!");
    }

    showStatus("Generating AI flashcards...", "success");

    // Generate flashcards
    aiCards = await generateAIFlashcards(currentHighlights);

    // Store AI cards in content script
    await chrome.tabs.sendMessage(tabs[0].id, {
      action: "setAICards",
      cards: aiCards,
    });

    updateHighlightsList();

    showStatus(
      'AI Flashcards created! Click "Export to Mochi" to save them.',
      "success"
    );
  } catch (error) {
    console.error("Error creating flashcards:", error);
    handleButtonState("create-cards", true);
    showStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
}
document.getElementById("create-cards").addEventListener("click", createCards);
document
  .getElementById("regenerate-cards")
  .addEventListener("click", createCards);

document
  .getElementById("clear-highlights")
  .addEventListener("click", async () => {
    const button = document.getElementById("clear-highlights");
    button.disabled = true;

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length === 0) {
        throw new Error("No active tab found");
      }

      const canCommunicate = await canCommunicateWithTab(tabs[0].id);
      if (!canCommunicate) {
        throw new Error("Please refresh the page to use the highlighter");
      }

      await chrome.tabs.sendMessage(tabs[0].id, { action: "clearHighlights" });

      // Clear both highlights and AI cards
      currentHighlights = [];
      aiCards = [];

      document.getElementById("highlights-list").innerHTML =
        '<div class="no-highlights">No highlights yet. Select text on the page to create highlights.</div>';
      showStatus("Highlights cleared!", "success");
    } catch (error) {
      handleButtonState("clear-highlights", true);
      showStatus(
        error.message || "Failed to clear highlights. Try refreshing the page.",
        "error"
      );
    } finally {
      button.disabled = false;
    }
  });

// Export to Mochi
document
  .getElementById("export-to-mochi")
  .addEventListener("click", async () => {
    const button = document.getElementById("export-to-mochi");
    button.disabled = true;

    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length === 0) {
        throw new Error("No active tab found");
      }

      const canCommunicate = await canCommunicateWithTab(tabs[0].id);
      if (!canCommunicate) {
        throw new Error("Please refresh the page to use the highlighter");
      }

      if (aiCards.length === 0) {
        throw new Error("No cards to export!");
      }

      let apiKey = document.getElementById("mochi-api-key").value;

      if (!hasApiKey && !apiKey) {
        document.querySelector(".api-keys-section").style.display = "block";
        throw new Error("Please enter your Mochi API key");
      }

      if (!hasApiKey && apiKey) {
        await chrome.storage.local.set({ mochiApiKey: apiKey });
        hasApiKey = true;
      }

      for (const card of aiCards) {
        const card_data = {
          content: card,
          "deck-id": "mMrpYLrT",
        };

        const response = await fetch("https://app.mochi.cards/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(apiKey + ":")}`,
          },
          body: JSON.stringify(card_data),
        });

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Invalid API key");
          } else if (response.status === 403) {
            throw new Error(
              response.statusText ||
                "Access denied. Please check your API key and try again."
            );
          } else if (response.status === 429) {
            throw new Error("Too many requests. Please try again later");
          } else {
            throw new Error(
              response.statusText ||
                `Failed to create card (HTTP ${response.status})`
            );
          }
        }
      }

      showStatus("Successfully exported cards to Mochi!", "success");
    } catch (error) {
      if (error.message.includes("Failed to create card")) {
        hasApiKey = false;
        document.querySelector(".api-keys-section").style.display = "block";
        showStatus("Invalid API key. Please check and try again.", "error");
      } else {
        handleButtonState("export-to-mochi", true);
        showStatus(
          error.message || "Error exporting to Mochi. Please try again.",
          "error"
        );
      }
    } finally {
      button.disabled = false;
    }
  });
