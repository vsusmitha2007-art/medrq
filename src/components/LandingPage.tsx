import React from 'react';
import {
  Shield,
  Activity,
  MapPin,
  Ambulance,
  Hospital,
  ArrowRight,
  QrCode,
  Lock,
  Cpu,
  CheckCircle2,
  FileCheck2,
} from 'lucide-react';
import heroImage from '../assets/images/emergency_control_center_1791210407320.jpg';
import paramedicImage from '../assets/images/paramedic_field_terminal_1791210418915.jpg';

interface LandingPageProps {
  onOpenLogin: () => void;
  onQuickDemoLogin: (role: 'PARAMEDIC' | 'DOCTOR' | 'NURSE' | 'HOSPITAL_ADMIN' | 'ADMIN') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onQuickDemoLogin,
}) => {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200/80 rounded-full text-xs font-semibold text-rose-700">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Live Trauma & Hospital Resource Orchestration
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight text-balance leading-[1.1]">
                Emergency Response, Connected.
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-xl text-balance">
                Securely connect patients, emergency personnel, hospitals, locations, and critical resources when every second matters.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-rose-500"
                >
                  Emergency Access
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#features"
                  className="px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-sm"
                >
                  Explore Platform
                </a>
              </div>

              {/* Quick Demo Role Launchers */}
              <div className="pt-4 border-t border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Immediate One-Click Persona Demos
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onQuickDemoLogin('PARAMEDIC')}
                    className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-rose-50 hover:text-rose-700 border border-slate-200 rounded-lg transition-colors text-slate-700 shadow-2xs"
                  >
                    🚑 Paramedic
                  </button>
                  <button
                    onClick={() => onQuickDemoLogin('DOCTOR')}
                    className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors text-slate-700 shadow-2xs"
                  >
                    🩺 Doctor
                  </button>
                  <button
                    onClick={() => onQuickDemoLogin('NURSE')}
                    className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg transition-colors text-slate-700 shadow-2xs"
                  >
                    👩‍⚕️ Nurse
                  </button>
                  <button
                    onClick={() => onQuickDemoLogin('HOSPITAL_ADMIN')}
                    className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-purple-50 hover:text-purple-700 border border-slate-200 rounded-lg transition-colors text-slate-700 shadow-2xs"
                  >
                    🏥 Hospital Admin
                  </button>
                  <button
                    onClick={() => onQuickDemoLogin('ADMIN')}
                    className="px-3 py-1.5 text-xs font-medium bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg transition-colors text-slate-700 shadow-2xs"
                  >
                    🛡️ System Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual & SVG Emergency Network Visualization */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900">
                <img
                  src={heroImage}
                  alt="EmergencyLink Coordination Center"
                  className="w-full h-64 sm:h-72 object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent p-6 flex flex-col justify-end">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Autonomous Resource Matching Mesh
                  </div>
                  <h3 className="text-white font-bold text-lg sm:text-xl">
                    Live Regional Emergency Topology
                  </h3>
                  <p className="text-slate-300 text-xs mt-1">
                    Synchronizing Level 1 trauma beds, field EMT GPS coordinates, and ventilator availability in sub-seconds.
                  </p>
                </div>
              </div>

              {/* Elegant HTML/SVG Emergency Network Visualization:
                  Patient → Location → Ambulance → Hospital → Emergency Resources */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                  Emergency Coordination Pipeline
                </p>
                <div className="flex items-center justify-between text-center overflow-x-auto py-2">
                  <div className="flex flex-col items-center min-w-[70px]">
                    <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-1 shadow-2xs">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Patient</span>
                    <span className="text-[10px] text-slate-500">QR ID</span>
                  </div>

                  <div className="text-slate-300 text-xs font-bold px-1">→</div>

                  <div className="flex flex-col items-center min-w-[70px]">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-1 shadow-2xs">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Location</span>
                    <span className="text-[10px] text-slate-500">HTML5 GPS</span>
                  </div>

                  <div className="text-slate-300 text-xs font-bold px-1">→</div>

                  <div className="flex flex-col items-center min-w-[70px]">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-1 shadow-2xs">
                      <Ambulance className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Ambulance</span>
                    <span className="text-[10px] text-slate-500">Fast Transit</span>
                  </div>

                  <div className="text-slate-300 text-xs font-bold px-1">→</div>

                  <div className="flex flex-col items-center min-w-[70px]">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-1 shadow-2xs">
                      <Hospital className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Hospital</span>
                    <span className="text-[10px] text-slate-500">Trauma Bay</span>
                  </div>

                  <div className="text-slate-300 text-xs font-bold px-1">→</div>

                  <div className="flex flex-col items-center min-w-[70px]">
                    <div className="w-10 h-10 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 mb-1 shadow-2xs">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Resources</span>
                    <span className="text-[10px] text-slate-500">ICU & Blood</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Integrated Emergency Response Architecture
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Eliminating clinical blindspots with secure tokenized patient identification, real-time hospital resource matching, and complete compliance audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Secure Patient Information */}
          <article className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Secure Patient Information
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Safe QR scanning via HTML5 Camera video stream. Displays critical allergens, current medications, and blood group without exposing private identifiers.
            </p>
          </article>

          {/* Card 2: Location Intelligence */}
          <article className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Location Intelligence
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              HTML5 Geolocation locks patient coordinates and plots interactive Leaflet maps with custom SVG rings indicating hospital availability and live ambulance positions.
            </p>
          </article>

          {/* Card 3: Hospital Resource Matching */}
          <article className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Hospital className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Hospital Resource Matching
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Rule-based scoring balances transit distance, emergency department status, ICU beds, ventilators, and blood units to prioritize receptive facilities.
            </p>
          </article>

          {/* Card 4: Emergency Coordination */}
          <article className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
              <Ambulance className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Emergency Coordination
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              End-to-end dispatch timeline tracking: from request creation, GPS confirmation, hospital selection, to en-route ambulance triage and arrival.
            </p>
          </article>
        </div>
      </section>

      {/* Built for Faster Emergency Decisions Section */}
      <section id="security" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-md">
                <img
                  src={paramedicImage}
                  alt="Paramedic using ruggedized field scanner"
                  className="w-full h-72 object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  HIPAA-aligned role-based access control with tamper-evident, append-only security logs recorded on every query.
                </span>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                  Built for Faster Emergency Decisions
                </h2>
                <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                  Engineered specifically for paramedics in noisy ambulances, triage nurses under pressure, and hospital administrators managing surge capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Secure Access</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Strict RBAC ensuring doctors, paramedics, and hospital directors only see data within their clinical scope.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Real-Time Resource Visibility</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Live counters for ICU beds, ventilators, blood bank reserves, and on-duty resuscitation specialists.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Location-Based Hospital Discovery</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Automated Haversine distance calculations and estimated emergency transit times for all regional hospitals.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Complete Audit Trail</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Every patient lookup, QR scan, hospital selection, and unauthorized attempt is recorded in an immutable ledger.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onOpenLogin}
                  className="px-6 py-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm inline-flex items-center gap-2"
                >
                  Enter Emergency Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Semantic Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">
              EmergencyLink
            </span>
            <span className="text-xs text-slate-500 ml-2">
              © 2026 Emergency Medical Coordination System
            </span>
          </div>

          <nav className="flex items-center gap-6 text-xs text-slate-600">
            <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy Notice: EmergencyLink operates under strict HIPAA security protocols. All emergency patient data is synthetic for demonstration."); }} className="hover:text-slate-900 transition-colors">
              Privacy
            </a>
            <a href="#security" className="hover:text-slate-900 transition-colors">
              Security
            </a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); alert("Emergency Communications Desk: dispatch@emergencylink.health (Simulated hotline)"); }} className="hover:text-slate-900 transition-colors">
              Contact
            </a>
            <button
              onClick={() => onQuickDemoLogin('PARAMEDIC')}
              className="text-rose-600 font-semibold hover:text-rose-700 transition-colors"
            >
              Launch Live Demo
            </button>
          </nav>
        </div>
      </footer>
    </main>
  );
};
