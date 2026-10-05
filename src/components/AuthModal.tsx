import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Shield, Lock, Mail, X, AlertCircle } from 'lucide-react';
import { User } from '../types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    const success = await login(email, password);
    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Invalid credentials. Use demo persona or verify user identifier.');
    }
  };

  const handleDemoLogin = async (role: User['role']) => {
    setErrorMsg('');
    setIsSubmitting(true);
    const success = await login('', '', role);
    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(`Failed to authenticate demo user for role ${role}`);
    }
  };

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 w-full h-full border-none"
      aria-labelledby="auth-dialog-title"
    >
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-dialog-title" className="text-base font-bold text-slate-900">
                EmergencyLink Access
              </h2>
              <p className="text-xs text-slate-500">Secure Healthcare Authentication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email / User ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paramedic@emergencylink.health"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                Remember me
              </label>
              <a
                href="#forgot-password"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Credential Reset: Contact your hospital IT operations officer or use one-click demo login below.");
                }}
                className="text-slate-600 hover:text-rose-600 transition-colors"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In to Network'}
            </button>
          </form>

          {/* Instant Demo Personas */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Instant One-Click Authorized Personas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('PARAMEDIC')}
                className="p-2 text-left bg-slate-50 hover:bg-rose-50 hover:border-rose-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-rose-700">
                  🚑 Paramedic
                </div>
                <div className="text-[10px] text-slate-500">Alex Rivera (EMT-P)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('DOCTOR')}
                className="p-2 text-left bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                  🩺 Doctor
                </div>
                <div className="text-[10px] text-slate-500">Dr. Sarah Chen, MD</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('HOSPITAL_ADMIN')}
                className="p-2 text-left bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
                  🏥 Hospital Admin
                </div>
                <div className="text-[10px] text-slate-500">Marcus Vance (Metro)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="p-2 text-left bg-slate-50 hover:bg-slate-200 hover:border-slate-300 border border-slate-200 rounded-lg transition-colors group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                  🛡️ System Admin
                </div>
                <div className="text-[10px] text-slate-500">Chief Reynolds (HQ)</div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </dialog>
  );
};
