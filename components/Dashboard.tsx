import React, { useEffect, useState } from 'react';
import { SavedReport, AnalysisResult, UploadedFile } from '../types';
import { getUserReports, deleteReport } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { FileUpload } from './FileUpload'; // Reusing icons mostly
import { BeakerIcon, HeartPulseIcon, CheckCircleIcon, XIcon, ChevronRightIcon } from './Icons';
import { AnalysisView } from './AnalysisView';

interface DashboardProps {
  onViewReport: (result: AnalysisResult, fileName: string, fileType: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewReport }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserReports(user.id);
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this report? This cannot be undone.")) {
      await deleteReport(id);
      await loadReports();
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-serif">Health Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Welcome back, {user.name}</p>
        </div>
        <div className="hidden sm:block">
           <div className="bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-xl border border-teal-100 dark:border-teal-800">
             <span className="text-2xl font-bold text-teal-600 dark:text-teal-400 mr-2">{reports.length}</span>
             <span className="text-sm text-teal-800 dark:text-teal-300">Saved Reports</span>
           </div>
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 border-dashed">
          <BeakerIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">No reports yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 mb-6">Upload a medical document to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map((report) => (
            <div 
              key={report.id}
              onClick={() => onViewReport(report.result, report.fileName, report.fileType)}
              className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-teal-200 dark:hover:border-teal-800 transition-all duration-200 cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                      <HeartPulseIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{report.fileName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(report.timestamp)}</p>
                    </div>
                 </div>
                 <button 
                  onClick={(e) => handleDelete(e, report.id)}
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-300 hover:text-rose-500 rounded-full transition-colors"
                  title="Delete Report"
                 >
                   <XIcon className="w-4 h-4" />
                 </button>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {report.result.summary}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-700/50">
                 <div className="flex space-x-3">
                   {/* Mini Stats */}
                   <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                     {report.result.findings.length} findings
                   </span>
                 </div>
                 <div className="flex items-center text-teal-600 dark:text-teal-400 text-sm font-medium group-hover:underline">
                   View Full Analysis 
                   <ChevronRightIcon className="w-4 h-4 ml-1" />
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
