import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle, Play, ExternalLink, Move } from 'lucide-react';

interface SmartBatteryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartBatteryModal({ isOpen, onClose }: SmartBatteryModalProps) {
  const [videoError, setVideoError] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Direct Supabase URL for the GIF
  const SMART_BATTERY_GIF_URL = 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/smartbattery/MySmartBattery%20-%20French%20version.gif';
  
  // Vidéos témoins - ordre inversé
  const TESTIMONIAL_VIDEOS = [
    {
      id: 'video2',
      title: 'Retour d\'expérience - Optimisation de l\'autoconsommation',
      url: 'https://www.youtube.com/watch?v=6zgZj5Y2EWg',
      thumbnail: 'https://img.youtube.com/vi/6zgZj5Y2EWg/hqdefault.jpg'
    },
    {
      id: 'video1',
      title: 'Témoignage client - Installation solaire avec SmartBattery',
      url: 'https://www.youtube.com/watch?v=jI1E2LoY5-Q',
      thumbnail: 'https://img.youtube.com/vi/jI1E2LoY5-Q/hqdefault.jpg'
    }
  ];
  
  // Centrer la modal au départ
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      
      setPosition({
        x: (windowWidth - modalWidth) / 2,
        y: (windowHeight - modalHeight) / 2
      });
    }
  }, [isOpen]);
  
  // Gestion du drag and drop
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Ajouter/supprimer les event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  if (!isOpen) return null;

  const openVideoInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto">
      <div 
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-auto relative"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'none',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div 
          className="absolute top-0 left-0 right-0 bg-gray-100 p-2 flex items-center justify-between cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2 text-gray-700">
            <Move className="h-4 w-4" />
            <span className="text-sm font-medium">Smart Battery - Déplacer cette fenêtre</span>
          </div>
          <button
            onClick={onClose}
            className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-6 mt-10">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            {videoError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4">
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                <p className="text-gray-700 text-center">
                  La vidéo n'a pas pu être chargée. Veuillez réessayer ultérieurement.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Vous pouvez également accéder directement à la vidéo via <a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">ce lien</a>.
                </p>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img 
                  src={SMART_BATTERY_GIF_URL}
                  alt="Smart Battery Demonstration" 
                  className="max-w-full max-h-full object-contain"
                  onError={() => setVideoError(true)}
                />
              </div>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Smart Battery : l'innovation au service de votre autonomie
            </h3>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              Découvrez comment la Smart Battery optimise votre consommation d'énergie en pilotant intelligemment vos équipements pour maximiser l'autoconsommation sans batterie physique. Récupérez la nuit, en hiver, le surplus solaire stocké avec un rendement optimal : <strong>1kWh stocké = 1kWh restitué</strong>.
            </p>
          </div>
          
          <div className="mt-8">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Témoignages clients
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TESTIMONIAL_VIDEOS.map(video => (
                <div 
                  key={video.id}
                  className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openVideoInNewTab(video.url)}
                >
                  <div className="relative aspect-video">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                        <ExternalLink className="h-7 w-7 text-blue-600" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h5 className="font-medium text-gray-900">{video.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">
                      Cliquez pour regarder le témoignage (s'ouvre dans un nouvel onglet)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}