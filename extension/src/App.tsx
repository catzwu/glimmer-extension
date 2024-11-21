import React, { useState, useEffect } from "react";
import "./App.css";
import ActivationToggle from "./components/ActivationToggle";
import AICardGenerator from "./components/AICardGenerator";
import HighlightsList from "./components/HighlightsList";
import MarkdownExporter from "./components/MarkdownExporter";
import MochiExporter from "./components/MochiExporter";
import StatusMessage from "./components/StatusMessage";
import { ExtensionProvider } from "./contexts/ExtensionContext";

const App: React.FC = () => {
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [statusType, setStatusType] = useState<"success" | "error">("success");
  const [isContextValid, setIsContextValid] = useState(true);

  useEffect(() => {
    // Check if extension context is valid
    const checkContext = () => {
      const isValid = !!chrome.runtime?.id;
      setIsContextValid(isValid);
      if (!isValid) {
        setStatusMessage("Extension was updated. Please refresh the page.");
        setStatusType("error");
      }
    };

    // Initial check
    checkContext();
  }, []);

  const showStatus = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleClose = async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        console.error("[App] No valid tab found");
        return;
      }

      await chrome.runtime.sendMessage({
        type: "CLOSE_SIDE_PANEL",
        tabId: tab.id,
      });
    } catch (error) {
      console.error("[App] Error in handleClose:", error);
    }
  };

  if (!isContextValid) {
    return (
      <div className="app-container">
        <div className="error-banner">
          Extension was updated. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <ExtensionProvider>
      <div className="h-screen flex flex-col p-4">
        {/* Header container - not flex */}
        <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200 w-full">
          <div className="flex justify-between items-center">
            <ActivationToggle />
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Close sidebar"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="overflow-auto flex-1">
          <div className="space-y-4 my-4">
            <section className="flex-none">
              <HighlightsList />
            </section>

            <section className="flex-1 min-h-0">
              <AICardGenerator showStatus={showStatus} />
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-none border-t border-gray-200 bg-white">
          <div className="space-y-2">
            <MochiExporter showStatus={showStatus} />
            <MarkdownExporter showStatus={showStatus} />
          </div>
        </div>

        {statusMessage && (
          <div className="fixed bottom-4 left-4 right-4">
            <StatusMessage message={statusMessage} type={statusType} />
          </div>
        )}
      </div>
    </ExtensionProvider>
  );
};

export default App;
