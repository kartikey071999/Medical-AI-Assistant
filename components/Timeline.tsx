import React from 'react';
import { TimelineEvent, DailyLogEntry } from '../types';
import { BeakerIcon, HeartPulseIcon, SparklesIcon } from './Icons';

interface TimelineProps {
  events: TimelineEvent[];
}

export const Timeline: React.FC<TimelineProps> = ({ events }) => {
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type: string) => {
    switch(type) {
        case 'report': return <BeakerIcon className="w-5 h-5 text-teal-600" />;
        case 'log': return <div className="text-xl">📝</div>; 
        case 'symptom_check': return <HeartPulseIcon className="w-5 h-5 text-rose-500" />;
        default: return <SparklesIcon className="w-5 h-5 text-slate-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch(type) {
        case 'report': return 'bg-teal-100 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800';
        case 'log': return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30';
        case 'symptom_check': return 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
        default: return 'bg-slate-100 dark:bg-slate-800 border-slate-200';
    }
  };

  const renderWearableData = (details: DailyLogEntry) => {
    if (!details.steps && !details.heartRate && !details.sleepHours) return null;
    return (
        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex space-x-4 text-xs font-mono text-slate-600 dark:text-slate-400">
            {details.steps && <span>👣 {details.steps} steps</span>}
            {details.heartRate && <span>❤️ {details.heartRate} bpm</span>}
            {details.sleepHours && <span>💤 {details.sleepHours} hrs</span>}
        </div>
    );
  };

  if (events.length === 0) {
    return (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
            <p>No activity yet. Start by logging your day or uploading a report.</p>
        </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 py-4">
       {events.map((event) => (
         <div key={event.id} className="relative pl-8">
            {/* Dot */}
            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                event.type === 'report' ? 'bg-teal-500' :
                event.type === 'log' ? 'bg-blue-500' : 'bg-rose-500'
            }`}></div>
            
            {/* Content Card */}
            <div className={`p-4 rounded-2xl border shadow-sm transition-transform hover:scale-[1.01] ${getBgColor(event.type)}`}>
               <div className="flex justify-between items-start mb-2">
                 <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-white/50 dark:bg-black/20 rounded-lg">
                        {getIcon(event.type)}
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{event.title}</span>
                 </div>
                 <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formatDate(event.date)}</span>
               </div>
               <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                 {event.summary}
               </p>
               
               {event.type === 'log' && renderWearableData(event.details)}
            </div>
         </div>
       ))}
    </div>
  );
};
