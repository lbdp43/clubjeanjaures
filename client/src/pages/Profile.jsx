import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { whatsappLink, mapsUrl } from '../utils/helpers';

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
  const [uploadMsg, setUploadMsg] = useState('');
  const [uploading, setUploading] = useState(false);
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
    setUploading(true);
    setUploadMsg('');
    const formData = new FormData();
    formData.append('photos', file);
    formData.append('type', 'logo');
    try {
      await api.uploadPhotos(user.id, formData);
      await refreshUser();
      setUploadMsg('Logo mis à jour.');
    } catch (err) {
      setUploadMsg(`Erreur logo : ${err.message}`);
    }
    setUploading(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setUploadMsg('');
    const formData = new FormData();
    files.forEach(f => formData.append('photos', f));
    formData.append('type', 'gallery');
    try {
      await api.uploadPhotos(user.id, formData);
      await refreshUser();
      setUploadMsg('Photos ajoutées.');
    } catch (err) {
      setUploadMsg(`Erreur photos : ${err.message}`);
    }
    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <h1 className="font-display text-2xl text-blue-dark">Mon profil</h1>

      <form onSubmit={handleSave} className="card p-4 sm:p-6 space-y-5">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {user.member?.logoUrl ? (
              <img src={user.member.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-blue-light flex items-center justify-center text-blue font-bold text-xl">
                {form.companyName?.charAt(0) || '?'}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <div className="animate-spin w-6 h-6 border-3 border-blue border-t-transparent rounded-full" />
              </div>
            )}
          </div>
          <div>
            <button type="button" onClick={() => logoRef.current?.click()} className={`text-sm text-blue hover:underline ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              Modifier le logo
            </button>
            {uploadMsg && uploadMsg.includes('Logo') && (
              <p className={`text-xs mt-1 ${uploadMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{uploadMsg}</p>
            )}
          </div>
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
      <div className="card p-4 sm:p-6 relative">
        {uploading && (
          <div className="absolute inset-0 bg-white/80 rounded-card flex flex-col items-center justify-center z-10">
            <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
            <p className="text-sm text-text-muted mt-2">Envoi en cours...</p>
          </div>
        )}
        <h3 className="font-semibold mb-4">Photos de l'entreprise</h3>
        {uploadMsg && (
          <p className={`text-sm mb-3 ${uploadMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>{uploadMsg}</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {(user.member?.photos || []).map((url, i) => (
            <div key={i} className="relative">
              <img src={url} alt="" className="rounded-xl object-cover w-full h-24" />
              <button
                onClick={async () => {
                  try { await api.deletePhoto(user.id, i); refreshUser(); }
                  catch (err) { setUploadMsg(`Erreur suppression : ${err.message}`); }
                }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
        <label className={`text-sm text-blue hover:underline cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          + Ajouter des photos
          <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>

      {/* Aperçu des liens de contact */}
      {(form.phone || user?.email || form.website || form.socialLinks?.linkedin || form.socialLinks?.facebook || form.socialLinks?.instagram || form.address) && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold mb-4">Aperçu de vos liens de contact</h3>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-4">
            {form.phone && (
              <a href={`tel:${form.phone}`} className="btn-primary text-sm py-2 px-4 text-center">
                Appeler
              </a>
            )}
            {user?.email && (
              <a href={`mailto:${user.email}`} className="btn-secondary text-sm py-2 px-4 text-center">
                Email
              </a>
            )}
            {form.phone && (
              <a href={whatsappLink(form.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 text-center">
                WhatsApp
              </a>
            )}
            {form.website && (
              <a href={form.website} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 text-center">
                Site web
              </a>
            )}
          </div>
          <div className="space-y-2 text-sm">
            {form.address && (
              <p>
                <span className="text-text-muted">Adresse :</span>{' '}
                <a href={mapsUrl(form.address)} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline inline-flex items-center gap-1">
                  {form.address}
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {form.socialLinks?.linkedin && (
                <a href={form.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">
                  LinkedIn
                </a>
              )}
              {form.socialLinks?.facebook && (
                <a href={form.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">
                  Facebook
                </a>
              )}
              {form.socialLinks?.instagram && (
                <a href={form.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline">
                  Instagram
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
