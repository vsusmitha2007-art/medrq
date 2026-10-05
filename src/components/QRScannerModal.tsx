import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { Camera, X, AlertCircle, RefreshCw, Upload, CheckCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { Patient } from '../types.ts';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientFound: (patientId: string) => void;
  samplePatients?: Patient[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onPatientFound,
  samplePatients = [],
}) => {
  const { token, user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [deniedMessage, setDeniedMessage] = useState<string | null>(null);
  const [lastScannedToken, setLastScannedToken] = useState<string | null>(null);

  // Initialize Camera stream when open
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setDeniedMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera MediaDevices API is unavailable on this device/browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setStreamActive(true);
        setIsScanning(true);
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Camera access could not be acquired:', err);
      setCameraError(
        err.message || 'Camera permission denied or camera device not connected.'
      );
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Canvas processing loop
  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (ctx) {
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDetectedToken(code.data);
          return;
        }
      }
    }

    if (isScanning) {
      requestAnimationFrame(tick);
    }
  };

  // Token resolution and RBAC check via backend API
  const handleDetectedToken = async (qrToken: string) => {
    setIsScanning(false);
    setLastScannedToken(qrToken);

    try {
      const res = await fetch(`/api/patients/qr/${encodeURIComponent(qrToken)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 403) {
        setDeniedMessage(
          "Your role does not have permission to view this patient's information."
        );
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setCameraError(data.error || 'QR code token invalid or unregistered.');
        return;
      }

      const data = await res.json();
      stopCamera();
      onPatientFound(data.patient.id);
      onClose();
    } catch (err) {
      setCameraError('Network error while validating patient identifier.');
    }
  };

  // Image file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          handleDetectedToken(code.data);
        } else {
          setCameraError('No valid QR barcode found in uploaded image file.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 w-full h-full border-none"
      aria-labelledby="qr-scanner-title"
    >
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 id="qr-scanner-title" className="text-sm font-bold text-slate-900">
                Patient QR Identifier
              </h2>
              <p className="text-[11px] text-slate-500">
                HTML5 Video Feed & Real-Time Canvas Decoder
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Permission Denied Banner (Section 9 Requirement) */}
          {deniedMessage && (
            <div
              role="alert"
              className="p-4 bg-rose-50 border-2 border-rose-300 rounded-xl text-rose-800 space-y-1 animate-in fade-in"
            >
              <div className="flex items-center gap-2 font-bold text-sm text-rose-700">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                Access Denied
              </div>
              <p className="text-xs leading-relaxed">{deniedMessage}</p>
              <p className="text-[11px] text-rose-600 mt-2 font-mono">
                Current Role: {user?.role || 'UNAUTHENTICATED'}
              </p>
            </div>
          )}

          {/* Camera Error Banner */}
          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* HTML5 Live Video Element with SVG Viewfinder Frame */}
          <div className="relative w-full aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />

            {/* Hidden Canvas Element used for frame raster decoding */}
            <canvas ref={canvasRef} className="hidden" />

            {!streamActive && (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <Camera className="w-12 h-12 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs">
                  Camera preview inactive or in simulation mode.
                </p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg inline-flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Request Camera Permission
                </button>
              </div>
            )}

            {/* Overlaid HTML/SVG Viewfinder Frame */}
            {streamActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-56 h-56 border-2 border-rose-500/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Laser Scan line */}
                  <div className="absolute left-0 right-0 h-0.5 bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-bounce" />
                  
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Fallback / File Upload & Instant Sample Triggers */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Field Simulation / Quick Triggers
              </span>
              <label className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Upload QR Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Click any patient badge to simulate scanning an emergency QR bracelet with authorized field decryption:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => handleDetectedToken('EMG-QR-P1001-SECURE-TOKEN-A9')}
                className="p-2.5 text-left bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                    Arthur Pendelton
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">P1001</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Cardiac risk · Penicillin allergy · O-
                </div>
              </button>

              <button
                onClick={() => handleDetectedToken('EMG-QR-P1002-SECURE-TOKEN-B3')}
                className="p-2.5 text-left bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                    Maya Lin-Kowalski
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">P1002</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Epilepsy · Peanut allergy · A+
                </div>
              </button>

              <button
                onClick={() => handleDetectedToken('EMG-QR-P1003-SECURE-TOKEN-C7')}
                className="p-2.5 text-left bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                    Marcus Brody
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">P1003</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Mechanical Valve · Anticoagulated · B+
                </div>
              </button>

              <button
                onClick={() => handleDetectedToken('EMG-QR-P1005-SECURE-TOKEN-E2')}
                className="p-2.5 text-left bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                    Robert V. Hastings
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">P1005</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Active DNR / POLST Verified · O+
                </div>
              </button>
            </div>
          </div>

        </div>
      </div>
    </dialog>
  );
};
