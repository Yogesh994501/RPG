import React, { useState } from 'react';
import { X, Shield, Sparkles, User, Lock, Mail, Globe } from 'lucide-react';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { user: any; character: any }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({
          username,
          email,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        onSuccess(res);
      } else {
        const res = await api.login({
          emailOrUsername: email || username,
          password
        });
        onSuccess(res);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.demoLogin();
      onSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="text-amber-400" size={22} />
            <h2 className="font-rpg text-lg font-bold text-white">
              {isRegister ? 'Inscribe New Hero' : 'Heroic Access Portal'}
            </h2>
          </div>
          <button onClick={onClose} className="icon-btn w-8 h-8" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        {/* Quick Demo Hero Login */}
        <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-950/60 to-amber-950/60 border border-amber-500/40 text-center">
          <p className="text-xs text-amber-200 font-medium mb-2">
            ⚔️ Hackathon Reviewer or Instant Player?
          </p>
          <button
            type="button"
            onClick={handleDemo}
            disabled={isLoading}
            className="rpg-btn rpg-btn-gold w-full text-xs py-2 shadow-lg font-bold"
          >
            <Sparkles size={14} />
            <span>One-Click Instant Demo Hero (Level 3 Champion)</span>
          </button>
        </div>

        <div className="relative my-4 text-center">
          <hr className="border-slate-800" />
          <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[#0B0E14] px-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Or Use Account
          </span>
        </div>

        {error && (
          <div className="mb-3 p-2.5 rounded bg-red-950/70 border border-red-800 text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegister && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-username">Adventurer Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-username"
                  type="text"
                  required
                  placeholder="e.g. SirGalen"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-input pl-9 text-xs"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">
              {isRegister ? 'Scroll Address (Email)' : 'Email or Username'}
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-email"
                type={isRegister ? 'email' : 'text'}
                required
                placeholder={isRegister ? 'hero@aetheria.realm' : 'Username or email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input pl-9 text-xs"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Secret Rune (Password)</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-9 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rpg-btn rpg-btn-gold w-full text-xs py-2 mt-2"
          >
            {isLoading ? 'Verifying...' : isRegister ? 'Enter Realm of Aetheria' : 'Enter the Realm'}
          </button>
        </form>

        <div className="mt-3 text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Already inscribed?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-amber-400 font-semibold underline hover:text-amber-300"
              >
                Log In
              </button>
            </span>
          ) : (
            <span>
              New hero?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-amber-400 font-semibold underline hover:text-amber-300"
              >
                Create Account
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
