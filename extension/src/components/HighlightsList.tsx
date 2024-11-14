// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/HighlightsList.tsx
import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const HighlightsList: React.FC = () => {
  const { highlights, clearHighlights } = useExtension();

  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Current Highlights</h3>
        {highlights.length > 0 && (
          <button
            onClick={clearHighlights}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Clear All
          </button>
        )}
      </div>
      {highlights.length === 0 ? (
        <p className="text-gray-500 italic">
          Select text on the page to create highlights
        </p>
      ) : (
        <ul className="space-y-2">
          {highlights.map((highlight, index) => (
            <li key={index} className="bg-white p-2 rounded shadow-sm text-sm">
              {highlight}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HighlightsList;
