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

  // Get current tab URL and title when component mounts
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
  }, []);

  const [template, setTemplate] = useState(`
    ---
    url: {{url}}
    updated: ${new Date().toISOString().slice(0, 10)}
    ---
    # {{title}}

## Highlights and Flashcards

### Highlights
{{highlights}}

### Flashcards
{{flashcards}}`);

  const sanitizeFilename = (filename: string): string => {
    // Replace invalid filename characters with underscores
    return filename
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .slice(0, 100); // Limit length to avoid too long filenames
  };

  const exportToMarkdown = async () => {
    try {
      console.log("[MarkdownExporter] Exporting markdown with URL and title:", {
        url: currentUrl,
        title: pageTitle,
      });
      const highlightsText = highlights.map(
        (highlight) => `- ${highlight.text}`
      );

      const markdownContent = template
        .replace(/{{title}}/g, pageTitle) // Replace all instances of {{title}}
        .replace("{{url}}", currentUrl)
        .replace("{{highlights}}", highlightsText.join("\n"))
        .replace("{{flashcards}}", cards.join("\n"));

      // Create a Blob with the markdown content
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const filename = `${sanitizeFilename(pageTitle)}.md`;

      // Use chrome.downloads API to save the file
      chrome.downloads.download(
        {
          url: url,
          filename: filename,
          saveAs: true,
        },
        () => {
          URL.revokeObjectURL(url);
          showStatus("Successfully exported markdown file", "success");
          console.log("[MarkdownExporter] Successfully exported markdown file");
        }
      );
    } catch (error) {
      console.error("[MarkdownExporter] Error exporting markdown:", error);
      showStatus("Failed to export markdown file", "error");
    }
  };

  return (
    <button
      onClick={exportToMarkdown}
      disabled={highlights.length === 0 && cards.length === 0}
      className="primary-button"
      aria-label="Export to Markdown"
    >
      Export to Markdown
    </button>
  );
};

export default MarkdownExporter;
