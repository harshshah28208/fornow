import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Kanban,
  FileSpreadsheet,
  Users,
  Building2,
  Contact,
  CheckCircle2,
  FileSignature,
  Receipt,
  CreditCard,
  TrendingUp,
  Settings,
  Package,
  Boxes,
  ShieldAlert,
  Sliders,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();

  const navSections = [
    {
      title: 'Sales Engine',
      items: [
        { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Deal Pipeline', path: '/pipeline', icon: Kanban },
        { label: 'Deals 360', path: '/deals', icon: FileSpreadsheet },
        { label: 'Leads & Inbound', path: '/leads', icon: Users },
        { label: 'Accounts & Tiers', path: '/accounts', icon: Building2 },
        { label: 'Contacts Directory', path: '/contacts', icon: Contact },
      ],
    },
    {
      title: 'Governance & Legal',
      items: [
        { label: 'Discount Approvals', path: '/approvals', icon: CheckCircle2 },
        { label: 'Contracts & Legal', path: '/contracts', icon: FileSignature },
      ],
    },
    {
      title: 'Operations & Inventory',
      items: [
        { label: 'Products & Plans', path: '/products', icon: Package },
        { label: 'Warehouses & Stock', path: '/warehouses', icon: Boxes },
      ],
    },
    {
      title: 'Finance & Revenue',
      items: [
        { label: 'Invoices', path: '/invoices', icon: Receipt },
        { label: 'Payments & Revenue', path: '/revenue', icon: TrendingUp },
      ],
    },
    {
      title: 'System & Admin',
      items: [
        { label: 'Settings & Rules', path: '/settings', icon: Settings },
        { label: 'Audit Trail', path: '/audit-logs', icon: ShieldAlert },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-30 backdrop-blur-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-glow text-slate-950 font-extrabold text-lg">
            360
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              DealFlow<span className="text-brand-400">360</span>
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Rule-Driven Deal Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </h3>
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      {/* User Info & Demo Switcher */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900 border border-slate-800 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-600/30 border border-brand-500/40 flex items-center justify-center text-brand-300 font-bold text-xs">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-brand-400 font-mono font-medium truncate">{user?.role}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
