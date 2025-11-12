import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setIsLoading(true);
    setMessage(null);
    setError(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          setMessage('Account created. Please verify your email if required, then sign in.');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{mode === 'signin' ? 'Sign in' : 'Create account'}</h1>
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!email || !password || isLoading}
            className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isLoading ? 'Please wait...' : (mode === 'signin' ? 'Sign in' : 'Sign up')}
          </button>
          <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
            {mode === 'signin' ? (
              <button onClick={() => setMode('signup')} className="underline">Create an account</button>
            ) : (
              <button onClick={() => setMode('signin')} className="underline">Have an account? Sign in</button>
            )}
          </div>
          {message && <div className="text-sm text-green-600">{message}</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;


