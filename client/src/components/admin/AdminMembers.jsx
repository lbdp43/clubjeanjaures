import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

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

  const handleCopyLink = () => {
    const url = `${window.location.origin}/inscription`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Lien d'inscription */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Inviter de nouveaux membres</h3>
        <p className="text-sm text-text-muted mb-3">Copiez le lien d'inscription et partagez-le directement.</p>
        <button onClick={handleCopyLink} className="btn-primary text-sm flex items-center gap-2">
          {linkCopied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Lien copié !
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copier le lien d'inscription
            </>
          )}
        </button>
      </div>

      {/* Liste */}
      <div className="card p-4 sm:p-5">
        <h3 className="font-semibold mb-4 text-sm sm:text-base">Membres ({members.length})</h3>
        <div className="space-y-2">
          {members.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              expanded={expandedId === m.id}
              onToggleExpand={() => setExpandedId(expandedId === m.id ? null : m.id)}
              onRoleChange={handleRoleChange}
              onStatusToggle={handleStatusToggle}
              onDelete={handleDelete}
              onUpdate={(updated) => setMembers(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member: m, expanded, onToggleExpand, onRoleChange, onStatusToggle, onDelete, onUpdate }) {
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [profileMsg, setProfileMsg] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const initProfileForm = () => {
    setProfileForm({
      companyName: m.member?.companyName || '',
      jobTitle: m.member?.jobTitle || '',
      phone: m.member?.phone || '',
      address: m.member?.address || '',
      city: m.member?.city || '',
      website: m.member?.website || '',
      description: m.member?.description || '',
      lookingFor: m.member?.lookingFor || '',
      canOffer: m.member?.canOffer || ''
    });
  };

  const handleExpand = () => {
    if (!expanded) initProfileForm();
    onToggleExpand();
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    if (passwordForm.password.length < 6) {
      setPwMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPwMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    setPwLoading(true);
    try {
      await api.resetPassword(m.id, passwordForm.password);
      setPwMsg('Mot de passe modifié avec succès.');
      setPasswordForm({ password: '', confirm: '' });
    } catch (err) {
      setPwMsg(err.message);
    }
    setPwLoading(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileLoading(true);
    try {
      const updated = await api.adminUpdateProfile(m.id, profileForm);
      onUpdate({ id: m.id, member: updated });
      setProfileMsg('Profil mis à jour.');
    } catch (err) {
      setProfileMsg(err.message);
    }
    setProfileLoading(false);
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      {/* Header row */}
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={handleExpand}
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{m.member?.companyName || m.email}</p>
          <p className="text-sm text-text-muted truncate">{m.email}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
          <select
            value={m.role}
            onChange={e => onRoleChange(m.id, e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1"
          >
            <option value="visitor">Visiteur</option>
            <option value="member">Membre</option>
            <option value="moderator">Modérateur</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => onStatusToggle(m)}
            className={`text-sm px-3 py-1 rounded-full ${
              m.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {m.status === 'active' ? 'Actif' : 'Suspendu'}
          </button>
          <button
            onClick={() => onDelete(m.id)}
            className="text-sm text-red-500 hover:underline"
          >
            Supprimer
          </button>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50/50">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'profile' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'password' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
              }`}
            >
              Mot de passe
            </button>
          </div>

          {/* Profile tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Entreprise</label>
                  <input value={profileForm.companyName || ''} onChange={e => setProfileForm({...profileForm, companyName: e.target.value})} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fonction</label>
                  <input value={profileForm.jobTitle || ''} onChange={e => setProfileForm({...profileForm, jobTitle: e.target.value})} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
                  <input value={profileForm.phone || ''} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Site web</label>
                  <input value={profileForm.website || ''} onChange={e => setProfileForm({...profileForm, website: e.target.value})} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
                  <input value={profileForm.address || ''} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="input-field text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
                  <input value={profileForm.city || ''} onChange={e => setProfileForm({...profileForm, city: e.target.value})} className="input-field text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={profileForm.description || ''} onChange={e => setProfileForm({...profileForm, description: e.target.value})} className="input-field text-sm resize-none" rows={2} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ce que je recherche</label>
                  <textarea value={profileForm.lookingFor || ''} onChange={e => setProfileForm({...profileForm, lookingFor: e.target.value})} className="input-field text-sm resize-none" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ce que je peux apporter</label>
                  <textarea value={profileForm.canOffer || ''} onChange={e => setProfileForm({...profileForm, canOffer: e.target.value})} className="input-field text-sm resize-none" rows={2} />
                </div>
              </div>
              {profileMsg && <p className={`text-sm ${profileMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{profileMsg}</p>}
              <button type="submit" className="btn-primary text-sm" disabled={profileLoading}>
                {profileLoading ? 'Sauvegarde...' : 'Enregistrer le profil'}
              </button>
            </form>
          )}

          {/* Password tab */}
          {activeTab === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordForm.password}
                    onChange={e => setPasswordForm({...passwordForm, password: e.target.value})}
                    className="input-field text-sm"
                    placeholder="Min. 6 caractères"
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Confirmer</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    className="input-field text-sm"
                    placeholder="Confirmer le mot de passe"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              {pwMsg && <p className={`text-sm ${pwMsg.includes('succès') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>}
              <button type="submit" className="btn-primary text-sm" disabled={pwLoading}>
                {pwLoading ? 'Modification...' : 'Modifier le mot de passe'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
