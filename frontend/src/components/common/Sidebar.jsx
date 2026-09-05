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
  LogOut,
  Sparkles,
  Activity,
  Truck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navSections = [
    {
      title: 'Sales & Deal Engine',
      items: [
        { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Quotations Board', path: '/quotations', icon: FileSpreadsheet },
        { label: 'Deal Pipeline', path: '/pipeline', icon: Kanban },
        { label: 'Deals 360', path: '/deals', icon: FileSpreadsheet },
        { label: 'Deal Health Radar', path: '/deal-health', icon: Activity },
      ],
    },
    {
      title: 'CRM & Pipeline',
      items: [
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
        { label: 'Customer Portal Demo', path: '/portal/QT-2026-0001-V1', icon: Sparkles },
      ],
    },
    {
      title: 'Operations & Fulfillment',
      items: [
        { label: 'Fulfillment Milestones', path: '/fulfillment', icon: Truck },
        { label: 'Products & Pricing', path: '/products', icon: Package },
        { label: 'Warehouses & Stock', path: '/warehouses', icon: Boxes },
        { label: 'CPQ Quote Builder', path: '/quotes/new', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Finance & Revenue Ops',
      items: [
        { label: 'Invoices', path: '/invoices', icon: Receipt },
        { label: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
        { label: 'Revenue Analytics', path: '/revenue', icon: TrendingUp },
        { label: 'Executive Reports', path: '/reports', icon: BarChart3 },
      ],
    },
    {
      title: 'System & Governance',
      items: [
        { label: 'Settings & Rules', path: '/settings', icon: Settings },
        { label: 'Audit Trail', path: '/audit-logs', icon: ShieldAlert },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-sm">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
            360
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1">
              DealFlow<span className="text-teal-600">360</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">B2B Deal Engine</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
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
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 border border-teal-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center text-teal-800 font-bold text-xs">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-[10px] text-teal-700 font-mono font-bold truncate">{user?.role}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
