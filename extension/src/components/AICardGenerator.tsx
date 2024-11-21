// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/AICardGenerator.tsx
import React, { useState, useEffect } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface AICardGeneratorProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const AICardGenerator: React.FC<AICardGeneratorProps> = ({ showStatus }) => {
  const { highlights, addCards, removeCard, cards } = useExtension();
  const [isGenerating, setIsGenerating] = useState(false);
  const [claudeApiKey, setClaudeApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(true);

  useEffect(() => {
    // Load saved API key on mount
    chrome.storage.local.get(["claudeApiKey"], (result) => {
      if (result.claudeApiKey) {
        setClaudeApiKey(result.claudeApiKey);
        setShowApiInput(false);
      }
    });
  }, []);

  const generateFlashcard = async (text: string) => {
    const prompt =
      'Transform the provided text into 1-3 atomic flashcards that optimize learning through spaced repetition. Each flashcard should:\nFront Side Requirements\n\nAsk a single, specific question\nFocus on understanding rather than pure memorization\nUse clear, unambiguous language\nWhen appropriate, include relevant context without giving away the answer\nFor concepts requiring computation or problem-solving, ask for the process rather than just the result\n\nBack Side Requirements\nProvide a concise, focused answer that fully addresses the question, ideally no more than 10-15 words\nFor problem-solving questions, show the key steps in the solution\n\nFormatting Rules\nFor each flashcard, output in this format:\nQuestion\n---\nAnswer\n#Relevant topic tags for organization\nNote: [Optional - Any special study tips or mnemonics]\n\nOutput Format\nGenerate the flashcards in this structure:\n\nFirst, list all created flashcards in the specified format. Separate cards with *****.\nDo not say anything besides text that will appear in the flashcards\n\n\nProcessing Instructions\nWhen converting text into flashcards:\n\nBreak down complex ideas into multiple atomic cards\n\nEach card should test one specific fact or concept\nAvoid compound questions\nCreate separate cards for related but distinct ideas\n\n\nApply these transformation rules:\n\nConvert statements into questions that promote active recall\nRephrase to eliminate textbook-style language and shorten where possible\nRemove redundant questions or information\nAdd context when the original text assumes background knowledge\nCreate bidirectional cards for important relationships (A→B and B→A)\n\nApply these quality checks:\n\nDoes the card test understanding rather than recognition?\nIs the question clear without seeing the answer?\nCould someone familiar with the subject verify the answer\'s correctness?\nIs the card\'s scope appropriate (neither too broad nor too narrow)?\n\n\nExamples\nHere are three example transformations:\nOriginal text: "The mitochondria is the powerhouse of the cell, producing ATP through cellular respiration."\nBad card:\nWhat is the mitochondria?\n---\nThe powerhouse of the cell that produces ATP through cellular respiration.\nGood cards:\nThrough what process do mitochondria produce ATP?\n---\nCellular respiration\n#biology, #cellular-processes\n*****\nWhy are mitochondria often called the "powerhouse" of the cell?\n---\nThey produce ATP (energy) through cellular respiration, which powers most cellular processes\n#biology, #cellular-processes\nNote: Think of mitochondria as tiny power plants inside each cell\n\nQuality Guidelines\nEach flashcard must:\n\nFollow the minimum information principle (one fact per card)\nBe clear and unambiguous\nUse few words\nFocus on understanding over memorization\nBe self-contained (understand the question without external reference)\nAvoid sets/enumerations (break into individual cards)';

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1024,
        system:
          "You create perfect Anki flashcards, in accordance with the twenty rules of formulating knowledge",
        messages: [{ role: "user", content: prompt + "\n\n" + text }],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate flashcard");
    }

    const data = await response.json();
    return data.content[0].text.split("*****");
  };

  const generateFlashcards = async () => {
    if (highlights.length === 0) {
      showStatus("No highlights to generate flashcards from", "error");
      return;
    }

    if (!claudeApiKey) {
      setShowApiInput(true);
      showStatus("Please enter your Claude API key", "error");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedCards = [];
      for (const highlight of highlights) {
        const cards = await generateFlashcard(highlight.text);
        generatedCards.push(...cards);
      }

      addCards(generatedCards);
      showStatus("Flashcards generated successfully!");

      // Save API key if generation was successful
      chrome.storage.local.set({ claudeApiKey });
    } catch (error) {
      showStatus("Failed to generate flashcards", "error");
      setShowApiInput(true);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (highlights.length === 0 && cards.length === 0) return null;

  return (
    <div className="flashcards-container space-y-4">
      {showApiInput && (
        <div className="api-key-input mb-4">
          <input
            type="password"
            value={claudeApiKey}
            onChange={(e) => {
              setClaudeApiKey(e.target.value);
              setShowApiInput(false);
              chrome.storage.local.set({ claudeApiKey: e.target.value });
              showStatus("API key saved successfully!", "success");
            }}
            placeholder="Enter Claude API Key"
            className="w-full p-2 border rounded mb-2"
          />
          <p className="text-sm text-gray-600">
            Your API key will be saved securely in your browser
          </p>
        </div>
      )}

      {cards.length === 0 ? (
        <button
          onClick={generateFlashcards}
          disabled={isGenerating || highlights.length === 0}
          className="primary-button"
        >
          {isGenerating ? "Generating..." : "Generate Flashcards"}
        </button>
      ) : (
        <>
          <div className="flashcards-header">
            <h3>Flashcards</h3>
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
        </>
      )}
    </div>
  );
};

export default AICardGenerator;
