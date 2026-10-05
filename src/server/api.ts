/**
 * EmergencyLink Express REST API Endpoints
 * Role-Based Access Control (RBAC), JWT Authentication, Audit Trails, and Parametric Validation
 */

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User, EmergencyRequest } from './db.ts';
import { rankHospitals, calculateDistanceKm } from './recommendationEngine.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'emergencylink-production-secure-hmac-key-2026';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication Middleware
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || (req.cookies && req.cookies['auth_token']);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decodedUser: any) => {
    if (err || !decodedUser) {
      return res.status(403).json({ error: 'Session token invalid or expired. Please re-authenticate.' });
    }
    const userPayload = decodedUser as User;
    const existing = db.users.get(userPayload.id);
    req.user = existing || userPayload;
    next();
  });
}

// RBAC Middleware Generator
export function requireRole(...allowedRoles: Array<User['role']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Log access denial to immutable audit trail
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'ACCESS_DENIED',
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Web Client',
        result: 'DENIED',
        denialReason: `Role '${req.user.role}' does not possess required privileges [${allowedRoles.join(', ')}].`,
        details: `Unauthorized attempt to access protected resource at ${req.originalUrl}`,
      });

      return res.status(403).json({
        error: 'Access Denied: Your role does not have permission to view or modify this resource.',
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
}

// ----------------- AUTHENTICATION ROUTES -----------------

// POST /api/auth/login
router.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, demoRole } = req.body;

  let user: User | undefined;

  if (demoRole) {
    user = Array.from(db.users.values()).find((u) => u.role === demoRole);
  } else if (email) {
    user = Array.from(db.users.values()).find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or user ID not found.' });
  }

  // Issue signed JWT token with 12 hour expiry
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      badgeNumber: user.badgeNumber,
      department: user.department,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  // Set cookie for browser session
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 12 * 60 * 60 * 1000,
  });

  // Log successful login in audit trail
  db.addAuditLog({
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'LOGIN',
    ipAddress: req.ip || '127.0.0.1',
    deviceInfo: req.headers['user-agent'] || 'Web Browser',
    result: 'SUCCESS',
    details: `User authenticated successfully as ${user.role} (${user.badgeNumber})`,
  });

  return res.json({
    token,
    user,
    message: 'Authentication successful',
  });
});

// GET /api/auth/me
router.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// POST /api/auth/logout
router.post('/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'LOGOUT',
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Web Browser',
      result: 'SUCCESS',
      details: 'User logged out and session revoked.',
    });
  }

  res.clearCookie('auth_token');
  res.json({ message: 'Session closed successfully' });
});

// ----------------- PATIENT SEARCH & RECORDS -----------------

// GET /api/patients (Safe Search - does not expose private psychiatric notes or unneeded data)
router.get(
  '/patients',
  authenticateToken,
  requireRole('ADMIN', 'DOCTOR', 'NURSE', 'PARAMEDIC'),
  (req: AuthenticatedRequest, res: Response) => {
    const query = String(req.query.q || '').trim().toLowerCase();
    const allPatients = Array.from(db.patients.values());

    const results = allPatients.filter((p) => {
      if (!query) return true;
      return (
        p.id.toLowerCase().includes(query) ||
        p.name.toLowerCase().includes(query) ||
        p.qrToken.toLowerCase().includes(query)
      );
    });

    // Map each patient to safe preview representation
    const safePreviews = results.map((patient) => {
      const record = db.medicalRecords.get(patient.id);
      const contacts = db.emergencyContacts.get(patient.id) || [];
      const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

      return {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        bloodGroup: record ? record.bloodGroup : 'UNKNOWN',
        criticalAllergies: record ? record.allergies : [],
        emergencyContact: primaryContact
          ? {
              name: primaryContact.name,
              relation: primaryContact.relation,
              phone: primaryContact.phone,
            }
          : null,
        qrToken: patient.qrToken,
      };
    });

    // Audit log search action if query provided
    if (query && req.user) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'VIEW_PATIENT',
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'SUCCESS',
        details: `Queried patient registry for: "${query}" (Returned ${results.length} matches)`,
      });
    }

    res.json({ patients: safePreviews, count: safePreviews.length });
  }
);

// GET /api/patients/:id (Full Emergency Patient Profile)
router.get(
  '/patients/:id',
  authenticateToken,
  requireRole('ADMIN', 'DOCTOR', 'NURSE', 'PARAMEDIC'),
  (req: AuthenticatedRequest, res: Response) => {
    const patientId = req.params.id;
    const patient = db.patients.get(patientId);

    if (!patient) {
      return res.status(404).json({ error: `Patient record with ID ${patientId} not found.` });
    }

    const record = db.medicalRecords.get(patientId);
    const contacts = db.emergencyContacts.get(patientId) || [];

    // Log emergency profile access in audit trail
    if (req.user) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'VIEW_EMERGENCY_PROFILE',
        patientId,
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'SUCCESS',
        details: `Accessed emergency profile for patient ${patient.name} (${patient.id}). Critical allergy review verified.`,
      });
    }

    res.json({
      patient,
      medicalRecord: record,
      emergencyContacts: contacts,
    });
  }
);

// GET /api/patients/qr/:token (Safe QR Patient Identification)
router.get(
  '/patients/qr/:token',
  authenticateToken,
  (req: AuthenticatedRequest, res: Response) => {
    const token = req.params.token;

    // RBAC verification for QR scan
    const allowedRoles: Array<User['role']> = ['ADMIN', 'DOCTOR', 'NURSE', 'PARAMEDIC'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      db.addAuditLog({
        userId: req.user ? req.user.id : 'anonymous',
        userName: req.user ? req.user.name : 'Unknown User',
        role: req.user ? req.user.role : 'UNKNOWN',
        action: 'ACCESS_DENIED',
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'DENIED',
        denialReason: "Your role does not have permission to view this patient's information.",
        details: `Attempted to resolve QR Token: ${token}`,
      });

      return res.status(403).json({
        error: "Access Denied: Your role does not have permission to view this patient's information.",
      });
    }

    // Find patient matching QR token
    const patient = Array.from(db.patients.values()).find(
      (p) => p.qrToken === token || p.id === token
    );

    if (!patient) {
      return res.status(404).json({ error: 'Patient QR code invalid or token expired.' });
    }

    const record = db.medicalRecords.get(patient.id);
    const contacts = db.emergencyContacts.get(patient.id) || [];

    // Audit log successful QR scan
    db.addAuditLog({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'SCAN_QR',
      patientId: patient.id,
      ipAddress: req.ip || '127.0.0.1',
      deviceInfo: req.headers['user-agent'] || 'Mobile Field Scanner',
      result: 'SUCCESS',
      details: `Validated QR token for patient ${patient.name} (${patient.id}). Role authorized.`,
    });

    res.json({
      patient,
      medicalRecord: record,
      emergencyContacts: contacts,
    });
  }
);

// PATCH /api/patients/:id/medical (Update permitted medical info - DOCTOR & ADMIN only)
router.patch(
  '/patients/:id/medical',
  authenticateToken,
  requireRole('ADMIN', 'DOCTOR'),
  (req: AuthenticatedRequest, res: Response) => {
    const patientId = req.params.id;
    const record = db.medicalRecords.get(patientId);

    if (!record) {
      return res.status(404).json({ error: 'Medical record not found.' });
    }

    const { allergies, medications, chronicConditions, notes } = req.body;

    if (allergies) record.allergies = allergies;
    if (medications) record.medications = medications;
    if (chronicConditions) record.chronicConditions = chronicConditions;
    if (notes !== undefined) record.notes = notes;
    record.lastUpdated = new Date().toISOString();

    if (req.user) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'UPDATE_PATIENT',
        patientId,
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'SUCCESS',
        details: `Updated medical record for patient ID ${patientId}. Modified clinical notes/allergies.`,
      });
    }

    res.json({ message: 'Medical information updated successfully', record });
  }
);

// ----------------- HOSPITALS & RESOURCE TELEMETRY -----------------

// GET /api/hospitals
router.get('/hospitals', (req: Request, res: Response) => {
  const hospitals = Array.from(db.hospitals.values());
  res.json({ hospitals });
});

// GET /api/hospitals/:id
router.get('/hospitals/:id', (req: Request, res: Response) => {
  const hospital = db.hospitals.get(req.params.id);
  if (!hospital) {
    return res.status(404).json({ error: 'Hospital not found.' });
  }
  res.json({ hospital });
});

// PATCH /api/hospitals/:id/resources (Hospital Admin updates capacity & resources)
router.patch(
  '/hospitals/:id/resources',
  authenticateToken,
  requireRole('HOSPITAL_ADMIN', 'ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const hospitalId = req.params.id;
    const hospital = db.hospitals.get(hospitalId);

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    // Role check: Hospital admin can only edit their designated hospital unless ADMIN
    if (req.user && req.user.role === 'HOSPITAL_ADMIN' && req.user.hospitalId && req.user.hospitalId !== hospitalId) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'ACCESS_DENIED',
        hospitalId,
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'DENIED',
        denialReason: 'Hospital Admin is only permitted to manage resources for their assigned hospital.',
        details: `User from ${req.user.hospitalId} attempted to alter telemetry of ${hospitalId}.`,
      });

      return res.status(403).json({
        error: 'Access Denied: You are only authorized to manage resources for your assigned hospital facility.',
      });
    }

    const {
      icuBedsAvailable,
      generalBedsAvailable,
      ventilatorsAvailable,
      ambulancesAvailable,
      bloodBankAvailable,
      emergencyDoctorsOnDuty,
      emergencyDepartmentStatus,
    } = req.body;

    const resObj = hospital.resources;

    if (icuBedsAvailable !== undefined) {
      resObj.icuBedsAvailable = Math.max(0, Math.min(resObj.icuBedsTotal, Number(icuBedsAvailable)));
    }
    if (generalBedsAvailable !== undefined) {
      resObj.generalBedsAvailable = Math.max(0, Math.min(resObj.generalBedsTotal, Number(generalBedsAvailable)));
    }
    if (ventilatorsAvailable !== undefined) {
      resObj.ventilatorsAvailable = Math.max(0, Math.min(resObj.ventilatorsTotal, Number(ventilatorsAvailable)));
    }
    if (ambulancesAvailable !== undefined) {
      resObj.ambulancesAvailable = Math.max(0, Math.min(resObj.ambulancesTotal, Number(ambulancesAvailable)));
    }
    if (bloodBankAvailable !== undefined) {
      resObj.bloodBank.isAvailable = Boolean(bloodBankAvailable);
    }
    if (emergencyDoctorsOnDuty !== undefined) {
      resObj.emergencyDoctorsOnDuty = Math.max(0, Number(emergencyDoctorsOnDuty));
    }
    if (emergencyDepartmentStatus) {
      resObj.emergencyDepartmentStatus = emergencyDepartmentStatus;
    }
    resObj.lastUpdated = new Date().toISOString();

    // Audit log
    if (req.user) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'UPDATE_HOSPITAL_RESOURCE',
        hospitalId,
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'SUCCESS',
        details: `Updated capacity telemetry for ${hospital.name}. ICU: ${resObj.icuBedsAvailable}/${resObj.icuBedsTotal}, General: ${resObj.generalBedsAvailable}/${resObj.generalBedsTotal}, Status: ${resObj.emergencyDepartmentStatus}`,
      });

      db.addNotification({
        title: 'Hospital Capacity Updated',
        message: `${hospital.name} updated emergency resources (ICU: ${resObj.icuBedsAvailable}, Ventilators: ${resObj.ventilatorsAvailable}).`,
        type: 'RESOURCE',
      });
    }

    res.json({
      message: 'Hospital resources successfully updated',
      hospital,
    });
  }
);

// ----------------- HOSPITAL RECOMMENDATION ENGINE -----------------

// POST /api/hospitals/recommend
router.post('/hospitals/recommend', (req: Request, res: Response) => {
  const { latitude, longitude, requiredResources = [], severity = 'HIGH' } = req.body;

  if (latitude === undefined || longitude === undefined) {
    return res.status(400).json({ error: 'Latitude and Longitude coordinates are required.' });
  }

  const allHospitals = Array.from(db.hospitals.values());
  const ranked = rankHospitals(allHospitals, {
    latitude: Number(latitude),
    longitude: Number(longitude),
    requiredResources,
    severity,
  });

  res.json({
    recommendations: ranked,
    patientCoordinates: { latitude, longitude },
    disclaimer: 'Recommended based on distance and currently available resources. This rule-based match does not constitute a clinical medical diagnosis.',
  });
});

// ----------------- AMBULANCE MODULE -----------------

// GET /api/ambulances
router.get('/ambulances', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const ambulances = Array.from(db.ambulances.values());
  res.json({ ambulances });
});

// PATCH /api/ambulances/:id/status
router.patch(
  '/ambulances/:id/status',
  authenticateToken,
  requireRole('ADMIN', 'PARAMEDIC', 'HOSPITAL_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const ambulanceId = req.params.id;
    const ambulance = db.ambulances.get(ambulanceId);

    if (!ambulance) {
      return res.status(404).json({ error: 'Ambulance not found.' });
    }

    const { status, address, latitude, longitude } = req.body;

    if (status) {
      ambulance.status = status;
    }
    if (latitude !== undefined && longitude !== undefined) {
      ambulance.currentLocation = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        address: address || ambulance.currentLocation?.address || 'Field Transit',
      };
    }

    res.json({ message: 'Ambulance status updated', ambulance });
  }
);

// ----------------- EMERGENCY REQUESTS & WORKFLOW -----------------

// GET /api/emergencies
router.get('/emergencies', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const emergencies = Array.from(db.emergencies.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ emergencies });
});

// GET /api/emergencies/:id
router.get('/emergencies/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const emergency = db.emergencies.get(req.params.id);
  if (!emergency) {
    return res.status(404).json({ error: 'Emergency request not found.' });
  }
  res.json({ emergency });
});

// POST /api/emergencies (Create Emergency Request)
router.post(
  '/emergencies',
  authenticateToken,
  requireRole('ADMIN', 'DOCTOR', 'PARAMEDIC'),
  (req: AuthenticatedRequest, res: Response) => {
    const {
      patientId,
      emergencyType,
      severity = 'HIGH',
      requiredResources = [],
      latitude,
      longitude,
      address = 'Patient GPS Location',
      notes = '',
    } = req.body;

    if (!patientId || !emergencyType) {
      return res.status(400).json({ error: 'Patient ID and emergency type are required.' });
    }

    const patient = db.patients.get(patientId);
    if (!patient) {
      return res.status(404).json({ error: `Patient ID ${patientId} not found in registry.` });
    }

    const record = db.medicalRecords.get(patientId);

    // Generate formatted Emergency ID (e.g. EMG-2026-00125)
    const emgCounter = Math.floor(10000 + Math.random() * 90000);
    const emgId = `EMG-2026-${emgCounter}`;

    const lat = Number(latitude || 37.761);
    const lon = Number(longitude || -122.42);

    const now = new Date().toISOString();

    const newEmergency: EmergencyRequest = {
      id: emgId,
      patientId: patient.id,
      patientName: patient.name,
      age: patient.age,
      bloodGroup: record ? record.bloodGroup : 'UNKNOWN',
      emergencyType,
      severity,
      requiredResources,
      status: 'LOCATION_CONFIRMED',
      patientLocation: {
        latitude: lat,
        longitude: lon,
        address,
        accuracyRadiusMeters: 6,
        timestamp: now,
      },
      assignedPersonnel: req.user ? `${req.user.name} (${req.user.role})` : 'Dispatched Team',
      createdByUserId: req.user ? req.user.id : 'system',
      createdByRole: req.user ? req.user.role : 'PARAMEDIC',
      notes,
      timeline: [
        {
          step: 'CREATED',
          label: 'Emergency Created',
          timestamp: now,
          completed: true,
          note: `Field emergency registered by ${req.user?.name || 'Dispatcher'}`,
        },
        {
          step: 'LOCATION_CONFIRMED',
          label: 'Location Confirmed via GPS',
          timestamp: now,
          completed: true,
          note: `Coordinates locked to ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        },
        {
          step: 'HOSPITAL_SEARCHING',
          label: 'Searching Nearby Hospitals',
          timestamp: now,
          completed: true,
          note: 'Rule-based hospital matching engine evaluated',
        },
        {
          step: 'HOSPITAL_SELECTED',
          label: 'Hospital Selected',
          timestamp: '',
          completed: false,
        },
        {
          step: 'AMBULANCE_ASSIGNED',
          label: 'Ambulance Assigned',
          timestamp: '',
          completed: false,
        },
        {
          step: 'EN_ROUTE',
          label: 'Ambulance En Route',
          timestamp: '',
          completed: false,
        },
        {
          step: 'ARRIVED',
          label: 'Patient Arrived at Hospital',
          timestamp: '',
          completed: false,
        },
        {
          step: 'COMPLETED',
          label: 'Emergency Concluded',
          timestamp: '',
          completed: false,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.emergencies.set(emgId, newEmergency);

    // Audit Log
    if (req.user) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'CREATE_EMERGENCY',
        patientId: patient.id,
        targetId: emgId,
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'SUCCESS',
        details: `Emergency ${emgId} created for patient ${patient.name} (${patient.id}). Severity: ${severity}, Type: ${emergencyType}`,
      });

      db.addNotification({
        title: 'Emergency Request Created',
        message: `Emergency ${emgId} created for ${patient.name} (${severity}). Immediate hospital resource matching initiated.`,
        type: 'EMERGENCY',
      });
    }

    // Auto calculate recommended hospitals
    const rankedHospitals = rankHospitals(Array.from(db.hospitals.values()), {
      latitude: lat,
      longitude: lon,
      requiredResources,
      severity,
    });

    res.status(201).json({
      emergency: newEmergency,
      recommendedHospitals: rankedHospitals,
      message: 'Emergency request created successfully.',
    });
  }
);

// POST /api/emergencies/:id/select-hospital
router.post(
  '/emergencies/:id/select-hospital',
  authenticateToken,
  requireRole('ADMIN', 'DOCTOR', 'PARAMEDIC'),
  (req: AuthenticatedRequest, res: Response) => {
    const emergencyId = req.params.id;
    const emergency = db.emergencies.get(emergencyId);

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency request not found.' });
    }

    const { hospitalId, ambulanceId } = req.body;
    const hospital = db.hospitals.get(hospitalId);

    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found.' });
    }

    emergency.selectedHospitalId = hospital.id;
    emergency.selectedHospitalName = hospital.name;
    emergency.status = 'HOSPITAL_SELECTED';

    // Find or assign ambulance
    let assignedAmbulance: any;
    if (ambulanceId) {
      assignedAmbulance = db.ambulances.get(ambulanceId);
    } else {
      // Find first available ambulance associated with this hospital or regional fleet
      assignedAmbulance = Array.from(db.ambulances.values()).find(
        (a) => (a.hospitalId === hospital.id || a.status === 'AVAILABLE') && a.status === 'AVAILABLE'
      );
    }

    if (assignedAmbulance) {
      emergency.assignedAmbulanceId = assignedAmbulance.id;
      emergency.assignedAmbulanceCallSign = assignedAmbulance.callSign;
      assignedAmbulance.status = 'ASSIGNED';
      assignedAmbulance.assignedEmergencyId = emergency.id;
      emergency.status = 'AMBULANCE_ASSIGNED';
    }

    const now = new Date().toISOString();

    // Update timeline
    emergency.timeline = emergency.timeline.map((step) => {
      if (step.step === 'HOSPITAL_SELECTED') {
        return {
          ...step,
          completed: true,
          timestamp: now,
          note: `Selected ${hospital.name}`,
        };
      }
      if (step.step === 'AMBULANCE_ASSIGNED' && assignedAmbulance) {
        return {
          ...step,
          completed: true,
          timestamp: now,
          note: `Ambulance ${assignedAmbulance.callSign} assigned`,
        };
      }
      return step;
    });

    emergency.updatedAt = now;

    // Audit log
    if (req.user) {
      db.addAuditLog({
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'SELECT_HOSPITAL',
        patientId: emergency.patientId,
        targetId: emergency.id,
        hospitalId: hospital.id,
        ipAddress: req.ip || '127.0.0.1',
        deviceInfo: req.headers['user-agent'] || 'Browser',
        result: 'SUCCESS',
        details: `Assigned hospital ${hospital.name} to Emergency ${emergency.id}. Ambulance: ${assignedAmbulance?.callSign || 'Pending'}`,
      });

      db.addNotification({
        title: 'Hospital Selected',
        message: `${hospital.name} selected for Emergency ${emergency.id}.`,
        type: 'EMERGENCY',
      });
    }

    res.json({
      message: 'Hospital and ambulance assigned to emergency successfully.',
      emergency,
      assignedAmbulance,
    });
  }
);

// PATCH /api/emergencies/:id/status (Advance workflow status)
router.patch(
  '/emergencies/:id/status',
  authenticateToken,
  requireRole('ADMIN', 'DOCTOR', 'PARAMEDIC', 'HOSPITAL_ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const emergencyId = req.params.id;
    const emergency = db.emergencies.get(emergencyId);

    if (!emergency) {
      return res.status(404).json({ error: 'Emergency not found.' });
    }

    const { status, note } = req.body;
    const now = new Date().toISOString();

    emergency.status = status;
    emergency.updatedAt = now;

    // Update matching timeline step
    emergency.timeline = emergency.timeline.map((step) => {
      if (step.step === status) {
        return {
          ...step,
          completed: true,
          timestamp: now,
          note: note || step.note,
        };
      }
      return step;
    });

    // If ambulance en route or arrived, sync ambulance status
    if (emergency.assignedAmbulanceId) {
      const amb = db.ambulances.get(emergency.assignedAmbulanceId);
      if (amb) {
        if (status === 'EN_ROUTE') amb.status = 'EN_ROUTE';
        if (status === 'ARRIVED') amb.status = 'ARRIVED';
        if (status === 'COMPLETED') {
          amb.status = 'AVAILABLE';
          amb.assignedEmergencyId = undefined;
        }
      }
    }

    res.json({ message: 'Emergency status progressed', emergency });
  }
);

// ----------------- AUDIT LOGS (ADMIN ONLY) -----------------

// GET /api/audit-logs
router.get(
  '/audit-logs',
  authenticateToken,
  requireRole('ADMIN'),
  (req: AuthenticatedRequest, res: Response) => {
    const { action, role, patientId, result, query } = req.query;

    let logs = [...db.auditLogs];

    if (action) {
      logs = logs.filter((l) => l.action === action);
    }
    if (role) {
      logs = logs.filter((l) => l.role === role);
    }
    if (patientId) {
      logs = logs.filter((l) => l.patientId === patientId);
    }
    if (result) {
      logs = logs.filter((l) => l.result === result);
    }
    if (query) {
      const q = String(query).toLowerCase();
      logs = logs.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q)
      );
    }

    res.json({ logs, count: logs.length });
  }
);

// ----------------- NOTIFICATIONS -----------------

// GET /api/notifications
router.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ notifications: db.notifications });
});

// POST /api/notifications/:id/read
router.post('/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

// POST /api/notifications/read-all
router.post('/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  for (const n of db.notifications) {
    n.read = true;
  }
  res.json({ success: true });
});

// ----------------- SYSTEM ANALYTICS & SUMMARY -----------------

// GET /api/analytics
router.get('/analytics', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const allHospitals = Array.from(db.hospitals.values());
  const allEmergencies = Array.from(db.emergencies.values());
  const allAmbulances = Array.from(db.ambulances.values());

  const totalPatients = db.patients.size;
  const registeredHospitals = allHospitals.length;
  const activeEmergencies = allEmergencies.filter((e) => e.status !== 'COMPLETED').length;

  const availableIcuBeds = allHospitals.reduce(
    (acc, h) => acc + h.resources.icuBedsAvailable,
    0
  );
  const totalIcuBeds = allHospitals.reduce(
    (acc, h) => acc + h.resources.icuBedsTotal,
    0
  );

  const availableAmbulances = allAmbulances.filter(
    (a) => a.status === 'AVAILABLE'
  ).length;

  // Breakdown by emergency severity
  const severityCounts = {
    CRITICAL: allEmergencies.filter((e) => e.severity === 'CRITICAL').length,
    HIGH: allEmergencies.filter((e) => e.severity === 'HIGH').length,
    MEDIUM: allEmergencies.filter((e) => e.severity === 'MEDIUM').length,
    LOW: allEmergencies.filter((e) => e.severity === 'LOW').length,
  };

  // Breakdown by status
  const statusCounts = allEmergencies.reduce((acc: Record<string, number>, emg) => {
    acc[emg.status] = (acc[emg.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    metrics: {
      totalUsers: db.users.size,
      totalPatients,
      registeredHospitals,
      activeEmergencies,
      availableIcuBeds,
      totalIcuBeds,
      availableAmbulances,
      totalAmbulances: allAmbulances.length,
      auditLogCount: db.auditLogs.length,
    },
    severityCounts,
    statusCounts,
  });
});

export default router;
