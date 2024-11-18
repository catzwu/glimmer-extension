// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/AICardGenerator.tsx
import React, { useState } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface AICardGeneratorProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const AICardGenerator: React.FC<AICardGeneratorProps> = ({ showStatus }) => {
  const { highlights, addCards, removeCard, cards } = useExtension();
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
          `What is the key point about "${highlight.text}"?\n---\nKey insight about the highlight`
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
    <div className="flashcards-container">
      <div className="flashcards-header">
        <h3>AI-Generated Flashcards</h3>
        <button
          onClick={generateFlashcards}
          disabled={isGenerating}
          className="clear-button"
        >
          {isGenerating ? "Generating..." : "Regenerate"}
        </button>
      </div>

      <div className="flashcards-list">
        {cards.map((card, index) => (
          <div key={index} className="flashcard-preview">
            <div className="card-header">
              <strong>Card {index + 1}</strong>
              <button
                className="delete-highlight"
                onClick={() => removeCard(index)}
                aria-label="Delete card"
              >
                x
              </button>
            </div>
            <p className="card-front">{card.split("---")[0]}</p>
            <p className="card-back">{card.split("---")[1]}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AICardGenerator;
