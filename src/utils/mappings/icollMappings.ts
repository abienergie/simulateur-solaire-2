// Mapping des orientations vers les IDs iColl
const ORIENTATION_TO_ICOLL_ID = {
  0: 1,    // SUD
  45: 5,   // SUD-OUEST
  90: 4,   // OUEST
  "-45": 2,  // SUD-EST
  "-90": 3   // EST
} as const;

// Mapping des inclinaisons vers les IDs iColl
const TILT_TO_ICOLL_ID = {
  0: 1,    // 0°
  10: 2,   // 10°
  15: 22,  // 15°
  20: 11,  // 20°
  25: 12,  // 25°
  30: 3,   // 30°
  35: 13,  // 35°
  40: 4,   // 40°
  45: 14,  // 45°
  50: 6,   // 50°
  60: 5,   // 60°
  90: 7    // 90°
} as const;

// Mapping des masques solaires vers les IDs iColl
export const SHADING_TO_ICOLL_ID = (shadingPercentage: number): number => {
  return shadingPercentage > 0 ? 1 : 2; // 1 = OUI, 2 = NON
};

// Fonction pour trouver l'ID d'orientation iColl le plus proche
export function getNearestOrientationId(orientation: number): number {
  const orientations = Object.entries(ORIENTATION_TO_ICOLL_ID)
    .map(([key, value]) => ({ key: Number(key), value }));
  
  const nearest = orientations.reduce((prev, curr) => 
    Math.abs(curr.key - orientation) < Math.abs(prev.key - orientation) ? curr : prev
  );
  
  return nearest.value;
}

// Fonction pour trouver l'ID d'inclinaison iColl le plus proche
export function getNearestTiltId(tiltDegrees: number): number {
  const tilts = Object.entries(TILT_TO_ICOLL_ID)
    .map(([key, value]) => ({ key: Number(key), value }));
  
  const nearest = tilts.reduce((prev, curr) =>
    Math.abs(curr.key - tiltDegrees) < Math.abs(prev.key - tiltDegrees) ? curr : prev
  );
  
  return nearest.value;
}

// Validation du numéro PDL
export function validatePDL(pdl: string): boolean {
  const trimmedPdl = pdl.trim();
  return /^\d{14}$/.test(trimmedPdl);
}

// Validation du revenu fiscal
export function validateRevenuFiscal(revenu: string): boolean {
  const trimmedRevenu = revenu.trim();
  const revenuNumber = parseInt(trimmedRevenu, 10);
  return !isNaN(revenuNumber) && revenuNumber > 0;
}

export interface IcollMappedData {
  id_orientation_toit: string;
  id_inclinaison: string;
  masque_solaire: string;
}

// Fonction pour convertir les paramètres solaires en format iColl
export function convertToIcollFormat(orientation: number, inclinaison: number, masqueSolaire: number): IcollMappedData {
  const orientationId = getNearestOrientationId(orientation);
  const inclinaisonId = getNearestTiltId(inclinaison);
  const masqueId = SHADING_TO_ICOLL_ID(masqueSolaire);

  return {
    id_orientation_toit: String(orientationId),
    id_inclinaison: String(inclinaisonId),
    masque_solaire: String(masqueId)
  };
}