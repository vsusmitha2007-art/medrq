import React, { useState } from 'react';
import { Ambulance } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Ambulance as AmbIcon, MapPin, Radio, Shield, Check, Edit2, CheckCircle2 } from 'lucide-react';

interface AmbulanceModuleProps {
  ambulances: Ambulance[];
  onRefresh: () => void;
}

export const AmbulanceModule: React.FC<AmbulanceModuleProps> = ({ ambulances, onRefresh }) => {
  const { hasRole, token } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<Ambulance['status']>('AVAILABLE');
  const [isUpdating, setIsUpdating] = useState(false);

  const canEditStatus = hasRole('ADMIN', 'PARAMEDIC', 'HOSPITAL_ADMIN');

  const handleUpdateStatus = async (ambulanceId: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/ambulances/${ambulanceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (res.ok) {
        setEditingId(null);
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update ambulance status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: Ambulance['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">AVAILABLE</span>;
      case 'EN_ROUTE':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">EN ROUTE</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200">ASSIGNED</span>;
      case 'ARRIVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200">ARRIVED AT SCENE</span>;
      case 'MAINTENANCE':
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-slate-100 text-slate-600 border border-slate-200">MAINTENANCE</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AmbIcon className="w-5 h-5 text-rose-600" />
            Ambulance & Paramedic Fleet Dispatch
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Regional fleet deployment, GPS coordinates, crew allocation, and active mission links
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Fleet Ready:</span>
          <span className="font-mono text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {ambulances.filter((a) => a.status === 'AVAILABLE').length} Available
          </span>
        </div>
      </section>

      {/* Ambulance Grid / Table (Section 17 Requirement) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ambulances.map((amb) => {
          const isEditing = editingId === amb.id;

          return (
            <article
              key={amb.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                {/* Top Call Sign and Type */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      {amb.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                      {amb.callSign}
                    </h3>
                    <p className="text-xs text-slate-500">{amb.hospitalName}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                      {amb.type} {/* ALS, BLS, MICU */}
                    </span>
                    {getStatusBadge(amb.status)}
                  </div>
                </div>

                {/* Location Information */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs text-slate-600 mb-3">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-800">
                        {amb.currentLocation?.address || 'Staged at Hospital Bay'}
                      </span>
                      {amb.currentLocation && (
                        <span className="block text-[10px] font-mono text-slate-400">
                          {amb.currentLocation.latitude.toFixed(4)}°, {amb.currentLocation.longitude.toFixed(4)}°
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Crew and Assignment */}
                <div className="text-xs space-y-1 text-slate-600 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Lead Paramedic:</span>
                    <span className="font-semibold text-slate-800">{amb.paramedicLead}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Driver / EMT:</span>
                    <span className="text-slate-700">{amb.driverName}</span>
                  </div>
                  {amb.assignedEmergencyId && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-rose-600 font-bold">Active Mission:</span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                        {amb.assignedEmergencyId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Controls (Authorized Roles only) */}
              {canEditStatus && (
                <div className="pt-3 border-t border-slate-100">
                  {isEditing ? (
                    <div className="space-y-2">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as any)}
                        className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-lg"
                      >
                        <option value="AVAILABLE">AVAILABLE (Bay / Patrol)</option>
                        <option value="ASSIGNED">ASSIGNED (Dispatching)</option>
                        <option value="EN_ROUTE">EN ROUTE (Lights & Siren)</option>
                        <option value="ARRIVED">ARRIVED (At Patient Scene)</option>
                        <option value="MAINTENANCE">MAINTENANCE (Depot)</option>
                      </select>
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(amb.id)}
                          disabled={isUpdating}
                          className="px-3 py-1 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm"
                        >
                          {isUpdating ? 'Updating...' : 'Save Status'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(amb.id);
                        setSelectedStatus(amb.status);
                      }}
                      className="w-full py-1.5 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3 h-3" />
                      Update Fleet Status
                    </button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

    </div>
  );
};
