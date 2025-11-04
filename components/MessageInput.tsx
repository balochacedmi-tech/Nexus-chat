import React, { useState, useRef } from 'react';
import { SendIcon, MagicWandIcon, LoaderIcon, MicrophoneIcon } from './icons';
import { rewriteMessage } from '../services/geminiService';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onSendAudioMessage: (audio: Blob) => void;
}

const TONES = ['Formal', 'Casual', 'Poetic', 'Humorous'];

const MagicComposeModal: React.FC<{
  originalText: string;
  onSelect: (text: string) => void;
  onClose: () => void;
}> = ({ originalText, onSelect, onClose }) => {
    const [rewritten, setRewritten] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});

    const handleRewrite = async (tone: string) => {
        setLoading(prev => ({...prev, [tone]: true}));
        const result = await rewriteMessage(originalText, tone);
        setRewritten(prev => ({...prev, [tone]: result}));
        setLoading(prev => ({...prev, [tone]: false}));
    }

    return (
        <div className="absolute bottom-full mb-2 w-full bg-gray-800/80 backdrop-blur-md border border-gray-700/50 rounded-lg shadow-2xl p-4 z-20">
            <h3 className="text-md font-semibold text-cyan-400 mb-3">Magic Compose</h3>
            <div className="space-y-3">
                {TONES.map(tone => (
                    <div key={tone}>
                        <button onClick={() => handleRewrite(tone)} disabled={loading[tone]} className="text-sm font-semibold text-gray-300 hover:text-white flex items-center disabled:opacity-50">
                            {loading[tone] ? <LoaderIcon className="animate-spin w-4 h-4 mr-2" /> : null}
                            Rewrite as {tone}
                        </button>
                        {rewritten[tone] && (
                             <p onClick={() => { onSelect(rewritten[tone]); onClose(); }} className="mt-1 p-2 bg-gray-700/50 rounded-md text-sm text-gray-200 cursor-pointer hover:bg-gray-700">
                                {rewritten[tone]}
                            </p>
                        )}
                    </div>
                ))}
            </div>
            <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white">&times;</button>
        </div>
    )
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, onSendAudioMessage }) => {
  const [message, setMessage] = useState('');
  const [showMagicCompose, setShowMagicCompose] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleMicClick = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          onSendAudioMessage(audioBlob);
          audioChunksRef.current = [];
          // Stop all tracks on the stream to release the microphone
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
        };
        
        audioChunksRef.current = [];
        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone. Please check permissions.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="relative">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <button type="button" onClick={() => setShowMagicCompose(s => !s)} disabled={!message.trim() || isRecording} className="p-2 rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
            <MagicWandIcon className={`w-6 h-6 ${showMagicCompose ? 'text-cyan-400' : 'text-gray-400'}`} />
        </button>
        <div className="flex-1 relative flex items-center">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isRecording ? 'Recording voice message...' : "Type a message..."}
                className="w-full bg-gray-800 border border-gray-700/50 rounded-full py-2 px-5 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all pr-12 disabled:bg-gray-700"
                disabled={isRecording}
            />
            <button type="button" onClick={handleMicClick} className="absolute right-2 p-2 rounded-full hover:bg-gray-700 transition-colors">
                <MicrophoneIcon className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            </button>
        </div>
        <button type="submit" className="p-3 bg-cyan-500 rounded-full hover:bg-cyan-600 transition-colors disabled:bg-gray-600" disabled={!message.trim() || isRecording}>
            <SendIcon className="w-5 h-5 text-white" />
        </button>
        </form>
        {showMagicCompose && message.trim() && !isRecording && (
            <MagicComposeModal originalText={message} onSelect={setMessage} onClose={() => setShowMagicCompose(false)} />
        )}
    </div>
  );
};