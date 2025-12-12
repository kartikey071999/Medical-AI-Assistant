import { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult, UserProfile } from '../types';
import { createChatSession } from '../services/geminiService';
import { getUserChatHistory, saveUserChatHistory } from '../services/storageService';
import { Chat } from '@google/genai';
import { useLanguage } from '../contexts/LanguageContext';

export const useChat = (analysisResult: AnalysisResult | null, user: UserProfile | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const lastAnalyzedRef = useRef<string | null>(null); 
  
  // Access current language
  const { language } = useLanguage();

  // 1. Load User History on Login
  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        const history = await getUserChatHistory(user.id);
        if (history.length > 0) {
          setMessages(history);
        } else {
          setMessages([]);
        }
      } else {
        // Guest mode: Start fresh
        setMessages([]);
      }
    };
    loadHistory();
  }, [user?.id]); // Re-run only if user changes

  // 2. Save History on Change
  useEffect(() => {
    if (user && messages.length > 0) {
      saveUserChatHistory(user.id, messages);
    }
  }, [messages, user]);

  // 3. Handle New Analysis Context (Injection, not Reset)
  useEffect(() => {
    const summarySignature = analysisResult?.summary || '';
    
    if (analysisResult && summarySignature !== lastAnalyzedRef.current) {
      lastAnalyzedRef.current = summarySignature;
      
      const botIntro: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `I've finished analyzing the new report. It looks like: ${analysisResult.summary.substring(0, 100)}... Let me know if you have questions!`
      };

      setMessages(prev => [...prev, botIntro]);
      setIsOpen(true);
    }
  }, [analysisResult]);

  const sendMessage = async (text: string) => {
    // Pass current language to createChatSession so the AI knows how to respond
    chatSessionRef.current = createChatSession(user, messages, undefined, language);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
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
    if (user) {
        return; 
    }
    chatSessionRef.current = null;
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