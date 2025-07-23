'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, Users, DollarSign, Shield, Eye, EyeOff } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/')
      }
    }
    checkSession()
  }, [router])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        console.error('SignIn Error:', result.error);
        setError('Nome utente o password non validi. Controlla la console per i dettagli.');
      } else if (!result?.ok) {
        console.error('SignIn failed with status:', result?.status);
        setError('Accesso non riuscito. Riprova.');
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Exception during sign-in:', error);
      setError('Si è verificato un errore imprevisto durante l\'accesso.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="card text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <DollarSign className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestionale Spese Famiglia
          </h1>
          
          <p className="text-gray-600 mb-8">
            Gestisci le spese della tua famiglia con facilità. Condividi i costi, sincronizza in tempo reale e rimani organizzato.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <Users className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Condivisione Famiglia</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <Shield className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Sincronizzazione Sicura</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <DollarSign className="w-6 h-6 text-primary-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Tracciamento Costi</p>
            </motion.div>
          </div>

          {/* Registration Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center"
          >
            <p className="text-sm text-green-800 mb-2">
              Non hai ancora un gruppo famiglia?
            </p>
            <a
              href="/auth/register"
              className="text-green-600 hover:text-green-700 font-medium text-sm underline"
            >
              Crea il tuo gruppo famiglia
            </a>
          </motion.div>

          {/* Credentials Form */}
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleCredentialsSignIn}
            className="space-y-4 mb-6 text-left"
          >
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Utente
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Inserisci il tuo nome utente"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Inserisci la tua password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </motion.form>


          
          <p className="text-xs text-gray-500 mt-4">
            Effettuando l'accesso, accetti i nostri termini di servizio e la politica sulla privacy.
          </p>
        </div>
      </motion.div>
    </div>
  )
}