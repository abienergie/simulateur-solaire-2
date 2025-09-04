import { useState, useEffect } from 'react';
import { SolarParameters, ProductionResult } from '../types';
import { DEFAULT_PARAMS } from '../utils/constants';
import { getOrientationLabel } from '../utils/orientationMapping';

export function useSolarData() {
  const [params, setParams] = useState<SolarParameters>(() => {
    const saved = localStorage.getItem('solarParams');
    const selectedPower = localStorage.getItem('selectedPower');
    
    if (saved) {
      const parsedParams = JSON.parse(saved);
      // Ensure orientation is a number
      parsedParams.orientation = Number(parsedParams.orientation);
      
      // Update with selected power if available
      if (selectedPower) {
        const power = parseFloat(selectedPower);
        if (!isNaN(power)) {
          parsedParams.nombreModules = Math.ceil((power * 1000) / parsedParams.puissanceModules);
        }
      }
      
      return parsedParams;
    }
    return DEFAULT_PARAMS;
  });

  const [result, setResult] = useState<ProductionResult | null>(() => {
    const saved = localStorage.getItem('solarResult');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('solarParams', JSON.stringify(params));
    localStorage.setItem('orientation', params.orientation.toString());
    localStorage.setItem('orientationLabel', getOrientationLabel(params.orientation));
  }, [params]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('solarResult', JSON.stringify(result));
    }
  }, [result]);

  const resetData = () => {
    setParams(DEFAULT_PARAMS);
    setResult(null);
    localStorage.removeItem('solarParams');
    localStorage.removeItem('solarResult');
    localStorage.removeItem('orientation');
    localStorage.removeItem('orientationLabel');
    localStorage.removeItem('selectedPower');
  };

  return {
    params,
    setParams,
    result,
    setResult,
    resetData
  };
}