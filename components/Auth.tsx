
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Lock, Eye, EyeOff, AlertCircle, RefreshCw, Info } from './Icons';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

interface AuthProps {
  onLogin: () => void;
  existingProfile: UserProfile | null;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Falha ao conectar com Google. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      else if (err.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres.';
      else message = err.message;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col p-6 font-sans">
      {/* Status Bar Spacer */}
      <div className="h-8" />

      <main className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Logo Centralizado no Topo */}
        <div className="flex flex-col items-center justify-center pt-6 mb-8 select-none text-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none flex items-center gap-2">
            MEU CORRE
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2">
            Financeiro do motoboy
          </p>
        </div>

        {/* Intro Text */}
        <div className="mb-10 text-center">
          <p className="text-slate-500 text-sm font-normal mb-1">Acesse sua conta</p>
          <h1 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
            Informe seu e-mail de cadastro e senha
          </h1>
        </div>

        {/* Social Login - Somente Google */}
        <div className="flex mb-6">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex-1 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-2xl font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
        </div>

        {/* Legal Text */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed mb-8 px-4">
          Ao continuar, você concorda com os nossos{' '}
          <a href="#" className="text-blue-600 font-bold hover:underline">termos de uso</a> e{' '}
          <a href="#" className="text-blue-600 font-bold hover:underline">política de privacidade</a>.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] flex-1 bg-slate-200" />
          <span className="text-[11px] font-medium text-slate-400">ou use seu e-mail</span>
          <div className="h-[1px] flex-1 bg-slate-200" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-slate-900 font-medium text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="E-mail"
            className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-slate-900 font-medium text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl text-slate-900 font-medium text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-4 rounded-2xl border border-rose-100 animate-in fade-in zoom-in-95">
              <AlertCircle size={18} />
              <p className="text-xs font-bold leading-tight">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <RefreshCw size={20} className="animate-spin" /> : (isSignup ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        {/* Auxiliary Links */}
        <div className="mt-8 flex flex-col items-center space-y-4">
          <button 
            type="button"
            className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            Esqueceu sua senha?
          </button>
          
          <button 
            onClick={toggleMode}
            className="text-sm font-medium text-slate-500"
          >
            {isSignup ? (
              <>Já possui uma conta? <span className="text-blue-600 font-bold">Faça login</span></>
            ) : (
              <>Ainda não possui conta? <span className="text-blue-600 font-bold">Clique aqui</span></>
            )}
          </button>
        </div>

        {/* Bottom Branding */}
        <div className="mt-auto pt-8 flex justify-center pb-4">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
            MEU CORRE 2.0
          </p>
        </div>
      </main>
    </div>
  );
};
