import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AuditLog, AnalyticsData } from '../types.ts';
import {
  ShieldAlert,
  Search,
  Filter,
  Users,
  Building2,
  Bed,
  Ambulance,
  Radio,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';

export const AdminAuditDashboard: React.FC = () => {
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetchLogs();
    fetchAnalytics();
  }, [actionFilter, roleFilter, resultFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (resultFilter) params.append('result', resultFilter);
      if (searchQuery) params.append('query', searchQuery);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner */}
      <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold tracking-tight">
              Security Operations & Immutable Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            HIPAA Security Rule compliant · Cryptographic append-only event logging
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-slate-400">Total Audit Records:</span>
          <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded tabular-nums">
            {logs.length} logged
          </span>
        </div>
      </section>

      {/* Summary Metric Cards (Section 22 Requirement) */}
      {analytics && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Users
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
              {analytics.metrics.totalUsers}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Registered Patients
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
              {analytics.metrics.totalPatients}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Network Hospitals
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-slate-900">
              {analytics.metrics.registeredHospitals}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block mb-1">
              Active Emergencies
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-rose-600">
              {analytics.metrics.activeEmergencies}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
              Available ICU Beds
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-blue-600">
              {analytics.metrics.availableIcuBeds}{' '}
              <span className="text-xs font-normal text-slate-400">/ {analytics.metrics.totalIcuBeds}</span>
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">
              Available Fleet
            </span>
            <span className="text-2xl font-extrabold font-mono tabular-nums text-emerald-600">
              {analytics.metrics.availableAmbulances}{' '}
              <span className="text-xs font-normal text-slate-400">/ {analytics.metrics.totalAmbulances}</span>
            </span>
          </div>
        </section>
      )}

      {/* SVG Analytics Charts (Section 22 Requirement) */}
      {analytics && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Chart 1: Severity Distribution Meter */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Emergency Severity Distribution
            </h3>
            
            <div className="space-y-2 pt-2 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-rose-700">Critical (Code Red)</span>
                  <span className="font-mono font-bold tabular-nums">{analytics.severityCounts.CRITICAL || 0} cases</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-600 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((analytics.severityCounts.CRITICAL || 0) / 4) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-amber-700">High Severity</span>
                  <span className="font-mono font-bold tabular-nums">{analytics.severityCounts.HIGH || 0} cases</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((analytics.severityCounts.HIGH || 0) / 4) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold text-slate-700">Medium / Standard</span>
                  <span className="font-mono font-bold tabular-nums">{analytics.severityCounts.MEDIUM || 0} cases</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-slate-700 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((analytics.severityCounts.MEDIUM || 0) / 4) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Regional Capacity Utilization */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Regional Bed Capacity Utilization
            </h3>

            <div className="flex items-center justify-around h-36 pt-2">
              <div className="text-center">
                <div className="text-2xl font-mono font-extrabold text-blue-600 tabular-nums">
                  {Math.round(((analytics.metrics.totalIcuBeds - analytics.metrics.availableIcuBeds) / (analytics.metrics.totalIcuBeds || 1)) * 100)}%
                </div>
                <span className="text-[11px] text-slate-500 font-medium">ICU Occupancy Rate</span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {analytics.metrics.availableIcuBeds} open / {analytics.metrics.totalIcuBeds} total
                </p>
              </div>

              <div className="h-16 w-px bg-slate-200" />

              <div className="text-center">
                <div className="text-2xl font-mono font-extrabold text-emerald-600 tabular-nums">
                  {Math.round((analytics.metrics.availableAmbulances / (analytics.metrics.totalAmbulances || 1)) * 100)}%
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Ambulance Fleet Ready</span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  {analytics.metrics.availableAmbulances} in bay / {analytics.metrics.totalAmbulances} total
                </p>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* Audit Logs Filterable Table (Section 20 Requirement) */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Comprehensive Audit Trail Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Append-only verified logs capturing all patient views, QR scans, and resource telemetry changes
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Actions</option>
              <option value="VIEW_PATIENT">VIEW_PATIENT</option>
              <option value="VIEW_EMERGENCY_PROFILE">VIEW_EMERGENCY_PROFILE</option>
              <option value="SCAN_QR">SCAN_QR</option>
              <option value="UPDATE_PATIENT">UPDATE_PATIENT</option>
              <option value="UPDATE_HOSPITAL_RESOURCE">UPDATE_HOSPITAL_RESOURCE</option>
              <option value="CREATE_EMERGENCY">CREATE_EMERGENCY</option>
              <option value="SELECT_HOSPITAL">SELECT_HOSPITAL</option>
              <option value="ACCESS_DENIED">ACCESS_DENIED</option>
            </select>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="DOCTOR">DOCTOR</option>
              <option value="NURSE">NURSE</option>
              <option value="PARAMEDIC">PARAMEDIC</option>
              <option value="HOSPITAL_ADMIN">HOSPITAL_ADMIN</option>
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="DENIED">DENIED</option>
            </select>

            <button
              onClick={() => {
                setActionFilter('');
                setRoleFilter('');
                setResultFilter('');
                setSearchQuery('');
              }}
              className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3 font-bold">Timestamp</th>
                <th className="py-2.5 px-3 font-bold">User / Role</th>
                <th className="py-2.5 px-3 font-bold">Action Type</th>
                <th className="py-2.5 px-3 font-bold">Patient / Target</th>
                <th className="py-2.5 px-3 font-bold">Outcome</th>
                <th className="py-2.5 px-3 font-bold">Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    log.result === 'DENIED' ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                    <time dateTime={log.timestamp}>
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </time>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 block">{log.userName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.role}</span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                    {log.patientId || log.hospitalId || log.targetId || 'SYSTEM'}
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    {log.result === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        DENIED
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-slate-600 max-w-md">
                    <p className="leading-snug">{log.details}</p>
                    {log.denialReason && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                        Reason: {log.denialReason}
                      </p>
                    )}
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
