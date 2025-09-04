import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
}

export default function Tooltip({ content }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <HelpCircle
        className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help inline-block ml-1"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />
      {isVisible && (
        <div className="absolute z-10 w-72 px-4 py-3 text-sm bg-gray-900 text-white rounded-lg shadow-lg left-1/2 -translate-x-1/2 top-6">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
          {content}
        </div>
      )}
    </div>
  );
}