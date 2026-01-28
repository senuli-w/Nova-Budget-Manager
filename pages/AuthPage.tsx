import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-700 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-purple-500/30 rounded-full blur-3xl"></div>
         <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/20 relative z-10">
        
        <div className="p-8 w-full">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-gradient-to-br from-brand-600 to-brand-500 text-white p-2.5 rounded-xl shadow-lg shadow-brand-500/30">
                <Wallet size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Nova<span className="text-brand-600">.</span></span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 mb-6 text-sm">
             {isLogin ? 'Enter your details to access your wealth.' : 'Start your journey to financial freedom.'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                placeholder="hello@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 transform active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                    <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-brand-600 font-bold hover:text-brand-700 hover:underline transition-all"
              >
                {isLogin ? 'Register' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};