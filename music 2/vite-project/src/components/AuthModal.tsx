import React from 'react';
import { X } from 'lucide-react';
import { useMusicStore } from '../store/useMusicStore';
import { AuthCard } from './AuthCard';

export const AuthModal: React.FC = () => {
  const { showAuthModal, closeAuthModal } = useMusicStore();

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      {/* Backdrop overlay click to close */}
      <div
        className="absolute inset-0 z-0"
        onClick={closeAuthModal}
      />

      {/* Floating Close Button */}
      <button
        onClick={closeAuthModal}
        className="absolute top-6 right-6 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-all shadow-lg hover:scale-110 cursor-pointer"
        title="Close modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-[880px] animate-slide-up">
        <AuthCard isModal onCloseModal={closeAuthModal} />
      </div>
    </div>
  );
};
