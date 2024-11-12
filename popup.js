// State
let currentHighlights = [];
let hasApiKey = false;

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

function createFlashcardPreview(highlight, index) {
  const cardDiv = document.createElement("div");
  cardDiv.className = "flashcard-preview";

  const frontDiv = document.createElement("div");
  frontDiv.className = "card-front";
  frontDiv.innerHTML = `<strong>Card ${index + 1} - Front</strong>${
    highlight.text
  }`;

  const backDiv = document.createElement("div");
  backDiv.className = "card-back";
  backDiv.innerHTML = `<strong>Back</strong>
    <div class="context">${highlight.context}</div>`;

  cardDiv.appendChild(frontDiv);
  cardDiv.appendChild(backDiv);
  return cardDiv;
}

async function exportToMochi(apiKey, highlights) {
  let header = {
    "Content-Type": "application/json",
    Authorization: `Basic ${btoa(apiKey + ":")}`,
  };

  for (const highlight of highlights) {
    const card = {
      content: `${highlight.text}\n---\n${highlight.context}`,
      "deck-id": "vf6VuQBa",
    };

    try {
      const response = await fetch("https://app.mochi.cards/api/cards", {
        method: "POST",
        headers: header,
        credentials: "include",
        body: JSON.stringify(card),
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
    } catch (error) {
      throw error;
    }
  }
}

function removeHighlight(highlightId) {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      await chrome.tabs.sendMessage(tabs[0].id, {
        action: "removeHighlight",
        highlightId: highlightId
      });
      
      currentHighlights = currentHighlights.filter(h => h.id !== highlightId);
      updateHighlightsList();
      showStatus("Highlight removed", "success");
    } catch (error) {
      showStatus("Failed to remove highlight", "error");
    }
  });
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
      currentHighlights = response;
      const container = document.getElementById("highlights-list");
      container.innerHTML = response.length
        ? ""
        : '<div class="no-highlights">No highlights yet. Select text on the page to create highlights.</div>';

      response.forEach((highlight) => {
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
    currentHighlights = currentHighlights.filter(h => h.id !== request.highlightId);
    updateHighlightsList();
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const result = await chrome.storage.local.get(["mochiApiKey"]);
  if (result.mochiApiKey) {
    document.getElementById("mochi-api-key").value = result.mochiApiKey;
    hasApiKey = true;
  }

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
  }

  updateHighlightsList();
});

document.getElementById("create-cards").addEventListener("click", async () => {
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

    const container = document.getElementById("highlights-list");
    container.innerHTML = "<h3>Flashcard Previews</h3>";

    currentHighlights.forEach((highlight, index) => {
      container.appendChild(createFlashcardPreview(highlight, index));
    });

    showStatus(
      'Flashcards created! Click "Export to Mochi" to save them.',
      "success"
    );
  } catch (error) {
    handleButtonState("create-cards", true);
    showStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
});

document.getElementById("save-api-key").addEventListener("click", async () => {
  const apiKey = document.getElementById("mochi-api-key").value.trim();
  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  await chrome.storage.local.set({ mochiApiKey: apiKey });
  hasApiKey = true;
  document.querySelector(".api-key-section").style.display = "none";
  showStatus("API key saved!", "success");
});

document.getElementById("mochi-api-key").addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    document.getElementById("save-api-key").click();
  }
});

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

      currentHighlights = [];
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

      if (currentHighlights.length === 0) {
        throw new Error("No highlights to export!");
      }

      let apiKey = document.getElementById("mochi-api-key").value;

      if (!hasApiKey && !apiKey) {
        document.querySelector(".api-key-section").style.display = "block";
        throw new Error("Please enter your Mochi API key");
      }

      if (!hasApiKey && apiKey) {
        await chrome.storage.local.set({ mochiApiKey: apiKey });
        hasApiKey = true;
        document.querySelector(".api-key-section").style.display = "none";
      }

      await exportToMochi(apiKey, currentHighlights);
      showStatus("Successfully exported cards to Mochi!", "success");
    } catch (error) {
      if (error.message.includes("Failed to create card")) {
        hasApiKey = false;
        document.querySelector(".api-key-section").style.display = "block";
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
