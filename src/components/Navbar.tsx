import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { NotificationDropdown } from './NotificationDropdown.tsx';
import { Shield, Activity, LogOut, Radio } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLogin: () => void;
  onOpenCreateEmergency: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenLogin,
  onOpenCreateEmergency,
}) => {
  const { user, logout, hasRole } = useAuth();

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'System Commander';
      case 'DOCTOR':
        return 'Attending Physician';
      case 'NURSE':
        return 'Triage Nurse';
      case 'PARAMEDIC':
        return 'Lead Paramedic';
      case 'HOSPITAL_ADMIN':
        return 'Hospital Director';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab(user ? 'dashboard' : 'landing')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold shadow-sm shadow-rose-200 group-hover:bg-rose-700 transition-colors">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-rose-600 transition-colors">
                  EmergencyLink
                </span>
                <span className="hidden sm:inline-block text-[11px] text-slate-500 font-normal ml-2">
                  Emergency Medical Network
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 4-6 clean text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            {user ? (
              <>
                <button
                  onClick={() => onSelectTab('dashboard')}
                  className={`transition-colors hover:text-slate-900 pb-0.5 ${
                    currentTab === 'dashboard'
                      ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => onSelectTab('patients')}
                  className={`transition-colors hover:text-slate-900 pb-0.5 ${
                    currentTab === 'patients'
                      ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  Patients
                </button>
                <button
                  onClick={() => onSelectTab('hospitals')}
                  className={`transition-colors hover:text-slate-900 pb-0.5 ${
                    currentTab === 'hospitals'
                      ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  Hospitals
                </button>
                <button
                  onClick={() => onSelectTab('map')}
                  className={`transition-colors hover:text-slate-900 pb-0.5 ${
                    currentTab === 'map'
                      ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  Live Map
                </button>
                <button
                  onClick={() => onSelectTab('fleet')}
                  className={`transition-colors hover:text-slate-900 pb-0.5 ${
                    currentTab === 'fleet'
                      ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                      : 'text-slate-600'
                  }`}
                >
                  Ambulances
                </button>
                {hasRole('HOSPITAL_ADMIN', 'ADMIN') && (
                  <button
                    onClick={() => onSelectTab('resources')}
                    className={`transition-colors hover:text-slate-900 pb-0.5 ${
                      currentTab === 'resources'
                        ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    Hospital Capacity
                  </button>
                )}
                {hasRole('ADMIN') && (
                  <button
                    onClick={() => onSelectTab('admin')}
                    className={`transition-colors hover:text-slate-900 pb-0.5 ${
                      currentTab === 'admin'
                        ? 'text-slate-900 font-semibold border-b-2 border-rose-600'
                        : 'text-slate-600'
                    }`}
                  >
                    Audit & Security
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => onSelectTab('landing')}
                  className="hover:text-slate-900 transition-colors"
                >
                  Overview
                </button>
                <a href="#features" className="hover:text-slate-900 transition-colors">
                  System Architecture
                </a>
                <a href="#security" className="hover:text-slate-900 transition-colors">
                  Security & Audit
                </a>
                <a href="#hospitals-section" className="hover:text-slate-900 transition-colors">
                  Network Capacity
                </a>
              </>
            )}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <button
                  onClick={onOpenCreateEmergency}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-rose-500 whitespace-nowrap"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  New Emergency
                </button>

                <NotificationDropdown />

                <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-slate-900 leading-tight">
                      {user.name}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-500">
                      <span>{getRoleLabel(user.role)}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{user.badgeNumber}</span>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    aria-label="Logout"
                    title="Sign Out"
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm focus-visible:outline-2 focus-visible:outline-slate-900 whitespace-nowrap"
              >
                Emergency Access
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
