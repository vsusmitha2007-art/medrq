import React, { useState } from 'react';
import { Hospital, HospitalResources } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Activity,
  Bed,
  Wind,
  Ambulance,
  HeartPulse,
  Users,
  ShieldCheck,
  AlertCircle,
  Save,
  Check,
  Clock,
} from 'lucide-react';

interface HospitalResourceDashboardProps {
  hospital: Hospital;
  onUpdateHospital: (updated: Hospital) => void;
}

export const HospitalResourceDashboard: React.FC<HospitalResourceDashboardProps> = ({
  hospital,
  onUpdateHospital,
}) => {
  const { token, user } = useAuth();
  const [formData, setFormData] = useState<HospitalResources>({ ...hospital.resources });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automatic status threshold calculation (Section 16 Requirement)
  const getResourceStatus = (available: number, total: number) => {
    if (available === 0) return { label: 'FULL / UNAVAILABLE', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    if (available <= 4) return { label: 'LIMITED CAPACITY', color: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'AVAILABLE', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/hospitals/${hospital.id}/resources`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          icuBedsAvailable: Number(formData.icuBedsAvailable),
          generalBedsAvailable: Number(formData.generalBedsAvailable),
          ventilatorsAvailable: Number(formData.ventilatorsAvailable),
          ambulancesAvailable: Number(formData.ambulancesAvailable),
          bloodBankAvailable: formData.bloodBank.isAvailable,
          emergencyDoctorsOnDuty: Number(formData.emergencyDoctorsOnDuty),
          emergencyDepartmentStatus: formData.emergencyDepartmentStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update hospital resources');
      }

      const data = await res.json();
      onUpdateHospital(data.hospital);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating hospital capacity');
    } finally {
      setIsSaving(false);
    }
  };

  const icuStatus = getResourceStatus(formData.icuBedsAvailable, formData.icuBedsTotal);
  const genStatus = getResourceStatus(formData.generalBedsAvailable, formData.generalBedsTotal);
  const ventStatus = getResourceStatus(formData.ventilatorsAvailable, formData.ventilatorsTotal);

  return (
    <div className="space-y-6">
      
      {/* Top Banner and Facility Overview */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {hospital.name}
            </h2>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
              {hospital.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {hospital.address} · Emergency Direct: <span className="font-mono text-slate-700">{hospital.emergencyPhone}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block uppercase font-bold">Telemetry Last Synchronized</span>
            <time className="text-xs font-mono tabular-nums text-slate-700">
              {new Date(hospital.resources.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </time>
          </div>
        </div>
      </section>

      {errorMsg && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Hospital telemetry successfully saved and published to emergency dispatch mesh. Audit log generated.</span>
        </div>
      )}

      {/* Interactive HTML Update Form (Section 15 Requirement) */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section: Resource Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* ICU Beds Widget Card */}
          <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-rose-600" />
                ICU Beds
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${icuStatus.color}`}>
                {icuStatus.label}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                {formData.icuBedsAvailable} <span className="text-sm font-normal text-slate-400">/ {formData.icuBedsTotal}</span>
              </div>
              <span className="text-xs text-slate-500">Available</span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Update Available ICU Beds:
              </label>
              <input
                type="number"
                min="0"
                max={formData.icuBedsTotal}
                value={formData.icuBedsAvailable}
                onChange={(e) => setFormData({ ...formData, icuBedsAvailable: Number(e.target.value) })}
                className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </article>

          {/* General Beds Widget Card */}
          <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-blue-600" />
                General Inpatient Beds
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${genStatus.color}`}>
                {genStatus.label}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                {formData.generalBedsAvailable} <span className="text-sm font-normal text-slate-400">/ {formData.generalBedsTotal}</span>
              </div>
              <span className="text-xs text-slate-500">Available</span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Update Available General Beds:
              </label>
              <input
                type="number"
                min="0"
                max={formData.generalBedsTotal}
                value={formData.generalBedsAvailable}
                onChange={(e) => setFormData({ ...formData, generalBedsAvailable: Number(e.target.value) })}
                className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </article>

          {/* Ventilators Widget Card */}
          <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-purple-600" />
                Ventilators
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${ventStatus.color}`}>
                {ventStatus.label}
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                {formData.ventilatorsAvailable} <span className="text-sm font-normal text-slate-400">/ {formData.ventilatorsTotal}</span>
              </div>
              <span className="text-xs text-slate-500">Available</span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Update Available Ventilators:
              </label>
              <input
                type="number"
                min="0"
                max={formData.ventilatorsTotal}
                value={formData.ventilatorsAvailable}
                onChange={(e) => setFormData({ ...formData, ventilatorsAvailable: Number(e.target.value) })}
                className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </article>

          {/* Ambulances in Bay */}
          <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Ambulance className="w-4 h-4 text-emerald-600" />
                Hospital Ambulance Fleet
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-slate-100 text-slate-700">
                STAGED AT BAY
              </span>
            </div>

            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
                {formData.ambulancesAvailable} <span className="text-sm font-normal text-slate-400">/ {formData.ambulancesTotal}</span>
              </div>
              <span className="text-xs text-slate-500">In Bay</span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Update In-Bay Ambulances:
              </label>
              <input
                type="number"
                min="0"
                max={formData.ambulancesTotal}
                value={formData.ambulancesAvailable}
                onChange={(e) => setFormData({ ...formData, ambulancesAvailable: Number(e.target.value) })}
                className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </article>

          {/* Emergency Department Status & Doctors on Duty */}
          <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-600" />
                Emergency Department Status
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Reception Status:
              </label>
              <select
                value={formData.emergencyDepartmentStatus}
                onChange={(e) => setFormData({ ...formData, emergencyDepartmentStatus: e.target.value as any })}
                className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="OPEN">🟢 OPEN (Receiving all emergencies)</option>
                <option value="LIMITED">🟡 LIMITED (Acute triage priority)</option>
                <option value="DIVERSION">🔴 DIVERSION (Diverting non-critical ambulances)</option>
                <option value="CLOSED">⚫ CLOSED (Major incident / lockdown)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Emergency Doctors on Duty:
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.emergencyDoctorsOnDuty}
                onChange={(e) => setFormData({ ...formData, emergencyDoctorsOnDuty: Number(e.target.value) })}
                className="w-full text-xs font-mono p-2 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </article>

          {/* Blood Bank Availability */}
          <article className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                Blood Bank Reserves
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${formData.bloodBank.isAvailable ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                {formData.bloodBank.isAvailable ? 'STOCKED' : 'DEPLETED'}
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 pt-2">
              <input
                type="checkbox"
                checked={formData.bloodBank.isAvailable}
                onChange={(e) => setFormData({
                  ...formData,
                  bloodBank: { ...formData.bloodBank, isAvailable: e.target.checked },
                })}
                className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="font-semibold">Blood Bank Ready for Transfusion Protocols</span>
            </label>

            <div className="grid grid-cols-4 gap-1 text-[11px] font-mono text-center pt-2">
              <div className="bg-slate-50 p-1 rounded">O-: <strong>{formData.bloodBank['O-']}</strong></div>
              <div className="bg-slate-50 p-1 rounded">O+: <strong>{formData.bloodBank['O+']}</strong></div>
              <div className="bg-slate-50 p-1 rounded">A+: <strong>{formData.bloodBank['A+']}</strong></div>
              <div className="bg-slate-50 p-1 rounded">B+: <strong>{formData.bloodBank['B+']}</strong></div>
            </div>
          </article>

        </section>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => setFormData({ ...hospital.resources })}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Reset Changes
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Synchronizing...' : 'Save & Publish Telemetry'}
          </button>
        </div>

      </form>

    </div>
  );
};
