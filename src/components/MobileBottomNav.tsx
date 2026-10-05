import React from 'react';
import { Home, Radio, Users, MapPin, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateEmergency: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateEmergency,
}) => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1 flex items-center justify-around safe-area-pb"
    >
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] text-xs ${
          currentTab === 'dashboard' ? 'text-rose-600 font-semibold' : 'text-slate-600'
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => onSelectTab('patients')}
        className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] text-xs ${
          currentTab === 'patients' ? 'text-rose-600 font-semibold' : 'text-slate-600'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Patients</span>
      </button>

      {/* Primary Emergency Center Button */}
      <button
        onClick={onOpenCreateEmergency}
        aria-label="Create Emergency"
        className="flex flex-col items-center justify-center min-h-[48px] px-3 -mt-4 bg-rose-600 text-white rounded-full shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
      >
        <Radio className="w-5 h-5 animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Emergency</span>
      </button>

      <button
        onClick={() => onSelectTab('map')}
        className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] text-xs ${
          currentTab === 'map' ? 'text-rose-600 font-semibold' : 'text-slate-600'
        }`}
      >
        <MapPin className="w-5 h-5 mb-0.5" />
        <span>Map</span>
      </button>

      <button
        onClick={() => onSelectTab(user.role === 'ADMIN' ? 'admin' : 'hospitals')}
        className={`flex flex-col items-center justify-center min-h-[48px] min-w-[56px] text-xs ${
          (currentTab === 'admin' || currentTab === 'hospitals')
            ? 'text-rose-600 font-semibold'
            : 'text-slate-600'
        }`}
      >
        <Shield className="w-5 h-5 mb-0.5" />
        <span>{user.role === 'ADMIN' ? 'Admin' : 'Hospitals'}</span>
      </button>
    </nav>
  );
};
