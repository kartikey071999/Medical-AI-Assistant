import React, { useEffect, useState } from 'react';
import { DailyLogEntry, HealthInsight, SavedReport, RiskAssessment } from '../types';
import { generateHealthInsights } from '../services/geminiService';
import { calculateHealthRisks } from '../services/analysisService';
import { SparklesIcon, HeartPulseIcon, WarningIcon } from './Icons';

interface HealthInsightsProps {
  logs: DailyLogEntry[];
  reports: SavedReport[];
}

export const HealthInsights: React.FC<HealthInsightsProps> = ({ logs, reports }) => {
  const [insights, setInsights] = useState<HealthInsight[]>([]);
  const [risks, setRisks] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (logs.length > 0 || reports.length > 0) {
        loadData();
    }
  }, [logs.length, reports.length]);

  const loadData = async () => {
    setLoading(true);
    const calculatedRisks = calculateHealthRisks(logs);
    setRisks(calculatedRisks);
    const data = await generateHealthInsights(logs, reports);
    setInsights(data);
    setLoading(false);
  };

  const getAverage = (key: keyof DailyLogEntry) => {
    const validLogs = logs.filter(l => l[key] !== undefined);
    if (validLogs.length === 0) return 0;
    const sum = validLogs.reduce((acc, log) => acc + (log[key] as number), 0);
    return (sum / validLogs.length).toFixed(1);
  };

  const renderBarChart = (key: keyof DailyLogEntry, colorClass: string, label: string, maxVal: number = 5) => {
    const last7 = logs.slice(0, 7).reverse();
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</span>
                <span className="text-xl font-bold text-slate-800 dark:text-white">{getAverage(key)}<span className="text-xs text-slate-400 font-normal"> avg</span></span>
            </div>
            <div className="flex items-end justify-between h-20 space-x-1">
                {last7.map((log, i) => {
                    const val = log[key] as number || 0;
                    const height = Math.min(100, (val / maxVal) * 100);
                    return (
                        <div key={i} className="flex flex-col items-center flex-1 group relative">
                            <div 
                               className={`w-full rounded-t-sm ${colorClass} opacity-80 hover:opacity-100 transition-all`} 
                               style={{ height: `${height}%` }}
                            ></div>
                             {/* Tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {val}
                            </div>
                        </div>
                    )
                })}
                {last7.length === 0 && <p className="text-xs text-slate-400 w-full text-center">No data</p>}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       
       {/* Risk Predictions */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {risks.map((risk, i) => (
             <div key={i} className={`p-4 rounded-2xl border shadow-sm ${
                 risk.level === 'Severe' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900' :
                 risk.level === 'High' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900' :
                 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
             }`}>
                <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-slate-800 dark:text-white text-sm">{risk.title}</h4>
                   <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${
                      risk.level === 'Severe' || risk.level === 'High' ? 'text-rose-600 bg-rose-100' : 'text-teal-600 bg-teal-100'
                   }`}>{risk.level}</span>
                </div>
                
                {/* Score Bar */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${risk.score > 50 ? 'bg-rose-500' : 'bg-teal-500'}`} 
                        style={{ width: `${risk.score}%` }}
                    ></div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">{risk.description}</p>
                
                <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Suggestion</p>
                    <p className="text-xs text-slate-700 dark:text-slate-200">{risk.suggestions[0]}</p>
                </div>
             </div>
          ))}
       </div>

       {/* AI Insights Section */}
       <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <h3 className="text-lg font-bold flex items-center mb-4 relative z-10">
             <SparklesIcon className="w-5 h-5 mr-2" />
             AI Health Patterns
          </h3>
          
          {loading ? (
             <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/20 rounded w-3/4"></div>
                <div className="h-4 bg-white/20 rounded w-1/2"></div>
             </div>
          ) : insights.length > 0 ? (
             <div className="space-y-4 relative z-10">
                {insights.map((insight, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/20">
                        <div className="flex items-center mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded mr-2 ${
                                insight.type === 'warning' ? 'bg-rose-500' :
                                insight.type === 'improvement' ? 'bg-green-500' : 'bg-blue-500'
                            }`}>{insight.type}</span>
                            <span className="font-bold text-sm">{insight.title}</span>
                        </div>
                        <p className="text-xs text-indigo-100 leading-relaxed">{insight.description}</p>
                    </div>
                ))}
             </div>
          ) : (
             <p className="text-sm opacity-80">Log more data to unlock AI patterns and correlations.</p>
          )}
       </div>

       {/* Charts Grid */}
       <h3 className="font-bold text-slate-800 dark:text-white flex items-center mt-8">
            <HeartPulseIcon className="w-5 h-5 mr-2 text-teal-500" />
            Trends & Wearables
       </h3>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderBarChart('mood', 'bg-yellow-400', 'Mood', 5)}
          {renderBarChart('stress', 'bg-rose-500', 'Stress', 5)}
          {renderBarChart('sleepQuality', 'bg-indigo-500', 'Sleep Qual', 5)}
          {renderBarChart('energy', 'bg-teal-500', 'Energy', 5)}
          
          {/* Wearables Charts */}
          {renderBarChart('steps', 'bg-blue-500', 'Steps', 10000)}
          {renderBarChart('sleepHours', 'bg-purple-500', 'Sleep Hrs', 10)}
       </div>
    </div>
  );
};
