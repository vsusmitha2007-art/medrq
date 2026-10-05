/**
 * EmergencyLink Type Definitions
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
  qrToken: string;
  address: string;
  insuranceProvider?: string;
  policyNumber?: string;
  createdAt: string;
}

export interface PatientPreview {
  id: string;
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: string;
  criticalAllergies: string[];
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  } | null;
  qrToken: string;
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
  type: 'ALS' | 'BLS' | 'MICU';
  assignedEmergencyId?: string;
  driverName: string;
  paramedicLead: string;
}

export interface TimelineStep {
  step: string;
  label: string;
  timestamp: string;
  completed: boolean;
  note?: string;
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
  timeline: TimelineStep[];
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

export interface HospitalMatchResult {
  hospital: Hospital;
  distanceKm: number;
  estimatedTravelMinutes: number;
  score: number;
  matchingDetails: {
    distanceScore: number;
    edStatusScore: number;
    resourcesScore: number;
    criticalResourcesMatched: string[];
    missingResources: string[];
    statusBadge: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNAVAILABLE';
    reasons: string[];
  };
}

export interface AnalyticsData {
  metrics: {
    totalUsers: number;
    totalPatients: number;
    registeredHospitals: number;
    activeEmergencies: number;
    availableIcuBeds: number;
    totalIcuBeds: number;
    availableAmbulances: number;
    totalAmbulances: number;
    auditLogCount: number;
  };
  severityCounts: Record<string, number>;
  statusCounts: Record<string, number>;
}
