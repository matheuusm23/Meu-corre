
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Logo } from './ui/Logo';
import { User, Lock, ChevronRight, CheckCircle2, AlertCircle, RefreshCw, Info } from './Icons';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

interface AuthProps {
  onLogin: (profile: UserProfile) => void;
  existingProfile: UserProfile | null;
}

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  // Fix: Added missing toggleMode function to switch between login and signup
  const toggleMode = () => setMode(prev => prev === 'login' ? 'signup' : 'login');

  const handleGoogleLogin = async () => {
    setError('');
    setUnauthorizedDomain(null);
    setLoading(true);
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Google Auth Error:", err.code, err.message);
      
      if (err.code === 'auth/unauthorized-domain') {
        const domain = window.location.hostname;
        setError(`Este domínio (${domain}) não está autorizado no Firebase.`);
        setUnauthorizedDomain(domain);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('O login com Google não foi ativado no Console do Firebase.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Você fechou a janela do Google antes de terminar.');
      } else {
        setError('Falha ao conectar com Google. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUnauthorizedDomain(null);
    setLoading(true);

    try {
      if (isSignup) {
        if (!name || !email || !password) throw new Error('Preencha todos os campos');
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
      } else {
        if (!email || !password) throw new Error('Preencha e-mail e senha');
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      let message = 'Erro na autenticação';
      if (err.code === 'auth/invalid-credential') message = 'E-mail ou senha incorretos.';
      else if (err.code === 'auth/email-already-in-use') message = 'Este e-mail já está em uso.';
      else if (err.code === 'auth/operation-not-allowed') message = 'Login por e-mail desativado no Firebase.';
      else message = err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-4 bg-emerald-500 rounded-[2rem] shadow-2xl shadow-emerald-500/20 mb-4 animate-bounce">
            <Logo variant="light" size="lg" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            {isSignup ? 'Começar o Corre' : 'Entrar no Corre'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">Use sua conta Google para acesso rápido</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw size={20} className="animate-spin text-emerald-500" /> : <GoogleIcon />}
            Entrar com Google
          </button>

          <div className="flex items-center gap-4 px-2">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ou e-mail</span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white font-black text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="E-mail"
              className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white font-black text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white font-black text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-500 font-black uppercase text-[10px] tracking-widest">
                  <AlertCircle size={14} /> Atenção
                </div>
                <p className="text-rose-400 text-xs font-medium">{error}</p>
                
                {unauthorizedDomain && (
                  <div className="p-3 bg-black/40 rounded-xl space-y-2 border border-rose-500/30">
                    <p className="text-[10px] text-white font-black uppercase flex items-center gap-1">
                      <Info size={12} className="text-emerald-500" /> Resolver Agora:
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Vá em <b>Authentication > Settings > Authorized domains</b> no Firebase e adicione:
                    </p>
                    <code className="block bg-slate-800 p-2 rounded text-emerald-400 font-mono text-[11px] break-all">
                      {unauthorizedDomain}
                    </code>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isSignup ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>
        </div>

        <button 
          onClick={toggleMode}
          className="w-full text-emerald-500 text-xs font-black uppercase tracking-widest text-center"
        >
          {isSignup ? 'Já tenho conta' : 'Criar conta gratuita'}
        </button>
      </div>
    </div>
  );
};
