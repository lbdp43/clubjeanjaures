import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    companyName: '', jobTitle: '', phone: '', address: '', city: '',
    website: '', description: '', lookingFor: '', canOffer: '',
    socialLinks: { linkedin: '', facebook: '', instagram: '' },
    visibility: { phone: 'public', email: 'public' }
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const logoRef = useRef();

  useEffect(() => {
    if (user?.member) {
      setForm({
        companyName: user.member.companyName || '',
        jobTitle: user.member.jobTitle || '',
        phone: user.member.phone || '',
        address: user.member.address || '',
        city: user.member.city || '',
        website: user.member.website || '',
        description: user.member.description || '',
        lookingFor: user.member.lookingFor || '',
        canOffer: user.member.canOffer || '',
        socialLinks: user.member.socialLinks || { linkedin: '', facebook: '', instagram: '' },
        visibility: user.member.visibility || { phone: 'public', email: 'public' }
      });
    }
  }, [user]);

  if (!user) return <Navigate to="/connexion" replace />;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      await api.updateMember(user.id, form);
      await refreshUser();
      setMsg('Profil enregistré.');
    } catch (err) {
      setMsg(err.message);
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photos', file);
    formData.append('type', 'logo');
    try {
      await api.uploadPhotos(user.id, formData);
      await refreshUser();
    } catch {}
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    formData.append('type', 'gallery');
    try {
      await api.uploadPhotos(user.id, formData);
      await refreshUser();
    } catch {}
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <h1 className="font-display text-2xl text-blue-dark">Mon profil</h1>

      <form onSubmit={handleSave} className="card p-4 sm:p-6 space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          {user.member?.logoUrl ? (
            <img src={user.member.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-blue-light flex items-center justify-center text-blue font-bold text-xl">
              {form.companyName?.charAt(0) || '?'}
            </div>
          )}
          <button type="button" onClick={() => logoRef.current?.click()} className="text-sm text-blue hover:underline">
            Modifier le logo
          </button>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        {/* Champs obligatoires */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Société *</label>
            <input value={form.companyName} onChange={e => setForm({...form, companyName: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Métier / Activité *</label>
            <input value={form.jobTitle} onChange={e => setForm({...form, jobTitle: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone *</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ville</label>
            <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse complète *</label>
          <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input-field" required />
        </div>

        {/* Champs optionnels */}
        <div>
          <label className="block text-sm font-medium mb-1">Site web</label>
          <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="input-field" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description de l'activité</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field resize-none" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ce que je recherche</label>
          <textarea value={form.lookingFor} onChange={e => setForm({...form, lookingFor: e.target.value})} className="input-field resize-none" rows={2} placeholder="Ex : bars et restaurants partenaires" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ce que je peux apporter</label>
          <textarea value={form.canOffer} onChange={e => setForm({...form, canOffer: e.target.value})} className="input-field resize-none" rows={2} />
        </div>

        {/* Réseaux sociaux */}
        <h3 className="font-semibold text-sm text-text-muted pt-2">Réseaux sociaux</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input
            placeholder="LinkedIn"
            value={form.socialLinks.linkedin || ''}
            onChange={e => setForm({...form, socialLinks: {...form.socialLinks, linkedin: e.target.value}})}
            className="input-field text-sm"
          />
          <input
            placeholder="Facebook"
            value={form.socialLinks.facebook || ''}
            onChange={e => setForm({...form, socialLinks: {...form.socialLinks, facebook: e.target.value}})}
            className="input-field text-sm"
          />
          <input
            placeholder="Instagram"
            value={form.socialLinks.instagram || ''}
            onChange={e => setForm({...form, socialLinks: {...form.socialLinks, instagram: e.target.value}})}
            className="input-field text-sm"
          />
        </div>

        {/* Visibilité */}
        <h3 className="font-semibold text-sm text-text-muted pt-2">Visibilité pour les visiteurs</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm mb-1">Téléphone</label>
            <select value={form.visibility.phone} onChange={e => setForm({...form, visibility: {...form.visibility, phone: e.target.value}})} className="input-field">
              <option value="public">Visible publiquement</option>
              <option value="members">Membres uniquement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <select value={form.visibility.email} onChange={e => setForm({...form, visibility: {...form.visibility, email: e.target.value}})} className="input-field">
              <option value="public">Visible publiquement</option>
              <option value="members">Membres uniquement</option>
            </select>
          </div>
        </div>

        {msg && <p className={`text-sm ${msg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Enregistrer le profil'}
        </button>
      </form>

      {/* Photos */}
      <div className="card p-4 sm:p-6">
        <h3 className="font-semibold mb-4">Photos de l'entreprise</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {(user.member?.photos || []).map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="rounded-xl object-cover w-full h-24" />
              <button
                onClick={async () => { await api.deletePhoto(user.id, i); refreshUser(); }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <label className="text-sm text-blue hover:underline cursor-pointer">
          + Ajouter des photos
          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>
    </div>
  );
}
