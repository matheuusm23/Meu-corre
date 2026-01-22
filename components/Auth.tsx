
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Logo } from './ui/Logo';
import { User, Lock, ChevronRight, CheckCircle2, AlertCircle, RefreshCw } from './Icons';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";

interface AuthProps {
  onLogin: (profile: UserProfile) => void;
  existingProfile: UserProfile | null;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignup) {
        if (!name || !email || !password) {
          throw new Error('Preencha todos os campos para o cadastro');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        onLogin({ 
          name: name, 
          login: email 
        });
      } else {
        if (!email || !password) {
          throw new Error('Preencha login e senha');
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onLogin({ 
          name: userCredential.user.displayName || 'Parceiro', 
          login: email 
        });
      }
    } catch (err: any) {
      console.error(err);
      let message = 'Ocorreu um erro na autenticação';
      if (err.code === 'auth/invalid-credential') message = 'Login ou senha incorretos';
      else if (err.code === 'auth/email-already-in-use') message = 'Este email já está em uso';
      else if (err.code === 'auth/weak-password') message = 'A senha deve ter pelo menos 6 caracteres';
      else if (err.code === 'auth/invalid-email') message = 'Formato de email inválido';
      else if (err.message) message = err.message;
      
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
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
            {isSignup ? 'Crie sua conta para começar o corre' : 'Entre com seus dados para acessar'}
          </p>
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
              placeholder="Seu email"
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
              placeholder="Senha"
              className="w-full bg-slate-900 border border-slate-800 p-4 pl-12 rounded-2xl text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>
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

        <div className="pt-2 flex flex-col items-center gap-6">
          <button 
            onClick={toggleMode}
            disabled={loading}
            className="text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors disabled:opacity-50"
          >
            {isSignup ? 'Já possui um cadastro? Faça login' : 'Novo por aqui? Criar uma conta'}
          </button>

          <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
            <CheckCircle2 size={12} className="text-emerald-500" /> Autenticação Firebase Segura
          </div>
        </div>
      </div>
    </div>
  );
};
