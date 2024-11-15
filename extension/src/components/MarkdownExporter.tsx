// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/MarkdownExporter.tsx
import React, { useState } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface MarkdownExporterProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const MarkdownExporter: React.FC<MarkdownExporterProps> = ({ showStatus }) => {
  const { highlights, cards } = useExtension();
  const [template, setTemplate] = useState(`## Highlights and Flashcards

### Highlights
{{highlights}}

### Flashcards
{{flashcards}}`);

  const exportToMarkdown = async () => {
    if (highlights.length === 0 || cards.length === 0) {
      showStatus("No highlights or flashcards to export", "error");
      return;
    }

    try {
      // Format highlights and flashcards
      const highlightsText = highlights
        .map((highlight) => `- ${highlight.text}`)
        .join("\n");

      const flashcardsText = cards
        .map((card) => {
          const [question, answer] = card.split("---");
          return `**${question.trim()}**\n${answer.trim()}`;
        })
        .join("\n\n");

      // Replace placeholders in template
      const markdownContent = template
        .replace("{{highlights}}", highlightsText)
        .replace("{{flashcards}}", flashcardsText);

      // Use Chrome's File System Access API
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: "highlights_and_flashcards.md",
        types: [
          {
            description: "Markdown File",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(markdownContent);
      await writable.close();

      showStatus("Markdown file saved successfully!");
    } catch (error) {
      console.error("Export error:", error);
      showStatus("Failed to export markdown file", "error");
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Markdown Export</h3>
      <textarea
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        className="w-full p-2 mb-4 border rounded text-sm h-32"
        placeholder="Customize your markdown template"
      />
      <button
        onClick={exportToMarkdown}
        disabled={highlights.length === 0 || cards.length === 0}
        className={`w-full py-2 rounded ${
          highlights.length === 0 || cards.length === 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
      >
        Export to Markdown
      </button>
    </div>
  );
};

export default MarkdownExporter;
