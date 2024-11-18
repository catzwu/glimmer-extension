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

  return (
    <ExtensionProvider>
      <div className="space-y-4 flex flex-col max-h-[570px]">
        <ActivationToggle />

        <div className="overflow-y-auto flex-initial space-y-4">
          <HighlightsList />
          <AICardGenerator showStatus={showStatus} />
          <div className="space-y-2">
            <MochiExporter showStatus={showStatus} />
            <MarkdownExporter showStatus={showStatus} />
          </div>
        </div>

        {statusMessage && (
          <StatusMessage message={statusMessage} type={statusType} />
        )}
      </div>
    </ExtensionProvider>
  );
};

export default App;
