import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { PatientSearch } from './components/PatientSearch.tsx';
import { PatientEmergencyProfile } from './components/PatientEmergencyProfile.tsx';
import { QRScannerModal } from './components/QRScannerModal.tsx';
import { InteractiveMap } from './components/InteractiveMap.tsx';
import { NearbyHospitalFinder } from './components/NearbyHospitalFinder.tsx';
import { HospitalResourceDashboard } from './components/HospitalResourceDashboard.tsx';
import { AmbulanceModule } from './components/AmbulanceModule.tsx';
import { CreateEmergencyModal } from './components/CreateEmergencyModal.tsx';
import { EmergencyTrackerView } from './components/EmergencyTrackerView.tsx';
import { AdminAuditDashboard } from './components/AdminAuditDashboard.tsx';
import {
  Hospital,
  Ambulance,
  EmergencyRequest,
  Patient,
  MedicalRecord,
  PatientEmergencyContact,
} from './types.ts';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

function EmergencyLinkApp() {
  const { user, token, hasRole, login } = useAuth();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState<boolean>(false);
  const [isCreateEmergencyOpen, setIsCreateEmergencyOpen] = useState<boolean>(false);

  // Core Data States
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);

  // Selected Entities
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyRequest | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<{
    patient: Patient;
    medicalRecord: MedicalRecord;
    emergencyContacts: PatientEmergencyContact[];
  } | null>(null);

  // Active Patient Location coordinates (Defaults to SF Potrero / Mission Core)
  const [patientCoords, setPatientCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  }>({
    latitude: 37.761,
    longitude: -122.42,
  });

  // Fetch Hospitals, Ambulances, and Emergencies
  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (token) {
      fetchAmbulances();
      fetchEmergencies();
    }
  }, [token]);

  // If user switches, redirect to dashboard if they were on landing page
  useEffect(() => {
    if (user && currentTab === 'landing') {
      setCurrentTab('dashboard');
    }
  }, [user]);

  // Load detailed patient profile when selectedPatientId changes
  useEffect(() => {
    if (!selectedPatientId || !token) {
      setPatientData(null);
      return;
    }

    const loadPatient = async () => {
      try {
        const res = await fetch(`/api/patients/${selectedPatientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPatientData(data);
        }
      } catch (err) {
        console.error('Failed to load patient profile:', err);
      }
    };

    loadPatient();
  }, [selectedPatientId, token]);

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/hospitals');
      if (res.ok) {
        const data = await res.json();
        setHospitals(data.hospitals || []);
      }
    } catch (e) {
      console.error('Failed to fetch hospitals', e);
    }
  };

  const fetchAmbulances = async () => {
    try {
      const res = await fetch('/api/ambulances', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAmbulances(data.ambulances || []);
      }
    } catch (e) {
      console.error('Failed to fetch ambulances', e);
    }
  };

  const fetchEmergencies = async () => {
    try {
      const res = await fetch('/api/emergencies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEmergencies(data.emergencies || []);
      }
    } catch (e) {
      console.error('Failed to fetch emergencies', e);
    }
  };

  // Quick Demo Login Handler
  const handleQuickDemoLogin = async (
    role: 'PARAMEDIC' | 'DOCTOR' | 'NURSE' | 'HOSPITAL_ADMIN' | 'ADMIN'
  ) => {
    await login('', '', role);
    setCurrentTab('dashboard');
  };

  // Handle emergency status progression
  const handleProgressEmergencyStatus = async (
    newStatus: EmergencyRequest['status']
  ) => {
    if (!selectedEmergency) return;

    try {
      const res = await fetch(`/api/emergencies/${selectedEmergency.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedEmergency(data.emergency);
        fetchEmergencies();
        fetchAmbulances();
      }
    } catch (err) {
      console.error('Failed to advance emergency status', err);
    }
  };

  // Handle hospital selection for active emergency
  const handleSelectHospitalForEmergency = async (hospital: Hospital) => {
    if (!selectedEmergency) {
      // If no active emergency, prompt creating one or assign
      alert(`Selected ${hospital.name}. Create an emergency request to dispatch resources.`);
      return;
    }

    try {
      const res = await fetch(`/api/emergencies/${selectedEmergency.id}/select-hospital`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ hospitalId: hospital.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedEmergency(data.emergency);
        fetchEmergencies();
        fetchAmbulances();
        setCurrentTab('emergency-tracker');
      }
    } catch (err) {
      console.error('Failed to assign hospital to emergency', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation (Zone Contract Compliant) */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedEmergency(null);
          setSelectedPatientId(null);
          setCurrentTab(tab);
        }}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onOpenCreateEmergency={() => setIsCreateEmergencyOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* If user is not authenticated and tab is landing, render LandingPage */}
        {!user && currentTab === 'landing' ? (
          <LandingPage
            onOpenLogin={() => setIsAuthModalOpen(true)}
            onQuickDemoLogin={handleQuickDemoLogin}
          />
        ) : !user ? (
          /* Unauthenticated Prompt */
          <div className="py-12">
            <LandingPage
              onOpenLogin={() => setIsAuthModalOpen(true)}
              onQuickDemoLogin={handleQuickDemoLogin}
            />
          </div>
        ) : (
          /* Authenticated Router Views */
          <div>
            {/* View: Emergency Tracker */}
            {selectedEmergency ? (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedEmergency(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Dashboard
                </button>

                <EmergencyTrackerView
                  emergency={selectedEmergency}
                  onUpdateStatus={handleProgressEmergencyStatus}
                />
              </div>
            ) : selectedPatientId && patientData ? (
              /* View: Patient Emergency Profile */
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedPatientId(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Patient Registry
                </button>

                <PatientEmergencyProfile
                  patient={patientData.patient}
                  medicalRecord={patientData.medicalRecord}
                  emergencyContacts={patientData.emergencyContacts}
                  onFindHospitals={() => setCurrentTab('hospitals')}
                  onCreateEmergency={() => setIsCreateEmergencyOpen(true)}
                  onViewLocation={() => setCurrentTab('map')}
                  onRefresh={() => {
                    if (selectedPatientId) {
                      fetch(`/api/patients/${selectedPatientId}`, {
                        headers: { Authorization: `Bearer ${token}` },
                      })
                        .then((r) => r.json())
                        .then((d) => setPatientData(d));
                    }
                  }}
                />
              </div>
            ) : currentTab === 'dashboard' ? (
              /* Tab: Main Dashboard Overview */
              <DashboardOverview
                emergencies={emergencies}
                hospitals={hospitals}
                ambulances={ambulances}
                onOpenCreateEmergency={() => setIsCreateEmergencyOpen(true)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
                onOpenPatientSearch={() => setCurrentTab('patients')}
                onOpenHospitalFinder={() => setCurrentTab('hospitals')}
                onSelectEmergency={(emg) => setSelectedEmergency(emg)}
              />
            ) : currentTab === 'patients' ? (
              /* Tab: Patient Search & Safe Registry */
              <PatientSearch
                onSelectPatient={(pId) => setSelectedPatientId(pId)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
              />
            ) : currentTab === 'hospitals' ? (
              /* Tab: Nearby Hospital Finder & Recommendations */
              <NearbyHospitalFinder
                patientCoords={patientCoords}
                onSelectHospitalForEmergency={handleSelectHospitalForEmergency}
                onFocusMapHospital={(hosp) => {
                  setPatientCoords({ latitude: hosp.latitude, longitude: hosp.longitude });
                  setCurrentTab('map');
                }}
              />
            ) : currentTab === 'map' ? (
              /* Tab: Interactive Leaflet Map */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Live Emergency Operations Map
                    </h2>
                    <p className="text-xs text-slate-500">
                      Real-time spatial visualization of trauma facilities, paramedic vehicles, and incident GPS
                    </p>
                  </div>
                </div>

                <InteractiveMap
                  hospitals={hospitals}
                  ambulances={ambulances}
                  patientCoords={patientCoords}
                  onUpdatePatientCoords={(coords) => setPatientCoords(coords)}
                  onSelectHospital={handleSelectHospitalForEmergency}
                  onViewHospital={(hosp) => {
                    alert(`Hospital: ${hosp.name}\nCode: ${hosp.code}\nAddress: ${hosp.address}\nEmergency Direct: ${hosp.emergencyPhone}\nAvailable ICU Beds: ${hosp.resources.icuBedsAvailable}`);
                  }}
                />
              </div>
            ) : currentTab === 'fleet' ? (
              /* Tab: Ambulance Fleet Module */
              <AmbulanceModule
                ambulances={ambulances}
                onRefresh={fetchAmbulances}
              />
            ) : currentTab === 'resources' && hasRole('HOSPITAL_ADMIN', 'ADMIN') ? (
              /* Tab: Hospital Capacity Management (Hospital Admin) */
              hospitals.length > 0 ? (
                <HospitalResourceDashboard
                  hospital={
                    user?.hospitalId
                      ? hospitals.find((h) => h.id === user.hospitalId) || hospitals[0]
                      : hospitals[0]
                  }
                  onUpdateHospital={(updated) => {
                    setHospitals((prev) =>
                      prev.map((h) => (h.id === updated.id ? updated : h))
                    );
                  }}
                />
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm">Loading hospitals...</div>
              )
            ) : currentTab === 'admin' && hasRole('ADMIN') ? (
              /* Tab: Admin Security & Audit Trail */
              <AdminAuditDashboard />
            ) : (
              <DashboardOverview
                emergencies={emergencies}
                hospitals={hospitals}
                ambulances={ambulances}
                onOpenCreateEmergency={() => setIsCreateEmergencyOpen(true)}
                onOpenQRScanner={() => setIsQRScannerOpen(true)}
                onOpenPatientSearch={() => setCurrentTab('patients')}
                onOpenHospitalFinder={() => setCurrentTab('hospitals')}
                onSelectEmergency={(emg) => setSelectedEmergency(emg)}
              />
            )}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Section 27 Requirement) */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedEmergency(null);
          setSelectedPatientId(null);
          setCurrentTab(tab);
        }}
        onOpenCreateEmergency={() => setIsCreateEmergencyOpen(true)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setCurrentTab('dashboard');
          fetchAmbulances();
          fetchEmergencies();
        }}
      />

      {/* HTML5 Camera Video Stream QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onPatientFound={(patientId) => {
          setSelectedPatientId(patientId);
          setCurrentTab('patients');
        }}
      />

      {/* Create Emergency Request Modal */}
      <CreateEmergencyModal
        isOpen={isCreateEmergencyOpen}
        onClose={() => setIsCreateEmergencyOpen(false)}
        currentCoords={patientCoords}
        onEmergencyCreated={(emergency) => {
          fetchEmergencies();
          setSelectedEmergency(emergency);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EmergencyLinkApp />
    </AuthProvider>
  );
}
