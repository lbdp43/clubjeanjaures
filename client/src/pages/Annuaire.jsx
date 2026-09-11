import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import MemberCard from '../components/annuaire/MemberCard';

export default function Annuaire() {
  const { user, isMember } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('');

  // Seule la saisie texte est différée ; le chargement initial et les filtres sont immédiats
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const { data: sectors = [] } = useCachedFetch('sectors', () => api.getSectors());

  const scope = isMember ? `m:${user?.id}` : 'public';
  const serverSearch = isMember ? debouncedSearch : '';
  const { data: members = [], loading, error, refetch } = useCachedFetch(
    `annuaire:${scope}:${selectedSector}:${serverSearch}`,
    () => isMember
      ? api.getMembers({ search: serverSearch || undefined, sector: selectedSector || undefined })
      : api.getPublicMembers({ sector: selectedSector || undefined }),
    { persist: !serverSearch }
  );

  const needle = search.trim().toLowerCase();
  const filteredMembers = !isMember && needle
    ? members.filter(m =>
        m.companyName?.toLowerCase().includes(needle) ||
        m.jobTitle?.toLowerCase().includes(needle) ||
        m.city?.toLowerCase().includes(needle) ||
        m.sector?.toLowerCase().includes(needle)
      )
    : members;

  return (
    <div className="space-y-6">
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
        <div className="text-center py-4">
          <p className="text-red-500 text-sm mb-2">Impossible de charger l'annuaire. Vérifiez votre connexion.</p>
          <button onClick={refetch} className="text-sm text-blue hover:underline">Réessayer</button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredMembers.map(m => (
            <MemberCard key={m.id} member={m} />
          ))}
          {filteredMembers.length === 0 && !error && (
            <p className="text-text-muted col-span-full text-center py-8">Aucun résultat.</p>
          )}
        </div>
      )}
    </div>
  );
}
