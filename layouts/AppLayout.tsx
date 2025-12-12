import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { ChatWidget } from '../components/ChatWidget';
import { LegalModal } from '../components/LegalModal';
import { LogoIcon } from '../components/Icons';
import { ChatMessage } from '../types';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: 'home' | 'symptoms' | 'dashboard' | 'profile' | 'diary' | 'emergency';
  onNavigate: (view: any) => void;
  chatProps: {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    isTyping: boolean;
  };
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentView, 
  onNavigate,
  chatProps
}) => {
  const [darkMode, setDarkMode] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const openLegal = (type: 'terms' | 'privacy') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans flex flex-col">
      <Navbar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onNavigate={onNavigate}
        currentView={currentView}
      />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 flex-grow">
        {children}
      </main>

      <ChatWidget {...chatProps} />
      
      <LegalModal 
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300 print:hidden mt-auto">
         {/* Added md:pr-24 to ensure content clears the fixed chat widget */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 md:pr-24 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <LogoIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Vitalis AI</span>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} Vitalis Health Tech.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-slate-400 dark:text-slate-500">
            <button onClick={() => openLegal('terms')} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</button>
            <button onClick={() => openLegal('privacy')} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy</button>
            <a href="https://inquisitive-cajeta-5a3397.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Personal Portfolio</a>
          </div>
        </div>
      </footer>
    </div>
  );
};