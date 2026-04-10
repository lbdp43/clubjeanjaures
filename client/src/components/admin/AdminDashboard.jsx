import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatShortDate } from '../../utils/helpers';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, upcomingEvents, recentPosts, recentUsers } = data;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Membres actifs" value={stats.activeMembers} />
        <StatCard label="Suspendus" value={stats.suspendedMembers} />
        <StatCard label="Total inscrits" value={stats.totalUsers} />
        <StatCard label="Demandes" value={stats.activeDemands} />
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Prochains événements */}
        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold mb-4">Prochains événements</h3>
          <div className="space-y-3">
            {upcomingEvents.map(e => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-blue font-semibold">{formatShortDate(e.date)}</span>
                <span className="truncate">{e.title}</span>
              </div>
            ))}
            {upcomingEvents.length === 0 && <p className="text-text-muted text-sm">Aucun.</p>}
          </div>
        </div>

        {/* Publications récentes */}
        <div className="card p-4 sm:p-5">
          <h3 className="font-semibold mb-4">Publications récentes</h3>
          <div className="space-y-3">
            {recentPosts.map(p => (
              <div key={p.id} className="text-sm">
                <span className="font-medium">{p.author?.member?.companyName || p.author?.email}</span>
                <p className="text-text-muted truncate">{p.content}</p>
              </div>
            ))}
            {recentPosts.length === 0 && <p className="text-text-muted text-sm">Aucune.</p>}
          </div>
        </div>

        {/* Derniers inscrits */}
        <div className="card p-4 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold mb-4">Derniers inscrits</h3>
          <div className="space-y-2">
            {recentUsers.map(u => (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 sm:gap-3">
                <span className="truncate">{u.email}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="badge bg-blue-light text-blue-dark">{u.role}</span>
                  <span className="text-text-muted whitespace-nowrap">{formatShortDate(u.createdAt)}</span>
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
    <div className="card p-3 sm:p-4 text-center">
      <p className="text-2xl sm:text-3xl font-bold text-blue">{value}</p>
      <p className="text-xs sm:text-sm text-text-muted mt-1">{label}</p>
    </div>
  );
}
