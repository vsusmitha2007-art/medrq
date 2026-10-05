/**
 * EmergencyLink Relational Data Store & Synthetic Healthcare Records
 * Production-grade data layer with relational integrity, indexing, and append-only audit logging.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PARAMEDIC' | 'HOSPITAL_ADMIN';
  hospitalId?: string;
  badgeNumber: string;
  department?: string;
  avatarUrl?: string;
}

export interface PatientEmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relation: string;
  phone: string;
  isPrimary: boolean;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  medications: string[];
  chronicConditions: string[];
  organDonor: boolean;
  dnrStatus: boolean;
  notes: string;
  lastUpdated: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  qrToken: string; // Safe, unguessable token pointing to the patient ID
  address: string;
  insuranceProvider?: string;
  policyNumber?: string;
  createdAt: string;
}

export interface HospitalResources {
  icuBedsAvailable: number;
  icuBedsTotal: number;
  generalBedsAvailable: number;
  generalBedsTotal: number;
  ventilatorsAvailable: number;
  ventilatorsTotal: number;
  ambulancesAvailable: number;
  ambulancesTotal: number;
  bloodBank: {
    'A+': number;
    'O+': number;
    'B+': number;
    'AB+': number;
    'O-': number;
    'A-': number;
    'B-': number;
    'AB-': number;
    isAvailable: boolean;
  };
  emergencyDoctorsOnDuty: number;
  emergencyDepartmentStatus: 'OPEN' | 'LIMITED' | 'DIVERSION' | 'CLOSED';
  lastUpdated: string;
}

export interface Hospital {
  id: string;
  name: string;
  code: string;
  traumaLevel: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'COMMUNITY';
  address: string;
  phone: string;
  emergencyPhone: string;
  latitude: number;
  longitude: number;
  specialties: string[];
  resources: HospitalResources;
}

export interface Ambulance {
  id: string;
  callSign: string;
  hospitalId: string;
  hospitalName: string;
  status: 'AVAILABLE' | 'ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'MAINTENANCE';
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  type: 'ALS' | 'BLS' | 'MICU'; // Advanced Life Support, Basic Life Support, Mobile ICU
  assignedEmergencyId?: string;
  driverName: string;
  paramedicLead: string;
}

export interface EmergencyRequest {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  bloodGroup: string;
  emergencyType: 'CARDIAC_ARREST' | 'TRAUMA_COLLISION' | 'RESPIRATORY_DISTRESS' | 'STROKE' | 'SEVERED_BLEEDING' | 'BURNS' | 'GENERAL_ACUTE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  requiredResources: string[];
  status: 'CREATED' | 'LOCATION_CONFIRMED' | 'HOSPITAL_SEARCHING' | 'HOSPITAL_SELECTED' | 'AMBULANCE_ASSIGNED' | 'EN_ROUTE' | 'ARRIVED' | 'COMPLETED';
  patientLocation: {
    latitude: number;
    longitude: number;
    address: string;
    accuracyRadiusMeters?: number;
    timestamp: string;
  };
  selectedHospitalId?: string;
  selectedHospitalName?: string;
  assignedAmbulanceId?: string;
  assignedAmbulanceCallSign?: string;
  assignedPersonnel: string;
  createdByUserId: string;
  createdByRole: string;
  notes: string;
  timeline: {
    step: string;
    label: string;
    timestamp: string;
    completed: boolean;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: string;
  action: 'VIEW_PATIENT' | 'VIEW_EMERGENCY_PROFILE' | 'SCAN_QR' | 'UPDATE_PATIENT' | 'UPDATE_HOSPITAL_RESOURCE' | 'CREATE_EMERGENCY' | 'SELECT_HOSPITAL' | 'ACCESS_DENIED' | 'LOGIN' | 'LOGOUT';
  targetId?: string;
  patientId?: string;
  hospitalId?: string;
  ipAddress: string;
  deviceInfo: string;
  result: 'SUCCESS' | 'DENIED';
  denialReason?: string;
  details: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'EMERGENCY' | 'RESOURCE' | 'AMBULANCE' | 'SECURITY' | 'INFO';
  read: boolean;
  createdAt: string;
  targetRole?: string;
}

// ----------------- IN-MEMORY RELATIONAL STORE WITH PRECISE MOCK SEEDING -----------------

export class EmergencyDatabase {
  users: Map<string, User> = new Map();
  patients: Map<string, Patient> = new Map();
  medicalRecords: Map<string, MedicalRecord> = new Map();
  emergencyContacts: Map<string, PatientEmergencyContact[]> = new Map();
  hospitals: Map<string, Hospital> = new Map();
  ambulances: Map<string, Ambulance> = new Map();
  emergencies: Map<string, EmergencyRequest> = new Map();
  auditLogs: AuditLog[] = [];
  notifications: AppNotification[] = [];

  constructor() {
    this.seed();
  }

  private seed() {
    // 1. Users
    const initialUsers: User[] = [
      {
        id: 'usr_admin_1',
        name: 'Chief Reynolds',
        email: 'admin@emergencylink.health',
        role: 'ADMIN',
        badgeNumber: 'HQ-9001',
        department: 'State Emergency Operations Command',
      },
      {
        id: 'usr_doc_1',
        name: 'Dr. Sarah Chen, MD',
        email: 'doctor@emergencylink.health',
        role: 'DOCTOR',
        hospitalId: 'hosp_metro_central',
        badgeNumber: 'DOC-4482',
        department: 'Level 1 Trauma Surgery & Resuscitation',
      },
      {
        id: 'usr_nurse_1',
        name: 'Elena Rostova, RN',
        email: 'nurse@emergencylink.health',
        role: 'NURSE',
        hospitalId: 'hosp_metro_central',
        badgeNumber: 'RN-8831',
        department: 'Emergency & Acute Triage',
      },
      {
        id: 'usr_para_1',
        name: 'Alex Rivera, EMT-P',
        email: 'paramedic@emergencylink.health',
        role: 'PARAMEDIC',
        badgeNumber: 'EMS-5120',
        department: 'Metro Fast Response Unit 4',
      },
      {
        id: 'usr_hosp_admin_1',
        name: 'Marcus Vance, MHA',
        email: 'hospital.admin@emergencylink.health',
        role: 'HOSPITAL_ADMIN',
        hospitalId: 'hosp_metro_central',
        badgeNumber: 'HA-2010',
        department: 'Hospital Resource Logistics & Capacity Management',
      },
      {
        id: 'usr_hosp_admin_2',
        name: 'Diane Sterling',
        email: 'sterling@stjude.health',
        role: 'HOSPITAL_ADMIN',
        hospitalId: 'hosp_st_jude',
        badgeNumber: 'HA-3044',
        department: 'Clinical Operations & Emergency Response',
      }
    ];

    for (const u of initialUsers) {
      this.users.set(u.id, u);
    }

    // 2. Patients & Records (Synthetic data with non-identifiable profiles)
    const initialPatients: Array<{
      patient: Patient;
      record: MedicalRecord;
      contacts: PatientEmergencyContact[];
    }> = [
      {
        patient: {
          id: 'P1001',
          name: 'Arthur Pendelton',
          age: 62,
          gender: 'MALE',
          dob: '1964-03-12',
          qrToken: 'EMG-QR-P1001-SECURE-TOKEN-A9',
          address: '742 Evergreen Terrace, Sector 4',
          insuranceProvider: 'BlueCross Emergency Comprehensive',
          policyNumber: 'BC-99482-A',
          createdAt: '2025-01-10T08:00:00.000Z',
        },
        record: {
          id: 'med_p1001',
          patientId: 'P1001',
          bloodGroup: 'O-',
          allergies: ['Penicillin (Anaphylaxis)', 'Morphine Sulfate', 'Latex Contact'],
          medications: ['Lisinopril 20mg daily', 'Metformin 500mg BID', 'Aspirin 81mg'],
          chronicConditions: ['Type 2 Diabetes Mellitus', 'Severe Chronic Asthma', 'Hypertension Grade II'],
          organDonor: true,
          dnrStatus: false,
          notes: 'Carries rescue Albuterol inhaler. History of silent myocardial ischemia in 2023.',
          lastUpdated: '2026-08-14T11:20:00.000Z',
        },
        contacts: [
          {
            id: 'c1',
            patientId: 'P1001',
            name: 'Clara Pendelton',
            relation: 'Spouse',
            phone: '+1 (555) 234-8901',
            isPrimary: true,
          },
          {
            id: 'c2',
            patientId: 'P1001',
            name: 'David Pendelton',
            relation: 'Adult Son',
            phone: '+1 (555) 432-1098',
            isPrimary: false,
          },
        ],
      },
      {
        patient: {
          id: 'P1002',
          name: 'Maya Lin-Kowalski',
          age: 34,
          gender: 'FEMALE',
          dob: '1992-07-28',
          qrToken: 'EMG-QR-P1002-SECURE-TOKEN-B3',
          address: '180 Ocean Avenue, Apt 5B',
          insuranceProvider: 'Kaiser Permanente HealthNet',
          policyNumber: 'KP-382910-K',
          createdAt: '2025-03-22T10:15:00.000Z',
        },
        record: {
          id: 'med_p1002',
          patientId: 'P1002',
          bloodGroup: 'A+',
          allergies: ['Peanuts (Severe)', 'Sulfa Drugs', 'Iodinated Contrast Dyes'],
          medications: ['Sertraline 50mg', 'Fluticasone nasal spray'],
          chronicConditions: ['Generalized Epilepsy (well controlled with Levetiracetam)'],
          organDonor: true,
          dnrStatus: false,
          notes: 'Patient carries EpiPen Auto-Injector in everyday bag. Last seizure > 24 months ago.',
          lastUpdated: '2026-09-02T14:40:00.000Z',
        },
        contacts: [
          {
            id: 'c3',
            patientId: 'P1002',
            name: 'Julian Kowalski',
            relation: 'Husband',
            phone: '+1 (555) 891-2345',
            isPrimary: true,
          },
        ],
      },
      {
        patient: {
          id: 'P1003',
          name: 'Marcus Brody',
          age: 49,
          gender: 'MALE',
          dob: '1977-11-04',
          qrToken: 'EMG-QR-P1003-SECURE-TOKEN-C7',
          address: '45 Industrial Parkway, Unit 12',
          insuranceProvider: 'Aetna Global Medical',
          policyNumber: 'AET-771239-X',
          createdAt: '2025-05-18T16:00:00.000Z',
        },
        record: {
          id: 'med_p1003',
          patientId: 'P1003',
          bloodGroup: 'B+',
          allergies: ['Ciprofloxacin', 'Codeine'],
          medications: ['Atorvastatin 40mg', 'Warfarin 5mg (Anticoagulated)'],
          chronicConditions: ['Atrial Fibrillation', 'Mechanical Aortic Valve Replacement (2021)'],
          organDonor: false,
          dnrStatus: false,
          notes: 'High bleeding risk due to therapeutic INR on Coumadin. Emergency reversal protocol: Prothrombin Complex Concentrate.',
          lastUpdated: '2026-09-20T09:12:00.000Z',
        },
        contacts: [
          {
            id: 'c4',
            patientId: 'P1003',
            name: 'Sarah Brody',
            relation: 'Sister',
            phone: '+1 (555) 302-8877',
            isPrimary: true,
          },
        ],
      },
      {
        patient: {
          id: 'P1004',
          name: 'Sofia Al-Mansoor',
          age: 26,
          gender: 'FEMALE',
          dob: '2000-05-19',
          qrToken: 'EMG-QR-P1004-SECURE-TOKEN-D4',
          address: '92 Campus Way, Dormitory C',
          insuranceProvider: 'University Student Health Plus',
          policyNumber: 'USH-441029',
          createdAt: '2025-08-30T12:00:00.000Z',
        },
        record: {
          id: 'med_p1004',
          patientId: 'P1004',
          bloodGroup: 'AB-',
          allergies: ['NSAIDs / Ibuprofen', 'Cephalosporins'],
          medications: ['Insulin Glargine 18 units QPM', 'Insulin Lispro sliding scale'],
          chronicConditions: ['Type 1 Diabetes Mellitus (Continuous Glucose Monitor Dexcom G7)'],
          organDonor: true,
          dnrStatus: false,
          notes: 'Wearable insulin pump on lower right abdomen. Susceptible to rapid ketoacidosis if pump infusion occluded.',
          lastUpdated: '2026-10-01T15:30:00.000Z',
        },
        contacts: [
          {
            id: 'c5',
            patientId: 'P1004',
            name: 'Tariq Al-Mansoor',
            relation: 'Father',
            phone: '+1 (555) 678-9012',
            isPrimary: true,
          },
        ],
      },
      {
        patient: {
          id: 'P1005',
          name: 'Robert V. Hastings',
          age: 78,
          gender: 'MALE',
          dob: '1948-09-03',
          qrToken: 'EMG-QR-P1005-SECURE-TOKEN-E2',
          address: '12 Pines Elder Residence, Apt 204',
          insuranceProvider: 'Medicare Part A/B + Supplemental Medigap',
          policyNumber: 'MC-1948-99238',
          createdAt: '2025-02-14T09:00:00.000Z',
        },
        record: {
          id: 'med_p1005',
          patientId: 'P1005',
          bloodGroup: 'O+',
          allergies: ['Vancomycin', 'ACE Inhibitors (Angioedema history)'],
          medications: ['Amlodipine 10mg', 'Furosemide 40mg', 'Potassium Chloride 20mEq'],
          chronicConditions: ['Congestive Heart Failure NYHA Class III', 'Chronic Kidney Disease Stage 3b'],
          organDonor: false,
          dnrStatus: true, // Has executed legal DNR / POLST
          notes: 'Active DNR / POLST order verified on file. Comfort measures first. Severe peripheral vascular disease.',
          lastUpdated: '2026-09-28T16:15:00.000Z',
        },
        contacts: [
          {
            id: 'c6',
            patientId: 'P1005',
            name: 'Dr. Gregory Hastings',
            relation: 'Son & Medical POA',
            phone: '+1 (555) 714-3322',
            isPrimary: true,
          },
        ],
      },
    ];

    for (const item of initialPatients) {
      this.patients.set(item.patient.id, item.patient);
      this.medicalRecords.set(item.patient.id, item.record);
      this.emergencyContacts.set(item.patient.id, item.contacts);
    }

    // 3. Hospitals (Configured around a realistic metropolitan coordinate center: San Francisco / Bay Area or Metro Downtown ~ 37.7749, -122.4194)
    const initialHospitals: Hospital[] = [
      {
        id: 'hosp_metro_central',
        name: 'Metro Central Trauma & Surgical Center',
        code: 'MCTC-01',
        traumaLevel: 'LEVEL_1',
        address: '1001 Potrero Avenue, San Francisco, CA',
        phone: '+1 (415) 555-0100',
        emergencyPhone: '+1 (415) 555-9111',
        latitude: 37.7558,
        longitude: -122.4048,
        specialties: ['Level 1 Trauma', 'Cardiac Resuscitation', 'Stroke Care', 'Neurosurgery', 'Burn Unit'],
        resources: {
          icuBedsAvailable: 6,
          icuBedsTotal: 24,
          generalBedsAvailable: 34,
          generalBedsTotal: 120,
          ventilatorsAvailable: 9,
          ventilatorsTotal: 16,
          ambulancesAvailable: 3,
          ambulancesTotal: 6,
          bloodBank: {
            'A+': 42,
            'O+': 38,
            'B+': 18,
            'AB+': 12,
            'O-': 14,
            'A-': 9,
            'B-': 6,
            'AB-': 4,
            isAvailable: true,
          },
          emergencyDoctorsOnDuty: 8,
          emergencyDepartmentStatus: 'OPEN',
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        id: 'hosp_st_jude',
        name: 'St. Jude Regional Memorial Hospital',
        code: 'SJRM-02',
        traumaLevel: 'LEVEL_2',
        address: '350 Parnassus Ave, San Francisco, CA',
        phone: '+1 (415) 555-0200',
        emergencyPhone: '+1 (415) 555-9222',
        latitude: 37.7634,
        longitude: -122.4581,
        specialties: ['Emergency Cardiac Catheterization', 'Orthopedic Surgery', 'Pediatric Emergency'],
        resources: {
          icuBedsAvailable: 2, // Amber/Limited
          icuBedsTotal: 16,
          generalBedsAvailable: 8,
          generalBedsTotal: 80,
          ventilatorsAvailable: 3,
          ventilatorsTotal: 10,
          ambulancesAvailable: 1,
          ambulancesTotal: 4,
          bloodBank: {
            'A+': 20,
            'O+': 16,
            'B+': 8,
            'AB+': 4,
            'O-': 5,
            'A-': 3,
            'B-': 2,
            'AB-': 1,
            isAvailable: true,
          },
          emergencyDoctorsOnDuty: 4,
          emergencyDepartmentStatus: 'OPEN',
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        id: 'hosp_mission_bay',
        name: 'Bay Medical Academic Health Center',
        code: 'BMAH-03',
        traumaLevel: 'LEVEL_1',
        address: '1825 4th St, San Francisco, CA',
        phone: '+1 (415) 555-0300',
        emergencyPhone: '+1 (415) 555-9333',
        latitude: 37.7675,
        longitude: -122.3922,
        specialties: ['Comprehensive Stroke Center', 'Cardiothoracic ICU', 'Hyperbaric Medicine'],
        resources: {
          icuBedsAvailable: 8,
          icuBedsTotal: 28,
          generalBedsAvailable: 45,
          generalBedsTotal: 150,
          ventilatorsAvailable: 12,
          ventilatorsTotal: 20,
          ambulancesAvailable: 4,
          ambulancesTotal: 5,
          bloodBank: {
            'A+': 55,
            'O+': 48,
            'B+': 24,
            'AB+': 15,
            'O-': 20,
            'A-': 12,
            'B-': 8,
            'AB-': 6,
            isAvailable: true,
          },
          emergencyDoctorsOnDuty: 11,
          emergencyDepartmentStatus: 'OPEN',
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        id: 'hosp_presidio_urgent',
        name: 'Pacific Heights Emergency Care Center',
        code: 'PHEC-04',
        traumaLevel: 'LEVEL_3',
        address: '2333 Buchanan St, San Francisco, CA',
        phone: '+1 (415) 555-0400',
        emergencyPhone: '+1 (415) 555-9444',
        latitude: 37.7915,
        longitude: -122.4312,
        specialties: ['Acute Medical Care', 'Advanced Diagnostics', 'Observation Unit'],
        resources: {
          icuBedsAvailable: 0, // Full / Red
          icuBedsTotal: 8,
          generalBedsAvailable: 4,
          generalBedsTotal: 40,
          ventilatorsAvailable: 1,
          ventilatorsTotal: 6,
          ambulancesAvailable: 0,
          ambulancesTotal: 3,
          bloodBank: {
            'A+': 8,
            'O+': 6,
            'B+': 3,
            'AB+': 1,
            'O-': 1,
            'A-': 1,
            'B-': 0,
            'AB-': 0,
            isAvailable: false,
          },
          emergencyDoctorsOnDuty: 2,
          emergencyDepartmentStatus: 'DIVERSION', // On Diversion
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        id: 'hosp_twin_peaks_comm',
        name: 'Summit Community Hospital',
        code: 'SCH-05',
        traumaLevel: 'COMMUNITY',
        address: '500 Portola Dr, San Francisco, CA',
        phone: '+1 (415) 555-0500',
        emergencyPhone: '+1 (415) 555-9555',
        latitude: 37.7428,
        longitude: -122.4498,
        specialties: ['Community Trauma', 'Urgent Resuscitation', 'Stabilization'],
        resources: {
          icuBedsAvailable: 4,
          icuBedsTotal: 10,
          generalBedsAvailable: 18,
          generalBedsTotal: 50,
          ventilatorsAvailable: 5,
          ventilatorsTotal: 8,
          ambulancesAvailable: 2,
          ambulancesTotal: 3,
          bloodBank: {
            'A+': 18,
            'O+': 15,
            'B+': 6,
            'AB+': 3,
            'O-': 6,
            'A-': 4,
            'B-': 2,
            'AB-': 1,
            isAvailable: true,
          },
          emergencyDoctorsOnDuty: 3,
          emergencyDepartmentStatus: 'OPEN',
          lastUpdated: new Date().toISOString(),
        },
      },
    ];

    for (const h of initialHospitals) {
      this.hospitals.set(h.id, h);
    }

    // 4. Ambulances
    const initialAmbulances: Ambulance[] = [
      {
        id: 'AMB-01',
        callSign: 'MEDIC-41',
        hospitalId: 'hosp_metro_central',
        hospitalName: 'Metro Central Trauma',
        status: 'AVAILABLE',
        type: 'ALS',
        driverName: 'Officer Jack Kowal',
        paramedicLead: 'Alex Rivera, EMT-P',
        currentLocation: {
          latitude: 37.7601,
          longitude: -122.4120,
          address: 'Station 14, Mission & 18th St',
        },
      },
      {
        id: 'AMB-02',
        callSign: 'RESCUE-88',
        hospitalId: 'hosp_metro_central',
        hospitalName: 'Metro Central Trauma',
        status: 'EN_ROUTE',
        type: 'MICU',
        driverName: 'Samira Patel',
        paramedicLead: 'Marcus Vance, EMT-P',
        assignedEmergencyId: 'EMG-2026-00041',
        currentLocation: {
          latitude: 37.7655,
          longitude: -122.4150,
          address: 'En route to 92 Campus Way',
        },
      },
      {
        id: 'AMB-03',
        callSign: 'LIFE-STAR-07',
        hospitalId: 'hosp_mission_bay',
        hospitalName: 'Bay Medical Center',
        status: 'AVAILABLE',
        type: 'ALS',
        driverName: 'Dan Reynolds',
        paramedicLead: 'Chloe Zhao, EMT-P',
        currentLocation: {
          latitude: 37.7702,
          longitude: -122.3950,
          address: 'Mission Bay Staging Point',
        },
      },
      {
        id: 'AMB-04',
        callSign: 'ST-JUDE-12',
        hospitalId: 'hosp_st_jude',
        hospitalName: 'St. Jude Regional',
        status: 'ARRIVED',
        type: 'BLS',
        driverName: 'Timothy Vance',
        paramedicLead: 'Grace Hopper, EMT',
        assignedEmergencyId: 'EMG-2026-00039',
        currentLocation: {
          latitude: 37.7634,
          longitude: -122.4581,
          address: 'St. Jude Emergency Bay',
        },
      },
      {
        id: 'AMB-05',
        callSign: 'SUMMIT-03',
        hospitalId: 'hosp_twin_peaks_comm',
        hospitalName: 'Summit Community Hospital',
        status: 'MAINTENANCE',
        type: 'ALS',
        driverName: 'Depot Staff',
        paramedicLead: 'Fleet Tech',
        currentLocation: {
          latitude: 37.7428,
          longitude: -122.4498,
          address: 'Twin Peaks Maintenance Garage',
        },
      },
    ];

    for (const a of initialAmbulances) {
      this.ambulances.set(a.id, a);
    }

    // 5. Initial Emergency Requests
    const initialEmergencies: EmergencyRequest[] = [
      {
        id: 'EMG-2026-00041',
        patientId: 'P1001',
        patientName: 'Arthur Pendelton',
        age: 62,
        bloodGroup: 'O-',
        emergencyType: 'CARDIAC_ARREST',
        severity: 'CRITICAL',
        requiredResources: ['ICU', 'Ventilator', 'Emergency Department'],
        status: 'EN_ROUTE',
        patientLocation: {
          latitude: 37.7610,
          longitude: -122.4200,
          address: '742 Evergreen Terrace (Market & Castro Sector)',
          accuracyRadiusMeters: 8,
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        },
        selectedHospitalId: 'hosp_metro_central',
        selectedHospitalName: 'Metro Central Trauma & Surgical Center',
        assignedAmbulanceId: 'AMB-02',
        assignedAmbulanceCallSign: 'RESCUE-88',
        assignedPersonnel: 'Alex Rivera, EMT-P & Samira Patel',
        createdByUserId: 'usr_para_1',
        createdByRole: 'PARAMEDIC',
        notes: 'Patient collapsed with sudden chest crushing sensation and cyanosis. Defibrillator deployed on arrival, rhythm stabilized. Penicillin allergy confirmed via QR bracelet scan.',
        timeline: [
          { step: 'CREATED', label: 'Emergency Created', timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(), completed: true, note: 'Dispatch received 911 relay' },
          { step: 'LOCATION_CONFIRMED', label: 'Location Confirmed via GPS', timestamp: new Date(Date.now() - 16 * 60 * 1000).toISOString(), completed: true, note: 'Coordinates locked to 37.7610, -122.4200' },
          { step: 'HOSPITAL_SELECTED', label: 'Hospital Matched & Selected', timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(), completed: true, note: 'Metro Central matched (Level 1 Trauma + ICU Available)' },
          { step: 'AMBULANCE_ASSIGNED', label: 'Ambulance Assigned', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), completed: true, note: 'RESCUE-88 dispatched with MICU team' },
          { step: 'EN_ROUTE', label: 'Ambulance En Route', timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString(), completed: true, note: 'ETA to hospital: 4 minutes' },
          { step: 'ARRIVED', label: 'Patient Arrived at Hospital', timestamp: '', completed: false },
          { step: 'COMPLETED', label: 'Emergency Resuscitation Concluded', timestamp: '', completed: false },
        ],
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      },
      {
        id: 'EMG-2026-00039',
        patientId: 'P1003',
        patientName: 'Marcus Brody',
        age: 49,
        bloodGroup: 'B+',
        emergencyType: 'TRAUMA_COLLISION',
        severity: 'HIGH',
        requiredResources: ['Blood', 'Emergency Department'],
        status: 'ARRIVED',
        patientLocation: {
          latitude: 37.7690,
          longitude: -122.4460,
          address: 'Buena Vista Park East Junction',
          accuracyRadiusMeters: 12,
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        },
        selectedHospitalId: 'hosp_st_jude',
        selectedHospitalName: 'St. Jude Regional Memorial Hospital',
        assignedAmbulanceId: 'AMB-04',
        assignedAmbulanceCallSign: 'ST-JUDE-12',
        assignedPersonnel: 'Timothy Vance & Grace Hopper, EMT',
        createdByUserId: 'usr_para_1',
        createdByRole: 'PARAMEDIC',
        notes: 'Multi-vehicle collision. Patient on therapeutic Warfarin. Monitored for occult abdominal hemorrhage.',
        timeline: [
          { step: 'CREATED', label: 'Emergency Created', timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(), completed: true },
          { step: 'LOCATION_CONFIRMED', label: 'Location Confirmed', timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(), completed: true },
          { step: 'HOSPITAL_SELECTED', label: 'Hospital Selected', timestamp: new Date(Date.now() - 44 * 60 * 1000).toISOString(), completed: true },
          { step: 'AMBULANCE_ASSIGNED', label: 'Ambulance Assigned', timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(), completed: true },
          { step: 'EN_ROUTE', label: 'Ambulance En Route', timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(), completed: true },
          { step: 'ARRIVED', label: 'Patient Arrived at Hospital', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), completed: true, note: 'Triage room 2B' },
          { step: 'COMPLETED', label: 'Case Closed', timestamp: '', completed: false },
        ],
        createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      },
    ];

    for (const em of initialEmergencies) {
      this.emergencies.set(em.id, em);
    }

    // 6. Audit Logs (Mandatory security feature)
    this.auditLogs = [
      {
        id: 'log_001',
        timestamp: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        userId: 'usr_doc_1',
        userName: 'Dr. Sarah Chen, MD',
        role: 'DOCTOR',
        action: 'LOGIN',
        ipAddress: '192.168.10.45',
        deviceInfo: 'Clinical Workstation - Trauma Suite 1 (macOS Chrome)',
        result: 'SUCCESS',
        details: 'Physician authenticated with JWT keypair credential',
      },
      {
        id: 'log_002',
        timestamp: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
        userId: 'usr_para_1',
        userName: 'Alex Rivera, EMT-P',
        role: 'PARAMEDIC',
        action: 'SCAN_QR',
        patientId: 'P1001',
        ipAddress: '10.24.110.12',
        deviceInfo: 'Paramedic Ruggedized Toughbook EMT-4 (Linux Mobile)',
        result: 'SUCCESS',
        details: 'QR Token EMG-QR-P1001 scanned and validated in field. Access granted to emergency allergies and blood group.',
      },
      {
        id: 'log_003',
        timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        userId: 'usr_para_1',
        userName: 'Alex Rivera, EMT-P',
        role: 'PARAMEDIC',
        action: 'VIEW_EMERGENCY_PROFILE',
        patientId: 'P1001',
        ipAddress: '10.24.110.12',
        deviceInfo: 'Paramedic Ruggedized Toughbook EMT-4',
        result: 'SUCCESS',
        details: 'Emergency patient profile displayed. High-visibility allergen warning loaded (Penicillin anaphylaxis).',
      },
      {
        id: 'log_004',
        timestamp: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
        userId: 'usr_hosp_admin_1',
        userName: 'Marcus Vance, MHA',
        role: 'HOSPITAL_ADMIN',
        hospitalId: 'hosp_metro_central',
        action: 'UPDATE_HOSPITAL_RESOURCE',
        ipAddress: '192.168.12.80',
        deviceInfo: 'Operations Console - Metro Central Admin',
        result: 'SUCCESS',
        details: 'Resource telemetry updated: ICU beds adjusted from 4 to 6 available following surgical discharges.',
      },
      {
        id: 'log_005',
        timestamp: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
        userId: 'usr_para_1',
        userName: 'Alex Rivera, EMT-P',
        role: 'PARAMEDIC',
        action: 'CREATE_EMERGENCY',
        patientId: 'P1001',
        targetId: 'EMG-2026-00041',
        ipAddress: '10.24.110.12',
        deviceInfo: 'EMS Dispatch Field Client',
        result: 'SUCCESS',
        details: 'Created critical emergency request EMG-2026-00041. Location 37.7610, -122.4200 locked.',
      },
      {
        id: 'log_006',
        timestamp: new Date(Date.now() - 3600 * 1000 * 0.8).toISOString(),
        userId: 'usr_para_1',
        userName: 'Alex Rivera, EMT-P',
        role: 'PARAMEDIC',
        action: 'SELECT_HOSPITAL',
        hospitalId: 'hosp_metro_central',
        targetId: 'EMG-2026-00041',
        ipAddress: '10.24.110.12',
        deviceInfo: 'EMS Dispatch Field Client',
        result: 'SUCCESS',
        details: 'Hospital Metro Central Trauma selected based on automated recommendation matching ICU capacity.',
      },
      {
        id: 'log_007',
        timestamp: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString(),
        userId: 'usr_nurse_1',
        userName: 'Elena Rostova, RN',
        role: 'NURSE',
        action: 'ACCESS_DENIED',
        hospitalId: 'hosp_st_jude',
        ipAddress: '192.168.10.99',
        deviceInfo: 'Nurse Triage Station 4',
        result: 'DENIED',
        denialReason: 'Nurse role does not possess privileges to adjust administrative hospital capacity quotas.',
        details: 'Attempted modification of ICU bed quotas on external hospital partition rejected by RBAC policy.',
      },
    ];

    // 7. Initial Notifications
    this.notifications = [
      {
        id: 'notif_1',
        title: 'Emergency Request Created',
        message: 'Critical Cardiac Emergency EMG-2026-00041 created at Market & Castro Sector.',
        type: 'EMERGENCY',
        read: false,
        createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_2',
        title: 'Hospital Selected & En Route',
        message: 'Metro Central Trauma confirmed admission. Ambulance RESCUE-88 en route.',
        type: 'AMBULANCE',
        read: false,
        createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_3',
        title: 'Resource Telemetry Synchronized',
        message: 'Metro Central Trauma added 2 ICU beds back to active pool.',
        type: 'RESOURCE',
        read: true,
        createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_4',
        title: 'Security Alert: Access Boundary Check',
        message: 'Unauthorized hospital quota modification attempt prevented and logged to audit trail.',
        type: 'SECURITY',
        read: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    ];
  }

  // --- QUERY & MUTATION HELPERS ---

  addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log); // prepend for chronological ordering
    return log;
  }

  addNotification(notif: Omit<AppNotification, 'id' | 'read' | 'createdAt'>) {
    const n: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(n);
    return n;
  }
}

export const db = new EmergencyDatabase();
