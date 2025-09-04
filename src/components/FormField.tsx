import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  disabled = false
}: FormFieldProps) {
  const displayValue = Number.isFinite(value) ? value : '';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {unit && <span className="text-gray-500">({unit})</span>}
      </label>
      <input
        type="number"
        name={name}
        value={displayValue}
        onChange={onChange}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        required={!disabled}
      />
    </div>
  );
}