import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types';
import { ME_USER_ID, EMOJI_REACTIONS } from '../constants';
import { SparklesIcon, TranslateIcon, LoaderIcon, SpeakerIcon, SoundWaveIcon, PlayIcon, PauseIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
  contact?: User;
  onTranslate: (messageId: string) => void;
  onPlayAudio: (messageId: string, text: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  isPlaying: boolean;
}

const ReactionPicker: React.FC<{ onSelect: (emoji: string) => void, onClose: () => void }> = ({ onSelect, onClose }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            className="absolute -top-10 z-10 flex items-center gap-2 p-2 bg-gray-800 border border-gray-700 rounded-full shadow-lg"
        >
            {EMOJI_REACTIONS.map(emoji => (
                <button
                    key={emoji}
                    onClick={() => onSelect(emoji)}
                    className="text-xl hover:scale-125 transition-transform"
                >
                    {emoji}
                </button>
            ))}
        </div>
    );
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, contact, onTranslate, onPlayAudio, onReaction, isPlaying }) => {
  const isMe = message.senderId === ME_USER_ID;

  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimer = useRef<number>();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const handlePlayPauseAudioMessage = () => {
    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handlePointerDown = () => {
    longPressTimer.current = window.setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  };

  const handlePointerUp = () => {
    clearTimeout(longPressTimer.current);
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowReactionPicker(true);
  }

  const handleReactionSelect = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowReactionPicker(false);
  };
  
  // FIX: Explicitly type the accumulator in the reduce function to ensure correct type inference for `aggregatedReactions`.
  const aggregatedReactions = (message.reactions || []).reduce((acc: Record<string, number>, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (message.type === 'ai-summary') {
    return (
        <div className="my-4 p-4 rounded-lg bg-gray-700/50 border border-cyan-500/30">
            <h3 className="flex items-center text-sm font-semibold text-cyan-400 mb-2">
                <SparklesIcon className="w-4 h-4 mr-2" />
                AI Summary
            </h3>
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{message.text}</p>
        </div>
    );
  }

  const messageContent = (
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl relative ${
          isMe
            ? 'bg-cyan-500 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        }`}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onContextMenu={handleContextMenu}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        {message.translatedText && (
            <>
                <div className="border-t border-gray-600/50 my-2"></div>
                <p className="text-sm text-cyan-200/80 italic whitespace-pre-wrap">{message.translatedText}</p>
            </>
        )}
        {showReactionPicker && <ReactionPicker onSelect={handleReactionSelect} onClose={() => setShowReactionPicker(false)} />}
        
        {Object.keys(aggregatedReactions).length > 0 && (
            <div className={`absolute -bottom-4 flex gap-1 ${isMe ? 'right-2' : 'left-2'}`}>
                {Object.entries(aggregatedReactions).map(([emoji, count]) => (
                    <div key={emoji} className="flex items-center bg-gray-600/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-xs shadow-md">
                        <span>{emoji}</span>
                        {count > 1 && <span className="ml-1 text-gray-300 text-[10px] font-bold">{count}</span>}
                    </div>
                ))}
            </div>
        )}
      </div>
  );

  if (message.type === 'audio' && message.audioUrl) {
    // Note: Reaction logic not applied to audio messages for simplicity in this step.
    return (
      <div className={`flex items-end gap-3 group ${isMe ? 'justify-end' : 'justify-start'}`}>
        {!isMe && contact && (
          <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full object-cover self-start" />
        )}
        <div
          className={`max-w-xs md:max-w-md flex items-center gap-3 px-4 py-2 rounded-2xl ${
            isMe
              ? 'bg-cyan-500 text-white rounded-br-none'
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
          }`}
        >
          <audio 
            ref={audioRef} 
            src={message.audioUrl} 
            onPlay={() => setIsAudioPlaying(true)} 
            onPause={() => setIsAudioPlaying(false)} 
            onEnded={() => setIsAudioPlaying(false)}
            preload="metadata"
            className="hidden"
          />
          <button onClick={handlePlayPauseAudioMessage} className="flex-shrink-0">
            {isAudioPlaying 
                ? <PauseIcon className="w-6 h-6 text-white" /> 
                : <PlayIcon className="w-6 h-6 text-white" />
            }
          </button>
          <div className="w-32 h-1 bg-white/30 rounded-full">
            {/* Future: Add progress bar here */}
          </div>
        </div>
      </div>
    );
  }

  const handlePlayAudioTTS = () => {
    const textToPlay = message.translatedText || message.text;
    onPlayAudio(message.id, textToPlay);
  };

  return (
    <div className={`flex items-end gap-3 group relative pb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {!isMe && contact && (
        <img src={contact.avatar} alt={contact.name} className="w-8 h-8 rounded-full object-cover self-start" />
      )}
      {messageContent}
       <div className="flex flex-col gap-1 self-center">
            {message.type === 'text' && (
                <button
                    onClick={handlePlayAudioTTS}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-cyan-400"
                    aria-label={isPlaying ? 'Stop audio' : 'Play audio'}
                >
                    {isPlaying ? <SoundWaveIcon className="w-4 h-4 text-cyan-400"/> : <SpeakerIcon className="w-4 h-4"/>}
                </button>
            )}
            {!isMe && message.type === 'text' && !message.translatedText && (
                <button 
                    onClick={() => onTranslate(message.id)}
                    disabled={message.isTranslating}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-cyan-400 disabled:opacity-50"
                    aria-label="Translate message"
                >
                    {message.isTranslating ? <LoaderIcon className="w-4 h-4 animate-spin"/> : <TranslateIcon className="w-4 h-4"/>}
                </button>
            )}
       </div>
    </div>
  );
};