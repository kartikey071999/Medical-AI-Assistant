import { useState, useRef, useEffect } from 'react';
import { ChatMessage, AnalysisResult, UserProfile } from '../types';
import { createChatSession } from '../services/geminiService';
import { getUserChatHistory, saveUserChatHistory } from '../services/storageService';
import { Chat } from '@google/genai';

export const useChat = (analysisResult: AnalysisResult | null, user: UserProfile | null) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const lastAnalyzedRef = useRef<string | null>(null); // To track if we've already introduced a specific report

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
      // Debounce slightly in a real app, but here direct save is fine
      saveUserChatHistory(user.id, messages);
    }
  }, [messages, user]);

  // 3. Handle New Analysis Context (Injection, not Reset)
  useEffect(() => {
    // We only trigger this if we have a result AND it's different from the last one we processed
    // We use a simple check on summary length/content to avoid infinite loops if objects change ref
    const summarySignature = analysisResult?.summary || '';
    
    if (analysisResult && summarySignature !== lastAnalyzedRef.current) {
      lastAnalyzedRef.current = summarySignature;
      
      const contextMessageText = `System Context: A new medical report has been analyzed.\n\nSummary: ${analysisResult.summary}\n\nFindings: ${JSON.stringify(analysisResult.findings.slice(0, 5))}`;
      
      // We don't show this raw blob to the user, but we inject it so the model knows.
      // However, to keep it simple for this UI, we will have the BOT introduce it.
      
      const botIntro: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: `I've finished analyzing the new report. It looks like: ${analysisResult.summary.substring(0, 100)}... Let me know if you have questions about specific findings!`
      };

      setMessages(prev => [...prev, botIntro]);
      setIsOpen(true);
      
      // Re-initialize chat session with new history + context
      // Note: We need the updated messages state, but state updates are async.
      // We'll let the sendMessage function handle lazy re-initialization or force it next render.
    }
  }, [analysisResult]);

  const sendMessage = async (text: string) => {
    // Always recreate session to ensure latest history and user context are included
    // In a production app, you might maintain the session object, but here we need to ensure
    // the model sees the *entire* relevant history including manual injections.
    
    // We pass the *current* messages state as history
    chatSessionRef.current = createChatSession(user, messages);

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
        // If logged in, we don't strictly wipe history unless explicitly asked (Clear History feature)
        // But the 'Reset' button in Home usually means "Reset Analysis". 
        // We do NOT clear chat messages here for logged in users.
        return; 
    }
    // Guest mode reset
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