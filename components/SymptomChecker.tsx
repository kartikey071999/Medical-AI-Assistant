import React, { useState } from 'react';
import { checkSymptoms } from '../services/geminiService';
import { SymptomCheckResult, SymptomInput, AnalysisResult, Finding } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { saveReport } from '../services/storageService';
import { 
  HeartPulseIcon, 
  WarningIcon, 
  AlertCircleIcon, 
  CheckCircleIcon, 
  SparklesIcon, 
  XIcon, 
  ChevronRightIcon
} from './Icons';

// Common symptoms for quick add
const COMMON_SYMPTOMS = [
  "Headache", "Fever", "Cough", "Sore Throat", "Nausea", 
  "Fatigue", "Dizziness", "Abdominal Pain", "Rash", "Shortness of Breath",
  "Anxiety", "Back Pain", "Insomnia", "Joint Pain"
];

export const SymptomChecker: React.FC = () => {
  const { user, login } = useAuth();
  
  // State
  const [step, setStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [error, setError] = useState('');
  const [input, setInput] = useState<SymptomInput>({
    symptoms: [],
    duration: '',
    severity: 'Mild',
    age: '',
    sex: 'Prefer not to say',
    history: '',
    activity: ''
  });
  const [result, setResult] = useState<SymptomCheckResult | null>(null);
  const [customSymptom, setCustomSymptom] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Handlers
  const addSymptom = (symptom: string) => {
    if (!input.symptoms.includes(symptom)) {
      setInput(prev => ({ ...prev, symptoms: [...prev.symptoms, symptom] }));
    }
  };

  const removeSymptom = (symptom: string) => {
    setInput(prev => ({ ...prev, symptoms: prev.symptoms.filter(s => s !== symptom) }));
  };

  const handleCustomSymptomAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customSymptom.trim()) {
      e.preventDefault();
      addSymptom(customSymptom.trim());
      setCustomSymptom('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.symptoms.length === 0) {
      setError("Please add at least one symptom.");
      return;
    }
    
    setStep('analyzing');
    setError('');

    try {
      const analysis = await checkSymptoms(input);
      setResult(analysis);
      setStep('results');
    } catch (err) {
      setError("Failed to analyze symptoms. Please try again.");
      setStep('input');
    }
  };

  const handleSave = async () => {
    if (!user) {
      if(confirm("Sign in to save this check to your dashboard?")) {
        await login();
      }
      return;
    }
    if (!result) return;

    setIsSaving(true);
    
    // Map Symptom Result to AnalysisResult for storage compatibility
    const analysisResult: AnalysisResult = {
      summary: `Symptom Check: ${input.symptoms.join(', ')}. Severity: ${result.severity_level}`,
      findings: result.conditions.map(c => ({
        parameter: c.name,
        value: c.probability,
        status: c.probability === 'High' ? 'Critical' : c.probability === 'Medium' ? 'Warning' : 'Normal',
        interpretation: c.description,
        category: 'Symptom Analysis'
      }) as Finding),
      researchContext: "This analysis is based on reported symptoms and does not constitute a clinical diagnosis.",
      patientAdvice: [
        ...result.recommendations.self_care,
        `Medical Advice: ${result.recommendations.doctor_visit}`
      ],
      disclaimer: result.disclaimer
    };

    try {
      await saveReport({
        userId: user.id,
        fileName: `Symptom Check - ${new Date().toLocaleDateString()}`,
        fileType: 'symptom-check',
        result: analysisResult
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      alert("Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    setStep('input');
    setResult(null);
    setInput({
      symptoms: [],
      duration: '',
      severity: 'Mild',
      age: '',
      sex: 'Prefer not to say',
      history: '',
      activity: ''
    });
    setSaved(false);
  };

  // Render Logic
  const renderInputStep = () => (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 bg-teal-100 dark:bg-teal-900/40 rounded-full mb-4">
          <HeartPulseIcon className="w-8 h-8 text-teal-600 dark:text-teal-400" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white">Symptom Checker</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Describe your symptoms to get instant AI-powered insights.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        
        {/* Symptoms Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">What are your symptoms?</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {input.symptoms.map(sym => (
              <span key={sym} className="inline-flex items-center px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm border border-teal-100 dark:border-teal-800">
                {sym}
                <button type="button" onClick={() => removeSymptom(sym)} className="ml-2 hover:text-teal-900 dark:hover:text-teal-100">
                  <XIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
             <input
               type="text"
               value={customSymptom}
               onChange={(e) => setCustomSymptom(e.target.value)}
               onKeyDown={handleCustomSymptomAdd}
               placeholder="Type a symptom and press Enter..."
               className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
             />
             <button 
               type="button" 
               onClick={() => { if(customSymptom.trim()) { addSymptom(customSymptom.trim()); setCustomSymptom(''); }}}
               className="absolute right-2 top-2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
             >
                <ChevronRightIcon className="w-5 h-5" />
             </button>
          </div>
          
          {/* Tag Cloud */}
          <div className="mt-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Common symptoms:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS.map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => addSymptom(sym)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    input.symptoms.includes(sym)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-teal-400'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Duration</label>
            <input 
              type="text"
              placeholder="e.g. 2 days, since morning"
              value={input.duration}
              onChange={(e) => setInput({...input, duration: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Severity</label>
            <select
              value={input.severity}
              onChange={(e) => setInput({...input, severity: e.target.value as any})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500"
            >
              <option value="Mild">Mild (Annoying but bearable)</option>
              <option value="Moderate">Moderate (Affects daily life)</option>
              <option value="Severe">Severe (Unbearable/Urgent)</option>
            </select>
          </div>
        </div>

        {/* Optional Section Toggle */}
        <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-4">Additional Context (Optional)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             <input 
               type="text"
               placeholder="Age (e.g. 35)"
               value={input.age}
               onChange={(e) => setInput({...input, age: e.target.value})}
               className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
             />
             <select
              value={input.sex}
              onChange={(e) => setInput({...input, sex: e.target.value})}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
            >
              <option value="Prefer not to say">Sex: Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <textarea 
             placeholder="Medical history, medications, or recent activities (e.g. travel, injury)..."
             value={input.history}
             onChange={(e) => setInput({...input, history: e.target.value})}
             rows={2}
             className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button 
          type="submit" 
          className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          <SparklesIcon className="w-5 h-5 mr-2" />
          Check Symptoms
        </button>
      </form>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
      <div className="w-20 h-20 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-6"></div>
      <h2 className="text-2xl font-serif font-bold text-slate-800 dark:text-white mb-2">Consulting Vitalis AI...</h2>
      <p className="text-slate-500 dark:text-slate-400">Comparing your symptoms against medical knowledge bases.</p>
    </div>
  );

  const renderResults = () => {
    if (!result) return null;

    const severityColor = 
      result.severity_level === 'High' ? 'bg-rose-500 text-white' :
      result.severity_level === 'Medium' ? 'bg-amber-500 text-white' :
      'bg-teal-500 text-white';
    
    const severityBorder = 
      result.severity_level === 'High' ? 'border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/10' :
      result.severity_level === 'Medium' ? 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-900/10' :
      'border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-900/10';

    return (
      <div className="max-w-4xl mx-auto pb-12 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Badge */}
        <div className={`rounded-2xl p-6 border ${severityBorder} mb-8 flex flex-col md:flex-row justify-between items-start md:items-center`}>
           <div>
             <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${severityColor}`}>
               {result.severity_level} Severity
             </span>
             <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">Analysis Complete</h2>
           </div>
           <div className="mt-4 md:mt-0 flex space-x-3">
             <button onClick={reset} className="px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">Check Again</button>
             <button 
                onClick={handleSave}
                disabled={saved || isSaving}
                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50"
             >
               {saved ? 'Saved' : 'Save Result'}
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {/* Conditions Column */}
           <div className="md:col-span-2 space-y-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center">
                <SparklesIcon className="w-5 h-5 text-teal-500 mr-2" />
                Potential Conditions
              </h3>
              
              {result.conditions.map((condition, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="text-lg font-bold text-slate-900 dark:text-white">{condition.name}</h4>
                     <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                       condition.probability === 'High' ? 'text-rose-600 bg-rose-100' : 
                       condition.probability === 'Medium' ? 'text-amber-600 bg-amber-100' : 
                       'text-teal-600 bg-teal-100'
                     }`}>
                       {condition.probability} Likelihood
                     </span>
                   </div>
                   <p className="text-slate-600 dark:text-slate-300 text-sm mb-4 leading-relaxed">{condition.description}</p>
                   <div>
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Matching Symptoms</p>
                     <div className="flex flex-wrap gap-2">
                       {condition.matching_symptoms.map(s => (
                         <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                           {s}
                         </span>
                       ))}
                     </div>
                   </div>
                </div>
              ))}
           </div>

           {/* Recommendations Column */}
           <div className="space-y-6">
             <div className="bg-teal-50 dark:bg-teal-900/20 p-6 rounded-2xl border border-teal-100 dark:border-teal-800">
               <h3 className="text-lg font-bold text-teal-900 dark:text-teal-100 mb-4 flex items-center">
                 <CheckCircleIcon className="w-5 h-5 mr-2" />
                 Self Care
               </h3>
               <ul className="space-y-3">
                 {result.recommendations.self_care.map((item, i) => (
                   <li key={i} className="flex items-start text-sm text-slate-700 dark:text-slate-300">
                     <span className="mr-2 text-teal-500">•</span>
                     {item}
                   </li>
                 ))}
               </ul>
             </div>

             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">When to see a doctor</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{result.recommendations.doctor_visit}</p>
                
                {result.recommendations.emergency && (
                  <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/50">
                    <div className="flex items-center text-rose-700 dark:text-rose-400 font-bold text-sm mb-1">
                      <AlertCircleIcon className="w-4 h-4 mr-1" />
                      Emergency Warning
                    </div>
                    <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                      {result.recommendations.emergency}
                    </p>
                  </div>
                )}
             </div>
           </div>
        </div>
        
        <div className="mt-8 text-center text-xs text-slate-400 max-w-2xl mx-auto">
           {result.disclaimer}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {step === 'input' && renderInputStep()}
      {step === 'analyzing' && renderAnalyzing()}
      {step === 'results' && renderResults()}
    </div>
  );
};
