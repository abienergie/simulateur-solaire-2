import React, { useState, useEffect } from 'react';
import { ClientContext } from './ClientContext';
import { ClientInfo, Address } from '../../types/client';
import { saveClientData, loadClientData, clearClientData } from '../../utils/storage/clientStorage';

const defaultClientInfo: ClientInfo = {
  civilite: '',
  nom: '',
  prenom: '',
  telephone: '',
  email: '',
  adresse: '',
  codePostal: '',
  ville: ''
};

const defaultAddress: Address = {
  rue: '',
  codePostal: '',
  ville: '',
  pays: 'France',
  region: '',
  coordinates: undefined
};

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clientInfo, setClientInfo] = useState<ClientInfo>(defaultClientInfo);
  const [address, setAddress] = useState<Address>(defaultAddress);

  // Load saved data on mount
  useEffect(() => {
    const savedData = loadClientData();
    if (savedData) {
      console.log('Chargement des données client depuis le stockage:', savedData);
      setClientInfo(prev => ({
        ...defaultClientInfo,
        ...savedData.clientInfo
      }));
      setAddress(prev => ({
        ...defaultAddress,
        ...savedData.address
      }));
    }
  }, []);

  // Save data on changes
  useEffect(() => {
    console.log('Sauvegarde des données client:', { clientInfo, address });
    saveClientData({ clientInfo, address });
  }, [clientInfo, address]);

  const updateClientInfo = (info: Partial<ClientInfo>) => {
    console.log('Mise à jour des informations client:', info);
    setClientInfo(prev => ({ ...prev, ...info }));
    
    // Synchroniser les champs d'adresse avec l'objet address
    if (info.adresse !== undefined || info.codePostal !== undefined || info.ville !== undefined) {
      setAddress(prev => ({
        ...prev,
        rue: info.adresse !== undefined ? info.adresse : prev.rue,
        codePostal: info.codePostal !== undefined ? info.codePostal : prev.codePostal,
        ville: info.ville !== undefined ? info.ville : prev.ville
      }));
      
      console.log('Synchronisation des champs d\'adresse de clientInfo vers address:', {
        rue: info.adresse,
        codePostal: info.codePostal,
        ville: info.ville
      });
    }
  };

  const updateAddress = (newAddress: Partial<Address>) => {
    console.log('Mise à jour de l\'adresse:', newAddress);
    setAddress(prev => ({ ...prev, ...newAddress }));
    
    // Synchroniser automatiquement les champs d'adresse avec clientInfo
    if (newAddress.rue !== undefined || newAddress.codePostal !== undefined || newAddress.ville !== undefined) {
      setClientInfo(prev => ({
        ...prev,
        adresse: newAddress.rue !== undefined ? newAddress.rue : prev.adresse,
        codePostal: newAddress.codePostal !== undefined ? newAddress.codePostal : prev.codePostal,
        ville: newAddress.ville !== undefined ? newAddress.ville : prev.ville
      }));
      
      console.log('Synchronisation des champs d\'adresse de address vers clientInfo:', {
        adresse: newAddress.rue,
        codePostal: newAddress.codePostal,
        ville: newAddress.ville
      });
    }
  };

  const resetClientInfo = () => {
    // Reset states to default values
    console.log('Réinitialisation des données client');
    setClientInfo({ ...defaultClientInfo });
    setAddress({ ...defaultAddress });
    
    // Clear all storage data
    clearClientData();
  };

  return (
    <ClientContext.Provider value={{
      clientInfo,
      address,
      updateClientInfo,
      updateAddress,
      resetClientInfo
    }}>
      {children}
    </ClientContext.Provider>
  );
}