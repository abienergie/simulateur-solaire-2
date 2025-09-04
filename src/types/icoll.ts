export interface IcollClientData {
  civilite: string;
  nom: string;
  prenom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string;
  email: string;
  pdl?: string;
  package?: string;
  commercialId: string;
  orientation?: number;
  inclinaison?: number;
  masqueSolaire?: number;
  revenuFiscal?: string;
}

export interface IcollQuoteResponse {
  response: {
    message: string;
    data: {
      devisId: number;
      filePath?: string;
    };
  };
  status: string | number;
}

export interface IcollQuoteResult {
  quoteId: number;
  pdfUrl?: string;
  quoteUrl?: string;
}