import React, { useState } from "react";
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

  const showStatus = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setStatusMessage(message);
    setStatusType(type);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleClose = async () => {
    console.log("[App] handleClose called");
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("[App] Current tab:", tab);

      if (!tab || !tab.id) {
        console.error("[App] No valid tab found");
        return;
      }

      console.log("[App] Sending close message to background script");
      await chrome.runtime.sendMessage({
        type: "CLOSE_SIDE_PANEL",
        tabId: tab.id,
      });
      console.log("[App] Close message sent successfully");
    } catch (error) {
      console.error("[App] Error in handleClose:", error);
    }
  };

  return (
    <ExtensionProvider>
      <div className="container flex flex-col h-screen">
        <div className="sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
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
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 space-y-4 my-4">
          <section className="flex-none">
            <HighlightsList />
          </section>

          <section className="flex-1 min-h-0 overflow-auto">
            <AICardGenerator showStatus={showStatus} />
          </section>

          <section className="flex-none space-y-2">
            <MochiExporter showStatus={showStatus} />
            <MarkdownExporter showStatus={showStatus} />
          </section>
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
