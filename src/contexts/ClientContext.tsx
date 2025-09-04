import React, { createContext, useContext, useState } from 'react';

interface ClientInfo {
  civilite: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
}

interface Address {
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
  region?: string;
}

interface ClientContextType {
  clientInfo: ClientInfo;
  address: Address;
  updateClientInfo: (info: Partial<ClientInfo>) => void;
  updateAddress: (address: Partial<Address>) => void;
  resetClientInfo: () => void;
}

const defaultClientInfo: ClientInfo = {
  civilite: '',
  nom: '',
  prenom: '',
  telephone: '',
  email: ''
};

const defaultAddress: Address = {
  rue: '',
  codePostal: '',
  ville: '',
  pays: 'France'
};

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [clientInfo, setClientInfo] = useState<ClientInfo>(defaultClientInfo);
  const [address, setAddress] = useState<Address>(defaultAddress);

  const updateClientInfo = (info: Partial<ClientInfo>) => {
    setClientInfo(prev => ({ ...prev, ...info }));
  };

  const updateAddress = (newAddress: Partial<Address>) => {
    setAddress(prev => ({ ...prev, ...newAddress }));
  };

  const resetClientInfo = () => {
    setClientInfo(defaultClientInfo);
    setAddress(defaultAddress);
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

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}