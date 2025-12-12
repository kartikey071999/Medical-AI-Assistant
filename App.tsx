import React, { useState, useEffect, useRef } from 'react';
import { AppState, UploadedFile, AnalysisResult, ChatMessage } from './types';
import { analyzeMedicalReport, createChatSession } from './services/geminiService';
import { FileUpload } from './components/FileUpload';
import { AnalysisView } from './components/AnalysisView';
import { ChatWidget } from './components/ChatWidget';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { SymptomChecker } from './components/SymptomChecker';
import { HealthDiary } from './components/HealthDiary';
import { EmergencyCard } from './components/EmergencyCard';
import { AuthProvider } from './contexts/AuthContext';
import { LegalModal } from './components/LegalModal';
import { LogoIcon } from './components/Icons';
import { Chat } from '@google/genai';

function AppContent() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [darkMode, setDarkMode] = useState(false);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<'home' | 'symptoms' | 'dashboard' | 'profile' | 'diary' | 'emergency'>('home');

  // Legal Modal State
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);

  // Chat State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  // Initialize
  useEffect(() => {
    chatSessionRef.current = createChatSession(undefined);
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFileSelect = async (file: File) => {
    // Manually cleanup previous URL if it exists
    if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const mimeType = file.type || (file.name.endsWith('.csv') ? 'text/csv' : 'text/plain');

    setAppState(AppState.ANALYZING);
    setCurrentView('home');

    try {
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result as string;
          const base64Content = base64String.split(',')[1];
          
          setUploadedFile({
            file,
            previewUrl,
            base64: base64Content,
            mimeType: mimeType
          });

          await runAnalysis({ base64: base64Content, mimeType });
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const textContent = reader.result as string;
          
          setUploadedFile({
            file,
            previewUrl,
            textContent,
            mimeType: mimeType
          });

          await runAnalysis({ textContent, mimeType });
        };
        reader.readAsText(file);
      }
    } catch (e) {
      setErrorMessage("Failed to read file.");
      setAppState(AppState.ERROR);
    }
  };

  const runAnalysis = async (input: { base64?: string, textContent?: string, mimeType: string }) => {
    try {
      const result = await analyzeMedicalReport(input);
      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);
      
      chatSessionRef.current = createChatSession(result);
      setChatMessages([{
        id: 'system-init',
        role: 'model',
        text: `I've finished analyzing your ${uploadedFile?.file.name || 'report'}. Feel free to ask me any questions about the findings!`
      }]);
      setChatOpen(true);

    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    if (uploadedFile?.previewUrl) {
        URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setAppState(AppState.IDLE);
    setUploadedFile(null);
    setAnalysisResult(null);
    setErrorMessage('');
    chatSessionRef.current = createChatSession(undefined);
    setChatMessages([]);
    setChatOpen(false);
    setCurrentView('home');
  };

  const handleViewReportFromDashboard = (result: AnalysisResult, fileName: string, fileType: string) => {
    // Construct a mock UploadedFile for display purposes
    const mockFile: UploadedFile = {
      file: new File([], fileName, { type: fileType }),
      previewUrl: '', // No blob URL needed for history view usually, unless we stored the blob (which we don't in this demo)
      mimeType: fileType,
      textContent: "Report loaded from history." 
    };
    
    setAnalysisResult(result);
    setUploadedFile(mockFile);
    setAppState(AppState.SUCCESS);
    setCurrentView('home');
    
    // Update chat context
    chatSessionRef.current = createChatSession(result);
    setChatMessages([{
        id: 'system-init',
        role: 'model',
        text: `I've loaded your saved report: ${fileName}. Ask me anything!`
    }]);
  };

  const handleSendMessage = async (text: string) => {
    if (!chatSessionRef.current) {
        chatSessionRef.current = createChatSession(analysisResult || undefined);
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setIsChatTyping(true);

    try {
      const response = await chatSessionRef.current.sendMessage({ message: text });
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: response.text || "I'm sorry, I couldn't process that." 
      };
      
      setChatMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      setChatMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: "Sorry, I encountered a connection error. Please try again." 
      }]);
    } finally {
      setIsChatTyping(false);
    }
  };

  const handleAskAboutFinding = (query: string) => {
    setChatOpen(true);
    handleSendMessage(query);
  };

  const openLegal = (type: 'terms' | 'privacy') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  // Render Logic based on View
  const renderMainContent = () => {
    switch (currentView) {
        case 'dashboard': return <Dashboard onViewReport={handleViewReportFromDashboard} />;
        case 'profile': return <Profile />;
        case 'symptoms': return <SymptomChecker />;
        case 'diary': return <HealthDiary />;
        case 'emergency': return <EmergencyCard />;
        case 'home':
        default:
            return (
                <>
                    {appState === AppState.IDLE && (
                    <div className="flex flex-col items-center justify-center mt-12 md:mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="text-center max-w-3xl mx-auto mb-12">
                        <span className="inline-block py-1 px-3 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-teal-100 dark:border-teal-800 animate-pulse">
                            AI-Powered Diagnostics Assistant
                        </span>
                        <h1 className="text-4xl md:text-6xl font-serif font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                            Understand your health <br/> with <span className="text-teal-600 dark:text-teal-400">clarity.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                            Upload your medical reports, lab results, or X-rays. Vitalis AI analyzes them instantly.
                        </p>
                        </div>

                        <FileUpload onFileSelect={handleFileSelect} />
                        
                        {/* Features Grid */}
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-center">
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400 text-xl">📄</div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Multi-Format</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Upload PDF, Image, or CSV files.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400 text-xl">🔍</div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Deep Research</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">AI-backed medical context analysis.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm">
                            <div className="w-12 h-12 bg-teal-50 dark:bg-teal-900/30 rounded-xl flex items-center justify-center mx-auto mb-4 text-teal-600 dark:text-teal-400 text-xl">🛡️</div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Secure</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">Private client-side processing.</p>
                        </div>
                        </div>
                    </div>
                    )}

                    {appState === AppState.ANALYZING && (
                    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
                        <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
                        <LogoIcon className="absolute inset-0 m-auto w-10 h-10 text-teal-500 animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white mb-3">Analyzing Report...</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md text-center">
                        Vitalis is reading the document, identifying medical terms, and cross-referencing diagnostic markers.
                        </p>
                    </div>
                    )}

                    {appState === AppState.ERROR && (
                    <div className="flex flex-col items-center justify-center h-[60vh] animate-in zoom-in-95 duration-300">
                        {/* Error UI same as before */}
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Analysis Failed</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8">{errorMessage}</p>
                        <button 
                        onClick={handleReset}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-medium shadow-lg hover:shadow-xl"
                        >
                        Try Again
                        </button>
                    </div>
                    )}

                    {appState === AppState.SUCCESS && uploadedFile && analysisResult && (
                    <AnalysisView 
                        result={analysisResult} 
                        file={uploadedFile} 
                        onReset={handleReset}
                        onAskAi={handleAskAboutFinding} 
                    />
                    )}
                </>
            );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-sans">
      <Navbar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        onNavigate={setCurrentView}
        currentView={currentView}
      />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 min-h-[calc(100vh-80px)]">
        {renderMainContent()}
      </main>

      <ChatWidget 
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isOpen={chatOpen}
        setIsOpen={setChatOpen}
        isTyping={isChatTyping}
      />
      
      <LegalModal 
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 transition-colors duration-300 print:hidden">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              <LogoIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Vitalis AI</span>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} Vitalis Health Tech.</p>
          </div>
          <div className="flex space-x-6 text-slate-400 dark:text-slate-500">
            <button onClick={() => openLegal('terms')} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms</button>
            <button onClick={() => openLegal('privacy')} className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy</button>
            <a href="https://inquisitive-cajeta-5a3397.netlify.app/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Portfolio</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;