import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { role: 'Sales Rep', email: 'rep@dealflow360.com', desc: 'Create quotes, submit discounts' },
    { role: 'Sales Manager', email: 'manager@dealflow360.com', desc: 'Review & approve tier discounts' },
    { role: 'Finance', email: 'finance@dealflow360.com', desc: '2nd-level approvals & invoicing' },
    { role: 'Legal Counsel', email: 'legal@dealflow360.com', desc: 'Review & execute contracts' },
    { role: 'Org Admin', email: 'admin@dealflow360.com', desc: 'Manage rules, pricing, users' },
  ];

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setLoading(true);
    setError('');
    try {
      await login(demoEmail, 'Password@123');
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-teal-400 items-center justify-center text-slate-950 font-black text-xl shadow-glow">
            360
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            DealFlow<span className="text-brand-400">360</span>
          </h1>
          <p className="text-xs text-slate-400">Rule-Driven B2B Deal Engine & Revenue Operations</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="you@dealflow360.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-teal-500 hover:from-brand-500 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-glow text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-400" /> 1-Click Persona Quick Login:
            </span>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.email)}
                  className="w-full p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left flex items-center justify-between text-xs transition-all group"
                >
                  <div>
                    <span className="font-bold text-slate-200 group-hover:text-brand-300 transition-colors">
                      {acc.role}
                    </span>
                    <p className="text-[10px] text-slate-400">{acc.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-brand-400">Demo Login →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
