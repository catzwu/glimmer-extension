import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const HighlightsList: React.FC = () => {
  const { highlights } = useExtension();

  return (
    <div className="">
      <h3 className="h3">Highlights</h3>

      {highlights.length === 0 ? (
        <p className="text-gray-500 italic bg-gray-100 p-4 my-2 rounded-lg">
          Select text on the page to create highlights
        </p>
      ) : (
        <ul className="space-y-2">
          {highlights.map((highlight) => (
            <li key={highlight.id} className="highlight-item">
              <button
                className="delete-highlight"
                onClick={async () => {
                  const [tab] = await chrome.tabs.query({
                    active: true,
                    currentWindow: true,
                  });

                  chrome.runtime.sendMessage({
                    type: "REMOVE_HIGHLIGHT",
                    id: highlight.id,
                    tabId: tab.id,
                  });
                }}
                aria-label="Delete highlight"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
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

              <div className="highlight-text">{highlight.text}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HighlightsList;
