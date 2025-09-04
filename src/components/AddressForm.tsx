import React, { useEffect } from 'react';
import { Address } from '../types';
import TextFormField from './TextFormField';
import AddressAutocomplete from './AddressAutocomplete';
import { getRegionFromPostalCode } from '../utils/regionMapping';
import { useClient } from '../contexts/client';

interface AddressFormProps {
  address: Address;
  onChange: (field: keyof Address, value: string | { lat: number; lon: number }) => void;
}

export default function AddressForm({ address, onChange }: AddressFormProps) {
  const { updateClientInfo } = useClient();

  useEffect(() => {
    if (address.codePostal && !address.region) {
      const region = getRegionFromPostalCode(address.codePostal);
      if (region) {
        onChange('region', region);
      }
    }
  }, [address.codePostal, address.region, onChange]);

  const handleAddressSelect = (
    fullAddress: string, 
    postcode: string, 
    city: string, 
    coordinates: { lat: number; lon: number }
  ) => {
    // Reset all fields first to avoid stale data
    onChange('rue', '');
    onChange('codePostal', '');
    onChange('ville', '');
    onChange('region', '');
    onChange('coordinates', { lat: 0, lon: 0 });
    
    // Then set new values with a small delay to ensure the reset is processed
    setTimeout(() => {
      // Set new values
      onChange('rue', fullAddress || '');
      onChange('codePostal', postcode || '');
      onChange('ville', city || '');
      onChange('coordinates', coordinates);
      
      // Set region based on postal code
      const region = getRegionFromPostalCode(postcode);
      if (region) {
        onChange('region', region);
      }
      
      // Synchroniser avec clientInfo
      updateClientInfo({
        adresse: fullAddress || '',
        codePostal: postcode || '',
        ville: city || ''
      });
      
      // Log the address data for debugging
      console.log('Adresse sélectionnée et enregistrée:', {
        rue: fullAddress,
        codePostal: postcode,
        ville: city,
        coordinates,
        region: region || ''
      });
      
      // Log pour vérifier si l'adresse est bien mise à jour
      console.log("🚀 Adresse mise à jour via autocomplétion :", {
        rue: fullAddress,
        codePostal: postcode,
        ville: city
      });
    }, 10);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Rechercher votre adresse
        </label>
        <AddressAutocomplete
          value={address.rue || ''}
          onChange={(value) => onChange('rue', value)}
          onSelect={handleAddressSelect}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <TextFormField
          label="Code postal"
          name="codePostal"
          value={address.codePostal || ''}
          onChange={(e) => {
            onChange('codePostal', e.target.value);
            updateClientInfo({ codePostal: e.target.value });
          }}
          placeholder="75001"
          disabled={!!address.codePostal}
        />
        
        <TextFormField
          label="Ville"
          name="ville"
          value={address.ville || ''}
          onChange={(e) => {
            onChange('ville', e.target.value);
            updateClientInfo({ ville: e.target.value });
          }}
          placeholder="Paris"
          disabled={!!address.ville}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <TextFormField
          label="Région"
          name="region"
          value={address.region || ''}
          onChange={(e) => onChange('region', e.target.value)}
          disabled
        />

        <TextFormField
          label="Pays"
          name="pays"
          value={address.pays || 'France'}
          onChange={(e) => onChange('pays', e.target.value)}
          disabled
        />
      </div>
      
      {/* Afficher les coordonnées pour le débogage en mode développement */}
      {address.coordinates && (
        <div className="text-xs text-gray-500 mt-1">
          Coordonnées: {address.coordinates.lat.toFixed(6)}, {address.coordinates.lon.toFixed(6)}
        </div>
      )}
    </div>
  );
}