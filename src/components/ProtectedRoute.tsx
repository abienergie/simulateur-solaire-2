import React from 'react';
import { Navigate } from 'react-router-dom';
import { useClient } from '../contexts/client';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { clientInfo } = useClient();
  const hasBasicInfo = !!(clientInfo.civilite && clientInfo.nom && clientInfo.prenom);

  if (!hasBasicInfo) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}