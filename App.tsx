
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import type { Chat, User, Message } from './types';
import { initialChats, initialContacts, ME_USER_ID } from './constants';
import { AIBotView } from './components/AIBotView';
import { WelcomeView } from './components/WelcomeView';

const App: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [contacts] = useState<User[]>(initialContacts);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const aiBotContact = contacts.find(c => c.id === 'ai-bot');

  const handleSendMessage = (chatId: string, messageText: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: ME_USER_ID,
      text: messageText,
      timestamp: new Date(),
      type: 'text',
    };

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, newMessage];
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      })
    );
    
    // Simulate a reply
    setTimeout(() => {
       const chat = chats.find(c => c.id === chatId);
       if (!chat) return;

       const contact = contacts.find(c => c.id === chat.participants.find(pId => pId !== ME_USER_ID));
       if (contact) {
            const replyMessage: Message = {
                id: `msg-${Date.now() + 1}`,
                senderId: contact.id,
                text: `Hey! I received your message: "${messageText}". I'll get back to you soon.`,
                timestamp: new Date(),
                type: 'text',
            };
            setChats(prevChats =>
              prevChats.map(chat => {
                if (chat.id === chatId) {
                  const updatedMessages = [...chat.messages, replyMessage];
                  return { ...chat, messages: updatedMessages };
                }
                return chat;
              })
            );
       }
    }, 1500);
  };

  const handleSendAudioMessage = (chatId: string, audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: ME_USER_ID,
      text: 'Voice Message',
      timestamp: new Date(),
      type: 'audio',
      audioUrl: audioUrl,
    };

    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, newMessage];
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      })
    );
  };

  const handleMessageReaction = (chatId: string, messageId: string, emoji: string) => {
    setChats(prevChats =>
      prevChats.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = chat.messages.map(message => {
            if (message.id === messageId) {
              const myReactionIndex = (message.reactions || []).findIndex(
                r => r.userId === ME_USER_ID
              );
              
              let newReactions = [...(message.reactions || [])];

              if (myReactionIndex > -1) {
                if (newReactions[myReactionIndex].emoji === emoji) {
                  // It's the same emoji, so remove it (toggle off)
                  newReactions.splice(myReactionIndex, 1);
                } else {
                  // It's a different emoji, so update mine
                  newReactions[myReactionIndex] = { emoji, userId: ME_USER_ID };
                }
              } else {
                // I don't have a reaction, so add one
                newReactions.push({ emoji, userId: ME_USER_ID });
              }
              
              return { ...message, reactions: newReactions };
            }
            return message;
          });
          return { ...chat, messages: updatedMessages };
        }
        return chat;
      })
    );
  };


  return (
    <div className="flex h-screen w-screen bg-gray-900 font-sans overflow-hidden">
      <Sidebar
        chats={chats}
        contacts={contacts}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
      />
      <main className="flex-1 flex flex-col bg-gray-800/50">
        {activeChat ? (
          <ChatView
            key={activeChat.id}
            chat={activeChat}
            contacts={contacts}
            onSendMessage={handleSendMessage}
            onSendAudioMessage={handleSendAudioMessage}
            onMessageReaction={handleMessageReaction}
          />
        ) : activeChatId === 'ai-bot' && aiBotContact ? (
            <AIBotView bot={aiBotContact} />
        ) : (
            <WelcomeView />
        )}
      </main>
    </div>
  );
};

export default App;