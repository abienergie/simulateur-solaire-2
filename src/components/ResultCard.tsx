import React from 'react';

interface ResultCardProps {
  label: string;
  value: number;
  unit: string;
}

export default function ResultCard({ label, value, unit }: ResultCardProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-md">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-blue-600">
        {value.toLocaleString()} {unit}
      </p>
    </div>
  );
}