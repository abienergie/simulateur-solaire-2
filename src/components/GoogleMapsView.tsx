import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Maximize, Minimize, RotateCw, Camera } from 'lucide-react';

interface GoogleMapsViewProps {
  coordinates: { lat: number; lon: number } | undefined;
  onCoordinatesChange?: (coordinates: { lat: number; lon: number }) => void;
}

// Keep track of the script loading state globally
let isScriptLoading = false;
let scriptLoadPromise: Promise<void> | null = null;

const loadGoogleMapsScript = (): Promise<void> => {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) {
    return scriptLoadPromise;
  }

  scriptLoadPromise = new Promise((resolve, reject) => {
    if (isScriptLoading) return;
    
    isScriptLoading = true;
    
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key is missing - using fallback map');
      resolve(); // Don't reject, just resolve to continue without maps
      isScriptLoading = false;
      scriptLoadPromise = null;
      return;
    }
    
    console.log('Loading Google Maps with API key:', apiKey ? `${apiKey.substring(0, 5)}...` : 'undefined');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('Google Maps script loaded successfully');
      isScriptLoading = false;
      scriptLoadPromise = null;
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error);
      isScriptLoading = false;
      scriptLoadPromise = null;
      reject(new Error("Failed to load Google Maps API"));
    };
    
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
};

export default function GoogleMapsView({ coordinates, onCoordinatesChange }: GoogleMapsViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCaptureInProgress, setIsCaptureInProgress] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [staticMapError, setStaticMapError] = useState<string | null>(null);

  // Initialize map when component mounts
  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        await loadGoogleMapsScript();

        if (!isMounted) return;

        // Create map instance if it doesn't exist
        if (!map) {
          const initialCenter = coordinates 
            ? { lat: coordinates.lat, lng: coordinates.lon }
            : { lat: 48.8566, lng: 2.3522 }; // Default to Paris if no coordinates
          
          const newMap = new google.maps.Map(mapRef.current, {
            center: initialCenter,
            zoom: 18,
            mapTypeId: 'satellite',
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_RIGHT,
              mapTypeIds: ['roadmap', 'satellite']
            },
            fullscreenControl: false,
            streetViewControl: true,
            zoomControl: true,
            tilt: 0 // Force a top-down view (0 degrees tilt)
          });
          
          setMap(newMap);
          
          // Only create marker if coordinates exist
          if (coordinates) {
            const newMarker = new google.maps.Marker({
              position: { lat: coordinates.lat, lng: coordinates.lon },
              map: newMap,
              draggable: true,
              animation: google.maps.Animation.DROP,
              title: 'Votre installation'
            });
            
            setMarker(newMarker);
            
            newMarker.addListener('dragend', () => {
              const position = newMarker.getPosition();
              if (position && onCoordinatesChange) {
                onCoordinatesChange({
                  lat: position.lat(),
                  lon: position.lng()
                });
                
                // Generate and save static map image when marker is moved
                generateStaticMapImage(position.lat(), position.lng());
              }
            });
            
            newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
              if (e.latLng && newMarker) {
                newMarker.setPosition(e.latLng);
                if (onCoordinatesChange) {
                  onCoordinatesChange({
                    lat: e.latLng.lat(),
                    lon: e.latLng.lng()
                  });
                  
                  // Generate and save static map image when map is clicked
                  generateStaticMapImage(e.latLng.lat(), e.latLng.lng());
                }
              }
            });
            
            // Generate initial static map image
            generateStaticMapImage(coordinates.lat, coordinates.lon);
          }
        }

        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing map:', err);
        if (isMounted) {
          setError('Error initializing map. Please check your Google Maps API key configuration.');
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (marker) {
        marker.setMap(null);
      }
      if (map) {
        google.maps.event.clearInstanceListeners(map);
      }
    };
  }, []);

  // Separate effect to update map and marker when coordinates change
  useEffect(() => {
    if (map && coordinates) {
      map.setCenter({ lat: coordinates.lat, lng: coordinates.lon });
      if (marker) {
        marker.setPosition({ lat: coordinates.lat, lng: coordinates.lon });
      } else {
        const newMarker = new google.maps.Marker({
          position: { lat: coordinates.lat, lng: coordinates.lon },
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
          title: 'Votre installation'
        });
        
        setMarker(newMarker);
        
        newMarker.addListener('dragend', () => {
          const position = newMarker.getPosition();
          if (position && onCoordinatesChange) {
            onCoordinatesChange({
              lat: position.lat(),
              lon: position.lng()
            });
            
            generateStaticMapImage(position.lat(), position.lng());
          }
        });
      }
      
      generateStaticMapImage(coordinates.lat, coordinates.lon);
    }
  }, [coordinates, map, onCoordinatesChange]);

  useEffect(() => {
    if (map) {
      const handleResize = () => {
        google.maps.event.trigger(map, 'resize');
        if (coordinates) {
          map.setCenter({ lat: coordinates.lat, lng: coordinates.lon });
        }
      };
      
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [map, coordinates]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    setTimeout(() => {
      if (map) {
        google.maps.event.trigger(map, 'resize');
        if (coordinates) {
          map.setCenter({ lat: coordinates.lat, lng: coordinates.lon });
        }
      }
    }, 300);
  };

  const resetMap = () => {
    if (map && coordinates) {
      map.setCenter({ lat: coordinates.lat, lng: coordinates.lon });
      map.setZoom(18);
      if (marker) {
        marker.setPosition({ lat: coordinates.lat, lng: coordinates.lon });
        if (onCoordinatesChange) {
          onCoordinatesChange(coordinates);
        }
        
        generateStaticMapImage(coordinates.lat, coordinates.lon);
      }
    }
  };
  
  const generateStaticMapImage = (lat: number, lng: number) => {
    try {
      // Get API key from environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Google Maps API key is missing');
      }
      
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=20&size=600x400&maptype=satellite&markers=color:red%7C${lat},${lng}&key=${apiKey}`;
      
      setStaticMapError(null);
      
      const img = new Image();
      
      img.onload = () => {
        setMapImageUrl(staticMapUrl);
        localStorage.setItem('satellite_image_url', staticMapUrl);
        setStaticMapError(null);
      };
      
      img.onerror = () => {
        setStaticMapError('Failed to load satellite image. Please verify your Google Maps API key configuration.');
        localStorage.removeItem('satellite_image_url');
        setMapImageUrl(null);
      };
      
      img.crossOrigin = 'anonymous';
      img.src = staticMapUrl;
      
    } catch (error) {
      console.error('Error generating static map image:', error);
      setStaticMapError('Error generating satellite image');
      localStorage.removeItem('satellite_image_url');
      setMapImageUrl(null);
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
      
      const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coordinates.lat},${coordinates.lon}&zoom=20&size=600x400&maptype=satellite&markers=color:red%7C${coordinates.lat},${coordinates.lon}&key=${apiKey}`;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      img.src = staticMapUrl;
      
      await loadPromise;
      
      localStorage.setItem('satellite_image_url', staticMapUrl);
      setMapImageUrl(staticMapUrl);
      setStaticMapError(null);
      setIsCaptureInProgress(false);
      setCaptureSuccess(true);
      setTimeout(() => setCaptureSuccess(false), 3000);
      
    } catch (err) {
      console.error('Error capturing map:', err);
      setIsCaptureInProgress(false);
      setStaticMapError("Failed to capture satellite image. Please verify your Google Maps API key configuration.");
      localStorage.removeItem('satellite_image_url');
      setMapImageUrl(null);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
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
      
      <div className={`relative ${isExpanded ? 'h-[calc(100%-60px)]' : 'h-[300px]'}`}>
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
              <p className="text-sm text-gray-600 mt-2">
                Please verify that your Google Maps API key is correctly configured and the necessary APIs are enabled.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef} 
          className="w-full h-full"
        />
        
        {!isLoading && !error && (
          <div className="absolute top-4 left-4 bg-white bg-opacity-90 px-3 py-2 rounded-lg shadow-md z-10">
            <p className="text-sm text-gray-700 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-blue-500" />
              Click to position your house
            </p>
          </div>
        )}
        
        {staticMapError && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md z-[1000] flex items-center gap-2">
            <span>{staticMapError}</span>
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