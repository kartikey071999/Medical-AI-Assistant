import React, { useState, useEffect } from 'react';
import { Timeline } from './Timeline';
import { DailyCheckIn } from './DailyCheckIn';
import { HealthInsights } from './HealthInsights';
import { ReportGenerator } from './ReportGenerator';
import { getTimelineEvents, getUserLogs, getUserReports } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { TimelineEvent, DailyLogEntry, SavedReport } from '../types';

export const HealthDiary: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'timeline' | 'insights'>('timeline');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
        loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [e, l, r] = await Promise.all([
        getTimelineEvents(user.id),
        getUserLogs(user.id),
        getUserReports(user.id)
    ]);
    setEvents(e);
    setLogs(l);
    setReports(r);
    setLoading(false);
  };

  if (!user) return <div className="text-center py-20">Please sign in to access your Health Diary.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-end mb-8">
         <div>
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Health Diary</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track your wellness journey day by day.</p>
         </div>
         <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0 items-end sm:items-center">
             <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex space-x-1">
                 <button 
                    onClick={() => setActiveTab('timeline')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'timeline' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                 >
                    Timeline
                 </button>
                 <button 
                    onClick={() => setActiveTab('insights')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'insights' ? 'bg-white dark:bg-slate-700 shadow-sm text-teal-600 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                 >
                    Insights
                 </button>
             </div>
             
             <ReportGenerator logs={logs} reports={reports} userName={user.name} />
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left Column: Daily Check-in (Always Visible) */}
           <div className="lg:col-span-1">
              <div className="sticky top-24">
                 <DailyCheckIn onSaved={loadData} />
              </div>
           </div>

           {/* Right Column: Tabbed Content */}
           <div className="lg:col-span-2">
              {loading ? (
                  <div className="flex justify-center py-20">
                      <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
              ) : activeTab === 'timeline' ? (
                  <Timeline events={events} />
              ) : (
                  <HealthInsights logs={logs} reports={reports} />
              )}
           </div>
       </div>
    </div>
  );
};
