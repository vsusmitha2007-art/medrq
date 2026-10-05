import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, X, Download, ShieldCheck } from 'lucide-react';
import { Patient } from '../types.ts';

interface QRCodeCardModalProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodeCardModal: React.FC<QRCodeCardModalProps> = ({ patient, isOpen, onClose }) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !patient) return;

    QRCode.toDataURL(patient.qrToken, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [isOpen, patient]);

  if (!isOpen) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 w-full h-full border-none"
    >
      <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Emergency Patient ID Bracelet
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900">{patient.name}</h3>
          <p className="text-xs text-slate-500 font-mono">ID: {patient.id}</p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR Code for ${patient.name}`} className="w-56 h-56 rounded-lg" />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
              Generating Barcode...
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 font-mono break-all text-left">
          <span className="font-semibold text-slate-700 block mb-0.5">Secure Non-PII Token:</span>
          {patient.qrToken}
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          Point any smartphone or the built-in HTML5 webcam scanner at this QR code to securely retrieve emergency medical information.
        </p>
      </div>
    </dialog>
  );
};
