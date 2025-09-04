import React, { createContext } from 'react';
import { ClientInfo, Address } from '../../types/client';

export interface ClientContextType {
  clientInfo: ClientInfo;
  address: Address;
  updateClientInfo: (info: Partial<ClientInfo>) => void;
  updateAddress: (address: Partial<Address>) => void;
  resetClientInfo: () => void;
}

export const ClientContext = createContext<ClientContextType | undefined>(undefined);