import React from "react";
import { useExtension } from "../contexts/ExtensionContext";

const ActivationToggle: React.FC = () => {
  const { isActivated, toggleActivation, clearAll } = useExtension();

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
        className="underline text-gray-500 hover:text-gray-700 text-sm transition-colors duration-200"
        onClick={() => {
          clearAll();
        }}
      >
        Clear All
      </button>
    </div>
  );
};

export default ActivationToggle;
