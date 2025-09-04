// Coefficients de production selon l'orientation et l'inclinaison
export const ORIENTATION_COEFFICIENTS: { [key: number]: { [key: number]: number } } = {
  // Est (-90°)
  [-90]: {
    0: 1,
    10: 0.99,
    15: 0.99,
    20: 0.97,
    25: 0.97,
    30: 0.94,
    35: 0.94,
    40: 0.90,
    45: 0.90,
    50: 0.84,
    55: 0.84,
    60: 0.81,
    90: 0.58
  },
  // Ouest (90°)
  [90]: {
    0: 1,
    10: 0.99,
    15: 0.99,
    20: 0.97,
    25: 0.97,
    30: 0.94,
    35: 0.94,
    40: 0.90,
    45: 0.90,
    50: 0.84,
    55: 0.84,
    60: 0.81,
    90: 0.58
  },
  // Sud (0°)
  [0]: {
    0: 1,
    10: 1.1,
    15: 1.1,
    20: 1.14,
    25: 1.14,
    30: 1.15,
    35: 1.15,
    40: 1.14,
    45: 1.14,
    50: 1.1,
    55: 1.1,
    60: 1.08,
    90: 0.79
  },
  // Sud-Est (-45°)
  [-45]: {
    0: 1,
    10: 1.07,
    15: 1.07,
    20: 1.09,
    25: 1.09,
    30: 1.09,
    35: 1.09,
    40: 1.07,
    45: 1.07,
    50: 1.03,
    55: 1.03,
    60: 1,
    90: 0.74
  },
  // Sud-Ouest (45°)
  [45]: {
    0: 1,
    10: 1.07,
    15: 1.07,
    20: 1.09,
    25: 1.09,
    30: 1.09,
    35: 1.09,
    40: 1.07,
    45: 1.07,
    50: 1.03,
    55: 1.03,
    60: 1,
    90: 0.74
  }
};

export function getOrientationCoefficient(orientation: number, tilt: number): number {
  const normalizedOrientation = Math.max(-90, Math.min(90, orientation));
  
  const orientations = Object.keys(ORIENTATION_COEFFICIENTS).map(Number);
  const closestOrientation = orientations.reduce((prev, curr) => {
    return Math.abs(curr - normalizedOrientation) < Math.abs(prev - normalizedOrientation) ? curr : prev;
  });

  const normalizedTilt = Math.max(0, Math.min(90, tilt));
  
  const tilts = Object.keys(ORIENTATION_COEFFICIENTS[closestOrientation]).map(Number);
  const closestTilt = tilts.reduce((prev, curr) => {
    return Math.abs(curr - normalizedTilt) < Math.abs(prev - normalizedTilt) ? curr : prev;
  });

  return ORIENTATION_COEFFICIENTS[closestOrientation][closestTilt];
}