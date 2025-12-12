import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useAnalysis } from './hooks/useAnalysis';
import { useChat } from './hooks/useChat';
import { AppLayout } from './layouts/AppLayout';
import { Home } from './pages/Home';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { SymptomChecker } from './components/SymptomChecker';
import { HealthDiary } from './components/HealthDiary';
import { EmergencyCard } from './components/EmergencyCard';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'symptoms' | 'dashboard' | 'profile' | 'diary' | 'emergency'>('home');
  
  // Custom Hooks for Feature Logic
  const analysis = useAnalysis();
  
  // Pass user to chat hook for persistent memory and personalized context
  const chat = useChat(analysis.analysisResult, user);

  // View Handlers
  const handleViewReportFromDashboard = (result: any, fileName: string, fileType: string) => {
    analysis.loadSavedReport(result, fileName, fileType);
    setCurrentView('home');
  };

  const handleAskAboutFinding = (query: string) => {
    chat.setIsOpen(true);
    chat.sendMessage(query);
  };

  const handleReset = () => {
    analysis.resetAnalysis();
    chat.resetChat();
  };

  // View Router
  const renderView = () => {
    switch (currentView) {
      case 'dashboard': 
        return <Dashboard onViewReport={handleViewReportFromDashboard} />;
      case 'profile': 
        return <Profile />;
      case 'symptoms': 
        return <SymptomChecker />;
      case 'diary': 
        return <HealthDiary />;
      case 'emergency': 
        return <EmergencyCard />;
      case 'home':
      default:
        return (
          <Home 
            appState={analysis.appState}
            uploadedFile={analysis.uploadedFile}
            analysisResult={analysis.analysisResult}
            errorMessage={analysis.errorMessage}
            onFileSelect={analysis.processFile}
            onReset={handleReset}
            onAskAi={handleAskAboutFinding}
          />
        );
    }
  };

  return (
    <AppLayout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      chatProps={{
        messages: chat.messages,
        isOpen: chat.isOpen,
        setIsOpen: chat.setIsOpen,
        isTyping: chat.isTyping,
        onSendMessage: chat.sendMessage
      }}
    >
      {renderView()}
    </AppLayout>
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