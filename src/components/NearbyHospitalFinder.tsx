import React, { useState, useEffect } from 'react';
import {
  Hospital,
  HospitalMatchResult,
} from '../types.ts';
import {
  Search,
  Filter,
  Navigation,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Phone,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface NearbyHospitalFinderProps {
  patientCoords: { latitude: number; longitude: number };
  onSelectHospitalForEmergency?: (hospital: Hospital) => void;
  onFocusMapHospital?: (hospital: Hospital) => void;
}

export const NearbyHospitalFinder: React.FC<NearbyHospitalFinderProps> = ({
  patientCoords,
  onSelectHospitalForEmergency,
  onFocusMapHospital,
}) => {
  const [recommendations, setRecommendations] = useState<HospitalMatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [maxDistance, setMaxDistance] = useState<number>(20);
  const [requireED, setRequireED] = useState<boolean>(true);
  const [requireICU, setRequireICU] = useState<boolean>(false);
  const [requireVentilator, setRequireVentilator] = useState<boolean>(false);
  const [requireBlood, setRequireBlood] = useState<boolean>(false);
  const [requireAmbulance, setRequireAmbulance] = useState<boolean>(false);
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');

  useEffect(() => {
    fetchRecommendations();
  }, [patientCoords, requireICU, requireVentilator, requireBlood, requireAmbulance, severity]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const requiredResources: string[] = [];
      if (requireICU) requiredResources.push('ICU');
      if (requireVentilator) requiredResources.push('VENTILATOR');
      if (requireBlood) requiredResources.push('BLOOD');
      if (requireAmbulance) requiredResources.push('AMBULANCE');

      const res = await fetch('/api/hospitals/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: patientCoords.latitude,
          longitude: patientCoords.longitude,
          requiredResources,
          severity,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to query hospital recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter by user client-side controls (distance slider & ED status)
  const filteredResults = recommendations.filter((item) => {
    if (item.distanceKm > maxDistance) return false;
    if (requireED && item.hospital.resources.emergencyDepartmentStatus === 'CLOSED') {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: HospitalMatchResult['matchingDetails']['statusBadge']) => {
    switch (status) {
      case 'AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            AVAILABLE
          </span>
        );
      case 'LIMITED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            LIMITED
          </span>
        );
      case 'FULL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FULL
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            UNAVAILABLE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Filter Panel */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Find Nearby Emergency Hospitals
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live distance calculations from patient GPS: {patientCoords.latitude.toFixed(4)}°, {patientCoords.longitude.toFixed(4)}°
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-700">Triage Severity:</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as any)}
              className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="CRITICAL">🔴 Critical (Code Red)</option>
              <option value="HIGH">🟠 High (Urgent)</option>
              <option value="MEDIUM">🟡 Medium (Acute)</option>
              <option value="LOW">🟢 Low (Standard)</option>
            </select>
          </div>
        </div>

        {/* Filters Form */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs">
          
          {/* Distance Slider */}
          <div className="lg:col-span-2 space-y-1">
            <div className="flex justify-between font-semibold text-slate-700">
              <span>Max Transit Radius:</span>
              <span className="font-mono text-rose-600 tabular-nums">{maxDistance} km</span>
            </div>
            <input
              type="range"
              min="2"
              max="35"
              step="1"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer"
            />
          </div>

          {/* Checkboxes for required resources */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={requireICU}
              onChange={(e) => setRequireICU(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-medium">Require ICU Bed</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={requireVentilator}
              onChange={(e) => setRequireVentilator(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-medium">Require Ventilator</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={requireBlood}
              onChange={(e) => setRequireBlood(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-medium">Blood Bank Stocked</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              checked={requireAmbulance}
              onChange={(e) => setRequireAmbulance(e.target.checked)}
              className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-medium">Ambulance in Bay</span>
          </label>
        </div>
      </section>

      {/* Mandatory Recommendation Rule Card Notice (Section 14 Requirement) */}
      <div className="bg-slate-100/80 border border-slate-200 p-3.5 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-800">Recommendation Engine Protocol:</strong> Hospitals are ranked objectively using distance, open emergency department capacity, and verified real-time resource availability. <em>Do not present the result as a guaranteed medical decision. Emergency personnel must apply clinical judgment.</em>
        </p>
      </div>

      {/* Hospital Recommendation Results Cards (Section 13 & 14 Requirements) */}
      <section className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-40" />
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No hospitals match current criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              Try increasing your transit radius slider or unchecking specific resource constraints.
            </p>
          </div>
        ) : (
          filteredResults.map((match, rankIndex) => {
            const hosp = match.hospital;
            const res = hosp.resources;

            return (
              <article
                key={hosp.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 relative overflow-hidden"
              >
                {/* Ranking Ribbon */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center font-mono">
                      #{rankIndex + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">{hosp.name}</h3>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {hosp.traumaLevel.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(match.matchingDetails.statusBadge)}
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Match Score</span>
                      <span className="text-base font-extrabold font-mono tabular-nums text-slate-900">
                        {match.score}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sub-header address & phone */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Navigation className="w-3.5 h-3.5 text-rose-600" />
                    {match.distanceKm} km away
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    ~{match.estimatedTravelMinutes} mins emergency transit
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{hosp.address}</span>
                  <span aria-hidden="true">·</span>
                  <a href={`tel:${hosp.emergencyPhone}`} className="text-rose-600 hover:underline flex items-center gap-1 font-mono">
                    <Phone className="w-3 h-3" />
                    {hosp.emergencyPhone}
                  </a>
                </div>

                {/* Resource Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">ICU Beds</span>
                    <span className={`text-sm font-extrabold font-mono tabular-nums ${res.icuBedsAvailable > 2 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {res.icuBedsAvailable} <span className="text-xs font-normal text-slate-400">/ {res.icuBedsTotal}</span>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">General Beds</span>
                    <span className="text-sm font-extrabold font-mono tabular-nums text-slate-800">
                      {res.generalBedsAvailable} <span className="text-xs font-normal text-slate-400">/ {res.generalBedsTotal}</span>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ventilators</span>
                    <span className="text-sm font-extrabold font-mono tabular-nums text-slate-800">
                      {res.ventilatorsAvailable} <span className="text-xs font-normal text-slate-400">/ {res.ventilatorsTotal}</span>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Ambulances</span>
                    <span className="text-sm font-extrabold font-mono tabular-nums text-slate-800">
                      {res.ambulancesAvailable} <span className="text-xs font-normal text-slate-400">in bay</span>
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Blood Bank</span>
                    <span className={`text-xs font-extrabold ${res.bloodBank.isAvailable ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {res.bloodBank.isAvailable ? 'AVAILABLE' : 'LIMITED'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">ED Status</span>
                    <span className={`text-xs font-extrabold ${res.emergencyDepartmentStatus === 'OPEN' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {res.emergencyDepartmentStatus}
                    </span>
                  </div>
                </div>

                {/* Transparent Rule-Based Match Reasons */}
                <div className="mt-3 text-xs space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Recommended based on distance and currently available resources:
                  </p>
                  <ul className="text-[11px] text-slate-600 space-y-0.5">
                    {match.matchingDetails.reasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  {onFocusMapHospital && (
                    <button
                      onClick={() => onFocusMapHospital(hosp)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      View on Map
                    </button>
                  )}

                  {onSelectHospitalForEmergency && (
                    <button
                      onClick={() => onSelectHospitalForEmergency(hosp)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      Select Hospital for Emergency
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
