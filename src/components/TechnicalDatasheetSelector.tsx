import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { TechnicalDatasheet } from '../types/datasheet';

interface TechnicalDatasheetSelectorProps {
  selectedDatasheets: string[];
  onSelectedDatasheetsChange: (datasheets: string[]) => void;
}

export default function TechnicalDatasheetSelector({
  selectedDatasheets,
  onSelectedDatasheetsChange
}: TechnicalDatasheetSelectorProps) {
  const [datasheets, setDatasheets] = useState<TechnicalDatasheet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load datasheets from localStorage
  useEffect(() => {
    const loadDatasheets = () => {
      setLoading(true);
      try {
        const savedDatasheets = localStorage.getItem('technical_datasheets');
        if (savedDatasheets) {
          const parsedDatasheets = JSON.parse(savedDatasheets);
          
          // Correction: S'assurer que SOLENSO Sol est dans la catégorie 'inverter'
          const correctedDatasheets = parsedDatasheets.map((ds: TechnicalDatasheet) => {
            if (ds.id === 'solenso-h900-h1000' || ds.name.includes('SOLENSO Sol')) {
              return { ...ds, category: 'inverter' };
            }
            return ds;
          });
          
          setDatasheets(correctedDatasheets);
          
          // Mettre à jour le localStorage avec les données corrigées
          localStorage.setItem('technical_datasheets', JSON.stringify(correctedDatasheets));
        } else {
          // Initialize with default datasheets
          const defaultDatasheets: TechnicalDatasheet[] = [
            {
              id: 'duonergy-500w',
              name: 'Panneau DUONERGY 500W',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//DUONERGY_500W.pdf',
              category: 'panel',
              createdAt: new Date().toISOString()
            },
            {
              id: 'solenso-500w',
              name: 'Panneau SOLENSO 500W',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//SOLENSO_500W.pdf',
              category: 'panel',
              createdAt: new Date().toISOString()
            },
            {
              id: 'enphase-iq8p',
              name: 'Micro-onduleur ENPHASE IQ8P',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//ENPHASE_IQ8P.pdf',
              category: 'inverter',
              createdAt: new Date().toISOString()
            },
            {
              id: 'solenso-h900-h1000',
              name: 'Micro-onduleur SOLENSO Sol H900/H1000',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//Micro-onduleur%20SOLENSO_Sol_H900_H1000_FR.pdf',
              category: 'inverter',
              createdAt: new Date().toISOString()
            },
            {
              id: 'huawei-oc-sun2000',
              name: 'Onduleur HUAWEI SUN2000 2-6KW',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//HUAWEI_OC_SUN2000-2-6KW.pdf',
              category: 'inverter',
              createdAt: new Date().toISOString()
            },
            {
              id: 'enphase-iq-battery-3t',
              name: 'Batterie ENPHASE IQ 3T',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//ENPHASE_IQ_Battery_3T.pdf',
              category: 'battery',
              createdAt: new Date().toISOString()
            },
            {
              id: 'enphase-iq-battery-5p',
              name: 'Batterie ENPHASE IQ 5P',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//ENPHASE_IQ_Battery_5P.pdf',
              category: 'battery',
              createdAt: new Date().toISOString()
            },
            {
              id: 'enphase-iq-battery-10t',
              name: 'Batterie ENPHASE IQ 10T',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//ENPHASE_IQ_Battery_10T.pdf',
              category: 'battery',
              createdAt: new Date().toISOString()
            },
            {
              id: 'huawei-battery-luna2000',
              name: 'Batterie HUAWEI LUNA2000 5-15kWh',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//HUAWEI_BATTERY_LUNA2000-5-15.pdf',
              category: 'battery',
              createdAt: new Date().toISOString()
            },
            {
              id: 'ecojoko-ft',
              name: 'Ecojoko - Fiche technique',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//Ecojoko_FT.pdf',
              category: 'other',
              createdAt: new Date().toISOString()
            },
            {
              id: 'renusol-bac-lestes',
              name: 'RENUSOL Bac lesté',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//RENUSOL_bac-lestes.pdf',
              category: 'other',
              createdAt: new Date().toISOString()
            },
            {
              id: 'smartbattery-plaquette',
              name: 'SmartBattery',
              url: 'https://xpxbxfuckljqdvkajlmx.supabase.co/storage/v1/object/public/material//OFFRE-MSB-PLAQUETTE.pdf',
              category: 'other',
              createdAt: new Date().toISOString()
            }
          ];
          
          setDatasheets(defaultDatasheets);
          localStorage.setItem('technical_datasheets', JSON.stringify(defaultDatasheets));
        }
      } catch (err) {
        console.error('Error loading datasheets:', err);
        setError('Erreur lors du chargement des fiches techniques');
      } finally {
        setLoading(false);
      }
    };

    loadDatasheets();
  }, []);

  const handleToggleDatasheet = (id: string) => {
    if (selectedDatasheets.includes(id)) {
      onSelectedDatasheetsChange(selectedDatasheets.filter(dsId => dsId !== id));
    } else {
      onSelectedDatasheetsChange([...selectedDatasheets, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500 mr-2" />
        <span className="text-xs text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700">{error}</p>
      </div>
    );
  }

  // Grouper les fiches par catégorie
  const categories = {
    panel: { label: 'Panneaux', items: [] as TechnicalDatasheet[] },
    inverter: { label: 'Onduleurs', items: [] as TechnicalDatasheet[] },
    battery: { label: 'Batteries', items: [] as TechnicalDatasheet[] },
    other: { label: 'Autres', items: [] as TechnicalDatasheet[] }
  };

  datasheets.forEach(datasheet => {
    if (categories[datasheet.category as keyof typeof categories]) {
      categories[datasheet.category as keyof typeof categories].items.push(datasheet);
    } else {
      categories.other.items.push(datasheet);
    }
  });

  return (
    <div className="mb-4">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full py-2"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Fiches techniques</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {selectedDatasheets.length} sélectionnée{selectedDatasheets.length !== 1 ? 's' : ''}
          </span>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2">
          {Object.entries(categories).map(([key, category]) => 
            category.items.length > 0 && (
              <div key={key} className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">{category.label}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.items.map(datasheet => (
                    <div 
                      key={datasheet.id}
                      onClick={() => handleToggleDatasheet(datasheet.id)}
                      className={`flex items-center justify-between p-4 rounded border cursor-pointer transition-colors ${
                        selectedDatasheets.includes(datasheet.id)
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className={`h-5 w-5 flex-shrink-0 ${
                          selectedDatasheets.includes(datasheet.id) ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <span className="truncate text-sm">{datasheet.name}</span>
                      </div>
                      {selectedDatasheets.includes(datasheet.id) ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}