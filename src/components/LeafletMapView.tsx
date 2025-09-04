import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Camera, Maximize, Minimize, RotateCw } from 'lucide-react';

interface LeafletMapViewProps {
  coordinates: { lat: number; lon: number } | undefined;
  onCoordinatesChange?: (coordinates: { lat: number; lon: number }) => void;
}

export default function LeafletMapView({ coordinates, onCoordinatesChange }: LeafletMapViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCaptureInProgress, setIsCaptureInProgress] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const getMapUrl = () => {
    if (!coordinates) return '';
    
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      setError('Google Maps API key is missing');
      return '';
    }
    
    console.log('Using API key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'undefined');
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lon}&zoom=18&size=${isExpanded ? '1200x800' : '600x400'}&maptype=satellite&markers=color:red%7C${coordinates.lat},${coordinates.lon}&key=${apiKey}`;
  };

  useEffect(() => {
    if (coordinates) {
      setIsLoading(false);
    }
  }, [coordinates]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const resetMap = () => {
    if (coordinates && onCoordinatesChange) {
      onCoordinatesChange(coordinates);
    }
  };

  const captureMap = async () => {
    if (!coordinates) {
      setError("Cannot capture map. Coordinates not available.");
      return;
    }

    try {
      setIsCaptureInProgress(true);
      setCaptureSuccess(false);
      
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Maps API key is missing');
      }
      
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lon}&zoom=18&size=600x400&maptype=satellite&markers=color:red%7C${coordinates.lat},${coordinates.lon}&key=${apiKey}`;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      img.src = staticMapUrl;
      
      await loadPromise;
      
      localStorage.setItem('satellite_image_url', staticMapUrl);
      setIsCaptureInProgress(false);
      setCaptureSuccess(true);
      setTimeout(() => setCaptureSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error capturing map:', err);
      setIsCaptureInProgress(false);
      setError("Failed to capture satellite image. Please verify your Google Maps API key configuration.");
      localStorage.removeItem('satellite_image_url');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow my-6">
      <div className="p-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Vue satellite</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={captureMap}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Capturer pour le rapport PDF"
            disabled={isCaptureInProgress || !coordinates}
          >
            {isCaptureInProgress ? (
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={resetMap}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Réinitialiser la vue"
            disabled={!coordinates}
          >
            <RotateCw className="h-5 w-5" />
          </button>
          <button
            onClick={toggleExpand}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title={isExpanded ? "Réduire" : "Agrandir"}
          >
            {isExpanded ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
      
      <div 
        ref={mapContainerRef}
        className={`relative ${isExpanded ? 'h-[calc(100vh-200px)]' : 'h-[300px]'}`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center p-4">
              <div className="bg-red-100 p-2 rounded-full inline-flex items-center justify-center mb-2">
                <MapPin className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                  setTimeout(() => {
                    setIsLoading(false);
                  }, 1000);
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {coordinates && !isLoading && !error && (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={getMapUrl()}
              alt="Vue satellite"
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                console.error('Error loading map image');
                setError("Failed to load satellite image. Please verify your Google Maps API key configuration.");
                setIsLoading(false);
                localStorage.removeItem('satellite_image_url');
              }}
              referrerPolicy="no-referrer-when-downgrade"
              crossOrigin="anonymous"
            />
          </div>
        )}
        
        {captureSuccess && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md z-[1000] flex items-center gap-2">
            <Camera className="h-4 w-4" />
            <span>Image captured successfully for PDF report</span>
          </div>
        )}
        
        {coordinates && !error && (
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md z-10">
            <p className="text-xs text-gray-700">
              Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}