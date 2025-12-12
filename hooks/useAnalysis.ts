import { useState, useCallback } from 'react';
import { AppState, UploadedFile, AnalysisResult } from '../types';
import { analyzeMedicalReport } from '../services/geminiService';

export const useAnalysis = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const processFile = useCallback(async (file: File) => {
    // Cleanup previous URL if exists to prevent memory leaks
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }

    const previewUrl = URL.createObjectURL(file);
    const mimeType = file.type || (file.name.endsWith('.csv') ? 'text/csv' : 'text/plain');

    setAppState(AppState.ANALYZING);

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

          await runGeminiAnalysis({ base64: base64Content, mimeType });
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

          await runGeminiAnalysis({ textContent, mimeType });
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.error("File processing error", e);
      setErrorMessage("Failed to read file.");
      setAppState(AppState.ERROR);
    }
  }, [uploadedFile]);

  const runGeminiAnalysis = async (input: { base64?: string, textContent?: string, mimeType: string }) => {
    try {
      const result = await analyzeMedicalReport(input);
      setAnalysisResult(result);
      setAppState(AppState.SUCCESS);
      return result;
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setAppState(AppState.ERROR);
      throw err;
    }
  };

  const resetAnalysis = useCallback(() => {
    if (uploadedFile?.previewUrl) {
      URL.revokeObjectURL(uploadedFile.previewUrl);
    }
    setAppState(AppState.IDLE);
    setUploadedFile(null);
    setAnalysisResult(null);
    setErrorMessage('');
  }, [uploadedFile]);

  const loadSavedReport = (result: AnalysisResult, fileName: string, fileType: string) => {
     // Mock file for display
     const mockFile: UploadedFile = {
      file: new File([], fileName, { type: fileType }),
      previewUrl: '', 
      mimeType: fileType,
      textContent: "Report loaded from history." 
    };
    setAnalysisResult(result);
    setUploadedFile(mockFile);
    setAppState(AppState.SUCCESS);
  };

  return {
    appState,
    uploadedFile,
    analysisResult,
    errorMessage,
    processFile,
    resetAnalysis,
    loadSavedReport
  };
};