import axios from 'axios';
import type { IcollClientData, IcollQuoteResponse, IcollQuoteResult } from '../../types/icoll';
import { convertToIcollFormat } from '../mappings/icollMappings';

class IcollAPI {
  private static instance: IcollAPI;
  private baseUrl = import.meta.env.DEV 
    ? 'http://localhost:3001/api'
    : 'https://abienergie.icoll.fr/api-v2';
  
  private constructor() {
    axios.defaults.timeout = 30000; // 30 second timeout
  }

  public static getInstance(): IcollAPI {
    if (!IcollAPI.instance) {
      IcollAPI.instance = new IcollAPI();
    }
    return IcollAPI.instance;
  }

  public async registerClientAndCreateQuote(clientData: IcollClientData): Promise<IcollQuoteResult> {
    try {
      // Use a placeholder token or implement a different authentication method
      const token = "placeholder_token";
      
      // Convert solar parameters to iColl format
      const icollParams = clientData.orientation !== undefined && 
                         clientData.inclinaison !== undefined && 
                         clientData.masqueSolaire !== undefined
        ? convertToIcollFormat(
            clientData.orientation,
            clientData.inclinaison,
            clientData.masqueSolaire
          )
        : undefined;

      // Create client
      const clientResponse = await axios.post(
        `${this.baseUrl}/clients`,
        {
          clients: [{
            id_type_client: "PARTICULIER",
            sexe: clientData.civilite === 'M' ? 'M' : 'F',
            nom: clientData.nom,
            prenom: clientData.prenom,
            adresse: clientData.adresse,
            cp: clientData.codePostal,
            ville: clientData.ville,
            tel_1: clientData.telephone,
            email: clientData.email,
            origine_client: "Simulateur",
            package: clientData.package,
            id_commercial: clientData.commercialId,
            ...icollParams
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (!clientResponse.data?.response?.data?.[0]?.id) {
        throw new Error('ID client non reçu');
      }

      const clientId = clientResponse.data.response.data[0].id;

      // Create quote
      const quoteResponse = await axios.post<IcollQuoteResponse>(
        `${this.baseUrl}/devis`,
        {
          devis: [{
            id_client: clientId,
            id_commercial: clientData.commercialId,
            id_package: clientData.package,
            revenu_fiscal: clientData.revenuFiscal
          }]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      if (!quoteResponse.data?.response?.data?.devisId) {
        throw new Error('ID devis non reçu');
      }

      return {
        clientId,
        quoteId: quoteResponse.data.response.data.devisId,
        pdfUrl: quoteResponse.data.response.data.filePath,
        quoteUrl: `https://abienergie.icoll.fr/devis/${quoteResponse.data.response.data.devisId}`
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Délai d\'attente dépassé');
        }
        if (error.response) {
          const message = error.response.data?.response?.message || error.response.data?.message;
          throw new Error(`Erreur ${error.response.status}: ${message || 'Erreur serveur'}`);
        }
        if (error.request) {
          throw new Error('Impossible de contacter le serveur');
        }
      }
      
      throw new Error('Erreur lors de la création du client');
    }
  }

  public getIcollLoginUrl(clientId: number, commercialId: string, quoteId?: number): string {
    const params = new URLSearchParams({
      redirect: quoteId ? 'devis' : 'import',
      clientId: clientId.toString(),
      commercialId
    });

    if (quoteId) {
      params.append('devisId', quoteId.toString());
    }

    return `https://abienergie.icoll.fr/login?${params.toString()}`;
  }
}

export const icollApi = IcollAPI.getInstance();