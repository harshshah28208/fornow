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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-600 items-center justify-center text-white font-black text-xl shadow-md">
            360
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            DealFlow<span className="text-brand-600">360</span>
          </h1>
          <p className="text-xs text-slate-600 font-medium">Rule-Driven B2B Deal Engine & Revenue Operations</p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="you@dealflow360.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-sm text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Persona Switcher */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-600" /> 1-Click Persona Quick Login:
            </span>
            <div className="space-y-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.email)}
                  className="w-full p-2 rounded-lg bg-slate-50 hover:bg-brand-50/60 border border-slate-200 text-left flex items-center justify-between text-xs transition-all group"
                >
                  <div>
                    <span className="font-bold text-slate-800 group-hover:text-brand-700 transition-colors">
                      {acc.role}
                    </span>
                    <p className="text-[10px] text-slate-500">{acc.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-brand-700 font-semibold">Demo Login →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
