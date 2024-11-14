import React, { useState } from "react";
import ActivationToggle from "./components/ActivationToggle";
import HighlightsList from "./components/HighlightsList";
import AICardGenerator from "./components/AICardGenerator";
import MarkdownExporter from "./components/MarkdownExporter";
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
      <div className="w-96 p-4 bg-white">
        <div className="space-y-4">
          <ActivationToggle />
          <HighlightsList />
          {/* <AICardGenerator showStatus={showStatus} /> */}
          {/* <MarkdownExporter showStatus={showStatus} /> */}
          {statusMessage && (
            <StatusMessage message={statusMessage} type={statusType} />
          )}
        </div>
      </div>
    </ExtensionProvider>
  );
};

export default App;
