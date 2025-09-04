import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface StepLinkProps {
  path: string;
  label: string;
  icon: LucideIcon;
  description: string;
  isActive: boolean;
  stepNumber: number;
  isEnabled: boolean;
}

export default function StepLink({
  path,
  label,
  icon: Icon,
  description,
  isActive,
  stepNumber,
  isEnabled
}: StepLinkProps) {
  if (!isEnabled) {
    return (
      <div className="flex items-start gap-4 p-3 rounded-lg text-gray-400 cursor-not-allowed">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-200 text-sm font-medium">
          {stepNumber}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-gray-300" />
            <span className="text-sm font-medium">{label}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <Link
      to={path}
      className={`group flex items-start gap-4 p-3 rounded-lg transition-colors ${
        isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 text-sm font-medium">
        {stepNumber}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>
    </Link>
  );
}