import React, { useState } from 'react';
import { findNearbyDoctors } from '../services/geminiService';
import { MapPinIcon, SparklesIcon } from './Icons';

interface DoctorFinderProps {
  summary: string;
}

export const DoctorFinder: React.FC<DoctorFinderProps> = ({ summary }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null); // Storing the full Gemini response
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await findNearbyDoctors(summary, latitude, longitude);
          setResults(response);
          setSearched(true);
        } catch (err) {
          console.error(err);
          setError("Failed to fetch nearby doctors. Please try again.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error(err);
        setError("Location access denied. Please enable location permissions to find nearby doctors.");
        setLoading(false);
      }
    );
  };

  const renderContent = () => {
    if (!results) return null;

    const text = results.text || "";
    // @ts-ignore - The types for groundingMetadata might be loosely defined in the current SDK version or custom
    const chunks = results.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
           {text.split('\n').map((line: string, i: number) => (
             <p key={i} className="mb-2 last:mb-0">{line}</p>
           ))}
        </div>

        {chunks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {chunks.map((chunk: any, idx: number) => {
              // Extract map data if available. The structure depends on the API response for Maps grounding.
              // Usually chunks have { web: ... } or { maps: ... }
              const mapData = chunk.maps; // Assuming standard Maps grounding structure
              if (!mapData) return null;

              return (
                <a 
                  key={idx}
                  href={mapData.uri} // Link to Google Maps
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-md transition-all group"
                >
                  <div className="bg-teal-50 dark:bg-teal-900/30 p-2 rounded-lg mr-3 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50 transition-colors">
                    <MapPinIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                      {mapData.title || "Medical Center"}
                    </h4>
                    {/* Sometimes review snippets or addresses are in specific fields, rendering title is safest basic implementation */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      View on Google Maps &rarr;
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center">
            <MapPinIcon className="w-5 h-5 text-teal-600 dark:text-teal-400 mr-2" />
            Find Nearby Specialists
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Based on your results, we can suggest relevant doctors near you.
          </p>
        </div>
        
        {!searched && (
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Locating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-2" />
                Find Doctors
              </>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg mb-4">
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  );
};
