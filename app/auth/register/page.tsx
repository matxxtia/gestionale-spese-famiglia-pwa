'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useTranslation } from '../../../hooks/useTranslation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    familyName: '',
    adminName: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.adminPassword !== formData.confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      setIsLoading(false);
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError(t('passwordTooShort'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyName: formData.familyName,
          adminName: formData.adminName,
          adminUsername: formData.adminUsername,
          adminPassword: formData.adminPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('registrationFailed'));
      }

      // Auto-login dopo registrazione
      const result = await signIn('credentials', {
        username: formData.adminUsername,
        password: formData.adminPassword,
        redirect: false,
      });

      if (result?.ok) {
        router.push('/');
      } else {
        setError(t('loginAfterRegistrationFailed'));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : t('registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('createFamilyGroup')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('createFamilyGroupDescription')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                {t('familyName')}
              </label>
              <input
                id="familyName"
                name="familyName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('familyNamePlaceholder')}
                value={formData.familyName}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
                {t('adminName')}
              </label>
              <input
                id="adminName"
                name="adminName"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('adminNamePlaceholder')}
                value={formData.adminName}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700">
                {t('username')}
              </label>
              <input
                id="adminUsername"
                name="adminUsername"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('usernamePlaceholder')}
                value={formData.adminUsername}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
                {t('password')}
              </label>
              <input
                id="adminPassword"
                name="adminPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('passwordPlaceholder')}
                value={formData.adminPassword}
                onChange={handleInputChange}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                {t('confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={t('confirmPasswordPlaceholder')}
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('creating') : t('createFamilyGroup')}
            </button>
          </div>

          <div className="text-center">
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-500">
              {t('alreadyHaveAccount')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}