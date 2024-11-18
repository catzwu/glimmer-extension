import React, { useEffect, useState } from "react";
import { useExtension } from "../contexts/ExtensionContext";

interface MochiExporterProps {
  showStatus: (message: string, type?: "success" | "error") => void;
}

const MochiExporter: React.FC<MochiExporterProps> = ({ showStatus }) => {
  const { cards } = useExtension();
  const [mochiApiKey, setMochiApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Load saved API key on mount
    chrome.storage.local.get(["mochiApiKey"], (result) => {
      if (result.mochiApiKey) {
        setMochiApiKey(result.mochiApiKey);
        setShowApiInput(false);
      }
    });
  }, []);

  const exportToMochi = async () => {
    if (cards.length === 0) {
      showStatus("No cards to export!", "error");
      return;
    }

    if (!mochiApiKey) {
      setShowApiInput(true);
      showStatus("Please enter your Mochi API key", "error");
      return;
    }

    setIsExporting(true);

    try {
      for (const card of cards) {
        const cardData = {
          content: card,
          "deck-id": "mMrpYLrT", // Default deck ID
        };

        const response = await fetch("https://app.mochi.cards/api/cards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(mochiApiKey + ":")}`,
          },
          body: JSON.stringify(cardData),
        });

        if (!response.ok) {
          if (response.status === 401) {
            setShowApiInput(true);
            throw new Error("Invalid API key");
          } else if (response.status === 403) {
            throw new Error(
              "Access denied. Please check your API key and try again."
            );
          } else if (response.status === 429) {
            throw new Error("Too many requests. Please try again later");
          } else {
            throw new Error(`Failed to create card (HTTP ${response.status})`);
          }
        }
      }

      showStatus("Successfully exported cards to Mochi!", "success");

      // Save API key for future use
      chrome.storage.local.set({ mochiApiKey });
    } catch (error) {
      showStatus("Error exporting to Mochi. Please try again.", "error");
      setShowApiInput(true);
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  // Don't render if there are no cards
  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      {showApiInput && (
        <div className="mochi-exporter mt-4 p-4 border rounded-lg bg-white shadow-sm">
          <input
            type="password"
            value={mochiApiKey}
            onChange={(e) => {
              setMochiApiKey(e.target.value);
              setShowApiInput(false);
              chrome.storage.local.set({ mochiApiKey: e.target.value });
              showStatus("API key saved successfully!", "success");
            }}
            placeholder="Enter Mochi API Key"
            className="w-full p-2 border rounded mb-2"
          />
          <p className="text-sm text-gray-600">
            Your API key will be saved securely in your browser
          </p>
        </div>
      )}
      <button
        onClick={exportToMochi}
        disabled={isExporting || !mochiApiKey}
        className="primary-button"
      >
        {isExporting ? "Exporting..." : "Export to Mochi"}
      </button>
    </div>
  );
};

export default MochiExporter;
