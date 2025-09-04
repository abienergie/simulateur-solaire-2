import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onLogin: () => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      onLogin();
    } catch (error) {
      setError('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;
      setError('Un email de réinitialisation vous a été envoyé');
    } catch (error) {
      setError('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <img 
            src="https://i.ibb.co/qLHXqbw/Logo-ABI.jpg"
            alt="ABI Énergie"
            className="h-32 mx-auto"
          />
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Simulateur Solaire
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Pour accéder au simulateur, veuillez vous connecter
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={resetMode ? handleResetPassword : handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email"
                />
              </div>
            </div>

            {!resetMode && (
              <div>
                <label htmlFor="password" className="sr-only">Mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Mot de passe"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : resetMode ? 'Envoyer le lien' : 'Se connecter'}
            </button>
          </div>

          <div className="text-sm text-center">
            <button
              type="button"
              onClick={() => setResetMode(!resetMode)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              {resetMode ? 'Retour à la connexion' : 'Mot de passe oublié ?'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Vous souhaitez faire une simulation ?
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600">
            Rapprochez-vous d'un conseiller ABI Énergie
          </p>
          <p className="mt-2 text-sm">
            <a href="tel:0183835150" className="font-medium text-blue-600 hover:text-blue-500">
              01 83 83 51 50
            </a>
          </p>
          <p className="mt-2 text-sm">
            <a href="mailto:contact@abie.fr" className="font-medium text-blue-600 hover:text-blue-500">
              contact@abie.fr
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}