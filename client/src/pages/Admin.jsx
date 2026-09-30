import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminMembers from '../components/admin/AdminMembers';
import AdminEvents from '../components/admin/AdminEvents';
import AdminSettings from '../components/admin/AdminSettings';
import { haptic } from '../utils/haptics';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'members', label: 'Membres' },
  { id: 'events', label: 'Événements' },
  { id: 'settings', label: 'Paramètres' }
];

// L'onglet est dans l'URL (/admin/members) : le bouton retour et le rechargement le conservent
export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { tab: tabParam } = useParams();
  const tab = TABS.some(t => t.id === tabParam) ? tabParam : 'dashboard';
  const setTab = (id) => navigate(id === 'dashboard' ? '/admin' : `/admin/${id}`);

  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="page-title">Administration</h1>

      <div className="chips-row">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { haptic('selection'); setTab(t.id); }}
            className={`chip ${tab === t.id ? 'chip-active' : ''}`}
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
