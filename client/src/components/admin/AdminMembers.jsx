import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';

const SECTORS = [
  'Artisanat', 'Automobile', 'BTP / Construction', 'Commerce', 'Communication / Marketing',
  'Comptabilité / Finance', 'Conseil', 'Culture / Loisirs', 'Droit / Juridique',
  'Éducation / Formation', 'Environnement', 'Immobilier', 'Industrie',
  'Informatique / Digital', 'Médical / Santé', 'Restauration / Hôtellerie',
  'Services aux entreprises', 'Services à la personne', 'Sport / Bien-être',
  'Transport / Logistique', 'Autre'
];

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
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
    } catch (err) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/inscription`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteMsg('');
    setInviteLoading(true);
    try {
      await api.sendInvite(inviteEmail);
      setInviteMsg(`Invitation envoyée à ${inviteEmail}`);
      setInviteEmail('');
    } catch (err) {
      setInviteMsg(err.message || "Erreur lors de l'envoi");
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Inviter un membre */}
      <div className="card p-3 sm:p-5">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Inviter de nouveaux membres</h3>

        {/* Invitation par email */}
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 mb-4">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@exemple.fr"
            className="input-field flex-1 text-sm"
            required
          />
          <button type="submit" className="btn-primary text-xs sm:text-sm whitespace-nowrap flex items-center justify-center gap-2" disabled={inviteLoading}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            {inviteLoading ? 'Envoi...' : 'Envoyer l\'invitation'}
          </button>
        </form>
        {inviteMsg && (
          <p className={`text-sm mb-3 ${inviteMsg.includes('Erreur') || inviteMsg.includes('Impossible') ? 'text-red-500' : 'text-green-600'}`}>
            {inviteMsg}
          </p>
        )}

        {/* Copier le lien */}
        <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-text-muted mb-2">Ou partagez le lien d'inscription directement :</p>
          <button onClick={handleCopyLink} className="text-sm text-blue hover:underline flex items-center gap-2">
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
      </div>

      {/* Liste */}
      <div className="card p-3 sm:p-5">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <h3 className="font-semibold text-sm sm:text-base">Membres ({members.length})</h3>
          <a
            href="/api/admin/members/export"
            download
            className="text-xs sm:text-sm text-blue hover:underline flex items-center gap-1.5 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exporter en .txt
          </a>
        </div>
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
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState('');
  const profilePhotoRef = useRef();
  const logoRef = useRef();

  const initProfileForm = () => {
    setProfileForm({
      companyName: m.member?.companyName || '',
      jobTitle: m.member?.jobTitle || '',
      phone: m.member?.phone || '',
      address: m.member?.address || '',
      city: m.member?.city || '',
      sector: m.member?.sector || '',
      website: m.member?.website || '',
      description: m.member?.description || '',
      lookingFor: m.member?.lookingFor || '',
      canOffer: m.member?.canOffer || '',
      visibility: m.member?.visibility || { phone: 'public', email: 'public' }
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

  const handlePhotoUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoMsg('');
    try {
      const formData = new FormData();
      formData.append('photos', file);
      formData.append('type', type);
      const result = await api.uploadPhotos(m.id, formData);
      const url = result.urls?.[0];
      if (url) {
        const updatedMember = { ...m.member };
        if (type === 'profile') updatedMember.photoUrl = url;
        if (type === 'logo') updatedMember.logoUrl = url;
        onUpdate({ id: m.id, member: updatedMember });
      }
      setPhotoMsg(`${type === 'profile' ? 'Photo de profil' : 'Logo'} mis à jour.`);
    } catch (err) {
      setPhotoMsg(err.message || "Erreur lors de l'upload");
    }
    setPhotoUploading(false);
    e.target.value = '';
  };

  const handleDeletePhoto = async (type) => {
    if (!confirm(`Supprimer ${type === 'profile' ? 'la photo de profil' : 'le logo'} ?`)) return;
    setPhotoUploading(true);
    setPhotoMsg('');
    try {
      await api.deleteProfilePhoto(m.id, type);
      const updatedMember = { ...m.member };
      if (type === 'profile') updatedMember.photoUrl = null;
      if (type === 'logo') updatedMember.logoUrl = null;
      onUpdate({ id: m.id, member: updatedMember });
      setPhotoMsg(`${type === 'profile' ? 'Photo de profil' : 'Logo'} supprimé.`);
    } catch (err) {
      setPhotoMsg(err.message || 'Erreur lors de la suppression');
    }
    setPhotoUploading(false);
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
      <div className="p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleExpand}>
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate text-sm sm:text-base">{m.member?.companyName || m.email}</p>
            <p className="text-xs sm:text-sm text-text-muted truncate">{m.email}</p>
          </div>
          <svg className={`w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
          <select
            value={m.role}
            onChange={e => onRoleChange(m.id, e.target.value)}
            className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2 py-1.5"
          >
            <option value="visitor">Visiteur</option>
            <option value="member">Membre</option>
            <option value="moderator">Modérateur</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => onStatusToggle(m)}
            className={`text-xs sm:text-sm px-3 py-1.5 rounded-full ${
              m.status === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {m.status === 'active' ? 'Actif' : 'Suspendu'}
          </button>
          <button
            onClick={() => onDelete(m.id)}
            className="text-xs sm:text-sm text-red-500 hover:underline ml-auto"
          >
            Supprimer
          </button>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-100 p-3 sm:p-4 bg-gray-50/50">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'profile' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
              }`}
            >
              Profil
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                activeTab === 'photos' ? 'bg-white text-blue shadow-sm' : 'text-text-muted'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-1.5 px-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium transition-colors ${
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
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Secteur d'activité</label>
                  <select
                    value={profileForm.sector || ''}
                    onChange={e => setProfileForm({...profileForm, sector: e.target.value})}
                    className="input-field text-sm"
                  >
                    <option value="">Choisir un secteur…</option>
                    {SECTORS.map(s => (<option key={s} value={s}>{s}</option>))}
                  </select>
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
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-2">Visibilité pour les non-membres</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                    <select
                      value={profileForm.visibility?.phone || 'public'}
                      onChange={e => setProfileForm({...profileForm, visibility: {...(profileForm.visibility || {}), phone: e.target.value}})}
                      className="input-field text-sm"
                    >
                      <option value="public">Visible publiquement</option>
                      <option value="members">Membres uniquement</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <select
                      value={profileForm.visibility?.email || 'public'}
                      onChange={e => setProfileForm({...profileForm, visibility: {...(profileForm.visibility || {}), email: e.target.value}})}
                      className="input-field text-sm"
                    >
                      <option value="public">Visible publiquement</option>
                      <option value="members">Membres uniquement</option>
                    </select>
                  </div>
                </div>
              </div>
              {profileMsg && <p className={`text-sm ${profileMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{profileMsg}</p>}
              <button type="submit" className="btn-primary text-sm" disabled={profileLoading}>
                {profileLoading ? 'Sauvegarde...' : 'Enregistrer le profil'}
              </button>
            </form>
          )}

          {/* Photos tab */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Photo de profil */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-2">Photo de profil</p>
                  <div className="flex items-center gap-3">
                    {m.member?.photoUrl ? (
                      <img src={m.member.photoUrl} alt="Profil" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Aucune</div>
                    )}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => profilePhotoRef.current?.click()}
                        className="text-xs sm:text-sm text-blue hover:underline text-left"
                        disabled={photoUploading}
                      >
                        {photoUploading ? 'Upload...' : 'Changer'}
                      </button>
                      {m.member?.photoUrl && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto('profile')}
                          className="text-xs text-red-500 hover:underline text-left"
                          disabled={photoUploading}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    <input ref={profilePhotoRef} type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'profile')} className="hidden" />
                  </div>
                </div>
                {/* Logo entreprise */}
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-2">Logo entreprise</p>
                  <div className="flex items-center gap-3">
                    {m.member?.logoUrl ? (
                      <img src={m.member.logoUrl} alt="Logo" className="w-14 h-14 rounded-lg object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Aucun</div>
                    )}
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => logoRef.current?.click()}
                        className="text-xs sm:text-sm text-blue hover:underline text-left"
                        disabled={photoUploading}
                      >
                        {photoUploading ? 'Upload...' : 'Changer'}
                      </button>
                      {m.member?.logoUrl && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto('logo')}
                          className="text-xs text-red-500 hover:underline text-left"
                          disabled={photoUploading}
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    <input ref={logoRef} type="file" accept="image/*" onChange={e => handlePhotoUpload(e, 'logo')} className="hidden" />
                  </div>
                </div>
              </div>
              {photoMsg && <p className={`text-sm ${photoMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{photoMsg}</p>}
              <p className="text-xs text-text-muted">Les images sont redimensionnées et orientées automatiquement.</p>
            </div>
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
