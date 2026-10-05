import React, { useState, useEffect } from 'react';
import { Search, QrCode, UserPlus, AlertTriangle, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { PatientPreview } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface PatientSearchProps {
  onSelectPatient: (patientId: string) => void;
  onOpenQRScanner: () => void;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({
  onSelectPatient,
  onOpenQRScanner,
}) => {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search query
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPatients(searchTerm);
    }, 280);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchPatients = async (query: string) => {
    setIsLoading(true);
    try {
      const url = query
        ? `/api/patients?q=${encodeURIComponent(query)}`
        : '/api/patients';

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to query patients:', err);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header and Input */}
      <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Emergency Patient Registry & Search
            </h2>
            <p className="text-xs text-slate-500">
              Query by Patient ID, Name, or scan tokenized QR emergency wristbands
            </p>
          </div>

          <button
            onClick={onOpenQRScanner}
            className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap active:scale-98"
          >
            <QrCode className="w-4 h-4" />
            Scan Patient QR
          </button>
        </div>

        {/* Accessible Search Form */}
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Patient ID (e.g. P1001), Full Name, or QR Token..."
            className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
        </form>

        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Quick Filters:</span>
          <button
            onClick={() => setSearchTerm('P1001')}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-mono"
          >
            P1001 (Arthur)
          </button>
          <button
            onClick={() => setSearchTerm('P1002')}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-mono"
          >
            P1002 (Maya)
          </button>
          <button
            onClick={() => setSearchTerm('P1005')}
            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] font-mono"
          >
            P1005 (Hastings)
          </button>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-rose-600 hover:underline text-[11px] ml-auto font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      </section>

      {/* Patient Results Grid (Section 8 Requirement) */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Registered Patients ({patients.length})
          </span>
          <span className="text-[11px] text-slate-400">
            Safe non-PII triage preview
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse h-48" />
            ))}
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No matching patient records</p>
            <p className="text-xs text-slate-500 mt-1">
              Verify the Patient ID or try searching with another keyword.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <article
                key={patient.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-rose-600">
                        {patient.id}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {patient.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {patient.age} yrs · {patient.gender}
                      </p>
                    </div>

                    <div className="px-2.5 py-1 bg-rose-50 text-rose-700 font-extrabold text-xs rounded-lg border border-rose-200">
                      {patient.bloodGroup}
                    </div>
                  </div>

                  {/* Critical Allergies Badge List */}
                  <div className="mt-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Critical Allergies:
                    </span>
                    {patient.criticalAllergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.criticalAllergies.map((allergy, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None reported</span>
                    )}
                  </div>

                  {/* Primary Emergency Contact */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                      Emergency Contact:
                    </span>
                    {patient.emergencyContact ? (
                      <div className="flex items-center justify-between text-slate-700">
                        <span>
                          {patient.emergencyContact.name} ({patient.emergencyContact.relation})
                        </span>
                        <a
                          href={`tel:${patient.emergencyContact.phone}`}
                          className="text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      </div>
                    ) : (
                      <span className="text-slate-400">No contact assigned</span>
                    )}
                  </div>
                </div>

                {/* Open Profile Button */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectPatient(patient.id)}
                    className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    Open Emergency Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
