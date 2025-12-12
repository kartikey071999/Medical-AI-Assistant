import React, { useState } from 'react';
import { AnalysisResult, UploadedFile, Finding } from '../types';
import { DoctorFinder } from './DoctorFinder';
import { useAuth } from '../contexts/AuthContext';
import { saveReport } from '../services/storageService';
import { 
  BeakerIcon, 
  HeartPulseIcon, 
  CheckCircleIcon, 
  WarningIcon, 
  AlertCircleIcon,
  ChevronRightIcon,
  UploadIcon,
  SparklesIcon
} from './Icons';

interface AnalysisViewProps {
  result: AnalysisResult;
  file: UploadedFile;
  onReset: () => void;
  onAskAi: (query: string) => void;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    Normal: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
    Warning: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    Critical: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    Unknown: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  };
  
  const icons = {
    Normal: <CheckCircleIcon className="w-4 h-4 mr-1" />,
    Warning: <WarningIcon className="w-4 h-4 mr-1" />,
    Critical: <AlertCircleIcon className="w-4 h-4 mr-1" />,
    Unknown: <span className="w-4 h-4 mr-1 text-xs font-bold">?</span>,
  };

  const key = status as keyof typeof styles;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[key] || styles.Unknown}`}>
      {icons[key] || icons.Unknown}
      {status.toUpperCase()}
    </span>
  );
};

const FindingCard: React.FC<{ finding: Finding; index: number; onAsk: (q: string) => void }> = ({ finding, index, onAsk }) => {
  const [expanded, setExpanded] = useState(false);

  const borderColor = 
    finding.status === 'Critical' ? 'border-rose-200 dark:border-rose-900 shadow-rose-50 dark:shadow-none' : 
    finding.status === 'Warning' ? 'border-amber-200 dark:border-amber-900 shadow-amber-50 dark:shadow-none' : 
    'border-slate-100 dark:border-slate-700';

  const handleAskClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const query = `Can you explain the finding for "${finding.parameter}" which is marked as ${finding.status}? The value is ${finding.value} ${finding.unit || ''}.`;
    onAsk(query);
  };

  return (
    <div 
      className={`bg-white dark:bg-slate-800 rounded-xl border ${borderColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-2`}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-4">
          <div className={`
            p-2 rounded-lg flex-shrink-0
            ${finding.status === 'Critical' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' : 
              finding.status === 'Warning' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 
              'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}
          `}>
             <HeartPulseIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center">
              {finding.parameter}
              <button 
                type="button"
                onClick={handleAskClick}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-600 dark:text-teal-400 p-1 rounded-full z-10"
                title="Ask Vitalis about this"
              >
                <SparklesIcon className="w-3 h-3" />
              </button>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">{finding.category || 'General'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{finding.value} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{finding.unit}</span></p>
          </div>
          <StatusBadge status={finding.status} />
          <ChevronRightIcon className={`w-5 h-5 text-slate-300 dark:text-slate-600 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      
      {expanded && (
        <div className="bg-slate-50 dark:bg-slate-850 p-4 border-t border-slate-100 dark:border-slate-700 text-sm">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="md:col-span-2">
               <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Interpretation</span>
               <p className="text-slate-700 dark:text-slate-300 mt-1">{finding.interpretation}</p>
             </div>
             
             <div className="sm:hidden">
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Measured Value</span>
                <p className="text-slate-700 dark:text-slate-300 mt-1 font-mono font-medium">{finding.value} {finding.unit}</p>
             </div>

             {finding.referenceRange && (
               <div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Common Values (Reference)</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-1 font-mono text-sm">{finding.referenceRange} {finding.unit}</p>
               </div>
             )}

             <div className="md:col-span-2 flex justify-end mt-2">
                <button 
                  type="button"
                  onClick={handleAskClick}
                  className="text-xs flex items-center text-teal-600 dark:text-teal-400 font-medium hover:underline hover:text-teal-700 dark:hover:text-teal-300 p-1"
                >
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Ask Chatbot to explain this further
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, file, onReset, onAskAi }) => {
  const { user, login } = useAuth();
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveReport = async () => {
    if (!user) {
      if(confirm("You need to sign in to save reports. Sign in now?")) {
         await login();
      }
      return; 
    }

    setIsSaving(true);
    try {
      await saveReport({
        userId: user.id,
        fileName: file.file.name,
        fileType: file.mimeType,
        result: result
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert("Failed to save report.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <img 
          src={file.previewUrl} 
          alt="Uploaded Report" 
          className="max-h-[400px] w-full object-contain rounded-lg shadow-sm"
        />
      );
    } else if (file.mimeType === 'application/pdf') {
      return (
        <iframe 
          src={file.previewUrl} 
          title="PDF Preview"
          className="w-full h-[400px] rounded-lg shadow-sm bg-white"
        />
      );
    } else {
      return (
        <div className="w-full h-[400px] overflow-auto bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-xs font-mono whitespace-pre custom-scrollbar text-slate-800 dark:text-slate-200">
          {file.textContent || "Preview not available"}
        </div>
      );
    }
  };

  const criticalFindings = result.findings.filter(f => f.status === 'Critical');
  const warningFindings = result.findings.filter(f => f.status === 'Warning');
  const normalFindings = result.findings.filter(f => f.status === 'Normal');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full max-w-7xl mx-auto pb-12">
      
      {/* Sidebar / Preview Column */}
      <div className="lg:col-span-4 flex flex-col space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex justify-between items-center">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Source Document</h3>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 uppercase">
               {file.mimeType.split('/')[1] || 'FILE'}
            </span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-900 flex justify-center items-center">
            {renderPreview()}
          </div>
          <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 space-y-3">
            <button 
              onClick={handleSaveReport}
              disabled={saved || isSaving}
              className={`w-full py-3 px-4 font-medium rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2
                ${saved 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl'
                }
              `}
            >
              {saved ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Report Saved</span>
                </>
              ) : (
                <>
                  {/* SVG for save/floppy */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  <span>{user ? 'Save to Dashboard' : 'Sign in to Save'}</span>
                </>
              )}
            </button>
            
            <button 
              onClick={onReset}
              className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <UploadIcon className="w-5 h-5" />
              <span>Analyze New Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Column */}
      <div className="lg:col-span-8 space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
        
        {/* Header Section */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-700 dark:from-teal-600 dark:to-teal-800 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400 opacity-20 rounded-full translate-y-1/3 -translate-x-1/3"></div>
           
           <h2 className="text-3xl font-serif font-bold mb-4 relative z-10">Analysis Complete</h2>
           <p className="text-teal-50 text-lg leading-relaxed relative z-10 opacity-90">
             {result.summary}
           </p>

           <div className="mt-6 flex space-x-4 relative z-10">
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30 flex items-center">
                <span className="text-2xl font-bold mr-2">{result.findings.length}</span>
                <span className="text-sm opacity-80">Total<br/>Markers</span>
              </div>
              {criticalFindings.length > 0 && (
                <div className="px-4 py-2 bg-rose-500/30 backdrop-blur-sm rounded-lg border border-rose-400/50 flex items-center text-rose-50">
                  <span className="text-2xl font-bold mr-2">{criticalFindings.length}</span>
                  <span className="text-sm opacity-90">Requires<br/>Attention</span>
                </div>
              )}
           </div>
        </div>

        {/* Detailed Findings Dashboard */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
             <HeartPulseIcon className="w-6 h-6 text-teal-600 dark:text-teal-400 mr-2" />
             Detailed Findings
          </h3>
          
          {result.findings.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
              No specific data points could be extracted.
            </div>
          ) : (
            <div className="space-y-1">
              {criticalFindings.map((f, i) => <FindingCard key={`crit-${i}`} finding={f} index={i} onAsk={onAskAi} />)}
              {warningFindings.map((f, i) => <FindingCard key={`warn-${i}`} finding={f} index={i + criticalFindings.length} onAsk={onAskAi} />)}
              {normalFindings.map((f, i) => <FindingCard key={`norm-${i}`} finding={f} index={i + criticalFindings.length + warningFindings.length} onAsk={onAskAi} />)}
            </div>
          )}
        </div>

        {/* Context & Advice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Clinical Research */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm h-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center">
               <BeakerIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
               Clinical Context
            </h3>
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed">
              {result.researchContext}
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-6 border border-teal-100 dark:border-teal-800/50 shadow-sm h-full">
             <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100 mb-4 flex items-center">
               <CheckCircleIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 mr-2" />
               Recommended Actions
            </h3>
            <ul className="space-y-3">
              {result.patientAdvice.map((advice, idx) => (
                <li key={idx} className="flex items-start bg-white dark:bg-slate-800 p-3 rounded-lg border border-teal-100 dark:border-teal-900 shadow-sm">
                  <div className="min-w-[20px] h-5 flex items-center justify-center mt-0.5 mr-3">
                    <div className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-300 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                  </div>
                  <span className="text-slate-700 dark:text-slate-300 text-sm">{advice}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Doctor Finder Section */}
        <DoctorFinder summary={result.summary} />

         {/* Disclaimer */}
         <div className="bg-slate-900 dark:bg-slate-950 rounded-xl p-6 text-center shadow-lg border border-slate-800 dark:border-slate-900">
            <p className="text-slate-400 text-xs leading-relaxed max-w-2xl mx-auto">
              <span className="font-bold text-slate-200 uppercase tracking-wider block mb-2">Medical Disclaimer</span>
              Vitalis AI is an experimental analysis tool. 
              Results are estimates and 
              <span className="text-rose-400 font-bold"> should never replace professional medical advice. </span>
              Consult with your physician.
            </p>
         </div>

      </div>
    </div>
  );
};
