
import React from 'react';

interface SmartReplyPillProps {
  text: string;
  onClick: () => void;
}

export const SmartReplyPill: React.FC<SmartReplyPillProps> = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-1.5 bg-gray-700/80 border border-gray-600/50 rounded-full text-sm text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/50 transition-all duration-200"
    >
      {text}
    </button>
  );
};
