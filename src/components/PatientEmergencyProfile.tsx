import React, { useState } from 'react';
import {
  AlertTriangle,
  Heart,
  Phone,
  Pill,
  FileText,
  MapPin,
  QrCode,
  Edit3,
  Check,
  X,
  Share2,
  Navigation,
  ShieldAlert,
} from 'lucide-react';
import { Patient, MedicalRecord, PatientEmergencyContact } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { QRCodeCardModal } from './QRCodeCardModal.tsx';

interface PatientEmergencyProfileProps {
  patient: Patient;
  medicalRecord: MedicalRecord;
  emergencyContacts: PatientEmergencyContact[];
  onFindHospitals: (patient: Patient) => void;
  onCreateEmergency: (patient: Patient) => void;
  onViewLocation: () => void;
  onRefresh?: () => void;
}

export const PatientEmergencyProfile: React.FC<PatientEmergencyProfileProps> = ({
  patient,
  medicalRecord,
  emergencyContacts,
  onFindHospitals,
  onCreateEmergency,
  onViewLocation,
  onRefresh,
}) => {
  const { hasRole, token } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotesText, setEditNotesText] = useState(medicalRecord.notes || '');
  const [editAllergiesText, setEditAllergiesText] = useState(
    medicalRecord.allergies.join(', ')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canEditMedical = hasRole('DOCTOR', 'ADMIN');

  const handleSaveMedical = async () => {
    setIsSaving(true);
    try {
      const allergiesList = editAllergiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/patients/${patient.id}/medical`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          notes: editNotesText,
          allergies: allergiesList,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setIsEditingNotes(false);
        if (onRefresh) onRefresh();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update medical record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
      
      {/* Top Banner (Section 10 Requirement) */}
      <div className="bg-rose-600 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🚨</span>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wide uppercase">
              Emergency Patient Profile
            </h2>
            <p className="text-xs text-rose-100">
              Immediate triage visibility · Verified records
            </p>
          </div>
        </div>

        {/* High visual weight vital identifiers */}
        <div className="flex items-center gap-4 text-xs">
          <div className="bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
            <span className="text-rose-200 text-[10px] block uppercase font-bold">Patient ID</span>
            <span className="font-mono font-bold text-sm">{patient.id}</span>
          </div>

          <div className="bg-white text-rose-700 px-3 py-1.5 rounded-lg shadow-sm font-extrabold text-sm sm:text-base flex items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Blood:</span>
            {medicalRecord.bloodGroup}
          </div>
        </div>
      </div>

      {/* Patient Key Identity Bar */}
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {patient.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{patient.age} years old</span>
            <span aria-hidden="true">·</span>
            <span>{patient.gender}</span>
            <span aria-hidden="true">·</span>
            <span>DOB: {patient.dob}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">{patient.address}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onCreateEmergency(patient)}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            Create Emergency
          </button>

          <button
            onClick={() => onFindHospitals(patient)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Navigation className="w-3.5 h-3.5 text-rose-600" />
            Find Hospitals
          </button>

          <button
            onClick={() => setShowQRModal(true)}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
            title="Display Patient QR Identification Card"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {canEditMedical && !isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="p-2 text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              title="Edit Permitted Clinical Information (Physician Only)"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Medical record changes updated and recorded to immutable audit log.</span>
        </div>
      )}

      {/* Main Medical Grids */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Critical Alerts, Meds, Conditions */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Critical Alerts (Section 10 Requirement) */}
          <section className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Critical Alerts & Life-Threatening Allergies
              </h3>
              {medicalRecord.dnrStatus && (
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                  DNR / POLST ACTIVE
                </span>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 block">
                  Allergies (comma-separated):
                </label>
                <input
                  type="text"
                  value={editAllergiesText}
                  onChange={(e) => setEditAllergiesText(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            ) : (
              <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {medicalRecord.allergies.map((allergy, idx) => (
                  <li
                    key={idx}
                    className="bg-white p-2.5 rounded-lg border border-rose-200 shadow-2xs flex items-center gap-2 text-xs font-semibold text-rose-900"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                    <span>⚠ {allergy}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Section: Current Medications */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-blue-600" />
              Current Medications
            </h3>
            <ul role="list" className="divide-y divide-slate-100 text-xs">
              {medicalRecord.medications.map((med, idx) => (
                <li key={idx} className="py-2 flex items-center justify-between text-slate-800">
                  <span className="font-medium">{med}</span>
                  <span className="text-[11px] text-slate-500">Active RX</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section: Known Medical Conditions */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-purple-600" />
              Known Medical Conditions & Implants
            </h3>
            <div className="flex flex-wrap gap-2">
              {medicalRecord.chronicConditions.map((cond, idx) => (
                <span
                  key={idx}
                  className="text-xs font-medium bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200"
                >
                  {cond}
                </span>
              ))}
            </div>
          </section>

          {/* Section: Clinical Resuscitation Notes */}
          <section className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Resuscitation & Clinical Notes
              </h3>
              <span className="text-[10px] text-slate-400 tabular-nums">
                Last updated: {new Date(medicalRecord.lastUpdated).toLocaleDateString()}
              </span>
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={editNotesText}
                  onChange={(e) => setEditNotesText(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  placeholder="Enter authorized clinical notes, advance directives, implant parameters..."
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNotes(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMedical}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {medicalRecord.notes || 'No specialized resuscitation caveats recorded.'}
              </p>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): Emergency Contacts, Insurance & Direct Calling */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Section: Emergency Contact (Section 10 Requirement) */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-emerald-600" />
              Emergency Contacts
            </h3>

            <div className="space-y-3">
              {emergencyContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{contact.name}</span>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {contact.relation}
                    </span>
                  </div>

                  {/* Clickable tel: link for fast mobile emergency dialing */}
                  <a
                    href={`tel:${contact.phone.replace(/[^0-9+]/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline pt-1"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Insurance & Legal Status */}
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Insurance & Legal Status
            </h3>
            <div className="space-y-1 text-slate-600">
              <p className="font-semibold text-slate-800">
                {patient.insuranceProvider || 'Direct Triage Coverage'}
              </p>
              <p className="text-[11px] font-mono">Policy: {patient.policyNumber || 'N/A'}</p>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-slate-700">
              <span>Organ Donor Registry:</span>
              <span className={`font-bold ${medicalRecord.organDonor ? 'text-emerald-600' : 'text-slate-500'}`}>
                {medicalRecord.organDonor ? 'YES' : 'NO'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-700">
              <span>Do Not Resuscitate (DNR):</span>
              <span className={`font-bold ${medicalRecord.dnrStatus ? 'text-rose-600' : 'text-slate-500'}`}>
                {medicalRecord.dnrStatus ? 'ACTIVE DNR' : 'FULL CODE'}
              </span>
            </div>
          </section>

          {/* Quick Notice */}
          <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
            <strong>Clinical Safety Rule:</strong> EmergencyLink renders verified allergy and medical profiles as recorded. Paramedics must execute local clinical protocol and clinical judgment without relying solely on automated outputs.
          </div>

        </div>

      </div>

      {/* QR Code Identification Card Modal */}
      {showQRModal && (
        <QRCodeCardModal
          patient={patient}
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
        />
      )}

    </article>
  );
};
