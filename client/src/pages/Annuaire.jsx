import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import MemberCard from '../components/annuaire/MemberCard';

export default function Annuaire() {
  const { user, isMember } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const searchTimeout = useRef(null);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState('');

  useEffect(() => {
    api.getSectors().then(setSectors).catch(() => {});
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      setError(false);
      try {
        if (isMember) {
          const data = await api.getMembers({ search: search || undefined, sector: selectedSector || undefined });
          setMembers(data);
        } else {
          const data = await api.getPublicMembers({ sector: selectedSector || undefined });
          setMembers(data);
        }
      } catch {
        setMembers([]);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(fetchMembers, 400);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, isMember, selectedSector]);

  const filteredMembers = !isMember && search
    ? members.filter(m =>
        m.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        m.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        m.city?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div className="space-y-6 fade-in">
      <h1 className="font-display text-2xl text-blue-dark">Annuaire</h1>

      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Rechercher un membre, métier, ville..."
          aria-label="Rechercher un membre"
        />
        <svg className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      {sectors.length > 0 && (
        <div>
          <p className="text-xs text-text-muted mb-2">Filtrer par métier / activité :</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            <button
              onClick={() => setSelectedSector('')}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
                !selectedSector
                  ? 'bg-blue text-white'
                  : 'bg-white text-text-muted border border-gray-200 hover:border-blue'
              }`}
            >
              Tous
            </button>
            {sectors.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSector(s === selectedSector ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  selectedSector === s
                    ? 'bg-blue text-white'
                    : 'bg-white text-text-muted border border-gray-200 hover:border-blue'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-red-500 text-sm py-4">
          Impossible de charger les données. Vérifiez votre connexion.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredMembers.map(m => (
            <MemberCard key={m.id} member={m} />
          ))}
          {filteredMembers.length === 0 && (
            <p className="text-text-muted col-span-full text-center py-8">Aucun résultat.</p>
          )}
        </div>
      )}
    </div>
  );
}
