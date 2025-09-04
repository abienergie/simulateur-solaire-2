import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { enedisApi } from '../utils/api/enedisApi';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function EnedisCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Connexion à Enedis en cours...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Extraire les paramètres de l'URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const usagePointId = params.get('usage_point_id');

        // Cas d'erreur
        if (error) {
          console.error('Erreur reçue:', error);
          setStatus('error');
          setMessage(error);
          setTimeout(() => {
            navigate('/abie-link', { 
              state: { error },
              replace: true
            });
          }, 3000);
          return;
        }

        // Cas où on reçoit directement un token (depuis la fonction Edge)
        if (accessToken) {
          console.log('Token reçu directement');
          localStorage.setItem('enedis_access_token', accessToken);
          
          if (refreshToken) {
            localStorage.setItem('enedis_refresh_token', refreshToken);
          }
          
          // Stocker la date d'expiration (1 heure par défaut)
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 1);
          localStorage.setItem('enedis_token_expires', expiresAt.toISOString());
          
          // Stocker le PDL
          if (usagePointId) {
            localStorage.setItem('enedis_usage_point_id', usagePointId);
          }
          
          setStatus('success');
          setMessage('Connexion réussie, redirection...');
          
          setTimeout(() => {
            navigate('/abie-link', { 
              state: { 
                success: true,
                pdl: usagePointId,
                message: 'Connexion à Enedis réussie'
              },
              replace: true
            });
          }, 2000);
          return;
        }

        // Cas où on reçoit un code d'autorisation
        if (code) {
          console.log('Code d\'autorisation reçu, échange contre un token...');
          await enedisApi.handleCallback(code);
          
          setStatus('success');
          setMessage('Connexion réussie, redirection...');
          
          setTimeout(() => {
            navigate('/abie-link', { 
              state: { 
                success: true,
                message: 'Connexion à Enedis réussie'
              },
              replace: true
            });
          }, 2000);
          return;
        }

        // Aucun paramètre utile
        setStatus('error');
        setMessage('Aucun paramètre d\'authentification reçu');
        setTimeout(() => {
          navigate('/abie-link', { 
            state: { error: 'Aucun paramètre d\'authentification reçu' },
            replace: true
          });
        }, 3000);
      } catch (error) {
        console.error('Erreur détaillée lors de la connexion Enedis:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Erreur inconnue');
        
        setTimeout(() => {
          navigate('/abie-link', { 
            state: { 
              error: error instanceof Error ? error.message : 'Échec de la connexion à Enedis'
            },
            replace: true
          });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">{message}</p>
            <p className="text-sm text-gray-500">Veuillez patienter pendant que nous traitons votre demande</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{message}</p>
            <p className="text-sm text-gray-500">Vous allez être redirigé automatiquement</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Erreur de connexion</p>
            <p className="text-sm text-red-500 mb-4">{message}</p>
            <button
              onClick={() => navigate('/abie-link')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Retour à Abie Link
            </button>
          </>
        )}
      </div>
    </div>
  );
}