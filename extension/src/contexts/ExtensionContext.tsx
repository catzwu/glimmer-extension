import React, { createContext, useState, useEffect, useContext } from "react";

interface Highlight {
  id: string;
  text: string;
  url: string;
  timestamp: number;
}

interface ExtensionContextType {
  isActivated: boolean;
  highlights: Highlight[];
  cards: string[];
  toggleActivation: () => Promise<void>;
  clearHighlights: () => void;
  clearCards: () => void;
  addCards: (cards: string[]) => void;
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(
  undefined
);

export const ExtensionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActivated, setIsActivated] = useState(true);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [cards, setCards] = useState<string[]>([]);

  useEffect(() => {
    // Get initial state
    chrome.runtime.sendMessage({ type: "GET_EXTENSION_STATE" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error getting extension state:",
          chrome.runtime.lastError
        );
        return;
      }
      if (response) {
        setIsActivated(response.isActive);
        setHighlights(response.highlights || []);
        setCards(response.cards || []);
      }
    });

    // Listen for messages
    const handleMessage = (
      message: any,
      sender: chrome.runtime.MessageSender
    ) => {
      console.log("Received message:", message.type, "from:", sender.id);

      try {
        switch (message.type) {
          case "HIGHLIGHTS_UPDATED":
            console.log("Updating highlights:", message.highlights);
            setHighlights(message.highlights);
            break;

          case "EXTENSION_STATE":
            setIsActivated(!!message.isActive);
            break;
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const toggleActivation = async () => {
    try {
      console.log("Toggling activation...");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;

      const newState = !isActivated;
      setIsActivated(newState);

      chrome.runtime.sendMessage({
        type: "TOGGLE_ACTIVATION",
        isActive: newState,
      });
    } catch (error) {
      console.error("Error toggling activation:", error);
    }
  };

  const clearHighlights = () => {
    chrome.runtime.sendMessage({ type: "CLEAR_HIGHLIGHTS" }, () => {
      setHighlights([]);
    });
  };

  const clearCards = () => {
    chrome.runtime.sendMessage({ type: "CLEAR_CARDS" }, () => {
      setCards([]);
    });
  };

  const addCards = (cards: string[]) => {
    chrome.runtime.sendMessage(
      {
        type: "ADD_CARDS",
        cards,
      },
      (response) => {
        if (response?.success) {
          chrome.runtime.sendMessage({ type: "GET_CARDS" }, (response) => {
            if (response?.cards) {
              setCards(response.cards);
            }
          });
        }
      }
    );
  };

  return (
    <ExtensionContext.Provider
      value={{
        isActivated,
        highlights,
        cards,
        toggleActivation,
        clearHighlights,
        clearCards,
        addCards,
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
