import React, { useState, useEffect } from 'react';
import { EmergencyProfile } from '../types';
import { saveEmergencyProfile, getEmergencyProfile } from '../services/storageService';
import { useAuth } from '../contexts/AuthContext';
import { WarningIcon } from './Icons';

export const EmergencyCard: React.FC = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<EmergencyProfile>({
    userId: user?.id || '',
    bloodGroup: '',
    allergies: [],
    medications: [],
    chronicConditions: [],
    contacts: [],
    doctorName: '',
    doctorPhone: ''
  });

  // Load data
  useEffect(() => {
    if (user) {
        getEmergencyProfile(user.id).then(data => {
            if (data) setProfile(data);
            else setProfile(p => ({ ...p, userId: user.id }));
        });
    }
  }, [user]);

  const handleSave = async () => {
     if(!user) return;
     await saveEmergencyProfile(profile);
     setIsEditing(false);
  };

  const addArrayItem = (field: 'allergies' | 'medications' | 'chronicConditions', value: string) => {
     if(value.trim()) {
        setProfile({ ...profile, [field]: [...profile[field], value.trim()] });
     }
  };

  const removeArrayItem = (field: 'allergies' | 'medications' | 'chronicConditions', index: number) => {
     const newArr = [...profile[field]];
     newArr.splice(index, 1);
     setProfile({ ...profile, [field]: newArr });
  };

  const qrData = encodeURIComponent(JSON.stringify({
    name: user?.name,
    blood: profile.bloodGroup,
    allergies: profile.allergies,
    meds: profile.medications,
    ICE: profile.contacts
  }));

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

  if (!user) return <div className="text-center p-10">Please sign in to access Emergency Card features. <button onClick={() => login()} className="text-teal-600 underline">Sign In</button></div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
       <div className="flex justify-between items-center mb-6">
         <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white flex items-center">
            <div className="bg-rose-500 p-2 rounded-lg mr-3 text-white">
               <WarningIcon className="w-6 h-6" />
            </div>
            Emergency Info
         </h1>
         <button 
           onClick={() => isEditing ? handleSave() : setIsEditing(true)}
           className={`px-4 py-2 rounded-xl font-medium transition-colors ${
               isEditing ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800'
           }`}
         >
           {isEditing ? 'Save Details' : 'Edit Details'}
         </button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card Preview */}
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
             <div className="bg-rose-600 h-4 w-full"></div>
             <div className="p-8">
                <div className="flex justify-between items-start">
                   <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-wider">{user.name}</h2>
                      <p className="text-slate-500 text-sm">Emergency Medical Card</p>
                   </div>
                   {profile.bloodGroup && (
                       <div className="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-2 rounded-xl font-bold border border-rose-100 dark:border-rose-900">
                          Blood: {profile.bloodGroup}
                       </div>
                   )}
                </div>

                <div className="mt-8 grid grid-cols-2 gap-6">
                   <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Allergies</h4>
                      {profile.allergies.length > 0 ? (
                        <ul className="list-disc list-inside text-rose-600 font-medium">
                           {profile.allergies.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                      ) : <span className="text-slate-400 italic">None listed</span>}
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Medications</h4>
                      {profile.medications.length > 0 ? (
                        <ul className="list-disc list-inside text-slate-700 dark:text-slate-300">
                           {profile.medications.map((m, i) => <li key={i}>{m}</li>)}
                        </ul>
                      ) : <span className="text-slate-400 italic">None listed</span>}
                   </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Emergency Contacts (ICE)</h4>
                    {profile.contacts.map((c, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 text-sm">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{c.name} ({c.relation})</span>
                            <a href={`tel:${c.phone}`} className="text-teal-600 hover:underline">{c.phone}</a>
                        </div>
                    ))}
                    {profile.contacts.length === 0 && <span className="text-slate-400 italic">No contacts added.</span>}
                </div>
             </div>
          </div>

          {/* QR Code & Actions */}
          <div className="space-y-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
                <div className="bg-white p-2 rounded-xl border border-slate-100 mb-4">
                    <img src={qrUrl} alt="Emergency QR Code" className="w-40 h-40" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white">Scan for Medical Info</h3>
                <p className="text-xs text-slate-500 mt-2">Paramedics can scan this code to view your vital information immediately.</p>
                <button 
                  onClick={() => window.print()}
                  className="mt-4 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                    Print / Save PDF
                </button>
             </div>
          </div>
       </div>

       {/* Edit Form */}
       {isEditing && (
          <div className="mt-8 bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
             <h3 className="font-bold text-lg mb-4 dark:text-white">Edit Information</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium mb-1 dark:text-slate-300">Blood Group</label>
                   <select 
                     value={profile.bloodGroup} 
                     onChange={(e) => setProfile({...profile, bloodGroup: e.target.value})}
                     className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                   >
                      <option value="">Select...</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                </div>
                
                {/* Simplified Contact Adder for Demo */}
                <div className="col-span-2">
                   <label className="block text-sm font-medium mb-1 dark:text-slate-300">Add Emergency Contact</label>
                   <div className="flex gap-2">
                      <input id="cName" placeholder="Name" className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                      <input id="cRel" placeholder="Relation" className="w-1/4 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                      <input id="cPhone" placeholder="Phone" className="w-1/4 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                      <button 
                        type="button"
                        onClick={() => {
                            const name = (document.getElementById('cName') as HTMLInputElement).value;
                            const relation = (document.getElementById('cRel') as HTMLInputElement).value;
                            const phone = (document.getElementById('cPhone') as HTMLInputElement).value;
                            if(name && phone) {
                                setProfile({...profile, contacts: [...profile.contacts, {name, relation, phone}]});
                                (document.getElementById('cName') as HTMLInputElement).value = '';
                                (document.getElementById('cRel') as HTMLInputElement).value = '';
                                (document.getElementById('cPhone') as HTMLInputElement).value = '';
                            }
                        }}
                        className="bg-teal-600 text-white px-4 rounded-lg"
                      >Add</button>
                   </div>
                   <div className="mt-2 space-y-1">
                      {profile.contacts.map((c, i) => (
                          <div key={i} className="flex justify-between bg-white dark:bg-slate-800 p-2 rounded text-sm dark:text-slate-200">
                              <span>{c.name} - {c.relation} ({c.phone})</span>
                              <button onClick={() => {
                                  const newC = [...profile.contacts];
                                  newC.splice(i, 1);
                                  setProfile({...profile, contacts: newC});
                              }} className="text-red-500">Remove</button>
                          </div>
                      ))}
                   </div>
                </div>

                {/* Simplified Array Adders */}
                <div>
                   <label className="block text-sm font-medium mb-1 dark:text-slate-300">Add Allergy</label>
                   <div className="flex gap-2">
                      <input id="newAllergy" className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                      <button type="button" onClick={() => {
                         const val = (document.getElementById('newAllergy') as HTMLInputElement).value;
                         addArrayItem('allergies', val);
                         (document.getElementById('newAllergy') as HTMLInputElement).value = '';
                      }} className="bg-teal-600 text-white px-3 rounded-lg">+</button>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-2">
                      {profile.allergies.map((a, i) => (
                          <span key={i} className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs flex items-center">
                              {a} <button onClick={() => removeArrayItem('allergies', i)} className="ml-1 font-bold">×</button>
                          </span>
                      ))}
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-medium mb-1 dark:text-slate-300">Add Medication</label>
                   <div className="flex gap-2">
                      <input id="newMed" className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-600 dark:text-white" />
                      <button type="button" onClick={() => {
                         const val = (document.getElementById('newMed') as HTMLInputElement).value;
                         addArrayItem('medications', val);
                         (document.getElementById('newMed') as HTMLInputElement).value = '';
                      }} className="bg-teal-600 text-white px-3 rounded-lg">+</button>
                   </div>
                   <div className="flex flex-wrap gap-2 mt-2">
                      {profile.medications.map((m, i) => (
                          <span key={i} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs flex items-center">
                              {m} <button onClick={() => removeArrayItem('medications', i)} className="ml-1 font-bold">×</button>
                          </span>
                      ))}
                   </div>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};
