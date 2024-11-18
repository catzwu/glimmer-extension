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
  clearHighlights: () => Promise<void>;
  clearCards: () => Promise<void>;
  addCards: (cards: string[]) => Promise<void>;
  removeCard: (index: number) => Promise<void>;
}

const ExtensionContext = createContext<ExtensionContextType | undefined>(
  undefined
);

export const ExtensionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isActivated, setIsActivated] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [cards, setCards] = useState<string[]>([]);

  useEffect(() => {
    const loadState = async () => {
      // Get current tab ID first
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];

      if (currentTab?.id) {
        const response = await chrome.runtime.sendMessage({
          type: "GET_STATE",
          tabId: currentTab.id,
        });
        setIsActivated(response.isActive);
        setHighlights(response.highlights || []);
        setCards(response.cards || []);
      }
    };

    loadState();

    // Listen for messages
    const handleMessage = (message: any) => {
      if (message.type === "ACTIVATION_CHANGED") {
        // Get current tab ID
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          // Only update if the message is for the current tab
          if (currentTab && currentTab.id === message.tabId) {
            setIsActivated(message.isActive);
          }
        });
      } else if (message.type === "HIGHLIGHTS_UPDATED") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];
          if (currentTab && currentTab.id === message.tabId) {
            setHighlights(message.highlights);
          }
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const toggleActivation = async () => {
    console.log('[ExtensionContext] Getting current tab for toggle activation');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab?.id) {
      console.error('[ExtensionContext] No tab ID found for toggle activation');
      return;
    }

    console.log(`[ExtensionContext] Sending toggle activation for tab ${currentTab.id}`);
    const response = await chrome.runtime.sendMessage({
      type: "TOGGLE_ACTIVATION",
      tabId: currentTab.id
    });
    
    console.log(`[ExtensionContext] Toggle activation response:`, response);
    if (response?.success) {
      setIsActivated(!isActivated);
    }
  };

  const clearHighlights = async () => {
    console.log('[ExtensionContext] Getting current tab for clear highlights');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab?.id) {
      console.error('[ExtensionContext] No tab ID found for clear highlights');
      return;
    }

    console.log(`[ExtensionContext] Clearing highlights for tab ${currentTab.id}`);
    await chrome.runtime.sendMessage({ 
      type: "CLEAR_HIGHLIGHTS",
      tabId: currentTab.id
    });
    setHighlights([]);
  };

  const clearCards = async () => {
    console.log('[ExtensionContext] Getting current tab for clear cards');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab?.id) {
      console.error('[ExtensionContext] No tab ID found for clear cards');
      return;
    }

    console.log(`[ExtensionContext] Clearing cards for tab ${currentTab.id}`);
    await chrome.runtime.sendMessage({ 
      type: "CLEAR_CARDS",
      tabId: currentTab.id
    });
    setCards([]);
  };

  const addCards = async (newCards: string[]) => {
    console.log('[ExtensionContext] Getting current tab for add cards');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab?.id) {
      console.error('[ExtensionContext] No tab ID found for add cards');
      return;
    }

    console.log(`[ExtensionContext] Adding cards for tab ${currentTab.id}:`, newCards);
    await chrome.runtime.sendMessage({ 
      type: "ADD_CARDS", 
      cards: newCards,
      tabId: currentTab.id
    });
    setCards([...cards, ...newCards]);
  };

  const removeCard = async (index: number) => {
    console.log('[ExtensionContext] Getting current tab for remove card');
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    if (!currentTab?.id) {
      console.error('[ExtensionContext] No tab ID found for remove card');
      return;
    }

    console.log(`[ExtensionContext] Removing card at index ${index} for tab ${currentTab.id}`);
    await chrome.runtime.sendMessage({ 
      type: "REMOVE_CARD", 
      index,
      tabId: currentTab.id
    });
    setCards(cards.filter((_, i) => i !== index));
  };

  const value = {
    isActivated,
    highlights,
    cards,
    toggleActivation,
    clearHighlights,
    clearCards,
    addCards,
    removeCard,
  };

  return (
    <ExtensionContext.Provider value={value}>
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
