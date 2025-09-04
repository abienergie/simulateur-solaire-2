import React, { useState, useEffect, useRef } from 'react';
import { getSuggestions } from '../utils/addressSuggestions';
import type { AddressFeature } from '../types/address';
import { Search, AlertCircle, MapPin } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (
    address: string, 
    postcode: string, 
    city: string, 
    coordinates: { lat: number; lon: number }
  ) => void;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSelected, setHasSelected] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualPostcode, setManualPostcode] = useState('');
  const [manualCity, setManualCity] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!value || value.length < 3 || hasSelected || manualMode) {
        setSuggestions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const results = await getSuggestions(value);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        
        if (results.length === 0 && value.length > 5) {
          setError('Aucune adresse trouvée. Essayez la saisie manuelle.');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des suggestions:', error);
        setError('Impossible de récupérer les suggestions. Veuillez réessayer.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(fetchSuggestions, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [value, hasSelected, manualMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasSelected(false);
    setError(null);
    const newValue = e.target.value || '';
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: AddressFeature) => {
    const { properties, geometry } = suggestion;
    const coordinates = {
      lat: geometry.coordinates[1],
      lon: geometry.coordinates[0]
    };
    
    // Extraire correctement l'adresse pour iColl
    const streetAddress = properties.housenumber 
      ? `${properties.housenumber} ${properties.street}`
      : properties.street;
    
    console.log('Suggestion sélectionnée:', {
      streetAddress,
      postcode: properties.postcode,
      city: properties.city,
      coordinates
    });
    
    setHasSelected(true);
    onChange(streetAddress);
    onSelect(
      streetAddress,
      properties.postcode,
      properties.city,
      coordinates
    );
    setIsOpen(false);
    setSuggestions([]);
  };

  const enableManualMode = () => {
    setManualMode(true);
    setIsOpen(false);
    setSuggestions([]);
    setError(null);
  };

  const handleManualSubmit = () => {
    if (value && manualPostcode && manualCity) {
      // Coordonnées par défaut pour la France
      const coordinates = { lat: 46.603354, lon: 1.888334 };
      
      console.log('Adresse manuelle saisie:', {
        rue: value,
        codePostal: manualPostcode,
        ville: manualCity,
        coordinates
      });
      
      setHasSelected(true);
      onSelect(value, manualPostcode, manualCity, coordinates);
      setManualMode(false);
    } else {
      setError('Veuillez remplir tous les champs d\'adresse');
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onFocus={() => !hasSelected && !manualMode && setIsOpen(true)}
          placeholder="Entrez votre adresse..."
          className={`w-full pl-10 pr-4 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-300' : 'border-gray-300'
          }`}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-1 flex items-start gap-1">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {!manualMode && !hasSelected && (
        <div className="mt-1 text-right">
          <button 
            onClick={enableManualMode}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Saisie manuelle
          </button>
        </div>
      )}

      {manualMode && (
        <div className="mt-2 space-y-3 p-3 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-sm font-medium text-gray-700">Saisie manuelle de l'adresse</p>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code postal</label>
            <input
              type="text"
              value={manualPostcode}
              onChange={(e) => setManualPostcode(e.target.value)}
              placeholder="75001"
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              maxLength={5}
            />
          </div>
          
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ville</label>
            <input
              type="text"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="Paris"
              className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleManualSubmit}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.properties.id}
              onClick={() => handleSuggestionClick(suggestion)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
            >
              <div className="flex items-center">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                <span className="font-normal block truncate">
                  {suggestion.properties.label}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}