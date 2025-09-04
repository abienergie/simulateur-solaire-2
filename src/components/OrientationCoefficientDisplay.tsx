import React from 'react';
import { getOrientationCoefficient } from '../utils/orientationCoefficients';

interface OrientationCoefficientDisplayProps {
  orientation: number;
  inclinaison: number;
}

export default function OrientationCoefficientDisplay({
  orientation,
  inclinaison
}: OrientationCoefficientDisplayProps) {
  const coefficient = getOrientationCoefficient(orientation, inclinaison);

  return (
    <div className="bg-gray-50 p-4 rounded-md">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Coefficient inclinaison/orientation
      </label>
      <div className="text-2xl font-bold text-blue-600">
        {coefficient.toFixed(2)}
      </div>
      <p className="text-sm text-gray-500 mt-1">
        {coefficient >= 1.1 ? 'Excellent' : 
         coefficient >= 1.0 ? 'Très bon' :
         coefficient >= 0.9 ? 'Bon' :
         coefficient >= 0.8 ? 'Acceptable' : 'Sous-optimal'}
      </p>
    </div>
  );
}