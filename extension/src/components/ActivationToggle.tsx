import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const ActivationToggle: React.FC = () => {
  const { isActivated, toggleActivation, clearCards, clearHighlights } =
    useExtension();

  return (
    <div className="flex justify-between items-center">
      <button
        onClick={toggleActivation}
        className={`px-1 py-1 rounded-full transition-all duration-300 text-white w-10 ${
          isActivated
            ? "bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] justify-items-end"
            : "bg-[var(--background-light)] hover:bg-gray-100 justify-items-start"
        }`}
      >
        <div className="bg-white w-4 h-4 rounded-full"></div>
        {/* {isActivated ? "On" : "Off"} */}
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
