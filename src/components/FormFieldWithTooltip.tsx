import React from 'react';
import FormField from './FormField';
import Tooltip from './Tooltip';

interface FormFieldWithTooltipProps {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  tooltipContent: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

export default function FormFieldWithTooltip({
  label,
  unit,
  tooltipContent,
  ...props
}: FormFieldWithTooltipProps) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label} {unit && <span className="text-gray-500">({unit})</span>}
        </label>
        <Tooltip content={tooltipContent} />
      </div>
      <FormField
        label=""
        {...props}
        className="mt-0"
      />
    </div>
  );
}