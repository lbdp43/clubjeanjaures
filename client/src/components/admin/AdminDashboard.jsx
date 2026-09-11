import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatShortDate } from '../../utils/helpers';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api.getDashboard()
      .then(setData)
      .catch(err => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 text-sm mb-2">Impossible de charger le tableau de bord{error ? ` : ${error}` : ''}.</p>
        <button onClick={load} className="text-sm text-blue hover:underline">Réessayer</button>
      </div>
    );
  }

  const { stats, upcomingEvents, recentPosts, recentUsers } = data;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard label="Membres actifs" value={stats.activeMembers} />
        <StatCard label="Suspendus" value={stats.suspendedMembers} />
        <StatCard label="Total inscrits" value={stats.totalUsers} />
        <StatCard label="Demandes" value={stats.activeDemands} />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Prochains événements */}
        <div className="card p-3 sm:p-5">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Prochains événements</h3>
          <div className="space-y-2 sm:space-y-3">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <span className="text-blue font-semibold whitespace-nowrap">{formatShortDate(e.date)}</span>
                <span className="truncate">{e.title}</span>
              </div>
            ))}
            {upcomingEvents.length === 0 && <p className="text-text-muted text-sm">Aucun.</p>}
          </div>
        </div>

        {/* Publications récentes */}
        <div className="card p-3 sm:p-5">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Publications récentes</h3>
          <div className="space-y-2 sm:space-y-3">
            {recentPosts.map(p => (
              <div key={p.id} className="text-xs sm:text-sm">
                <span className="font-medium">{p.author?.member?.companyName || p.author?.email}</span>
                <p className="text-text-muted truncate">{p.content}</p>
              </div>
            ))}
            {recentPosts.length === 0 && <p className="text-text-muted text-sm">Aucune.</p>}
          </div>
        </div>

        {/* Derniers inscrits */}
        <div className="card p-3 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Derniers inscrits</h3>
          <div className="space-y-2">
            {recentUsers.map(u => (
              <div key={u.id} className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <span className="truncate min-w-0">{u.email}</span>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-light text-blue-dark">{u.role}</span>
                  <span className="text-text-muted whitespace-nowrap text-xs">{formatShortDate(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card p-2.5 sm:p-4 text-center">
      <p className="text-xl sm:text-3xl font-bold text-blue">{value}</p>
      <p className="text-[10px] sm:text-sm text-text-muted mt-0.5 sm:mt-1 leading-tight">{label}</p>
    </div>
  );
}
