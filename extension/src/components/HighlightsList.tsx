import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const HighlightsList: React.FC = () => {
  const { highlights } = useExtension();

  return (
    <div className="">
      <h3 className="h3">Current Highlights</h3>

      {highlights.length === 0 ? (
        <p className="text-gray-500 italic bg-gray-100 p-4 rounded-lg">
          Select text on the page to create highlights
        </p>
      ) : (
        <ul className="space-y-2">
          {highlights.map((highlight) => (
            <li key={highlight.id} className="highlight-item">
              <div className="highlight-text">{highlight.text}</div>
              <button
                className="delete-highlight"
                onClick={() => {
                  chrome.runtime.sendMessage({
                    type: "REMOVE_HIGHLIGHT",
                    id: highlight.id,
                    tabId: chrome.tabs?.query(
                      { active: true, currentWindow: true },
                      (tabs) => tabs[0]?.id
                    ),
                  });
                }}
                aria-label="Delete highlight"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HighlightsList;
