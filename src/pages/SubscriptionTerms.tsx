import React from 'react';
import { 
  FileText, Shield, Cpu, 
  CreditCard, Leaf, HeartHandshake, CheckCircle2
} from 'lucide-react';

const advantages = [
  {
    title: "Un contrat flexible",
    icon: FileText,
    color: "blue",
    points: [
      "Résiliation possible dès la 5ème année",
      "Transfert gratuit en cas de vente",
      "Évolution possible de l'installation"
    ]
  },
  {
    title: "Service premium",
    icon: HeartHandshake,
    color: "purple",
    points: [
      "Service client basé en France",
      "Accompagnement personnalisé",
      "Suivi de production en temps réel"
    ]
  },
  {
    title: "Garanties complètes",
    icon: Shield,
    color: "green",
    points: [
      "Maintenance gratuite jusqu'à 25 ans",
      "Matériel garanti 30 ans",
      "Assurance tous risques incluse"
    ]
  },
  {
    title: "Haute performance",
    icon: Cpu,
    color: "orange",
    points: [
      "Panneaux dernière génération",
      "Micro-onduleurs optimisés",
      "Monitoring avancé"
    ]
  },
  {
    title: "Financement simplifié",
    icon: CreditCard,
    color: "indigo",
    points: [
      "Sans apport initial",
      "Pas de crédit bancaire",
      "Réponse sous 48h"
    ]
  },
  {
    title: "Engagement durable",
    icon: Leaf,
    color: "emerald",
    points: [
      "Entreprise à mission",
      "Transition énergétique",
      "Production locale"
    ]
  }
];

export default function SubscriptionTerms() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Avantages de l'abonnement
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advantages.map((advantage) => (
          <div 
            key={advantage.title} 
            className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
          >
            <div className={`p-6 space-y-4`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${advantage.color}-50`}>
                  <advantage.icon className={`h-6 w-6 text-${advantage.color}-500`} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {advantage.title}
                </h2>
              </div>
              <ul className="space-y-3">
                {advantage.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <CheckCircle2 className={`h-5 w-5 text-${advantage.color}-500 flex-shrink-0 mt-0.5`} />
                    <span className="text-gray-600">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 p-6 rounded-xl text-center">
        <p className="text-lg font-medium text-blue-900">
          Rejoignez les 100 000 premiers foyers abonnés !
        </p>
        <p className="mt-2 text-blue-700">
          Profitez d'une installation solaire clé en main sans investissement initial
        </p>
      </div>
    </div>
  );
}