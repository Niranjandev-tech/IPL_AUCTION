import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, Sparkles, Mail } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { user, signInWithGoogle, signInWithEmail, signInAsGuest } = useAuth();
  const [authTab, setAuthTab] = useState<'guest' | 'email'>('email');
  const [emailInput, setEmailInput] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);

  if (user) return null;

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;
    signInAsGuest(guestName.trim());
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubmitting(true);
    setEmailMessage(null);
    try {
      await signInWithEmail(emailInput.trim());
      setEmailMessage('Signed in successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to sign in with email');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
      <div className="glass-panel rounded-3xl border border-amber-500/30 p-8 max-w-md w-full shadow-broadcast text-center space-y-6 bg-[#0a0a0a]">
        <div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-neutral-950 font-black text-2xl mx-auto mb-3 shadow-gold-glow">
            IPL
          </div>
          <h2 className="font-heading text-2xl font-black gold-gradient-text tracking-wide">
            WELCOME TO IPL AUCTION ROOM
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Private, live multiplayer auction rooms for friends.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs font-mono">
          <button
            onClick={() => setAuthTab('email')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authTab === 'email'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> EMAIL SIGN IN
          </button>
          <button
            onClick={() => setAuthTab('guest')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              authTab === 'guest'
                ? 'bg-amber-400 text-neutral-950 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" /> QUICK GUEST
          </button>
        </div>

        {/* Form 1: Email Auth */}
        {authTab === 'email' && (
          <form onSubmit={handleEmailSubmit} className="space-y-3 bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 text-left">
            <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> ENTER YOUR EMAIL ADDRESS
            </label>
            <input
              type="email"
              required
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. rohit@mumbaiindians.com"
              className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 font-sans"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-heading font-black text-sm rounded-xl shadow-gold-glow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-4 h-4" /> {submitting ? 'SIGNING IN...' : 'SIGN IN WITH EMAIL'}
            </button>
            {emailMessage && (
              <div className="text-xs text-emerald-400 font-mono text-center pt-1">{emailMessage}</div>
            )}
          </form>
        )}

        {/* Form 2: Quick Guest */}
        {authTab === 'guest' && (
          <form onSubmit={handleGuestSubmit} className="space-y-3 bg-neutral-900/90 p-4 rounded-2xl border border-neutral-800 text-left">
            <label className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> ENTER YOUR DISPLAY NAME
            </label>
            <input
              type="text"
              required
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. Captain Dhoni, Rohit, Virat"
              className="w-full bg-black border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 focus:outline-none focus:border-amber-400 font-sans"
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-neutral-950 font-heading font-black text-sm rounded-xl shadow-gold-glow transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" /> ENTER AUCTION LOBBY
            </button>
          </form>
        )}

        <div className="flex items-center gap-3">
          <div className="h-px bg-neutral-800 flex-1" />
          <span className="text-[10px] text-neutral-500 uppercase font-mono">OR USE GOOGLE AUTH</span>
          <div className="h-px bg-neutral-800 flex-1" />
        </div>

        {/* Google Sign In */}
        <button
          onClick={signInWithGoogle}
          className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-amber-400" /> SIGN IN WITH GOOGLE
        </button>
      </div>
    </div>
  );
};
