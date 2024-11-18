// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/MarkdownExporter.tsx
import React, { useState, useEffect } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface MarkdownExporterProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const MarkdownExporter: React.FC<MarkdownExporterProps> = ({ showStatus }) => {
  const { highlights, cards } = useExtension();
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [pageTitle, setPageTitle] = useState<string>("");
  const [showSettings, setShowSettings] = useState(false);
  const [obsidianVault, setObsidianVault] = useState("cwu");
  const [obsidianFolder, setObsidianFolder] = useState("30 readings");
  const [silentMode, setSilentMode] = useState(true);

  // Get current tab URL and title, and load saved settings when component mounts
  useEffect(() => {
    const getCurrentTabInfo = async () => {
      try {
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const url = tabs[0]?.url || "No URL available";
        const title = tabs[0]?.title || "Untitled Page";
        console.log("[MarkdownExporter] Got current tab info:", { url, title });
        setCurrentUrl(url);
        setPageTitle(title);
      } catch (error) {
        console.error(
          "[MarkdownExporter] Error getting current tab info:",
          error
        );
        setCurrentUrl("Error getting URL");
        setPageTitle("Error getting title");
      }
    };

    getCurrentTabInfo();

    // Load saved Obsidian settings
    chrome.storage.local.get(
      ["obsidianVault", "obsidianFolder", "silentMode"],
      (result) => {
        if (result.obsidianVault) {
          setObsidianVault(result.obsidianVault);
        }
        if (result.obsidianFolder) {
          setObsidianFolder(result.obsidianFolder);
        }
        if (typeof result.silentMode === "boolean") {
          setSilentMode(result.silentMode);
        }
      }
    );
  }, []);

  const [template, setTemplate] = useState(`---
updated: ${new Date().toISOString().slice(0, 10)}
link: {{url}}
recommended: false
type: [[Readings]]
---
# {{title}}

## Highlights and Flashcards

### Highlights
{{highlights}}

### Flashcards
{{flashcards}}`);

  const sanitizeFilename = (filename: string): string => {
    // Replace invalid filename characters with underscores
    return filename.replace(/[<>:"/\\|?*]/g, "_").slice(0, 100); // Limit length to avoid too long filenames
  };

  const updateSettings = () => {
    chrome.storage.local.set(
      {
        obsidianVault,
        obsidianFolder,
        silentMode,
      },
      () => {
        setShowSettings(false);
        showStatus("Settings saved successfully!", "success");
      }
    );
  };

  const exportToObsidian = async () => {
    try {
      if (!obsidianVault) {
        setShowSettings(true);
        showStatus("Please set your Obsidian vault name first", "error");
        return;
      }

      console.log("[MarkdownExporter] Exporting to Obsidian:", {
        vault: obsidianVault,
        folder: obsidianFolder,
        silent: silentMode,
      });

      const highlightsText = highlights.map(
        (highlight) => `- ${highlight.text}`
      );

      const markdownContent = template
        .replace(/{{title}}/g, pageTitle) // Keep original title with spaces
        .replace("{{url}}", currentUrl)
        .replace("{{highlights}}", highlightsText.join("\n"))
        .replace("{{flashcards}}", cards.join("\n"));

      // Create the Obsidian URI
      const filename = sanitizeFilename(pageTitle);
      const filepath = obsidianFolder
        ? `${obsidianFolder}/${filename}`
        : filename;
      const encodedContent = encodeURIComponent(markdownContent);
      const obsidianUri = `obsidian://new?vault=${encodeURIComponent(
        obsidianVault
      )}&file=${encodeURIComponent(
        filepath
      )}&content=${encodedContent}&append=true${
        silentMode ? "&silent=true" : ""
      }`;

      // Open the Obsidian URI
      window.open(obsidianUri, "_blank");
      showStatus("File created in Obsidian!", "success");
      console.log("[MarkdownExporter] Successfully exported to Obsidian");
    } catch (error) {
      console.error("[MarkdownExporter] Error exporting to Obsidian:", error);
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
            onClick={() => setShowSettings(!showSettings)}
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
