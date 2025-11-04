import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Message } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// --- Audio Helper Functions ---
function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodePcmAudio(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number = 24000,
    numChannels: number = 1
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
// --- End Audio Helper Functions ---

export const generateSmartReplies = async (messages: Message[]): Promise<string[]> => {
    if (!messages.length) return [];
    
    const lastMessage = messages[messages.length - 1].text;
    const prompt = `Based on the last message in a conversation, suggest three short, relevant, and distinct replies. The last message is: "${lastMessage}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        replies: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                    },
                },
            },
        });
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse.replies.slice(0, 3);
    } catch (error) {
        console.error("Error generating smart replies:", error);
        return ["Got it.", "Thanks!", "Let me check."];
    }
};

export const rewriteMessage = async (text: string, tone: string): Promise<string> => {
    if (!text) return "";
    const prompt = `Rewrite the following text in a ${tone} tone: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error rewriting message for tone ${tone}:`, error);
        return `Could not rewrite message. Original: ${text}`;
    }
};

// FIX: Added an onEnd callback to provide a reliable way to determine when the stream has finished.
export const generateBotResponseStream = (history: Message[], onChunk: (text: string) => void, onEnd: () => void) => {
    const chatHistory = history.map(msg => ({
        role: msg.senderId === 'ai-bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));
    
    const run = async () => {
        try {
            const stream = await ai.models.generateContentStream({
                model: "gemini-2.5-flash",
                contents: chatHistory,
            });

            for await (const chunk of stream) {
                onChunk(chunk.text);
            }
        } catch (error) {
            console.error("Error in generating bot response stream:", error);
            onChunk("Sorry, I encountered an error. Please try again.");
        } finally {
            onEnd();
        }
    };
    run();
};

export const summarizeChat = async (messages: Message[]): Promise<string> => {
    const conversation = messages.map(m => `User ${m.senderId}: ${m.text}`).join('\n');
    const prompt = `Please provide a concise summary of the following conversation:\n\n${conversation}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error summarizing chat:", error);
        return "Could not generate a summary at this time.";
    }
};

export const translateMessage = async (text: string, targetLanguage: string = 'English'): Promise<string> => {
    if (!text) return "";
    const prompt = `Translate the following text to ${targetLanguage}. Only return the translated text, without any introductory phrases: "${text}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error translating message to ${targetLanguage}:`, error);
        return "Translation failed.";
    }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
    if (!prompt) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};


export const generateSpeech = async (text: string, voice: string = 'Zephyr'): Promise<AudioBuffer | null> => {
    if (!text) return null;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            const decodedBytes = decodeBase64(base64Audio);
            return await decodePcmAudio(decodedBytes, audioContext);
        }
        return null;
    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};