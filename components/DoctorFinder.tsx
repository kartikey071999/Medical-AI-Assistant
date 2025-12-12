import React, { useState, useEffect } from 'react';
import { identifySpecialist } from '../services/geminiService';
import { MapPinIcon, SparklesIcon, ChevronRightIcon } from './Icons';

interface DoctorFinderProps {
  summary: string;
}

export const DoctorFinder: React.FC<DoctorFinderProps> = ({ summary }) => {
  const [loading, setLoading] = useState(true);
  const [specialist, setSpecialist] = useState<string>('Doctors');
  const [mapUrl, setMapUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchSpecialist = async () => {
      setLoading(true);
      try {
        // Pre-fetch the specialist type immediately
        const term = await identifySpecialist(summary);
        if (isMounted) {
          setSpecialist(term);
          const query = `${term} near me`;
          setMapUrl(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`);
        }
      } catch (e) {
        console.error("Specialist ID failed", e);
        if (isMounted) {
          setMapUrl(`https://www.google.com/maps/search/?api=1&query=Doctors+near+me`);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSpecialist();

    return () => {
      isMounted = false;
    };
  }, [summary]);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <MapPinIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 mr-2" />
            Find Nearby Specialists
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {loading 
              ? "Identifying the best specialist for your condition..." 
              : `Based on your analysis, we recommend seeing a ${specialist}.`}
          </p>
        </div>
        
        <a
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center whitespace-nowrap group
            ${loading 
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-wait' 
              : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'}
          `}
          aria-disabled={loading}
          onClick={(e) => { if(loading) e.preventDefault(); }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              Analyzing...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              Find {specialist}
              <ChevronRightIcon className="w-4 h-4 ml-1 opacity-60 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </a>
      </div>
    </div>
  );
};