import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMembers();
      setMembers(data);
    } catch {}
    setLoading(false);
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.updateRole(id, role);
      setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    } catch {}
  };

  const handleStatusToggle = async (member) => {
    const newStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      await api.updateStatus(member.id, newStatus);
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, status: newStatus } : m));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer définitivement ce membre ?')) return;
    try {
      await api.deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch {}
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.sendInvite(inviteEmail);
      setInviteMsg('Invitation envoyée !');
      setInviteEmail('');
    } catch (err) {
      setInviteMsg(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Invitation */}
      <div className="card p-5">
        <h3 className="font-semibold mb-3">Inviter un nouveau membre</h3>
        <form onSubmit={handleInvite} className="flex gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            className="input-field"
            placeholder="email@exemple.fr"
            required
          />
          <button type="submit" className="btn-primary text-sm whitespace-nowrap">Inviter</button>
        </form>
        {inviteMsg && <p className="text-sm text-green-600 mt-2">{inviteMsg}</p>}
      </div>

      {/* Liste */}
      <div className="card p-5">
        <h3 className="font-semibold mb-4">Membres ({members.length})</h3>
        <div className="space-y-3">
          {members.map(m => (
            <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{m.member?.companyName || m.email}</p>
                <p className="text-sm text-text-muted">{m.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1"
                >
                  <option value="visitor">Visiteur</option>
                  <option value="member">Membre</option>
                  <option value="moderator">Modérateur</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => handleStatusToggle(m)}
                  className={`text-sm px-3 py-1 rounded-full ${
                    m.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {m.status === 'active' ? 'Actif' : 'Suspendu'}
                </button>
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-sm text-red-500 hover:underline"
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
