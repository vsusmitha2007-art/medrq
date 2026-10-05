import React, { useState } from 'react';
import { EmergencyRequest } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Radio,
  CheckCircle2,
  Clock,
  MapPin,
  Ambulance,
  Hospital,
  ArrowRight,
  Shield,
  Phone,
  AlertTriangle,
} from 'lucide-react';

interface EmergencyTrackerViewProps {
  emergency: EmergencyRequest;
  onUpdateStatus: (newStatus: EmergencyRequest['status']) => void;
  onSelectHospitalModal?: () => void;
}

export const EmergencyTrackerView: React.FC<EmergencyTrackerViewProps> = ({
  emergency,
  onUpdateStatus,
  onSelectHospitalModal,
}) => {
  const { hasRole } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const canAdvanceStatus = hasRole('ADMIN', 'PARAMEDIC', 'DOCTOR', 'HOSPITAL_ADMIN');

  const orderedStatuses: Array<{ key: EmergencyRequest['status']; label: string; icon: string }> = [
    { key: 'CREATED', label: 'Emergency Created', icon: '🚨' },
    { key: 'LOCATION_CONFIRMED', label: 'Location Confirmed', icon: '📍' },
    { key: 'HOSPITAL_SEARCHING', label: 'Hospital Searching', icon: '🔍' },
    { key: 'HOSPITAL_SELECTED', label: 'Hospital Selected', icon: '🏥' },
    { key: 'AMBULANCE_ASSIGNED', label: 'Ambulance Assigned', icon: '🚑' },
    { key: 'EN_ROUTE', label: 'Ambulance En Route', icon: '⚡' },
    { key: 'ARRIVED', label: 'Patient Arrived at Hospital', icon: '🏁' },
    { key: 'COMPLETED', label: 'Resuscitation Concluded', icon: '✅' },
  ];

  const currentIdx = orderedStatuses.findIndex((s) => s.key === emergency.status);

  const handleNextStep = () => {
    if (currentIdx >= 0 && currentIdx < orderedStatuses.length - 1) {
      const nextStatus = orderedStatuses[currentIdx + 1].key;
      onUpdateStatus(nextStatus);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden space-y-6 p-6">
      
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {emergency.id}
            </span>
            <span className="text-xs font-extrabold text-white bg-rose-600 px-2 py-0.5 rounded">
              {emergency.severity}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
            {emergency.emergencyType.replace(/_/g, ' ')}
          </h2>
          <p className="text-xs text-slate-500">
            Patient: <strong className="text-slate-800">{emergency.patientName}</strong> ({emergency.patientId}, Age {emergency.age}, Blood {emergency.bloodGroup})
          </p>
        </div>

        {/* Assigned units summary */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Assigned Hospital</span>
            <span className="font-bold text-slate-800">
              {emergency.selectedHospitalName || 'Pending Selection'}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Ambulance Unit</span>
            <span className="font-bold font-mono text-blue-600">
              {emergency.assignedAmbulanceCallSign || 'Deploying'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive HTML/SVG Timeline Component (Section 19 Requirement) */}
      <section className="bg-slate-50/70 p-5 rounded-xl border border-slate-200">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 mb-4">
          Emergency Operational Progress
        </h3>

        <ol className="relative border-l border-slate-300 ml-4 space-y-6">
          {orderedStatuses.map((item, index) => {
            const isPassed = index <= currentIdx;
            const isCurrent = index === currentIdx;

            return (
              <li key={item.key} className="ml-6">
                <span
                  className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${
                    isCurrent
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  )}
                </span>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold ${isCurrent ? 'text-rose-600 font-extrabold' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                    {item.label}
                  </h4>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                      ACTIVE STEP
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  {emergency.timeline.find((t) => t.step === item.key)?.note ||
                    (isCurrent ? 'Currently underway by field emergency dispatch.' : '')}
                </p>
              </li>
            );
          })}
        </ol>

        {/* Advance Timeline Control */}
        {canAdvanceStatus && currentIdx < orderedStatuses.length - 1 && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
            <button
              onClick={handleNextStep}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              Advance to: {orderedStatuses[currentIdx + 1].label}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Field Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
            Scene GPS Coordinates
          </span>
          <p className="font-mono text-slate-800 font-semibold">{emergency.patientLocation.address}</p>
          <div className="flex gap-4 font-mono text-[11px] text-slate-500">
            <span>Lat: {emergency.patientLocation.latitude.toFixed(4)}°</span>
            <span>Lon: {emergency.patientLocation.longitude.toFixed(4)}°</span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
            Required Resources Requested
          </span>
          <div className="flex flex-wrap gap-1.5">
            {emergency.requiredResources.map((res, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white border border-slate-200 text-slate-800 rounded font-semibold text-[11px]"
              >
                {res}
              </span>
            ))}
          </div>
        </div>
      </div>

      {emergency.notes && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
            Paramedic Clinical Log
          </span>
          <p className="text-slate-600 leading-relaxed">{emergency.notes}</p>
        </div>
      )}

    </article>
  );
};
