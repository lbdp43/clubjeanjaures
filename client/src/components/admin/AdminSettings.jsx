import { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const logoRef = useRef();
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => {
    api.getSettings().then(data => setSettings({ ...data, publicAgenda: data.publicAgenda ?? true })).catch(() => {}).finally(() => setLoading(false));
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

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!confirm(`Envoyer cet email à tous les membres actifs ?`)) return;
    setEmailMsg('');
    setEmailSending(true);
    try {
      const res = await api.sendNotification(emailSubject, emailMessage);
      setEmailMsg(res.message || `Email envoyé à ${res.sent} membre(s).`);
      setEmailSubject('');
      setEmailMessage('');
    } catch (err) {
      setEmailMsg(err.message || "Erreur lors de l'envoi.");
    }
    setEmailSending(false);
  };

  if (!settings) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <form onSubmit={handleSave} className="card p-3 sm:p-5 space-y-3 sm:space-y-4">
        <h3 className="font-semibold text-sm sm:text-base">Paramètres du club</h3>

        <div className="flex items-center gap-3 sm:gap-4">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-blue-light flex items-center justify-center text-blue font-bold text-lg sm:text-xl flex-shrink-0">JJ</div>
          )}
          <button type="button" onClick={() => logoRef.current?.click()} className="text-xs sm:text-sm text-blue hover:underline">
            Changer le logo
          </button>
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Nom du club</label>
          <input value={settings.name || ''} onChange={e => setSettings({...settings, name: e.target.value})} className="input-field text-sm" />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
          <textarea value={settings.description || ''} onChange={e => setSettings({...settings, description: e.target.value})} className="input-field text-sm resize-none" rows={3} />
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Email de contact</label>
            <input value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="input-field text-sm" />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Téléphone</label>
            <input value={settings.contactPhone || ''} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="input-field text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Adresse</label>
          <input value={settings.address || ''} onChange={e => setSettings({...settings, address: e.target.value})} className="input-field text-sm" />
        </div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <p className="text-sm font-medium">Agenda public</p>
            <p className="text-xs text-text-muted">Les visiteurs non-membres peuvent voir l'agenda</p>
          </div>
          <button
            type="button"
            onClick={() => setSettings({...settings, publicAgenda: !settings.publicAgenda})}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings.publicAgenda ? 'bg-blue' : 'bg-gray-300'
            }`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
              settings.publicAgenda ? 'translate-x-5' : ''
            }`} />
          </button>
        </div>

        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" className="btn-primary text-sm w-full sm:w-auto" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </form>

      {/* Email notification section */}
      <form onSubmit={handleSendEmail} className="card p-3 sm:p-5 space-y-3 sm:space-y-4">
        <h3 className="font-semibold text-sm sm:text-base">Envoyer un email à tous les membres</h3>
        <p className="text-xs sm:text-sm text-text-muted">L'email sera envoyé à tous les membres actifs du club (hors visiteurs).</p>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Sujet</label>
          <input
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
            className="input-field text-sm"
            placeholder="Objet de l'email"
            required
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Message</label>
          <textarea
            value={emailMessage}
            onChange={e => setEmailMessage(e.target.value)}
            className="input-field text-sm resize-none"
            rows={4}
            placeholder="Contenu de l'email..."
            required
          />
        </div>
        {emailMsg && (
          <p className={`text-sm ${emailMsg.includes('Erreur') ? 'text-red-500' : 'text-green-600'}`}>
            {emailMsg}
          </p>
        )}
        <button type="submit" className="btn-primary text-sm w-full sm:w-auto flex items-center justify-center gap-2" disabled={emailSending}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          {emailSending ? 'Envoi en cours...' : 'Envoyer à tous'}
        </button>
      </form>
    </div>
  );
}
