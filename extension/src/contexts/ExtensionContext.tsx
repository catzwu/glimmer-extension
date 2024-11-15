import React, { createContext, useState, useContext, useEffect } from "react";

interface ExtensionContextType {
  isActivated: boolean;
  highlights: string[];
  aiCards: string[];
  toggleActivation: () => void;
  clearAll: () => void;
  setAICards: (cards: string[]) => void;
  addHighlight: (text: string) => void;
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
    // Get initial extension state
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
      }
    });

    // Listen for messages from content script or background
    const handleMessage = (
      message: any,
      sender: chrome.runtime.MessageSender
    ) => {
      try {
        switch (message.type) {
          case "ADD_HIGHLIGHT":
            if (typeof message.text !== "string") {
              console.error("Invalid highlight text:", message.text);
              return;
            }
            setHighlights((prev) => [...prev, message.text]);
            break;

          case "CLEAR_HIGHLIGHTS":
            setHighlights([]);
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

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const toggleActivation = async () => {
    try {
      // Get the current tab
      console.log("Toggling activation...");
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tab?.id) return;

      // Update the state locally first
      const newState = !isActivated;
      setIsActivated(newState);

      // Send message to background script
      chrome.runtime.sendMessage({
        type: "TOGGLE_ACTIVATION",
        isActive: newState,
      });
      console.log("Toggled activation:", newState);
      // Try to send message to content script
      try {
        console.log("Sending message to content script...", tab.id);
        await chrome.tabs.sendMessage(tab.id, {
          type: "EXTENSION_STATE",
          isActive: newState,
        });
      } catch (error) {
        console.log("Content script not ready in current tab");
      }
    } catch (error) {
      console.error("Error toggling activation:", error);
    }
  };

  const clearAll = () => {
    try {
      chrome.runtime.sendMessage({ type: "CLEAR_HIGHLIGHTS" });
      setHighlights([]);
      setAICards([]);
    } catch (error) {
      console.error("Error clearing highlights:", error);
    }
  };

  const addHighlight = (text: string) => {
    if (!text.trim()) return;
    setHighlights((prev) => [...prev, text]);
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
        addHighlight,
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
