
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

// Ícone do Google em SVG para consistência visual
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
  const [isCriticalError, setIsCriticalError] = useState(false);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const handleGoogleLogin = async () => {
    setError('');
    setIsCriticalError(false);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // O onAuthStateChanged no App.tsx cuidará do redirecionamento
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      let message = 'Erro ao entrar com Google';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'A janela de login foi fechada antes de completar.';
      } else if (err.code === 'auth/operation-not-allowed') {
        message = 'O login com Google não está ativo no Firebase.';
        setIsCriticalError(true);
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsCriticalError(false);
    setLoading(true);

    try {
      if (isSignup) {
        if (!name || !email || !password) {
          throw new Error('Preencha todos os campos para o cadastro');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(userCredential.user, { displayName: name.trim() });
      } else {
        if (!email || !password) {
          throw new Error('Preencha login e senha');
        }
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err.code, err.message);
      let message = 'Ocorreu um erro na autenticação';
      
      if (err.code === 'auth/operation-not-allowed') {
        message = 'O provedor de E-mail/Senha está desativado no Firebase.';
        setIsCriticalError(true);
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'E-mail ou senha incorretos. Verifique e tente novamente.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Este e-mail já está sendo usado por outra conta.';
      } else if (err.code === 'auth/weak-password') {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'O formato do e-mail digitado é inválido.';
      } else if (err.message) {
        message = err.message;
      }
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
    setIsCriticalError(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-4 bg-emerald-500 rounded-[2rem] shadow-2xl shadow-emerald-500/20 mb-4">
            <Logo variant="light" size="lg" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter">
            {isSignup ? 'Seja bem-vindo!' : 'Bom te ver de novo'}
          </h2>
          <p className="text-slate-400 text-sm font-medium">
            {isSignup ? 'Crie sua conta para começar o seu controle' : 'Entre com seus dados para acessar o app'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <GoogleIcon />
            Entrar com Google
          </button>

          <div className="flex items-center gap-4 px-2">
            <div className="h-[1px] flex-1 bg-slate-800" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ou use seu e-mail</span>
            <div className="h-[1px] flex-1 bg-slate-800" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={name}
                  disabled={loading}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome (ex: Matheus)"
                  className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all disabled:opacity-50"
                />
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                <User size={20} />
              </div>
              <input
                type="email"
                value={email}
                disabled={loading}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all disabled:opacity-50"
              />
            </div>

            {error && (
              <div className={`p-4 rounded-xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300 ${isCriticalError ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                <div className="flex items-center gap-2 text-rose-500 font-black uppercase text-[10px] tracking-widest">
                  <AlertCircle size={14} /> Atenção
                </div>
                <p className="text-rose-400 text-xs font-medium leading-relaxed">{error}</p>
                
                {isCriticalError && (
                  <div className="mt-2 p-3 bg-black/40 rounded-lg space-y-2 border border-rose-500/20">
                    <p className="text-[10px] text-white font-black uppercase tracking-tight flex items-center gap-1">
                      <Info size={12} className="text-emerald-500" /> Como resolver:
                    </p>
                    <ol className="text-[10px] text-slate-300 space-y-1 list-decimal list-inside font-medium">
                      <li>Acesse o Console do Firebase</li>
                      <li>Vá em Authentication &gt; Sign-in method</li>
                      <li>Ative o provedor solicitado (E-mail ou Google)</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Criar minha conta' : 'Entrar no sistema'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="pt-2 flex flex-col items-center gap-6">
          <button 
            onClick={toggleMode}
            disabled={loading}
            className="text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors disabled:opacity-50"
          >
            {isSignup ? 'Já possui um cadastro? Faça login' : 'Novo por aqui? Criar uma conta gratuita'}
          </button>

          <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-60">
            <CheckCircle2 size={12} className="text-emerald-500" /> Autenticação Firebase Segura
          </div>
        </div>
      </div>
    </div>
  );
};
