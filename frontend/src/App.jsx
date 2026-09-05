import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import { Sidebar } from './components/common/Sidebar';
import { TopNav } from './components/common/TopNav';
import { LoadingSpinner } from './components/common/LoadingAndEmpty';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Pipeline } from './pages/Pipeline';
import { Deals } from './pages/Deals';
import { DealDetail } from './pages/DealDetail';
import { QuoteBuilder } from './pages/QuoteBuilder';
import { Approvals } from './pages/Approvals';
import { Contracts } from './pages/Contracts';
import { Invoices } from './pages/Invoices';
import { Revenue } from './pages/Revenue';
import { Leads } from './pages/Leads';
import { Accounts } from './pages/Accounts';
import { Contacts } from './pages/Contacts';
import { Products } from './pages/Products';
import { Warehouses } from './pages/Warehouses';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { CustomerPortal } from './pages/CustomerPortal';
import { Login } from './pages/Login';

// Protected App Layout
const AppLayout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <LoadingSpinner message="Initializing DealFlow360..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 min-h-screen flex flex-col">
        <TopNav onRefresh={() => window.location.reload()} />
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/deals/:id" element={<DealDetail />} />
            <Route path="/quotes/new" element={<QuoteBuilder />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/revenue" element={<Revenue />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/products" element={<Products />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Customer Portal View */}
          <Route path="/portal/:quoteId" element={<CustomerPortal />} />

          {/* Authentication */}
          <Route path="/login" element={<Login />} />

          {/* Protected Internal Routes */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
