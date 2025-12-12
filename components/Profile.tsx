import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sex } from '../types';
import { deleteAllUserReports } from '../services/storageService';

export const Profile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    sex: user?.sex || 'Prefer not to say',
    healthHistory: user?.healthHistory?.join(', ') || ''
  });
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!user) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));

    updateUser({
      name: formData.name,
      sex: formData.sex as Sex,
      healthHistory: formData.healthHistory.split(',').map(s => s.trim()).filter(Boolean)
    });

    setMessage("Profile updated successfully!");
    setSaving(false);
  };

  const handleDeleteData = async () => {
    if (confirm("WARNING: This will permanently delete ALL your saved analysis reports. This action cannot be undone. Are you sure?")) {
      await deleteAllUserReports(user.id);
      alert("All data deleted.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white font-serif mb-8">Profile Settings</h1>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        
        {/* Header / Avatar */}
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center md:space-x-6">
           <img 
              src={user.image} 
              alt={user.name} 
              className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 mb-4 md:mb-0"
           />
           <div className="text-center md:text-left">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
             <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">{user.email}</p>
             <div className="inline-flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
               <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.539c1.07-2.611,2.56-4.227,3.102-4.708C16.891,4.522,18.91,3,21.5,3c0.165,0,0.328,0.007,0.489,0.019 c-1.048,1.405-1.503,3.315-1.012,4.864c0.413,1.3,1.527,2.378,2.709,2.89C23.238,12.35,21.905,14.619,20,16.5 c-3.033,3.032-7.061,4.981-11.411,5.433c-0.342,0.035-0.687-0.203-0.741-0.543l-0.89-5.592C6.805,15.602,6.671,15.409,6.594,15.2 l-2.69-7.397C3.593,6.947,4.605,6,5.748,6c0.559,0,1.075,0.228,1.458,0.6l2.164,2.099C9.729,9.049,10.206,9.155,10.601,8.964 c2.049-0.989,2.056-3.899,2.062-5.464l0.002-0.5C12.665,1.344,11.321,0,9.665,0C6.904,0,2,2.904,2,5.665 C2,7.321,3.344,8.665,5,8.665h0.5l0.564,1.551l2.42,6.654L9.27,21.84c0.151,0.949,1.107,1.56,2.046,1.258 c5.053-1.626,9.27-5.048,11.838-9.351C22.695,12.98,22.09,12.368,21.353,12.016z"/></svg>
               Google Account
             </div>
           </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
               <input 
                 type="text" 
                 name="name"
                 value={formData.name}
                 onChange={handleChange}
                 className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
               />
             </div>
             
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sex</label>
               <select 
                 name="sex"
                 value={formData.sex}
                 onChange={handleChange}
                 className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
               >
                 <option value="Male">Male</option>
                 <option value="Female">Female</option>
                 <option value="Other">Other</option>
                 <option value="Prefer not to say">Prefer not to say</option>
               </select>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Known Health Issues (Comma separated)</label>
             <textarea 
               name="healthHistory"
               value={formData.healthHistory}
               onChange={handleChange}
               rows={3}
               placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes"
               className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
             />
             <p className="text-xs text-slate-500 mt-1">This helps Vitalis provide more personalized analysis context.</p>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            {message && <span className="text-green-600 text-sm font-medium animate-pulse">{message}</span>}
            <div className="flex-1"></div>
            <button 
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="bg-rose-50 dark:bg-rose-900/10 p-8 border-t border-rose-100 dark:border-rose-900/30">
          <h3 className="text-rose-700 dark:text-rose-400 font-bold mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Permanently delete all your analysis reports from the database.</p>
          <button 
            onClick={handleDeleteData}
            className="px-4 py-2 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-sm font-medium transition-colors"
          >
            Delete All Data
          </button>
        </div>

      </div>
    </div>
  );
};
