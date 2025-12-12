import { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult } from '../types';
import { createChatSession } from '../services/geminiService';
import { Chat } from '@google/genai';

export const useChat = (analysisResult: AnalysisResult | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Initialize or update chat session when analysis result changes
  useEffect(() => {
    chatSessionRef.current = createChatSession(analysisResult || undefined);
    
    if (analysisResult) {
      setMessages([{
        id: 'system-init',
        role: 'model',
        text: `I've finished analyzing your report. Feel free to ask me any questions about the findings!`
      }]);
      setIsOpen(true);
    } else {
      setMessages([]);
    }
  }, [analysisResult]);

  const sendMessage = async (text: string) => {
    if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession(analysisResult || undefined);
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: text });
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text || "I'm sorry, I couldn't process that." 
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, I encountered a connection error. Please try again." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    chatSessionRef.current = createChatSession(undefined);
    setMessages([]);
    setIsOpen(false);
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    isTyping,
    sendMessage,
    resetChat
  };
};