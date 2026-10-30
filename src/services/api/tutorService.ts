/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiClient } from './client';
import { ChatMessage, ComprehensionMode } from '../../types';

const CHAT_STORAGE_KEY = 'edubridge_tutor_chat_history';

const DEFAULT_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'ai',
    text: "Namaste Maya! 🤟 I'm Bridgey, your barrier-free AI tutor. What would you like to explore today? We can practice Indian Sign Language, break down science concepts, or converse using AAC phrase tiles!",
    timestamp: '10:00 AM',
    signTokens: ['HELLO', 'NAMASTE', 'LEARN'],
  },
];

export const tutorService = {
  async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const convs = await apiClient<any[]>('/api/v1/tutor/conversations', {
        method: 'GET',
      });
      if (Array.isArray(convs) && convs.length > 0 && Array.isArray(convs[0].messages)) {
        return convs[0].messages.map((m: any) => ({
          id: String(m.id || Date.now()),
          sender: m.role === 'user' ? 'user' : 'ai',
          text: m.content || '',
          timestamp: new Date(m.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
      }
    } catch {
      // fallback to local chat session
    }

    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_INITIAL_MESSAGES;
      }
    }
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_MESSAGES));
    return DEFAULT_INITIAL_MESSAGES;
  },

  async sendMessage(
    messageText: string,
    mode: ComprehensionMode = 'simple',
    inputMethod: 'text' | 'voice' | 'sign' | 'aac' = 'text'
  ): Promise<ChatMessage> {
    const payload = {
      message: messageText,
      modality: 'text',
      task: mode === 'step_by_step' ? 'explain' : mode === 'detailed' ? 'explain' : 'chat',
      preferences: {
        mode,
        input_method: inputMethod,
      },
    };

    try {
      const res = await apiClient<any>('/api/v1/tutor/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.response_text) {
        // Extract supported sign tokens from response for 3D Avatar synchronization
        const words = res.response_text.toUpperCase().replace(/[^A-Z0-9 ]/g, '').split(' ');
        const supportedSigns = ['HELLO', 'NAMASTE', 'THANK YOU', 'YES', 'NO', 'HELP', 'GOOD', 'LEARN', 'SIGN', 'A', 'B', 'C'];
        const matched = words.filter((w: string) => supportedSigns.includes(w));
        const signTokens = matched.length > 0 ? Array.from(new Set(matched)) as string[] : ['GOOD', 'LEARN'];

        const aiResponse: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: res.response_text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          signTokens,
          inputMethod,
        };

        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        const history: ChatMessage[] = saved ? JSON.parse(saved) : DEFAULT_INITIAL_MESSAGES;
        history.push(
          {
            id: `msg_user_${Date.now()}`,
            sender: 'user',
            text: messageText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            inputMethod,
          },
          aiResponse
        );
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));

        return aiResponse;
      }
    } catch (err) {
      console.warn('[FastAPI Integration] AI Tutor chat endpoint error/unauthorized, using inclusive fallback engine.');
    }

    // High-fidelity fallback tutor reasoning tailored to inclusive learning
    const lower = messageText.toLowerCase();
    let responseText = '';
    let signTokens: string[] = ['GOOD', 'LEARN'];

    if (lower.includes('hello') || lower.includes('namaste') || lower.includes('hi')) {
      responseText = "Namaste! Wonderful to connect with you. Notice how our 3D sign avatar raises a gentle open palm to greet you. How can I assist your study session today?";
      signTokens = ['HELLO', 'NAMASTE', 'WELCOME'];
    } else if (lower.includes('thank') || lower.includes('thanks') || lower.includes('धन्यवाद')) {
      responseText = "You are warmly welcome! In Indian Sign Language, 'Thank You' moves from the chin forward with an open, respectful palm. You did fantastic practicing this!";
      signTokens = ['THANK YOU', 'GOOD'];
    } else if (lower.includes('help') || lower.includes('stuck') || lower.includes('confused')) {
      responseText = "Don't worry at all! Let's break this into clear, accessible visual steps. Take a deep breath. Which part would you like me to explain with simpler words or gesture demonstrations?";
      signTokens = ['HELP', 'YES', 'GOOD'];
    } else if (lower.includes('sign') || lower.includes('isl') || lower.includes('alphabet')) {
      responseText = "In ISL, two-handed finger spelling provides crystal-clear precision for names and scientific terms! Let's watch the avatar demonstrate letters A, B, and C, or practice in our Sign Studio camera.";
      signTokens = ['A', 'B', 'C', 'SIGN'];
    } else if (lower.includes('solar') || lower.includes('planet') || lower.includes('gravity') || lower.includes('space')) {
      responseText = mode === 'simple'
        ? "Space is like a giant cosmic playground! Gravity is the invisible hug that keeps planets dancing safely in loops around the Sun."
        : "Planetary orbital mechanics rely on gravitational attraction acting as a centripetal force. The massive gravitational field of the Sun curves spacetime, causing elliptical orbits.";
      signTokens = ['LEARN', 'GOOD'];
    } else if (lower.includes('break') || lower.includes('rest') || lower.includes('tired')) {
      responseText = "Taking a restful pause is a key learning skill! Your brain integrates memory during rest. Let's do a 60-second gentle eye-relaxation exercise.";
      signTokens = ['GOOD', 'YES'];
    } else {
      responseText = mode === 'step_by_step'
        ? `Let's break down "${messageText}" into 3 simple milestones:
1. First, establish the core visual meaning.
2. Next, observe how our 3D avatar gestures the foundational sign tokens.
3. Finally, verify your understanding with a quick 1-question check!`
        : `Great question about "${messageText}"! Learning without communication barriers means we adapt every explanation to your comfort. Notice the synced gestures on your avatar screen!`;
      signTokens = ['GOOD', 'LEARN'];
    }

    const aiResponse: ChatMessage = {
      id: `msg_ai_${Date.now()}`,
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      signTokens,
    };

    // Update local history
    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    const history: ChatMessage[] = saved ? JSON.parse(saved) : DEFAULT_INITIAL_MESSAGES;
    history.push(
      {
        id: `msg_user_${Date.now()}`,
        sender: 'user',
        text: messageText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        inputMethod,
      },
      aiResponse
    );
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));

    return aiResponse;
  },

  async clearHistory(): Promise<void> {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_MESSAGES));
  },
};
