import React, { useState } from 'react';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';

interface AuthCardProps {
  initialMode?: 'signin' | 'signup';
  onSuccess?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialMode = 'signin',
  onSuccess,
  isModal = false,
  onCloseModal
}) => {
  const { login, signup, loginWithGoogle, loginWithX } = useMusicStore();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (authMode === 'signup' && !name.trim()) {
      setAuthError('Please enter a username.');
      return;
    }

    if (!email.trim()) {
      setAuthError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signup') {
        const res = await signup(name.trim(), email.trim());
        if (res.success) {
          if (onSuccess) onSuccess();
          if (onCloseModal) onCloseModal();
        } else {
          setAuthError(res.error || 'Registration failed.');
        }
      } else {
        const res = await login(email.trim());
        if (res.success) {
          if (onSuccess) onSuccess();
          if (onCloseModal) onCloseModal();
        } else {
          setAuthError(res.error || 'Login failed.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialClick = async (provider: 'google' | 'x') => {
    setIsSubmitting(true);
    try {
      if (provider === 'google') await loginWithGoogle();
      else if (provider === 'x') await loginWithX();

      if (onSuccess) onSuccess();
      if (onCloseModal) onCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto select-none relative">
      {/* Container with Glass Effect */}
      <div className="relative w-full rounded-[32px] p-8 md:p-10 bg-[#0c0d12]/60 backdrop-blur-3xl border border-white/5 shadow-2xl overflow-hidden">
        
        {/* Top-Left Green/Cyan Glow Effect */}
        <div className="absolute -top-16 -left-16 w-48 h-48 bg-gradient-to-br from-[#0EEBAA]/30 to-[#0EA5E9]/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#0EEBAA]/30 to-transparent opacity-50" />

        <div className="relative z-10 flex flex-col items-center">
          
          <h2 className="text-[26px] font-bold text-white mb-2 tracking-tight">
            {authMode === 'signin' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="text-sm text-white/50 mb-10">
            {authMode === 'signin' ? 'Sign in to your account' : 'Join us to explore new music'}
          </p>

          {authError && (
            <div className="w-full mb-6 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 mb-8">
            
            {authMode === 'signup' && (
              <div className="relative group">
                <label className="absolute -top-2 left-4 px-1 bg-[#13141a] text-[10px] text-white/40 font-medium z-10 rounded">
                  Username
                </label>
                <div className="relative w-full bg-[#13141a] border border-white/5 rounded-full overflow-hidden flex items-center p-1.5 px-3 focus-within:border-[#0EEBAA]/30 transition-colors">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (authError) setAuthError(null);
                    }}
                    className="flex-1 bg-transparent border-none text-sm text-white px-2 py-2 focus:outline-none placeholder-white/20"
                    placeholder="Enter your username"
                    required={authMode === 'signup'}
                  />
                </div>
              </div>
            )}

            <div className="relative group">
              <label className="absolute -top-2 left-4 px-1 bg-[#13141a] text-[10px] text-white/40 font-medium z-10 rounded">
                {authMode === 'signin' ? 'Email or Username' : 'Email'}
              </label>
              <div className="relative w-full bg-[#13141a] border border-white/5 rounded-full overflow-hidden flex items-center p-1.5 px-3 focus-within:border-[#0EEBAA]/30 transition-colors">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  className="flex-1 bg-transparent border-none text-sm text-white px-2 py-2 focus:outline-none placeholder-white/20"
                  placeholder={authMode === 'signin' ? "name@example.com or @username" : "name@example.com"}
                  required
                />
              </div>
            </div>

            <div className="relative group">
              <label className="absolute -top-2 left-4 px-1 bg-[#13141a] text-[10px] text-white/40 font-medium z-10 rounded">
                Password
              </label>
              <div className="relative w-full bg-[#13141a] border border-white/5 rounded-full overflow-hidden flex items-center p-1.5 focus-within:border-[#0EEBAA]/30 transition-colors">
                <input
                  type="password"
                  className="flex-1 bg-transparent border-none text-sm text-white px-4 py-2 focus:outline-none placeholder-white/20"
                  placeholder="••••••••"
                  required
                />
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center transition-all bg-gradient-to-r from-[#0EEBAA] to-[#0bc18a] hover:brightness-110 shadow-[0_0_15px_rgba(14,235,170,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 text-[#063324] animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-[#063324]" />
                  )}
                </button>
              </div>
            </div>
          </form>

          <div className="w-full flex items-center gap-3 mb-8">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">OR</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="w-full flex flex-col gap-3 mb-8">
            <button
              type="button"
              onClick={() => handleSocialClick('google')}
              className="w-full py-3.5 px-5 bg-[#13141a] hover:bg-[#181920] border border-white/5 rounded-full flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                  <path fill="#FBBC05" d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-1.9.4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16c1.8 3.8 5.6 7 10.1 7z" />
                </svg>
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition">Continue with Google</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleSocialClick('x')}
              className="w-full py-3.5 px-5 bg-[#13141a] hover:bg-[#181920] border border-white/5 rounded-full flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition">Continue with X</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition" />
            </button>
          </div>

          <div className="text-center">
            {authMode === 'signin' ? (
              <p className="text-xs text-white/50 font-medium">
                Don't have an account?{' '}
                <button
                  onClick={() => setAuthMode('signup')}
                  className="text-[#0EEBAA] hover:text-[#13ffd0] hover:underline font-bold transition-colors"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p className="text-xs text-white/50 font-medium">
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('signin')}
                  className="text-[#0EEBAA] hover:text-[#13ffd0] hover:underline font-bold transition-colors"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
