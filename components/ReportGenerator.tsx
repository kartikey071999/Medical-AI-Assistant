import React from 'react';
import { DailyLogEntry, SavedReport } from '../types';
import { calculateHealthRisks } from '../services/analysisService';
import { LogoIcon, BeakerIcon, HeartPulseIcon } from './Icons';

interface ReportGeneratorProps {
  logs: DailyLogEntry[];
  reports: SavedReport[];
  userName: string;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ logs, reports, userName }) => {
  
  const handlePrint = () => {
    window.print();
  };

  const risks = calculateHealthRisks(logs);
  const avgMood = logs.length ? (logs.reduce((a,b) => a + b.mood, 0) / logs.length).toFixed(1) : 'N/A';
  
  return (
    <>
      <button 
        onClick={handlePrint}
        className="flex items-center px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
      >
        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Generate PDF Report
      </button>

      {/* Hidden Print Container */}
      <div className="hidden print:block fixed inset-0 bg-white z-[200] p-12 overflow-y-auto">
         <div className="max-w-3xl mx-auto space-y-8 text-slate-900">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold mb-2">Health Report</h1>
                    <p className="text-slate-500">Generated for {userName}</p>
                </div>
                <div className="text-right">
                    <p className="font-bold">{new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-slate-500">Vitalis AI Analysis</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 rounded-xl">
                <div>
                    <p className="text-xs text-slate-500 uppercase">Avg Mood</p>
                    <p className="text-2xl font-bold">{avgMood}/5</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Total Logs</p>
                    <p className="text-2xl font-bold">{logs.length}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Reports</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase">Risk Level</p>
                    <p className="text-2xl font-bold">{risks.find(r => r.level === 'Severe' || r.level === 'High') ? 'High' : 'Normal'}</p>
                </div>
            </div>

            {/* Risk Analysis */}
            <section>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <HeartPulseIcon className="w-5 h-5 mr-2" />
                    Risk Analysis
                </h2>
                <div className="space-y-4">
                    {risks.map((risk, i) => (
                        <div key={i} className="border border-slate-200 p-4 rounded-lg break-inside-avoid">
                            <div className="flex justify-between mb-2">
                                <h3 className="font-bold">{risk.title}</h3>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase border ${
                                    risk.level === 'High' ? 'border-red-500 text-red-600' : 'border-slate-300 text-slate-600'
                                }`}>{risk.level}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{risk.description}</p>
                            <p className="text-xs text-slate-500"><strong>Advice:</strong> {risk.suggestions.join(', ')}</p>
                        </div>
                    ))}
                    {risks.length === 0 && <p className="text-slate-500 italic">Not enough data for risk analysis.</p>}
                </div>
            </section>

            {/* Recent Reports */}
            <section>
                <h2 className="text-xl font-bold mb-4 flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2" />
                    Medical Report Summary
                </h2>
                <div className="space-y-4">
                    {reports.slice(0, 5).map((r, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg break-inside-avoid">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold">{r.fileName}</span>
                                <span className="text-xs text-slate-500">{new Date(r.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-700">{r.result.summary}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <div className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
                <p>This report is generated by Vitalis AI for informational purposes only.</p>
                <p>Consult a medical professional for advice. Not a diagnosis.</p>
            </div>

         </div>
      </div>
    </>
  );
};
