import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { EmergencyRequest, Hospital, Ambulance } from '../types.ts';
import {
  Radio,
  QrCode,
  Search,
  Navigation,
  Activity,
  Bed,
  Ambulance as AmbulanceIcon,
  Building2,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface DashboardOverviewProps {
  emergencies: EmergencyRequest[];
  hospitals: Hospital[];
  ambulances: Ambulance[];
  onOpenCreateEmergency: () => void;
  onOpenQRScanner: () => void;
  onOpenPatientSearch: () => void;
  onOpenHospitalFinder: () => void;
  onSelectEmergency: (emergency: EmergencyRequest) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  emergencies,
  hospitals,
  ambulances,
  onOpenCreateEmergency,
  onOpenQRScanner,
  onOpenPatientSearch,
  onOpenHospitalFinder,
  onSelectEmergency,
}) => {
  const { user } = useAuth();

  // Metrics calculations
  const activeEmergencies = emergencies.filter((e) => e.status !== 'COMPLETED');
  const availableHospitals = hospitals.filter(
    (h) => h.resources.emergencyDepartmentStatus === 'OPEN'
  );
  const totalAvailableIcu = hospitals.reduce(
    (acc, h) => acc + h.resources.icuBedsAvailable,
    0
  );
  const totalIcuCapacity = hospitals.reduce(
    (acc, h) => acc + h.resources.icuBedsTotal,
    0
  );
  const availableAmbulances = ambulances.filter(
    (a) => a.status === 'AVAILABLE'
  ).length;

  const getStatusBadge = (status: EmergencyRequest['status']) => {
    switch (status) {
      case 'EN_ROUTE':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            EN ROUTE
          </span>
        );
      case 'ARRIVED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">
            ARRIVED
          </span>
        );
      case 'HOSPITAL_SELECTED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
            HOSPITAL MATCHED
          </span>
        );
      case 'LOCATION_CONFIRMED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">
            LOCATION LOCKED
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Main Summary Metric Grid (Section 7 Requirement) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Active Emergencies */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Active Emergencies
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {activeEmergencies.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">High/Critical Trauma</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 text-xl">
            🚨
          </div>
        </article>

        {/* Metric 2: Available Hospitals */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
              Available Hospitals
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {availableHospitals.length}{' '}
              <span className="text-sm font-normal text-slate-400">/ {hospitals.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Open ED Admission</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl">
            🏥
          </div>
        </article>

        {/* Metric 3: Available ICU Beds */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Available ICU Beds
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {totalAvailableIcu}{' '}
              <span className="text-sm font-normal text-slate-400">/ {totalIcuCapacity}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Regional Capacity</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xl">
            🛏️
          </div>
        </article>

        {/* Metric 4: Available Ambulances */}
        <article className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 block mb-1">
              Fleet Ambulances
            </span>
            <div className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {availableAmbulances}{' '}
              <span className="text-sm font-normal text-slate-400">/ {ambulances.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ready in Depot</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 text-xl">
            🚑
          </div>
        </article>

      </section>

      {/* Main Section: Emergency Response & Action Buttons (Section 7 Requirement) */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-600" />
              Emergency Response Command
            </h2>
            <p className="text-xs text-slate-500">
              Instant operational actions for field personnel, trauma directors, and dispatchers
            </p>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            onClick={onOpenCreateEmergency}
            className="p-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all flex flex-col items-center justify-center text-center gap-2 active:scale-98 group"
          >
            <Radio className="w-6 h-6 animate-pulse" />
            <span className="text-xs font-bold tracking-tight">Create Emergency Request</span>
          </button>

          <button
            onClick={onOpenQRScanner}
            className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all flex flex-col items-center justify-center text-center gap-2 active:scale-98 group"
          >
            <QrCode className="w-6 h-6 text-rose-400 group-hover:text-rose-300" />
            <span className="text-xs font-bold tracking-tight">Scan Patient QR</span>
          </button>

          <button
            onClick={onOpenPatientSearch}
            className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-2 active:scale-98"
          >
            <Search className="w-6 h-6 text-slate-600" />
            <span className="text-xs font-bold tracking-tight">Search Patient</span>
          </button>

          <button
            onClick={onOpenHospitalFinder}
            className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-all flex flex-col items-center justify-center text-center gap-2 active:scale-98"
          >
            <Building2 className="w-6 h-6 text-slate-600" />
            <span className="text-xs font-bold tracking-tight">Find Nearby Hospitals</span>
          </button>
        </div>
      </section>

      {/* Recent Emergency Cases Data Table (Section 7 Requirement) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Emergency Operations
            </h3>
            <p className="text-xs text-slate-500">Live multi-agency trauma cases</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {emergencies.length} registered
          </span>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-bold">Emergency ID</th>
                <th className="py-3 px-4 font-bold">Patient</th>
                <th className="py-3 px-4 font-bold">Current Status</th>
                <th className="py-3 px-4 font-bold">Incident Location</th>
                <th className="py-3 px-4 font-bold">Time Reported</th>
                <th className="py-3 px-4 font-bold">Assigned Personnel</th>
                <th className="py-3 px-4 font-bold">Matched Hospital</th>
                <th className="py-3 px-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {emergencies.map((emg) => (
                <tr
                  key={emg.id}
                  onClick={() => onSelectEmergency(emg)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                    {emg.id}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900 whitespace-nowrap">
                    {emg.patientName} <span className="text-slate-400 font-mono text-[11px]">({emg.patientId})</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getStatusBadge(emg.status)}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                    {emg.patientLocation.address}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-500">
                    <time dateTime={emg.createdAt}>
                      {new Date(emg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                    {emg.assignedPersonnel}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-900">
                    {emg.selectedHospitalName || (
                      <span className="text-slate-400 italic">Matching...</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEmergency(emg);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      Track Case
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};
