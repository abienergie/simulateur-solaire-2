import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClientProvider } from './contexts/client';
import { FinancialSettingsProvider } from './contexts/FinancialSettingsContext';
import Layout from './components/Layout';
import Header from './components/Header';
import SolarForm from './components/SolarForm';
import ProjectionFinanciere from './pages/ProjectionFinanciere';
import SubscriptionTerms from './pages/SubscriptionTerms';
import ExitTerms from './pages/ExitTerms';
import AbieLink from './pages/AbieLink';
import Agency from './pages/Agency';
import Settings from './pages/Settings';
import Report from './pages/Report';
import PdfGenerator from './pages/PdfGenerator';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Vérifier si l'application est en mode développement
  const isDevelopment = process.env.NODE_ENV === 'development';

  // En mode développement, on est automatiquement authentifié
  useEffect(() => {
    if (isDevelopment) {
      setIsAuthenticated(true);
    }
  }, [isDevelopment]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <Router>
      <ClientProvider>
        <FinancialSettingsProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <Layout>
              <Routes>
                <Route path="/" element={<SolarForm />} />
                <Route 
                  path="/projection" 
                  element={
                    <ProtectedRoute>
                      <ProjectionFinanciere />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/modalites-abonnement" element={<SubscriptionTerms />} />
                <Route path="/modalites-sortie" element={<ExitTerms />} />
                <Route path="/abie-link" element={<AbieLink />} />
                <Route path="/agence" element={<Agency />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/report" element={<Report />} />
                <Route path="/pdf-generator" element={<PdfGenerator />} />
                {/* Redirection par défaut vers la page d'accueil */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </div>
        </FinancialSettingsProvider>
      </ClientProvider>
    </Router>
  );
}