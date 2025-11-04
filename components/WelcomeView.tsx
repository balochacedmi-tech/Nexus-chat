
import React from 'react';

export const WelcomeView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-gray-800 via-gray-900 to-black">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold text-white mb-2">Welcome to Nexus Chat</h1>
        <p className="text-lg text-cyan-400 mb-6">Your intelligent communication hub.</p>
        <div className="p-6 bg-gray-800/50 border border-gray-700/50 rounded-xl">
            <p className="text-gray-300">
            Select a conversation from the sidebar to start chatting, or engage with the Gemini Assistant for powerful AI capabilities right at your fingertips.
            </p>
        </div>
      </div>
    </div>
  );
};
