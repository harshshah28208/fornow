import React, { useState, useEffect } from 'react';
import { Bell, Search, RefreshCw, ShieldCheck, Sparkles, Check, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const TopNav = ({ onRefresh }) => {
  const { user, switchRole } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [switching, setSwitching] = useState(false);

  const roles = [
    { id: 'SALES_REP', label: 'Sales Rep' },
    { id: 'SALES_MANAGER', label: 'Sales Manager' },
    { id: 'FINANCE', label: 'Finance' },
    { id: 'LEGAL', label: 'Legal Counsel' },
    { id: 'ORG_ADMIN', label: 'Admin' },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleSwitch = async (roleId) => {
    if (user?.role === roleId) return;
    setSwitching(true);
    try {
      await switchRole(roleId);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('Role switch error: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/all/read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 sticky top-0 z-20 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Left: Organization & Quick Info */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
          🏢 {user?.organization?.name || 'Acme Cloud Enterprise'}
        </span>
        <span className="text-xs text-slate-400">
          Currency: <strong className="text-slate-300 font-mono">INR (₹)</strong>
        </span>
      </div>

      {/* Center: Interactive Role Switcher for rapid demo evaluation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-lg">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-brand-400" /> Active Role:
        </span>
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRoleSwitch(r.id)}
            disabled={switching}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              user?.role === r.id
                ? 'bg-brand-500 text-slate-950 shadow-glow font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Right: Actions & Notifications */}
      <div className="flex items-center gap-3 relative">
        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Reload backend data"
            className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-brand-400 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto mt-2 space-y-2">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications yet</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-lg border text-xs ${
                        n.isRead ? 'bg-slate-950/40 border-slate-850 text-slate-400' : 'bg-brand-950/20 border-brand-500/30 text-slate-200'
                      }`}
                    >
                      <p className="font-semibold text-white mb-0.5">{n.title}</p>
                      <p className="text-[11px] text-slate-300 leading-tight">{n.message}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
