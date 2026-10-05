import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Hospital as HospitalIcon,
  Navigation,
  RefreshCw,
  AlertCircle,
  Activity,
  Ambulance as AmbulanceIcon,
  Crosshair,
  Check,
} from 'lucide-react';
import { Hospital, Ambulance } from '../types.ts';

interface InteractiveMapProps {
  hospitals: Hospital[];
  ambulances?: Ambulance[];
  patientCoords: { latitude: number; longitude: number } | null;
  onUpdatePatientCoords: (coords: { latitude: number; longitude: number; accuracy?: number }) => void;
  onSelectHospital?: (hospital: Hospital) => void;
  onViewHospital?: (hospital: Hospital) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  hospitals,
  ambulances = [],
  patientCoords,
  onUpdatePatientCoords,
  onSelectHospital,
  onViewHospital,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'success' | 'denied'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyRadius, setAccuracyRadius] = useState<number | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toISOString());

  // Default coordinate center (SF Bay Area Metropolitan Core)
  const defaultCenter: [number, number] = [37.765, -122.425];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = patientCoords ? patientCoords.latitude : defaultCenter[0];
    const initialLon = patientCoords ? patientCoords.longitude : defaultCenter[1];

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 13,
      zoomControl: true,
    });

    // Clean OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Layer group for dynamic markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Allow user to click anywhere on map to manually position emergency pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      onUpdatePatientCoords({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        accuracy: 15,
      });
      setLastUpdatedTime(new Date().toISOString());
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when data or patientCoords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Patient Marker (Custom SVG Pulse)
    if (patientCoords) {
      const patientIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5">
            <div class="absolute w-8 h-8 rounded-full bg-rose-500/40 animate-pulse-ring"></div>
            <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold text-xs">
              🚨
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const patientMarker = L.marker([patientCoords.latitude, patientCoords.longitude], {
        icon: patientIcon,
        zIndexOffset: 1000,
      }).addTo(markersGroup);

      patientMarker.bindPopup(`
        <div class="p-2 text-slate-900 font-sans">
          <strong class="text-rose-600 text-xs uppercase block">Patient Emergency GPS</strong>
          <p class="text-xs text-slate-600 mt-1">Lat: ${patientCoords.latitude.toFixed(4)}, Lon: ${patientCoords.longitude.toFixed(4)}</p>
          <span class="text-[10px] text-slate-400 block mt-1">Click anywhere on map to reposition</span>
        </div>
      `);
    }

    // 2. Hospital Markers (Custom SVG Rings according to availability)
    hospitals.forEach((hosp) => {
      const res = hosp.resources;
      let statusColor = '#16a34a'; // Green (Available)
      let statusLabel = 'AVAILABLE';

      if (res.emergencyDepartmentStatus === 'CLOSED' || res.emergencyDepartmentStatus === 'DIVERSION') {
        statusColor = '#dc2626'; // Red
        statusLabel = 'DIVERSION / FULL';
      } else if (res.icuBedsAvailable <= 2) {
        statusColor = '#d97706'; // Amber (Limited)
        statusLabel = 'LIMITED ICU';
      }

      const hospIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 -ml-5 -mt-5 cursor-pointer group">
            <div class="absolute w-8 h-8 rounded-full border-2" style="border-color: ${statusColor}; background-color: ${statusColor}22;"></div>
            <div class="w-6 h-6 rounded-lg bg-white border border-slate-300 shadow-md flex items-center justify-center text-xs font-bold" style="color: ${statusColor}">
              🏥
            </div>
            <span class="absolute -top-4 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              ${hosp.name}
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const hospMarker = L.marker([hosp.latitude, hosp.longitude], {
        icon: hospIcon,
      }).addTo(markersGroup);

      // Section 12 Popup specification
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-3 text-slate-900 font-sans min-w-[220px]';
      popupHtml.innerHTML = `
        <h3 class="font-bold text-sm text-slate-900 leading-tight">${hosp.name}</h3>
        <p class="text-[11px] text-slate-500 mt-0.5">${hosp.address}</p>
        
        <div class="mt-2 flex items-center justify-between border-y border-slate-100 py-1.5 text-xs">
          <span class="font-medium text-slate-600">ED Status:</span>
          <span class="font-bold px-2 py-0.5 rounded text-[10px]" style="background-color: ${statusColor}18; color: ${statusColor}">
            ${res.emergencyDepartmentStatus}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-1.5 mt-2 text-xs">
          <div class="bg-slate-50 p-1.5 rounded">
            <span class="text-[10px] text-slate-500 block">ICU Beds</span>
            <span class="font-bold font-mono ${res.icuBedsAvailable > 2 ? 'text-emerald-600' : 'text-amber-600'}">
              ${res.icuBedsAvailable} / ${res.icuBedsTotal}
            </span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded">
            <span class="text-[10px] text-slate-500 block">General Beds</span>
            <span class="font-bold font-mono text-slate-800">${res.generalBedsAvailable} / ${res.generalBedsTotal}</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded">
            <span class="text-[10px] text-slate-500 block">Ventilators</span>
            <span class="font-bold font-mono text-slate-800">${res.ventilatorsAvailable} / ${res.ventilatorsTotal}</span>
          </div>
          <div class="bg-slate-50 p-1.5 rounded">
            <span class="text-[10px] text-slate-500 block">Ambulances</span>
            <span class="font-bold font-mono text-slate-800">${res.ambulancesAvailable} in bay</span>
          </div>
        </div>

        <div class="mt-2 text-[10px] text-slate-500">
          Blood Bank: <strong class="${res.bloodBank.isAvailable ? 'text-emerald-600' : 'text-rose-600'}">${res.bloodBank.isAvailable ? 'STOCKED' : 'LOW'}</strong> · Doctors: <strong>${res.emergencyDoctorsOnDuty} on duty</strong>
        </div>

        <div class="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
          <button id="btn-select-${hosp.id}" class="flex-1 py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition-colors text-center shadow-xs">
            Select Hospital
          </button>
          <button id="btn-view-${hosp.id}" class="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded transition-colors">
            View
          </button>
        </div>
      `;

      // Attach event listeners to popup buttons
      hospMarker.bindPopup(popupHtml);
      hospMarker.on('popupopen', () => {
        const selectBtn = document.getElementById(`btn-select-${hosp.id}`);
        const viewBtn = document.getElementById(`btn-view-${hosp.id}`);

        if (selectBtn && onSelectHospital) {
          selectBtn.onclick = () => {
            onSelectHospital(hosp);
            hospMarker.closePopup();
          };
        }
        if (viewBtn && onViewHospital) {
          viewBtn.onclick = () => {
            onViewHospital(hosp);
            hospMarker.closePopup();
          };
        }
      });
    });

    // 3. Ambulance Markers
    ambulances.forEach((amb) => {
      if (!amb.currentLocation) return;

      const ambIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div class="relative flex items-center justify-center w-8 h-8 -ml-4 -mt-4 cursor-pointer">
            <div class="w-6 h-6 rounded-full bg-blue-600 border border-white shadow-md flex items-center justify-center text-white text-[10px] font-bold">
              🚑
            </div>
            <span class="absolute -bottom-3.5 bg-slate-900 text-white text-[8px] font-mono px-1 rounded">
              ${amb.callSign}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const ambMarker = L.marker([amb.currentLocation.latitude, amb.currentLocation.longitude], {
        icon: ambIcon,
      }).addTo(markersGroup);

      ambMarker.bindPopup(`
        <div class="p-2 text-slate-900 font-sans">
          <strong class="text-blue-600 text-xs block">Ambulance ${amb.callSign} (${amb.type})</strong>
          <p class="text-xs text-slate-600 mt-0.5">Status: <strong class="text-slate-800">${amb.status}</strong></p>
          <p class="text-[11px] text-slate-500 mt-1">${amb.currentLocation.address}</p>
          <span class="text-[10px] text-slate-400 block mt-1">Lead: ${amb.paramedicLead}</span>
        </div>
      `);
    });
  }, [hospitals, ambulances, patientCoords]);

  // HTML5 Web Geolocation API (Section 11 Requirement)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported by your browser.');
      setGeoStatus('denied');
      return;
    }

    setGeoStatus('locating');
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        onUpdatePatientCoords(coords);
        setAccuracyRadius(Math.round(pos.coords.accuracy));
        setLastUpdatedTime(new Date().toISOString());
        setGeoStatus('success');

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([coords.latitude, coords.longitude], 14, {
            animate: true,
          });
        }
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        setGeoStatus('denied');
        setGeoError(
          'Location access was denied or timed out. You can click anywhere on the map to set the emergency location pin.'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  return (
    <div className="space-y-3">
      {/* Geolocation Warning / Guidance Banner */}
      {geoStatus === 'denied' && (
        <div
          role="alert"
          className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">HTML5 Geolocation Permission Notice</p>
            <p className="mt-0.5">{geoError}</p>
          </div>
        </div>
      )}

      {/* Map Control Bar & Location Status Panel (Section 11 & 12 Requirement) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Live Telemetry Status Panel */}
        <div className="flex flex-wrap items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-rose-600" />
            <span className="font-semibold text-slate-800">Emergency GPS:</span>
            <span className="font-mono tabular-nums bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {patientCoords
                ? `${patientCoords.latitude.toFixed(4)}°, ${patientCoords.longitude.toFixed(4)}°`
                : 'Not Set (Click Map)'}
            </span>
          </div>

          {accuracyRadius && (
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-slate-400">Accuracy:</span>
              <span className="font-mono tabular-nums font-medium text-slate-700">
                ±{accuracyRadius}m
              </span>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400">
            <span>Updated:</span>
            <time className="font-mono tabular-nums text-slate-500">
              {new Date(lastUpdatedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </time>
          </div>
        </div>

        {/* Right: Map Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLocateMe}
            disabled={geoStatus === 'locating'}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Navigation className={`w-3.5 h-3.5 ${geoStatus === 'locating' ? 'animate-spin' : ''}`} />
            {geoStatus === 'locating' ? 'Locating...' : 'Locate Me'}
          </button>

          <button
            onClick={() => {
              if (patientCoords && mapInstanceRef.current) {
                mapInstanceRef.current.setView([patientCoords.latitude, patientCoords.longitude], 14);
              }
              setLastUpdatedTime(new Date().toISOString());
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recenter
          </button>
        </div>
      </div>

      {/* Leaflet HTML Container */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-md">
        <div id="map" ref={mapContainerRef} className="w-full h-full" />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-xs p-3 rounded-xl border border-slate-200 shadow-lg text-[11px] space-y-1.5">
          <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider mb-1">
            Map Legend
          </span>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-white" />
            <span className="text-slate-700 font-medium">Patient Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-emerald-600 bg-emerald-100 inline-block" />
            <span className="text-slate-700">Hospital (Available)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-amber-500 bg-amber-100 inline-block" />
            <span className="text-slate-700">Hospital (Limited ICU)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-rose-600 bg-rose-100 inline-block" />
            <span className="text-slate-700">Hospital (Full / Diversion)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white" />
            <span className="text-slate-700">Ambulance Fleet</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-500 italic text-right px-1">
        Tip: Click anywhere on the map to manually set or relocate the patient emergency coordinate pin.
      </p>
    </div>
  );
};
