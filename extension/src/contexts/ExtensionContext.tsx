import React, { createContext, useState, useContext } from "react";

interface ExtensionContextType {
  isActivated: boolean;
  highlights: string[];
  aiCards: string[];
  toggleActivation: () => void;
  addHighlight: (highlight: string) => void;
  clearHighlights: () => void;
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

  const toggleActivation = () => setIsActivated(!isActivated);
  const addHighlight = (highlight: string) =>
    setHighlights((prev) => [...prev, highlight]);
  const clearHighlights = () => setHighlights([]);

  return (
    <ExtensionContext.Provider
      value={{
        isActivated,
        highlights,
        aiCards,
        toggleActivation,
        addHighlight,
        clearHighlights,
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
