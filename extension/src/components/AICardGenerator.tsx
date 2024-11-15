// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/AICardGenerator.tsx
import React, { useState } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface AICardGeneratorProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const AICardGenerator: React.FC<AICardGeneratorProps> = ({ showStatus }) => {
  const { highlights, addCards, cards } = useExtension();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateFlashcards = async () => {
    if (highlights.length === 0) {
      showStatus("No highlights to generate flashcards from", "error");
      return;
    }

    setIsGenerating(true);
    try {
      // Placeholder for actual AI card generation logic
      const mockCards = highlights.map(
        (highlight) =>
          `What is the key point about "${highlight}"?\n---\nKey insight about the highlight`
      );

      addCards(mockCards);
      showStatus("Flashcards generated successfully!");
    } catch (error) {
      showStatus("Failed to generate flashcards", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  if (highlights.length === 0) return null;
  if (cards.length === 0)
    return (
      <button
        onClick={generateFlashcards}
        disabled={isGenerating || highlights.length === 0}
        className={`w-full py-2 rounded ${
          highlights.length === 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {isGenerating ? "Generating..." : "Generate AI Flashcards"}
      </button>
    );

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">AI Flashcard Generator</h3>
    </div>
  );
};

export default AICardGenerator;
