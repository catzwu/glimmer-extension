import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const ActivationToggle: React.FC = () => {
  const { isActivated, toggleActivation, clearCards, clearHighlights } =
    useExtension();

  return (
    <div className="flex justify-between items-center">
      <button
        onClick={toggleActivation}
        className={`px-4 py-2 rounded transition-colors duration-300 text-white ${
          isActivated
            ? "bg-[var(--primary-color)] hover:bg-[var(--primary-hover)]"
            : "bg-[var(--error-color)] hover:bg-[var(--error-dark)]"
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
