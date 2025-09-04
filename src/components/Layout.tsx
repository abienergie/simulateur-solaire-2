import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import StepNavigation from './StepNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation sidebar */}
      <div className="fixed inset-y-0 left-0 z-30">
        <div 
          className={`fixed inset-y-0 bg-gradient-to-b from-[#F6F9FC] to-[#EDF3F8] border-r border-gray-200 transition-all duration-300 ease-in-out ${
            isNavOpen ? 'w-64' : 'w-16'
          }`}
        >
          {/* Menu toggle button */}
          <button
            onClick={() => setIsNavOpen(!isNavOpen)}
            className="absolute top-4 left-4 p-1 rounded-lg transition-colors hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2F80ED]"
            aria-label={isNavOpen ? 'Réduire le menu' : 'Ouvrir le menu'}
          >
            {isNavOpen ? (
              <X className="h-5 w-5 text-[#2F80ED]" />
            ) : (
              <Menu className="h-5 w-5 text-[#2F80ED]" />
            )}
          </button>

          <div className="h-full pt-16">
            <StepNavigation isCollapsed={!isNavOpen} />
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isNavOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 transition-opacity lg:hidden z-20"
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ${isNavOpen ? 'lg:pl-64' : 'lg:pl-16'}`}>
        {children}
      </div>
    </div>
  );
}