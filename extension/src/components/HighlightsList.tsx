// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/HighlightsList.tsx
import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const HighlightsList: React.FC = () => {
  const { highlights } = useExtension();

  return (
    <div className="">
      <h3 className="text-lg font-semibold mb-2">Current Highlights</h3>

      {highlights.length === 0 ? (
        <p className="text-gray-500 italic bg-gray-100 p-4 rounded-lg">
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
