import React, { useState, useEffect, useRef } from 'react';
import type { User, Message } from '../types';
import { ME_USER_ID } from '../constants';
import { generateBotResponseStream, generateImage } from '../services/geminiService';
import { SendIcon } from './icons';

interface AIBotViewProps {
  bot: User;
}

export const AIBotView: React.FC<AIBotViewProps> = ({ bot }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'initial', senderId: bot.id, text: `Hello! I'm the Gemini Assistant. How can I help you today? You can ask me anything, or try generating an image by typing '/imagine a futuristic car'.`, timestamp: new Date(), type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const currentInput = input;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      senderId: ME_USER_ID,
      text: currentInput,
      timestamp: new Date(),
      type: 'text'
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setInput('');
    setIsStreaming(true);

    if (currentInput.toLowerCase().startsWith('/imagine ')) {
        const prompt = currentInput.substring(8).trim();
        const botMessageId = `bot-${Date.now()}`;
        
        setMessages(prev => [...prev, { 
            id: botMessageId, 
            senderId: bot.id, 
            text: `🎨 Generating an image for: "${prompt}"...`, 
            timestamp: new Date(), 
            type: 'text' 
        }]);

        const imageUrl = await generateImage(prompt);

        if (imageUrl) {
             setMessages(prev =>
                prev.map(msg =>
                    msg.id === botMessageId
                        ? { ...msg, text: imageUrl, type: 'image' }
                        : msg
                )
            );
        } else {
             setMessages(prev =>
                prev.map(msg =>
                    msg.id === botMessageId
                        ? { ...msg, text: 'Sorry, I couldn\'t generate that image. Please try a different prompt.' }
                        : msg
                )
            );
        }
        setIsStreaming(false);
    } else {
        const botMessageId = `bot-${Date.now()}`;
        setMessages(prev => [...prev, { id: botMessageId, senderId: bot.id, text: '', timestamp: new Date(), type: 'text' }]);
    
        generateBotResponseStream(updatedHistory, (chunk) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === botMessageId
                        ? { ...msg, text: msg.text + chunk }
                        : msg
                )
            );
        }, () => {
            setIsStreaming(false);
        });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-br from-gray-800 to-gray-900">
      <header className="flex items-center p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
        <img src={bot.avatar} alt={bot.name} className="w-10 h-10 rounded-full object-contain p-1 bg-white/10" />
        <div className="ml-4">
          <h2 className="text-lg font-bold text-white">{bot.name}</h2>
          <p className="text-sm text-cyan-400">Ready to assist</p>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} id={msg.id} className={`flex items-start gap-4 ${msg.senderId === ME_USER_ID ? 'justify-end' : ''}`}>
            {msg.senderId !== ME_USER_ID && <img src={bot.avatar} className="w-8 h-8 rounded-full object-contain bg-white/10 p-1 mt-1" alt="bot avatar" />}
            
            {msg.type === 'image' ? (
                <div className="max-w-xl rounded-2xl overflow-hidden bg-gray-700">
                    <img src={msg.text} alt="AI generated content" className="block max-w-full h-auto" />
                </div>
            ) : (
                <div className={`max-w-xl p-4 rounded-2xl ${msg.senderId === ME_USER_ID ? 'bg-cyan-500 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.text || '...'}</p>
                </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini anything or type /imagine..."
            className="flex-1 bg-gray-800 border border-gray-700/50 rounded-full py-2 px-5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            disabled={isStreaming}
          />
          <button type="submit" className="p-3 bg-cyan-500 rounded-full hover:bg-cyan-600 transition-colors disabled:bg-gray-600" disabled={!input.trim() || isStreaming}>
            <SendIcon className="w-5 h-5 text-white" />
          </button>
        </form>
      </footer>
    </div>
  );
};
