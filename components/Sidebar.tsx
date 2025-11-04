
import React from 'react';
import type { Chat, User } from '../types';
import { ME_USER_ID } from '../constants';
import { SparklesIcon } from './icons';

interface SidebarProps {
  chats: Chat[];
  contacts: User[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
}

const ChatListItem: React.FC<{ chat: Chat; contact?: User; isActive: boolean; onSelect: () => void }> = ({ chat, contact, isActive, onSelect }) => {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastMessageText = lastMessage ? (lastMessage.text.length > 25 ? `${lastMessage.text.substring(0, 25)}...` : lastMessage.text) : 'No messages yet';

  return (
    <li
      onClick={onSelect}
      className={`flex items-center p-3 cursor-pointer rounded-lg transition-all duration-200 ${
        isActive ? 'bg-cyan-500/20' : 'hover:bg-gray-700/50'
      }`}
    >
      <div className="relative">
        <img src={contact?.avatar} alt={contact?.name} className="w-12 h-12 rounded-full object-cover" />
        {contact?.online && (
          <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 border-2 border-gray-800"></span>
        )}
      </div>
      <div className="flex-1 ml-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-semibold text-gray-100">{contact?.name}</h3>
          {lastMessage && (
            <span className="text-xs text-gray-400">
              {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-400">{lastMessageText}</p>
          {chat.unreadCount > 0 && (
            <span className="bg-cyan-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </li>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ chats, contacts, activeChatId, onSelectChat }) => {
  const aiBot = contacts.find(c => c.isBot);

  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 p-4 bg-gray-900/70 backdrop-blur-md border-r border-gray-700/50 flex flex-col">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white">Nexus Chat</h1>
        <p className="text-sm text-cyan-400">The Future of Conversation</p>
      </header>

      {aiBot && (
         <div 
            onClick={() => onSelectChat(aiBot.id)}
            className={`flex items-center p-3 cursor-pointer rounded-lg transition-all duration-200 mb-4 border border-cyan-500/30 hover:border-cyan-500/80 ${activeChatId === aiBot.id ? 'bg-cyan-500/20' : 'bg-gray-800/50 hover:bg-gray-700/80'}`}
        >
            <img src={aiBot.avatar} alt={aiBot.name} className="w-10 h-10 rounded-full object-contain p-1 bg-white/10" />
            <div className="ml-3">
                <h3 className="text-md font-semibold text-gray-100">{aiBot.name}</h3>
                <p className="text-sm text-cyan-400 flex items-center"><SparklesIcon className="w-4 h-4 mr-1" /> AI Assistant</p>
            </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 -mr-2">
        <h2 className="text-lg font-semibold text-gray-300 mb-2 sticky top-0 bg-gray-900/70 py-2">Chats</h2>
        <ul className="space-y-2">
          {chats.map(chat => {
            const contact = contacts.find(c => c.id === chat.participants.find(pId => pId !== ME_USER_ID));
            return (
              <ChatListItem
                key={chat.id}
                chat={chat}
                contact={contact}
                isActive={activeChatId === chat.id}
                onSelect={() => onSelectChat(chat.id)}
              />
            );
          })}
        </ul>
      </div>
    </aside>
  );
};
