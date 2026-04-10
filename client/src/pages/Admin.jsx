import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminMembers from '../components/admin/AdminMembers';
import AdminEvents from '../components/admin/AdminEvents';
import AdminSettings from '../components/admin/AdminSettings';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Membres' },
  { id: 'events', label: 'Événements' },
  { id: 'settings', label: 'Paramètres' }
];

export default function Admin() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('dashboard');

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 fade-in">
      <h1 className="font-display text-2xl text-blue-dark">Administration</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-blue text-white' : 'bg-white text-text-muted border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <AdminDashboard />}
      {tab === 'members' && <AdminMembers />}
      {tab === 'events' && <AdminEvents />}
      {tab === 'settings' && <AdminSettings />}
    </div>
  );
}
