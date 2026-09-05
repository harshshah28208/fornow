import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw, Sparkles } from 'lucide-react';
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
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-6 flex items-center justify-between shadow-xs">
      {/* Left: Organization & Quick Info */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
          🏢 {user?.organization?.name || 'Acme Cloud Enterprise'}
        </span>
        <span className="text-xs text-slate-500">
          Currency: <strong className="text-slate-800 font-mono">INR (₹)</strong>
        </span>
      </div>

      {/* Center: Interactive Role Switcher */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Active Role:
        </span>
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRoleSwitch(r.id)}
            disabled={switching}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              user?.role === r.id
                ? 'bg-teal-600 text-white shadow-sm font-extrabold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
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
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded-lg transition-colors relative"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[11px] text-teal-600 font-bold hover:underline">
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
                      className={`p-2.5 rounded-xl border text-xs ${
                        n.isRead ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-teal-50/60 border-teal-200 text-slate-900'
                      }`}
                    >
                      <p className="font-bold text-slate-900 mb-0.5">{n.title}</p>
                      <p className="text-[11px] text-slate-600 leading-tight">{n.message}</p>
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
