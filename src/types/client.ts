export interface ClientInfo {
  civilite: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse?: string;
  codePostal?: string;
  ville?: string;
}

export interface Address {
  rue: string;
  codePostal: string;
  ville: string;
  pays: string;
  region?: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
}

export interface ClientState {
  clientInfo: ClientInfo;
  address: Address;
}