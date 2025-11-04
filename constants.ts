
import type { Chat, User } from './types';

export const ME_USER_ID = 'user-me';

export const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😯', '😢', '🙏'];

export const initialContacts: User[] = [
  { id: ME_USER_ID, name: 'You', avatar: 'https://picsum.photos/seed/me/100/100', online: true },
  { id: 'user-1', name: 'Alice', avatar: 'https://picsum.photos/seed/alice/100/100', online: true },
  { id: 'user-2', name: 'Bob', avatar: 'https://picsum.photos/seed/bob/100/100', online: false },
  { id: 'user-3', name: 'Charlie', avatar: 'https://picsum.photos/seed/charlie/100/100', online: true },
  { id: 'ai-bot', name: 'Gemini Assistant', avatar: '/gemini-logo.svg', online: true, isBot: true },
];

export const initialChats: Chat[] = [
  {
    id: 'chat-1',
    participants: [ME_USER_ID, 'user-1'],
    messages: [
      { id: 'msg-1-1', senderId: 'user-1', text: 'Hey, how is the project going?', timestamp: new Date(Date.now() - 1000 * 60 * 5), type: 'text' },
      { id: 'msg-1-2', senderId: ME_USER_ID, text: 'It\'s going great! Making good progress.', timestamp: new Date(Date.now() - 1000 * 60 * 4), type: 'text' },
       { id: 'msg-1-3', senderId: 'user-1', text: 'Awesome! Let me know if you need any help.', timestamp: new Date(Date.now() - 1000 * 60 * 3), type: 'text', reactions: [{emoji: '👍', userId: ME_USER_ID}] },
    ],
    unreadCount: 1,
  },
  {
    id: 'chat-2',
    participants: [ME_USER_ID, 'user-2'],
    messages: [
      { id: 'msg-2-1', senderId: 'user-2', text: 'Did you see the new design mockups?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), type: 'text' },
      { id: 'msg-2-2', senderId: ME_USER_ID, text: 'Not yet, I\'ll check them out now.', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), type: 'text' },
    ],
    unreadCount: 0,
  },
  {
    id: 'chat-3',
    participants: [ME_USER_ID, 'user-3'],
    messages: [
      { id: 'msg-3-1', senderId: ME_USER_ID, text: 'Lunch today?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), type: 'text' },
      { id: 'msg-3-2', senderId: 'user-3', text: 'Sure, how about 12:30 at the usual spot?', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), type: 'text' },
    ],
    unreadCount: 0,
  },
];