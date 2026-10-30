/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  RotateCcw,
  LayoutGrid,
  Bot,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, ComprehensionMode } from '../../types';
import { tutorService } from '../../services/api/tutorService';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { AACKeyboard } from './AACKeyboard';
import { Mascot } from '../common/Mascot';

interface TutorChatProps {
  onSignTokenSync?: (tokens: string[]) => void;
}

export const TutorChat: React.FC<TutorChatProps> = ({ onSignTokenSync }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<ComprehensionMode>('simple');
  const [showAAC, setShowAAC] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const { speak, stopSpeaking, isSpeaking, announce } = useAccessibility();
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await tutorService.getChatHistory();
        setMessages(history);
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Setup Web Speech API for voice input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
        announce(`Voice recognized: ${transcript}`);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
  }, [announce]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        announce('Microphone listening. Speak now.');
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string, inputMethod: 'text' | 'voice' | 'aac' = 'text') => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    setInputText('');
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      inputMethod,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await tutorService.sendMessage(text, mode, inputMethod);
      setMessages((prev) => [...prev, response]);

      // Automatically sync tokens with 3D avatar if available
      if (response.signTokens && response.signTokens.length > 0 && onSignTokenSync) {
        onSignTokenSync(response.signTokens);
      }

      // If user has screen reader or voice preference, optionally auto-speak brief summary
      if (user?.preferences?.needs.includes('visual_impairment')) {
        speak(response.text);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'ai',
        text: 'I had trouble connecting to the tutoring engine. Please check your network or try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAACSelect = (phrase: string, signToken?: string) => {
    if (signToken && onSignTokenSync) {
      onSignTokenSync([signToken]);
    }
    handleSendMessage(phrase, 'aac');
  };

  const handleClearHistory = async () => {
    await tutorService.clearHistory();
    const history = await tutorService.getChatHistory();
    setMessages(history);
  };

  return (
    <div className="bg-[#FFFFFF] rounded-2xl border-2 border-[#222222] shadow-stitch flex flex-col h-[650px] overflow-hidden">
      {/* Top Header & Comprehension Level Selector */}
      <div className="px-5 py-3.5 bg-[#FFF0C9] border-b-2 border-[#222222] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Mascot expression="greeting" size={38} />
          <div>
            <h3 className="text-sm font-bold text-[#222222] flex items-center gap-1.5">
              <span>Bridgey AI Tutor</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-[#222222]" />
            </h3>
            <p className="text-[11px] text-[#666666]">
              Barrier-Free Tutoring • Synchronized with 3D Sign Avatar
            </p>
          </div>
        </div>

        {/* Comprehension Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-full border-2 border-[#222222]">
          {(
            [
              { id: 'simple', label: 'Simple' },
              { id: 'detailed', label: 'Detailed' },
              { id: 'step_by_step', label: 'Step-by-Step' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                mode === m.id
                  ? 'bg-[#F28C00] text-white'
                  : 'text-[#666666] hover:text-[#222222]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleClearHistory}
          className="text-[#666666] hover:text-[#222222] p-1.5 rounded-full hover:bg-white/60 transition"
          title="Reset conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Transcript Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-[#FFFFFF] to-[#FFF0C9]/20">
        {messages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isAI ? 'self-start mr-auto' : 'self-end ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-xl border-2 border-[#222222] flex items-center justify-center shrink-0 shadow-xs ${
                  isAI ? 'bg-[#FFD966]' : 'bg-[#D9EAFB]'
                }`}
              >
                {isAI ? <Bot className="w-5 h-5 text-[#222222]" /> : <UserIcon className="w-5 h-5 text-[#222222]" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-1.5">
                <div
                  className={`p-4 rounded-2xl border-2 border-[#222222] text-sm leading-relaxed shadow-stitch-sm ${
                    isAI
                      ? 'bg-[#FFFFFF] text-[#222222]'
                      : 'bg-[#F28C00] text-white font-medium'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Sign Tokens Pill Strip */}
                  {msg.signTokens && msg.signTokens.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#222222]/15 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-[#666666] uppercase flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#F28C00]" /> Sign Tokens:
                      </span>
                      {msg.signTokens.map((token) => (
                        <button
                          key={token}
                          onClick={() => onSignTokenSync && onSignTokenSync([token])}
                          className="px-2 py-0.5 rounded-md bg-[#FFF0C9] text-[#222222] border border-[#222222] text-[10px] font-mono font-bold hover:bg-[#FFD966] transition"
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer timestamp & Audio speaker */}
                <div
                  className={`flex items-center gap-2 text-[10px] text-[#888888] px-1 ${
                    isAI ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <span>{msg.timestamp}</span>
                  {msg.inputMethod && (
                    <span className="capitalize px-1.5 py-0.2 bg-[#F1F1F1] rounded text-[#666666]">
                      via {msg.inputMethod}
                    </span>
                  )}
                  {isAI && (
                    <button
                      onClick={() => speak(msg.text)}
                      className="p-1 rounded-full hover:bg-[#FFE0BD] text-[#222222] transition"
                      title="Read aloud"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[80%] self-start mr-auto animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-[#FFD966] border-2 border-[#222222] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-[#222222]" />
            </div>
            <div className="p-3.5 rounded-2xl border-2 border-[#222222] bg-white text-xs text-[#666666] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F28C00] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#F28C00] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#F28C00] animate-bounce [animation-delay:0.4s]" />
              <span>Bridgey is formulating accessible answer & sign motion...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* AAC Drawer (Toggled from button) */}
      {showAAC && (
        <div className="border-t-2 border-[#222222] max-h-52 overflow-y-auto bg-[#F1F1F1] p-2">
          <AACKeyboard onSelectPhrase={handleAACSelect} />
        </div>
      )}

      {/* Input Action Controls */}
      <div className="p-3.5 bg-[#FFFFFF] border-t-2 border-[#222222] flex items-center gap-2">
        {/* Toggle AAC Button */}
        <button
          onClick={() => setShowAAC(!showAAC)}
          className={`p-2.5 rounded-xl border-2 border-[#222222] transition flex items-center gap-1.5 text-xs font-bold shrink-0 ${
            showAAC ? 'bg-[#FFD966]' : 'bg-[#FFFFFF] hover:bg-[#FFE0BD]'
          }`}
          title="Toggle AAC Phrase Grid"
        >
          <LayoutGrid className="w-4 h-4 text-[#222222]" />
          <span className="hidden sm:inline">AAC Grid</span>
        </button>

        {/* Voice Input Mic Button */}
        {speechSupported && (
          <button
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border-2 border-[#222222] transition shrink-0 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-[#FFFFFF] hover:bg-[#FFE0BD] text-[#222222]'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
        )}

        {/* Text Input Field */}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask a question, enter a sign word, or pick an AAC phrase..."
          className="flex-1 px-4 py-2.5 rounded-full border-2 border-[#222222] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#F28C00]"
        />

        {/* Send Button */}
        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="px-5 py-2.5 bg-[#F28C00] text-white rounded-full font-bold text-xs border-2 border-[#222222] hover:bg-[#de7f00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition shrink-0 shadow-xs"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
