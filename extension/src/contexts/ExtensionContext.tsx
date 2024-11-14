import React, { createContext, useState, useContext, useEffect } from "react";

interface ExtensionContextType {
  isActivated: boolean;
  highlights: string[];
  aiCards: string[];
  toggleActivation: () => void;
  clearAll: () => void;
  setAICards: (cards: string[]) => void;
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(
  undefined
);

export const ExtensionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActivated, setIsActivated] = useState(true);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [aiCards, setAICards] = useState<string[]>([]);

  useEffect(() => {
    // Listen for highlights from content script
    const handleHighlightsUpdate = (message: any) => {
      switch (message.type) {
        case "ADD_HIGHLIGHT":
          const newHighlights = [...highlights, message.text];
          setHighlights(newHighlights);
          break;

        case "CLEAR_HIGHLIGHTS":
          setHighlights([]);
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handleHighlightsUpdate);

    return () => {
      chrome.runtime.onMessage.removeListener(handleHighlightsUpdate);
    };
  }, []);

  const toggleActivation = () => {
    chrome.runtime.sendMessage({ type: "TOGGLE_ACTIVATION" });
    setIsActivated((prev) => !prev);
  };

  const clearAll = () => {
    chrome.runtime.sendMessage({ type: "CLEAR_HIGHLIGHTS" });
    setHighlights([]);
    setAICards([]);
  };

  return (
    <ExtensionContext.Provider
      value={{
        isActivated,
        highlights,
        aiCards,
        toggleActivation,
        clearAll,
        setAICards: (cards) => setAICards(cards),
      }}
    >
      {children}
    </ExtensionContext.Provider>
  );
};

export const useExtension = () => {
  const context = useContext(ExtensionContext);
  if (!context) {
    throw new Error("useExtension must be used within an ExtensionProvider");
  }
  return context;
};
