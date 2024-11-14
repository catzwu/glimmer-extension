// file:///Users/catherinewu/CascadeProjects/windsurf-project/extension/src/component/StatusMessage.tsx
import React from "react";

interface StatusMessageProps {
  message: string;
  type: "success" | "error";
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type }) => {
  const bgColor =
    type === "success"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

  return <div className={`p-3 rounded-lg ${bgColor}`}>{message}</div>;
};

export default StatusMessage;
