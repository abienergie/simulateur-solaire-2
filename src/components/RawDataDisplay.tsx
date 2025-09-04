import React from 'react';

interface RawDataDisplayProps {
  data: any;
  title?: string;
}

const RawDataDisplay: React.FC<RawDataDisplayProps> = ({ data, title = "Données brutes" }) => {
  if (!data) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
        <p className="text-sm text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="overflow-auto max-h-96">
        <pre className="text-xs bg-gray-100 p-3 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default RawDataDisplay;