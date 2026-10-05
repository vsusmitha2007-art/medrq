import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Radio,
  X,
  MapPin,
  AlertTriangle,
  Navigation,
  CheckCircle2,
  Clock,
  Send,
  Building2,
} from 'lucide-react';
import { Patient, EmergencyRequest } from '../types.ts';

interface CreateEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedPatient?: Patient | null;
  currentCoords: { latitude: number; longitude: number };
  onEmergencyCreated: (emergency: EmergencyRequest) => void;
}

export const CreateEmergencyModal: React.FC<CreateEmergencyModalProps> = ({
  isOpen,
  onClose,
  preselectedPatient,
  currentCoords,
  onEmergencyCreated,
}) => {
  const { token, user } = useAuth();

  const [patientId, setPatientId] = useState(preselectedPatient ? preselectedPatient.id : 'P1001');
  const [emergencyType, setEmergencyType] = useState<string>('CARDIAC_ARREST');
  const [severity, setSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('CRITICAL');
  const [latitude, setLatitude] = useState<number>(currentCoords.latitude);
  const [longitude, setLongitude] = useState<number>(currentCoords.longitude);
  const [address, setAddress] = useState<string>('742 Evergreen Terrace (Market & Castro)');
  const [notes, setNotes] = useState<string>('');

  // Required resources checklist
  const [reqICU, setReqICU] = useState(true);
  const [reqVentilator, setReqVentilator] = useState(false);
  const [reqBlood, setReqBlood] = useState(false);
  const [reqAmbulance, setReqAmbulance] = useState(true);
  const [reqED, setReqED] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdEmergency, setCreatedEmergency] = useState<EmergencyRequest | null>(null);

  if (!isOpen) return null;

  const handleFetchGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation API not supported by browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAddress(`GPS Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        alert('Could not access current geolocation: ' + err.message);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const requiredResources: string[] = [];
    if (reqICU) requiredResources.push('ICU');
    if (reqVentilator) requiredResources.push('VENTILATOR');
    if (reqBlood) requiredResources.push('BLOOD');
    if (reqAmbulance) requiredResources.push('AMBULANCE');
    if (reqED) requiredResources.push('EMERGENCY_DEPARTMENT');

    try {
      const res = await fetch('/api/emergencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patientId.trim().toUpperCase(),
          emergencyType,
          severity,
          latitude,
          longitude,
          address,
          requiredResources,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to dispatch emergency request.');
      }

      const data = await res.json();
      setCreatedEmergency(data.emergency);
      onEmergencyCreated(data.emergency);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating emergency request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 w-full h-full border-none"
      aria-labelledby="emergency-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <header className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 id="emergency-modal-title" className="text-sm font-bold uppercase tracking-wide">
                Dispatch Emergency Request
              </h2>
              <p className="text-xs text-rose-100">
                Trigger trauma protocols & hospital capacity reservation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-rose-200 hover:text-white hover:bg-rose-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Success Confirmation State (Section 18 Requirement) */}
        {createdEmergency ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div role="status" aria-live="polite" className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">
                Emergency Created Successfully
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Assigned Emergency Identifier: <strong className="text-rose-600 text-sm">{createdEmergency.id}</strong>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 text-left space-y-2">
              <div className="flex justify-between">
                <span>Patient:</span>
                <span className="font-bold">{createdEmergency.patientName} ({createdEmergency.patientId})</span>
              </div>
              <div className="flex justify-between">
                <span>Severity:</span>
                <span className="font-bold text-rose-600">{createdEmergency.severity}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-mono">{createdEmergency.patientLocation.address}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold text-blue-600">HOSPITAL_SEARCHING</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Nearby hospitals have been evaluated and prioritized based on distance and available ICU beds.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
            >
              Open Live Emergency Tracker
            </button>
          </div>
        ) : (
          /* Form (Section 18 Requirement) */
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            {errorMsg && (
              <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Patient ID and Emergency Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Patient ID: <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder="e.g. P1001"
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Emergency Type: <span className="text-rose-600">*</span>
                </label>
                <select
                  required
                  value={emergencyType}
                  onChange={(e) => setEmergencyType(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="CARDIAC_ARREST">🫀 Cardiac Arrest / Infarction</option>
                  <option value="TRAUMA_COLLISION">💥 Severe Trauma / Collision</option>
                  <option value="RESPIRATORY_DISTRESS">🫁 Respiratory Distress / Anaphylaxis</option>
                  <option value="STROKE">🧠 Acute Stroke Symptoms (FAST+)</option>
                  <option value="SEVERED_BLEEDING">🩸 Major Hemorrhage / Arterial</option>
                  <option value="BURNS">🔥 Severe Burns (Thermal/Chemical)</option>
                  <option value="GENERAL_ACUTE">🚨 General Acute Triage</option>
                </select>
              </div>
            </div>

            {/* Severity Level */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Triage Severity Level: <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      severity === lvl
                        ? lvl === 'CRITICAL'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : lvl === 'HIGH'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Location with Geolocation Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Current Emergency Location:
                </label>
                <button
                  type="button"
                  onClick={handleFetchGeolocation}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Fetch HTML5 Geolocation
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={address}
                  className="w-full text-xs p-2.5 pl-8 bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono"
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-slate-500">
                <span>Lat: {latitude.toFixed(4)}°</span>
                <span>Lon: {longitude.toFixed(4)}°</span>
              </div>
            </div>

            {/* Required Resources Checklist (Section 18 Requirement) */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Required Emergency Resources:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqICU}
                    onChange={(e) => setReqICU(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-800">ICU Bed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqVentilator}
                    onChange={(e) => setReqVentilator(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-800">Ventilator</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqBlood}
                    onChange={(e) => setReqBlood(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-800">Blood Bank</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqAmbulance}
                    onChange={(e) => setReqAmbulance(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-800">Ambulance</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={reqED}
                    onChange={(e) => setReqED(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium text-slate-800">Emergency Dept</span>
                </label>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Paramedic Field Notes:
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Initial vitals, airway status, active CPR, suspected fractures, scene conditions..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'Creating Emergency...' : 'Create & Match Emergency'}
              </button>
            </div>
          </form>
        )}

      </div>
    </dialog>
  );
};
