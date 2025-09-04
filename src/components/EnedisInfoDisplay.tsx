import React from 'react';
import { User, Home, FileText, Phone } from 'lucide-react';

interface EnedisInfoDisplayProps {
  data: any;
}

const EnedisInfoDisplay: React.FC<EnedisInfoDisplayProps> = ({ data }) => {
  // Extraire les données d'identité
  let identity = {};
  if (data.identity?.identity?.natural_person) {
    identity = data.identity.identity.natural_person;
  } else if (data.identity?.identity) {
    identity = data.identity.identity;
  } else if (data.identity && data.identity.natural_person) {
    identity = data.identity.natural_person;
  } else if (data.identity) {
    identity = data.identity;
  }
  
  // Extraire les données d'adresse
  const address = data.address?.address || data.address || {};
  
  // Extraire les données de contrat
  const contract = data.contract?.contract || data.contract || {};
  
  // Extraire les données de contact
  const contact = data.contact?.contact_data || data.contact || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Identité */}
      <div className="border rounded-lg p-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Identité
          </h3>
        </div>
        <div className="pt-4">
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Civilité</dt>
              <dd className="text-sm text-gray-900">{identity.title || identity.civilite || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Prénom</dt>
              <dd className="text-sm text-gray-900">{identity.firstname || identity.prenom || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nom</dt>
              <dd className="text-sm text-gray-900">{identity.lastname || identity.nom || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">ID Client</dt>
              <dd className="text-sm text-gray-900">{data.identity?.identity?.customer_id || identity.customer_id || 'Non disponible'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Adresse */}
      <div className="border rounded-lg p-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Home className="h-5 w-5 text-green-500" />
            Adresse
          </h3>
        </div>
        <div className="pt-4">
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Rue</dt>
              <dd className="text-sm text-gray-900">{address.street || address.rue || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Code postal</dt>
              <dd className="text-sm text-gray-900">{address.postal_code || address.codePostal || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ville</dt>
              <dd className="text-sm text-gray-900">{address.city || address.ville || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Pays</dt>
              <dd className="text-sm text-gray-900">{address.country || address.pays || 'France'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Contrat */}
      <div className="border rounded-lg p-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            Contrat
          </h3>
        </div>
        <div className="pt-4">
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Puissance souscrite</dt>
              <dd className="text-sm text-gray-900">{contract.subscribed_power || contract.puissanceSouscrite || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Type de compteur</dt>
              <dd className="text-sm text-gray-900">{contract.meter_type || contract.typeCompteur || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Heures creuses</dt>
              <dd className="text-sm text-gray-900">{contract.offpeak_hours || contract.heuresCreuses || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Statut du contrat</dt>
              <dd className="text-sm text-gray-900">{contract.contract_status || contract.statutContrat || 'Non disponible'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Contact */}
      <div className="border rounded-lg p-4">
        <div className="pb-2 border-b">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Phone className="h-5 w-5 text-amber-500" />
            Contact
          </h3>
        </div>
        <div className="pt-4">
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="text-sm text-gray-900">{contact.email || contact.courriel || 'Non disponible'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Téléphone</dt>
              <dd className="text-sm text-gray-900">{contact.phone || contact.telephone || 'Non disponible'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default EnedisInfoDisplay;