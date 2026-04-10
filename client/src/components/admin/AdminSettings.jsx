import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const logoRef = useRef();

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setMsg('Paramètres enregistrés.');
    } catch {
      setMsg('Erreur lors de la sauvegarde.');
    }
    setSaving(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.uploadClubLogo(formData);
      setSettings(prev => ({ ...prev, logoUrl: res.logoUrl }));
    } catch {}
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" /></div>;
  }

  if (!settings) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={handleSave} className="card p-4 sm:p-5 space-y-4">
        <h3 className="font-semibold text-sm sm:text-base">Paramètres du club</h3>

        <div className="flex items-center gap-4 mb-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-blue-light flex items-center justify-center text-blue font-bold text-xl">JJ</div>
          )}
          <button type="button" onClick={() => logoRef.current?.click()} className="text-sm text-blue hover:underline">
            Changer le logo
          </button>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nom du club</label>
          <input value={settings.name || ''} onChange={e => setSettings({...settings, name: e.target.value})} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea value={settings.description || ''} onChange={e => setSettings({...settings, description: e.target.value})} className="input-field resize-none" rows={3} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Email de contact</label>
            <input value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Téléphone</label>
            <input value={settings.contactPhone || ''} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="input-field" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adresse</label>
          <input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} className="input-field" />
        </div>

        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
