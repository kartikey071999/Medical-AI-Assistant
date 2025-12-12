import React, { useState } from 'react';
import { DailyLogEntry } from '../types';
import { saveDailyLog } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircleIcon, HeartPulseIcon } from './Icons';

interface DailyCheckInProps {
  onSaved: () => void;
}

export const DailyCheckIn: React.FC<DailyCheckInProps> = ({ onSaved }) => {
  const { user, login } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const [form, setForm] = useState<Omit<DailyLogEntry, 'id' | 'userId' | 'date'>>({
    mood: 3,
    stress: 3,
    sleepQuality: 3,
    pain: 1,
    energy: 3,
    notes: '',
    steps: undefined,
    heartRate: undefined,
    sleepHours: undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        if(confirm("Please sign in to save your daily log.")) login();
        return;
    }

    await saveDailyLog({
        userId: user.id,
        date: new Date().toISOString(),
        ...form
    });
    
    setSubmitted(true);
    setTimeout(() => {
        setSubmitted(false);
        setForm({ mood: 3, stress: 3, sleepQuality: 3, pain: 1, energy: 3, notes: '', steps: undefined, heartRate: undefined, sleepHours: undefined });
        onSaved();
    }, 2000);
  };

  const SliderField = ({ label, value, onChange, minLabel, maxLabel, emojis }: any) => (
    <div className="mb-5">
       <div className="flex justify-between mb-2">
         <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
         <span className="text-sm font-bold text-teal-600 dark:text-teal-400">
            {emojis ? emojis[value - 1] : value + '/5'}
         </span>
       </div>
       <input 
         type="range" 
         min="1" 
         max="5" 
         value={value}
         onChange={(e) => onChange(parseInt(e.target.value))}
         className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
       />
       <div className="flex justify-between mt-1 text-xs text-slate-400">
         <span>{minLabel}</span>
         <span>{maxLabel}</span>
       </div>
    </div>
  );

  if (submitted) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-green-200 dark:border-green-900 shadow-sm animate-in zoom-in duration-300">
            <div className="inline-flex p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 text-green-600 dark:text-green-400">
                <CheckCircleIcon className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Log Saved!</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Great job checking in today.</p>
        </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
       <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-white mb-6">Daily Health Check-in</h2>
       <form onSubmit={handleSubmit}>
          <SliderField 
            label="Mood" 
            value={form.mood} 
            onChange={(v: number) => setForm({...form, mood: v})} 
            minLabel="Terrible" 
            maxLabel="Excellent" 
            emojis={['😢', '😟', '😐', '🙂', '😁']}
          />
          <SliderField 
            label="Stress Level" 
            value={form.stress} 
            onChange={(v: number) => setForm({...form, stress: v})} 
            minLabel="Low" 
            maxLabel="High" 
          />
          <SliderField 
            label="Sleep Quality" 
            value={form.sleepQuality} 
            onChange={(v: number) => setForm({...form, sleepQuality: v})} 
            minLabel="Poor" 
            maxLabel="Restful" 
          />
          
          {expanded && (
             <div className="animate-in fade-in slide-in-from-top-2">
                <SliderField 
                    label="Pain Level" 
                    value={form.pain} 
                    onChange={(v: number) => setForm({...form, pain: v})} 
                    minLabel="None" 
                    maxLabel="Severe" 
                />
                <SliderField 
                    label="Energy Level" 
                    value={form.energy} 
                    onChange={(v: number) => setForm({...form, energy: v})} 
                    minLabel="Low" 
                    maxLabel="High" 
                />
             </div>
          )}

          {/* Wearables Section (Manual) */}
          <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
             <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <HeartPulseIcon className="w-4 h-4 mr-2 text-rose-500" />
                Wearables Data (Optional)
             </h4>
             <div className="grid grid-cols-3 gap-3">
                 <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Steps</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 8000"
                      value={form.steps || ''}
                      onChange={(e) => setForm({...form, steps: parseInt(e.target.value) || undefined})}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sleep (Hrs)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 7.5"
                      step="0.1"
                      value={form.sleepHours || ''}
                      onChange={(e) => setForm({...form, sleepHours: parseFloat(e.target.value) || undefined})}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white"
                    />
                 </div>
                 <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Avg HR</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 72"
                      value={form.heartRate || ''}
                      onChange={(e) => setForm({...form, heartRate: parseInt(e.target.value) || undefined})}
                      className="w-full px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm dark:text-white"
                    />
                 </div>
             </div>
          </div>
          
          <div className="mt-6 mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Notes</label>
            <textarea 
              value={form.notes}
              onChange={(e) => setForm({...form, notes: e.target.value})}
              placeholder="Any symptoms, medicines taken, or thoughts..."
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-500"
              rows={2}
            />
          </div>

          <div className="space-y-3">
             <button 
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
             >
                {expanded ? 'Show Less' : 'Show More Fields'}
             </button>

             <button 
                type="submit" 
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl"
             >
                Save Log
             </button>
          </div>
       </form>
    </div>
  );
};
