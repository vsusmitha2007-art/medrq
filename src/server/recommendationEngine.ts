/**
 * EmergencyLink Hospital Recommendation Engine
 * Transparent, rule-based algorithmic ranking for emergency hospital matching.
 * STRICTLY RULE-BASED: Does not make medical diagnoses or clinical treatment plans.
 */

import { Hospital } from './db.ts';

export interface RecommendationCriteria {
  latitude: number;
  longitude: number;
  requiredResources: string[]; // e.g. ['ICU', 'Ventilator', 'Blood', 'Ambulance']
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface HospitalMatchResult {
  hospital: Hospital;
  distanceKm: number;
  estimatedTravelMinutes: number;
  score: number; // 0 to 100
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

/**
 * Calculates Great-Circle distance in kilometers between two geo-coordinates
 * using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

/**
 * Estimates emergency vehicle transit time assuming an average urban emergency speed
 * of ~38 km/h with siren clearance plus 2 minutes dispatch queue.
 */
export function estimateEmergencyTravelMinutes(distanceKm: number): number {
  const speedKmH = 38;
  const transitMinutes = (distanceKm / speedKmH) * 60;
  return Math.max(3, Math.round(transitMinutes + 2));
}

/**
 * Evaluates and ranks all registered hospitals against patient location and requested emergency resources.
 */
export function rankHospitals(
  hospitals: Hospital[],
  criteria: RecommendationCriteria
): HospitalMatchResult[] {
  const results: HospitalMatchResult[] = [];

  for (const hospital of hospitals) {
    const dist = calculateDistanceKm(
      criteria.latitude,
      criteria.longitude,
      hospital.latitude,
      hospital.longitude
    );
    const etaMinutes = estimateEmergencyTravelMinutes(dist);

    const res = hospital.resources;
    const reasons: string[] = [];
    const criticalResourcesMatched: string[] = [];
    const missingResources: string[] = [];

    // 1. Emergency Department Status Weight (30 pts max)
    let edScore = 0;
    if (res.emergencyDepartmentStatus === 'OPEN') {
      edScore = 30;
      reasons.push('Emergency Department is fully open and receiving acute cases.');
    } else if (res.emergencyDepartmentStatus === 'LIMITED') {
      edScore = 15;
      reasons.push('Emergency Department operating under limited capacity.');
    } else if (res.emergencyDepartmentStatus === 'DIVERSION') {
      edScore = -25;
      reasons.push('Hospital is currently on DIVERSION (diverting non-critical transfers).');
    } else {
      edScore = -50;
      reasons.push('Emergency Department is closed.');
    }

    // 2. Required Resources Match (45 pts max)
    let resourcesScore = 0;
    const requested = criteria.requiredResources.map((r) => r.toUpperCase());

    // Check ICU
    if (requested.includes('ICU')) {
      if (res.icuBedsAvailable >= 3) {
        resourcesScore += 18;
        criticalResourcesMatched.push(`ICU Available (${res.icuBedsAvailable} beds open)`);
      } else if (res.icuBedsAvailable > 0) {
        resourcesScore += 10;
        criticalResourcesMatched.push(`ICU Limited (${res.icuBedsAvailable} beds open)`);
        reasons.push(`ICU availability is low (${res.icuBedsAvailable} beds remaining).`);
      } else {
        resourcesScore -= 20;
        missingResources.push('ICU Beds Full (0 available)');
        reasons.push('No ICU beds currently available.');
      }
    }

    // Check Ventilator
    if (requested.includes('VENTILATOR')) {
      if (res.ventilatorsAvailable >= 3) {
        resourcesScore += 12;
        criticalResourcesMatched.push(`Ventilators Available (${res.ventilatorsAvailable} units)`);
      } else if (res.ventilatorsAvailable > 0) {
        resourcesScore += 6;
        criticalResourcesMatched.push(`Ventilators Limited (${res.ventilatorsAvailable} units)`);
      } else {
        resourcesScore -= 15;
        missingResources.push('Ventilators Full (0 available)');
        reasons.push('No ventilators currently unassigned.');
      }
    }

    // Check Blood
    if (requested.includes('BLOOD')) {
      if (res.bloodBank.isAvailable) {
        resourcesScore += 10;
        criticalResourcesMatched.push('Blood Bank operational with matched reserves');
      } else {
        resourcesScore -= 10;
        missingResources.push('Blood Bank reserves low/unavailable');
        reasons.push('Blood bank has depleted key reserve groups.');
      }
    }

    // Check Ambulance
    if (requested.includes('AMBULANCE')) {
      if (res.ambulancesAvailable > 0) {
        resourcesScore += 10;
        criticalResourcesMatched.push(`Ambulance fleet active (${res.ambulancesAvailable} units in bay)`);
      } else {
        resourcesScore -= 5;
        missingResources.push('Hospital ambulance fleet currently deployed');
      }
    }

    // Baseline bonus if hospital has abundant general bed capacity
    if (res.generalBedsAvailable > 15) {
      resourcesScore += 5;
    }

    // 3. Distance Penalty / Scoring (25 pts max)
    // Closer distance scores higher: 25 - (dist * 1.5)
    let distanceScore = Math.max(0, 25 - dist * 1.8);
    reasons.push(`Estimated transit distance: ${dist} km (~${etaMinutes} mins)`);

    // Overall Score
    let totalScore = Math.round(edScore + resourcesScore + distanceScore);
    totalScore = Math.max(0, Math.min(100, totalScore));

    // Determine Status Badge
    let statusBadge: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNAVAILABLE' = 'AVAILABLE';
    if (res.emergencyDepartmentStatus === 'CLOSED' || res.emergencyDepartmentStatus === 'DIVERSION') {
      statusBadge = 'UNAVAILABLE';
    } else if (res.icuBedsAvailable === 0 && requested.includes('ICU')) {
      statusBadge = 'FULL';
    } else if (res.icuBedsAvailable <= 2 || res.ambulancesAvailable === 0) {
      statusBadge = 'LIMITED';
    } else {
      statusBadge = 'AVAILABLE';
    }

    results.push({
      hospital,
      distanceKm: dist,
      estimatedTravelMinutes: etaMinutes,
      score: totalScore,
      matchingDetails: {
        distanceScore: Math.round(distanceScore),
        edStatusScore: edScore,
        resourcesScore,
        criticalResourcesMatched,
        missingResources,
        statusBadge,
        reasons,
      },
    });
  }

  // Sort descending by score, then ascending by distance
  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.distanceKm - b.distanceKm;
  });

  return results;
}
