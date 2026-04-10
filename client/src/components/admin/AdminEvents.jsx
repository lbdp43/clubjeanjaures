import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { formatDate, formatTime, getEventTypeLabel } from '../../utils/helpers';

const emptyForm = {
  title: '', type: 'matinale', date: '', timeStart: '07:30',
  timeEnd: '', location: 'Saint-Étienne', description: '', speaker: ''
};

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEvents(); }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents();
      setEvents(data);
    } catch {}
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (e) => {
    setEditingId(e.id);
    setForm({
      title: e.title || '',
      type: e.type || 'matinale',
      date: e.date ? e.date.slice(0, 10) : '',
      timeStart: e.timeStart || '',
      timeEnd: e.timeEnd || '',
      location: e.location || '',
      description: e.description || '',
      speaker: e.speaker || ''
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.updateEvent(editingId, form);
        setEvents(prev => prev.map(ev => ev.id === editingId ? updated : ev));
      } else {
        await api.createEvent(form);
        await loadEvents();
      }
      cancelForm();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet événement ?')) return;
    try {
      await api.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Événements ({events.length})</h3>
        <button onClick={showForm ? cancelForm : openCreate} className="btn-primary text-sm py-2 px-4">
          {showForm ? 'Annuler' : '+ Créer'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-4 sm:p-5 space-y-4">
          <h4 className="font-semibold text-sm text-blue-dark">
            {editingId ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="input-field">
                <option value="matinale">Matinale</option>
                <option value="afterwork">Afterwork</option>
                <option value="formation">Formation</option>
                <option value="conference">Conférence</option>
                <option value="special">Spécial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Heure début</label>
              <input type="time" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Heure fin</label>
              <input type="time" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lieu / Adresse</label>
              <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="input-field" placeholder="Adresse complète" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input-field resize-none" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Intervenant(s)</label>
            <input value={form.speaker} onChange={e => setForm({...form, speaker: e.target.value})} className="input-field" />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Enregistrement...' : editingId ? 'Enregistrer les modifications' : 'Créer l\'événement'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-3">
          {events.map(e => (
            <div key={e.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{e.title}</p>
                <p className="text-sm text-text-muted">
                  {formatDate(e.date)} — {formatTime(e.timeStart)} — {getEventTypeLabel(e.type)}
                </p>
                {e.location && (
                  <p className="text-xs text-text-muted mt-0.5">{e.location}</p>
                )}
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button onClick={() => openEdit(e)} className="text-sm text-blue hover:underline whitespace-nowrap">
                  Modifier
                </button>
                <button onClick={() => handleDelete(e.id)} className="text-sm text-red-500 hover:underline whitespace-nowrap">
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
