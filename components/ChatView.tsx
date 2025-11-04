import React, { useState, useEffect, useRef } from 'react';
import type { Chat, User, Message } from '../types';
import { ME_USER_ID } from '../constants';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { SmartReplyPill } from './SmartReplyPill';
import { generateSmartReplies, summarizeChat, translateMessage, generateSpeech } from '../services/geminiService';
import { MoreVerticalIcon, LoaderIcon } from './icons';

interface ChatViewProps {
  chat: Chat;
  contacts: User[];
  onSendMessage: (chatId: string, message: string) => void;
  onSendAudioMessage: (chatId: string, audio: Blob) => void;
  onMessageReaction: (chatId: string, messageId: string, emoji: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ chat, contacts, onSendMessage, onSendAudioMessage, onMessageReaction }) => {
  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contact = contacts.find(c => c.id === chat.participants.find(pId => pId !== ME_USER_ID));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.senderId !== ME_USER_ID) {
      generateSmartReplies(messages).then(setSmartReplies);
    } else {
      setSmartReplies([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);
  
  useEffect(() => {
    setMessages(chat.messages);
  }, [chat.messages]);

  const handleSendMessage = (text: string) => {
    onSendMessage(chat.id, text);
    setSmartReplies([]);
  };
  
  const handleSendAudioMessage = (audio: Blob) => {
    onSendAudioMessage(chat.id, audio);
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    const summary = await summarizeChat(messages);
    const summaryMessage: Message = {
        id: `summary-${Date.now()}`,
        senderId: 'system',
        text: summary,
        timestamp: new Date(),
        type: 'ai-summary',
    }
    setMessages(prev => [...prev, summaryMessage]);
    setIsSummarizing(false);
  }

  const handleTranslate = async (messageId: string) => {
    setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, isTranslating: true } : msg
    ));

    const messageToTranslate = messages.find(msg => msg.id === messageId);
    if (!messageToTranslate) return;

    const translatedText = await translateMessage(messageToTranslate.text);

    setMessages(prev => prev.map(msg =>
        msg.id === messageId 
            ? { ...msg, translatedText: translatedText, isTranslating: false } 
            : msg
    ));
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (playingMessageId === messageId) {
        audioSourceRef.current?.stop();
        setPlayingMessageId(null);
        return;
    }
    
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
    }
    
    setPlayingMessageId(messageId);
    const audioBuffer = await generateSpeech(text);
    
    if (audioBuffer) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        source.onended = () => {
            setPlayingMessageId(null);
        };
        audioSourceRef.current = source;
    } else {
        setPlayingMessageId(null);
    }
  };

  const handleReaction = (messageId: string, emoji: string) => {
    onMessageReaction(chat.id, messageId, emoji);
  };


  if (!contact) {
    return <div className="flex-1 flex items-center justify-center">Select a chat to start</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex items-center p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
        <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
        <div className="ml-4">
          <h2 className="text-lg font-bold text-white">{contact.name}</h2>
          <p className="text-sm text-green-400">{contact.online ? 'Online' : 'Offline'}</p>
        </div>
        <div className="ml-auto relative group">
          <button className="p-2 rounded-full hover:bg-gray-700">
            <MoreVerticalIcon className="text-gray-400" />
          </button>
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
              <button onClick={handleSummarize} disabled={isSummarizing} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 flex items-center disabled:opacity-50">
                {isSummarizing ? <LoaderIcon className="animate-spin mr-2"/> : null}
                Summarize Chat
              </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            contact={msg.senderId === contact.id ? contact : undefined} 
            onTranslate={handleTranslate}
            onPlayAudio={handlePlayAudio}
            onReaction={handleReaction}
            isPlaying={playingMessageId === msg.id}
        />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <footer className="p-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
        {smartReplies.length > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            {smartReplies.map((reply, i) => (
              <SmartReplyPill key={i} text={reply} onClick={() => handleSendMessage(reply)} />
            ))}
          </div>
        )}
        <MessageInput onSendMessage={handleSendMessage} onSendAudioMessage={handleSendAudioMessage} />
      </footer>
    </div>
  );
};