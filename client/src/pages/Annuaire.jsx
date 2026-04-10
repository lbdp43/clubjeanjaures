import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import MemberCard from '../components/annuaire/MemberCard';

export default function Annuaire() {
  const { user, isMember } = useAuth();
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      try {
        if (isMember) {
          const data = await api.getMembers(search || undefined);
          setMembers(data);
        } else {
          const data = await api.getPublicMembers();
          setMembers(data);
        }
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchMembers, 300);
    return () => clearTimeout(timeout);
  }, [search, isMember]);

  const filteredMembers = !isMember && search
    ? members.filter(m =>
        m.companyName?.toLowerCase().includes(search.toLowerCase()) ||
        m.jobTitle?.toLowerCase().includes(search.toLowerCase()) ||
        m.city?.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-blue-dark">Annuaire</h1>
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-sm text-blue hover:underline"
        >
          {showMap ? 'Vue liste' : 'Vue carte'}
        </button>
      </div>

      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
          placeholder="Rechercher un membre, métier, ville..."
        />
        <svg className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
        </div>
      ) : showMap ? (
        <MapView members={filteredMembers} />
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

function MapView({ members }) {
  const membersWithCoords = members.filter(m => m.latitude && m.longitude);

  if (membersWithCoords.length === 0) {
    return <p className="text-text-muted text-center py-8">Aucun membre géolocalisé.</p>;
  }

  return (
    <div className="card p-0 overflow-hidden" style={{ height: 'min(500px, 70vh)' }}>
      <MapContainer members={membersWithCoords} />
    </div>
  );
}

function MapContainer({ members }) {
  const mapRef = useRef(null);

  useEffect(() => {
    let map;
    import('leaflet').then((mod) => {
      const L = mod.default || mod;
      // Charger le CSS Leaflet
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Fix icônes Leaflet manquantes avec les bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!mapRef.current) return;
      map = L.map(mapRef.current).setView([45.4397, 4.3872], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      members.forEach(m => {
        L.marker([m.latitude, m.longitude])
          .addTo(map)
          .bindPopup(`<strong>${m.companyName}</strong><br/>${m.jobTitle}`);
      });

      // Ajuster la vue si des membres existent
      if (members.length > 0) {
        const bounds = L.latLngBounds(members.map(m => [m.latitude, m.longitude]));
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    });

    return () => { if (map) map.remove(); };
  }, [members]);

  return <div ref={mapRef} className="w-full h-full" />;
}
