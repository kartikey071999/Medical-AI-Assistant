import React from 'react';
import { AppState, UploadedFile, AnalysisResult } from '../types';
import { FileUpload } from '../components/FileUpload';
import { AnalysisView } from '../components/AnalysisView';
import { LogoIcon } from '../components/Icons';

interface HomeProps {
  appState: AppState;
  uploadedFile: UploadedFile | null;
  analysisResult: AnalysisResult | null;
  errorMessage: string;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  onAskAi: (query: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  appState,
  uploadedFile,
  analysisResult,
  errorMessage,
  onFileSelect,
  onReset,
  onAskAi
}) => {
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

          <FileUpload onFileSelect={onFileSelect} />
          
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
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Analysis Failed</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{errorMessage}</p>
          <button 
            onClick={onReset}
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
          onReset={onReset}
          onAskAi={onAskAi} 
        />
      )}
    </>
  );
};