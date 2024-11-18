import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const ActivationToggle: React.FC = () => {
  const { isActivated, toggleActivation, clearCards, clearHighlights } =
    useExtension();

  return (
    <div className="flex justify-between items-center">
      <button
        onClick={toggleActivation}
        className={`px-4 py-2 rounded ${
          isActivated ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}
      >
        {isActivated ? "On" : "Off"}
      </button>
      <button
        className="clear-button"
        onClick={() => {
          clearCards();
          clearHighlights();
        }}
      >
        Clear All
      </button>
    </div>
  );
};

export default ActivationToggle;
