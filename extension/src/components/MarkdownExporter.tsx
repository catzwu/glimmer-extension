// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/MarkdownExporter.tsx
import React, { useState } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface MarkdownExporterProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const MarkdownExporter: React.FC<MarkdownExporterProps> = ({ showStatus }) => {
  const { highlights, cards } = useExtension();
  const [template, setTemplate] = useState(`
    ---
    url: ${"placeholder"}
    updated: ${new Date().toISOString().slice(0, 10)}
    ---
    ## Highlights and Flashcards

### Highlights
{{highlights}}

### Flashcards
{{flashcards}}`);

  const exportToMarkdown = async () => {
    try {
      const highlightsText = highlights.map((highlight) => highlight.text);

      const markdownContent = template
        .replace("{{highlights}}", highlightsText.join("\n"))
        .replace("{{flashcards}}", cards.join("\n"));

      // Create a Blob with the markdown content
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      // Use chrome.downloads API to save the file
      chrome.downloads.download(
        {
          url: url,
          filename: "mochi_flashcards.md",
          saveAs: true,
        },
        () => {
          URL.revokeObjectURL(url);
          showStatus("Successfully exported markdown file", "success");
        }
      );
    } catch (error) {
      console.error(error);
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
    // <div className="bg-white p-4 rounded-lg shadow-md">
    //   <h3 className="text-lg font-semibold mb-4">Markdown Export</h3>
    // {/* <textarea
    //   value={template}
    //   onChange={(e) => setTemplate(e.target.value)}
    //   className="w-full p-2 mb-4 border rounded text-sm h-32"
    //   placeholder="Customize your markdown template"
    // /> */}
    // </div>
  );
};

export default MarkdownExporter;
