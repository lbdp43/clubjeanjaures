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
  const [testEmail, setTestEmail] = useState('');
  const [testDaysBefore, setTestDaysBefore] = useState(10);
  const [testSending, setTestSending] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [customEmails, setCustomEmails] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customJoinLink, setCustomJoinLink] = useState(true);
  const [customSending, setCustomSending] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  useEffect(() => {
    api.getSettings().then(data => setSettings({ ...data, publicAgenda: data.publicAgenda ?? true })).catch(() => {}).finally(() => setLoading(false));
    api.getMe().then(me => setTestEmail(me.email || '')).catch(() => {});
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

  const handleSendTest = async (e) => {
    e.preventDefault();
    setTestMsg('');
    setTestSending(true);
    try {
      const res = await api.sendReminderTest(testEmail, testDaysBefore);
      setTestMsg(`Email de test envoyé à ${res.email}. Regarde ta boîte dans quelques secondes.`);
    } catch (err) {
      setTestMsg(err.message || 'Erreur lors de l\'envoi du test.');
    } finally {
      setTestSending(false);
    }
  };

  const handleSendCustomEmail = async (e) => {
    e.preventDefault();
    const count = customEmails.split(/[,;\n]+/).filter(e => e.trim()).length;
    if (!confirm(`Envoyer cet email à ${count} adresse(s) ?`)) return;
    setCustomMsg('');
    setCustomSending(true);
    try {
      const res = await api.sendCustomEmail({
        emails: customEmails,
        subject: customSubject,
        message: customMessage,
        includeJoinLink: customJoinLink
      });
      setCustomMsg(res.message || `Email envoyé à ${res.sent} adresse(s).`);
      setCustomEmails('');
      setCustomSubject('');
      setCustomMessage('');
    } catch (err) {
      setCustomMsg(err.message || "Erreur lors de l'envoi.");
    } finally {
      setCustomSending(false);
    }
  };

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
    } finally {
      setEmailSending(false);
    }
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

        {/* Rappels d'événements */}
        <div className="py-3 border-b border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="pr-3">
              <p className="text-sm font-medium">Rappels d'événements par email</p>
              <p className="text-xs text-text-muted">Relance automatique aux membres qui n'ont pas répondu</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings({...settings, eventRemindersEnabled: !settings.eventRemindersEnabled})}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                settings.eventRemindersEnabled ? 'bg-blue' : 'bg-gray-300'
              }`}
              aria-label="Activer les rappels"
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                settings.eventRemindersEnabled ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          {settings.eventRemindersEnabled && (
            <div className="space-y-3 pl-2 border-l-2 border-blue-light">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5">
                  Envoyer les rappels à J-… (en jours avant l'événement)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[15, 10, 7, 5, 3, 2, 1].map(d => {
                    const active = (settings.reminderDaysBefore || []).includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const current = settings.reminderDaysBefore || [];
                          const next = active ? current.filter(x => x !== d) : [...current, d];
                          setSettings({...settings, reminderDaysBefore: next.sort((a,b) => b-a)});
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                          active ? 'bg-blue text-white' : 'bg-white text-text-muted border border-gray-200'
                        }`}
                      >
                        J-{d}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  Par défaut : J-10 et J-5. Chaque membre ne reçoit qu'un rappel par déclencheur.
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  Message personnalisé (optionnel)
                </label>
                <textarea
                  value={settings.reminderMessage || ''}
                  onChange={e => setSettings({...settings, reminderMessage: e.target.value})}
                  className="input-field text-sm resize-none"
                  rows={3}
                  maxLength={1000}
                  placeholder="Ajout d'un mot du président, d'une précision sur l'événement…"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Le texte "Pense à dire si tu participes ou si tu ne participes pas" est déjà
                  inclus automatiquement dans l'email.
                </p>
              </div>
            </div>
          )}
        </div>

        {msg && <p className="text-sm text-green-600">{msg}</p>}
        <button type="submit" className="btn-primary text-sm w-full sm:w-auto" disabled={saving}>
          {saving ? 'Sauvegarde...' : 'Enregistrer'}
        </button>
      </form>

      {/* Test reminder email */}
      <form onSubmit={handleSendTest} className="card p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-semibold text-sm sm:text-base">Tester l'email de rappel</h3>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Envoie un email de démonstration à l'adresse de ton choix, sans impact sur les vrais rappels ni sur les autres membres.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Email destinataire</label>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              className="input-field text-sm"
              placeholder="ton.email@exemple.fr"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Simuler</label>
            <select
              value={testDaysBefore}
              onChange={e => setTestDaysBefore(parseInt(e.target.value, 10))}
              className="input-field text-sm"
            >
              <option value={10}>J-10</option>
              <option value={5}>J-5</option>
              <option value={2}>J-2</option>
              <option value={1}>J-1</option>
            </select>
          </div>
        </div>
        {testMsg && (
          <p className={`text-sm ${testMsg.includes('Erreur') || testMsg.includes('erreur') ? 'text-red-500' : 'text-green-600'}`}>
            {testMsg}
          </p>
        )}
        <button type="submit" className="btn-primary text-sm w-full sm:w-auto" disabled={testSending}>
          {testSending ? 'Envoi...' : 'Envoyer l\'email de test'}
        </button>
      </form>

      {/* Email personnalisé à une liste d'adresses */}
      <form onSubmit={handleSendCustomEmail} className="card p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div>
          <h3 className="font-semibold text-sm sm:text-base">Envoyer un email à des adresses personnalisées</h3>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Pour inviter des personnes extérieures au club, leur envoyer une info, etc.
          </p>
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Adresses email (une par ligne, ou séparées par des virgules)</label>
          <textarea
            value={customEmails}
            onChange={e => setCustomEmails(e.target.value)}
            className="input-field text-sm resize-none font-mono"
            rows={3}
            placeholder={"jean@exemple.fr\npierre@exemple.fr\nmarie@exemple.fr"}
            required
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Sujet</label>
          <input
            value={customSubject}
            onChange={e => setCustomSubject(e.target.value)}
            className="input-field text-sm"
            placeholder="Invitation au Club Jean Jaurès"
            required
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium mb-1">Message</label>
          <textarea
            value={customMessage}
            onChange={e => setCustomMessage(e.target.value)}
            className="input-field text-sm resize-none"
            rows={5}
            placeholder="Bonjour, je vous invite à découvrir le Club Jean Jaurès..."
            required
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={customJoinLink}
            onChange={e => setCustomJoinLink(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue focus:ring-blue"
          />
          <span className="text-xs sm:text-sm">Inclure un bouton "Rejoindre le Club Jean Jaurès" dans l'email</span>
        </label>
        {customMsg && (
          <p className={`text-sm ${customMsg.toLowerCase().includes('erreur') ? 'text-red-500' : 'text-green-600'}`}>
            {customMsg}
          </p>
        )}
        <button type="submit" className="btn-primary text-sm w-full sm:w-auto flex items-center justify-center gap-2" disabled={customSending}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          {customSending ? 'Envoi en cours...' : 'Envoyer'}
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
