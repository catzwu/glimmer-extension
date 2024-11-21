// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/MarkdownExporter.tsx
import React, { useState, useEffect } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface MarkdownExporterProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const DEFAULT_TEMPLATE = `---
updated: {{date}}
link: {{url}}
recommended: false
type: [[Readings]]
---
# {{title}}

## Highlights
{{highlights}}

## Flashcards
{{flashcards}}`;

const MarkdownExporter: React.FC<MarkdownExporterProps> = ({ showStatus }) => {
  const { highlights, cards } = useExtension();
  const [currentUrl, setCurrentUrl] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [obsidianVault, setObsidianVault] = useState("cwu");
  const [obsidianFolder, setObsidianFolder] = useState("30 readings");
  const [silentMode, setSilentMode] = useState(true);

  useEffect(() => {
    const getCurrentTabInfo = async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tabs[0]?.url || "No URL available";
        const title = tabs[0]?.title || "Untitled Page";
        setCurrentUrl(url);
        setPageTitle(title);
      } catch (error) {
        console.error("[MarkdownExporter] Error getting tab info:", error);
        setCurrentUrl("Error getting URL");
        setPageTitle("Error getting title");
      }
    };

    const loadSavedSettings = () => {
      chrome.storage.local.get(
        ["obsidianVault", "obsidianFolder", "silentMode"],
        (result) => {
          if (result.obsidianVault) setObsidianVault(result.obsidianVault);
          if (result.obsidianFolder) setObsidianFolder(result.obsidianFolder);
          if (typeof result.silentMode === "boolean")
            setSilentMode(result.silentMode);
        }
      );
    };

    getCurrentTabInfo();
    loadSavedSettings();
  }, []);

  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[<>:"/\\|?*]/g, "_").slice(0, 100);
  };

  const updateSettings = () => {
    chrome.storage.local.set(
      { obsidianVault, obsidianFolder, silentMode },
      () => {
        setShowSettings(false);
        showStatus("Settings saved successfully!", "success");
      }
    );
  };

  const createMarkdownContent = () => {
    const highlightsText = highlights
      .map((highlight) => highlight.text.trim())
      .map((text) => `- ${text}`);

    const cardsText = cards.filter((card) => card.trim()).join("\n");

    return DEFAULT_TEMPLATE.replace(
      "{{date}}",
      new Date().toISOString().slice(0, 10)
    )
      .replace("{{title}}", pageTitle)
      .replace("{{url}}", currentUrl)
      .replace(
        "{{highlights}}",
        highlightsText.length
          ? highlightsText.join("\n")
          : "_No highlights yet_"
      )
      .replace("{{flashcards}}", cardsText || "_No flashcards yet_")
      .trim();
  };

  const createObsidianUri = (content: string) => {
    const filename = sanitizeFilename(pageTitle);
    const filepath = obsidianFolder
      ? `${obsidianFolder}/${filename}`
      : filename;

    let uri = `obsidian://new?vault=${encodeURIComponent(
      obsidianVault
    )}&file=${encodeURIComponent(filepath)}`;

    uri += `&content=${encodeURIComponent(content)}`;
    uri += "&append=true";

    if (silentMode) {
      uri += "&silent=true";
    }

    return uri;
  };

  const exportToObsidian = async () => {
    try {
      if (!obsidianVault) {
        setShowSettings(true);
        showStatus("Please set your Obsidian vault name first", "error");
        return;
      }

      const markdownContent = createMarkdownContent();
      const obsidianUri = createObsidianUri(markdownContent);
      window.open(obsidianUri, "_blank");
      showStatus("File created in Obsidian!", "success");
    } catch (error) {
      console.error("[MarkdownExporter] Export error:", error);
      showStatus("Failed to export to Obsidian", "error");
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={exportToObsidian}
        disabled={highlights.length === 0 && cards.length === 0}
        className="primary-button w-full"
        aria-label="Export to Obsidian"
      >
        Export to Obsidian
      </button>

      <div className="flex items-center justify-between text-sm">
        {!showSettings && (
          <button
            onClick={() => setShowSettings(true)}
            className="text-blue-500 hover:text-blue-600"
          >
            Obsidian Settings
          </button>
        )}
        {!showSettings && obsidianVault && (
          <span className="text-gray-500">
            {obsidianFolder
              ? `${obsidianVault}/${obsidianFolder}`
              : obsidianVault}
          </span>
        )}
      </div>

      {showSettings && (
        <div className="space-y-2 mt-2">
          <input
            type="text"
            value={obsidianVault}
            onChange={(e) => setObsidianVault(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Obsidian vault name"
          />
          <input
            type="text"
            value={obsidianFolder}
            onChange={(e) => setObsidianFolder(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Folder path (optional)"
          />
          <div className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              id="silentMode"
              checked={silentMode}
              onChange={(e) => setSilentMode(e.target.checked)}
              className="rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="silentMode" className="text-gray-700">
              Silent Mode (don't open file after creation)
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowSettings(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={updateSettings}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarkdownExporter;
