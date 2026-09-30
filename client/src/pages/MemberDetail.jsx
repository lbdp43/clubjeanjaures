import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { useCachedFetch } from '../hooks/useCachedFetch';
import { whatsappLink, mapsUrl, imgUrl } from '../utils/helpers';

export default function MemberDetail() {
  const { id } = useParams();
  const { user, isMember } = useAuth();
  const [msg, setMsg] = useState('');
  const userId = user?.id;

  const { data: member, loading, error, refetch } = useCachedFetch(
    `member:${id}:${userId || 'anon'}`,
    () => api.getMember(id)
  );
  const { data: favorites = [], setData: setFavorites } = useCachedFetch(
    `favorites:${userId}`,
    () => api.getFavorites(),
    { enabled: !!userId }
  );
  const isFav = favorites.some(f => f.memberId === id);

  const handleShare = async () => {
    const url = `${window.location.origin}/annuaire/${member.id}`;
    const text = `${member.companyName}${member.jobTitle ? ` — ${member.jobTitle}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: text, text: `Découvrez ${text} sur le Club Jean Jaurès`, url });
      } catch {}
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setMsg('Lien copié !');
      } catch {
        setMsg('Impossible de copier le lien.');
      }
      setTimeout(() => setMsg(''), 2000);
    }
  };

  const toggleFav = async () => {
    const wasFav = isFav;
    setFavorites(wasFav ? favorites.filter(f => f.memberId !== id) : [...favorites, { id: `tmp-${id}`, memberId: id }]);
    try {
      if (wasFav) await api.removeFavorite(id);
      else await api.addFavorite(id);
    } catch {
      setFavorites(favorites);
      setMsg('Erreur lors de la mise à jour des favoris.');
      setTimeout(() => setMsg(''), 2500);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto" aria-hidden="true">
        <div className="skeleton h-96" />
      </div>
    );
  }

  if (!member) {
    const notFound = error?.status === 404 || error?.message?.includes('introuvable');
    return (
      <div className="text-center py-12 space-y-3">
        {!notFound && <div className="animate-spin w-6 h-6 border-4 border-white border-t-transparent rounded-full mx-auto" />}
        <p className="on-bg-muted">
          {notFound ? 'Membre introuvable.' : 'Connexion en cours… la fiche s\'affichera dès que le réseau répond.'}
        </p>
        {!notFound && <button onClick={refetch} className="text-sm on-bg-link">Réessayer maintenant</button>}
        <div><Link to="/annuaire" className="on-bg-link text-sm">&larr; Retour à l'annuaire</Link></div>
      </div>
    );
  }

  const photos = Array.isArray(member.photos) ? member.photos : [];
  const social = member.socialLinks || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/annuaire" className="on-bg-link text-sm">&larr; Retour à l'annuaire</Link>

      <div className="card p-4 sm:p-6">
        {/* Photo + Logo */}
        <div className="flex items-center justify-center gap-4 sm:gap-5 mb-5">
          {member.photoUrl && (
            <img src={imgUrl(member.photoUrl, 400)} alt={member.companyName || 'Photo de profil'} decoding="async" className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover flex-shrink-0" />
          )}
          {member.logoUrl ? (
            <img src={imgUrl(member.logoUrl, 800)} alt={`Logo ${member.companyName}`} decoding="async" className="flex-1 min-w-0 max-w-[220px] sm:max-w-[300px] h-auto max-h-36 sm:max-h-44 rounded-xl object-contain" />
          ) : (
            <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-xl bg-blue-light flex items-center justify-center text-blue font-display font-bold text-5xl sm:text-6xl flex-shrink-0">
              {member.companyName?.charAt(0)?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Nom + métier + ville */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl text-blue-dark">{member.companyName}</h1>
            {isMember && user?.id !== id && (
              <button onClick={toggleFav} className="text-2xl" title={isFav ? 'Retirer des favoris' : 'Ajouter en favori'}>
                {isFav ? '★' : '☆'}
              </button>
            )}
            <button onClick={handleShare} className="text-text-muted hover:text-blue transition-colors" aria-label="Partager ce profil">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </div>
          {msg && <p className="text-xs text-green-600 mt-1">{msg}</p>}
          <p className="text-text-muted text-sm sm:text-base">{member.jobTitle}</p>
          {member.sector && (
            <span className="inline-block text-xs sm:text-sm font-medium bg-blue-light text-blue-dark px-2.5 py-1 rounded-full mt-2">
              {member.sector}
            </span>
          )}
          {member.city && <p className="text-sm text-text-muted mt-2">{member.city}</p>}
        </div>

        {/* Boutons de contact */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-6">
          {member.phone && (
            <a href={`tel:${member.phone}`} className="btn-primary text-sm py-2.5 px-4 text-center inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
              Appeler
            </a>
          )}
          {member.phone && (
            <a href={whatsappLink(member.phone)} target="_blank" rel="noopener noreferrer" className="text-sm py-2.5 px-4 text-center rounded-full font-semibold bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors inline-flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
          )}
          {member.user?.email && (
            <a href={`mailto:${member.user.email}`} className="btn-secondary text-sm py-2.5 px-4 text-center">
              Email
            </a>
          )}
          {member.website && (
            <a href={member.website} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2.5 px-4 text-center">
              Site web
            </a>
          )}
        </div>

        {/* Description */}
        {member.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-sm text-text-muted mb-2">Activité</h3>
            <p className="text-text-main">{member.description}</p>
          </div>
        )}

        {member.lookingFor && (
          <div className="mb-6">
            <h3 className="font-semibold text-sm text-text-muted mb-2">Ce que je recherche</h3>
            <p className="text-text-main">{member.lookingFor}</p>
          </div>
        )}

        {member.canOffer && (
          <div className="mb-6">
            <h3 className="font-semibold text-sm text-text-muted mb-2">Ce que je peux apporter</h3>
            <p className="text-text-main">{member.canOffer}</p>
          </div>
        )}

        {/* Infos complètes */}
        <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
          {member.address && (
            <p>
              <span className="text-text-muted">Adresse :</span>{' '}
              <a
                href={mapsUrl(member.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue hover:underline inline-flex items-center gap-1"
              >
                {member.address}
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </p>
          )}
          {member.phone && (
            <p>
              <span className="text-text-muted">Téléphone :</span>{' '}
              <a href={`tel:${member.phone}`} className="text-blue hover:underline">{member.phone}</a>
            </p>
          )}
          {member.user?.email && (
            <p>
              <span className="text-text-muted">Email :</span>{' '}
              <a href={`mailto:${member.user.email}`} className="text-blue hover:underline">{member.user.email}</a>
            </p>
          )}
        </div>

        {/* Réseaux sociaux */}
        {Object.keys(social).length > 0 && (
          <div className="flex gap-3 mt-4">
            {social.linkedin && (
              <a href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline text-sm">
                LinkedIn
              </a>
            )}
            {social.facebook && (
              <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline text-sm">
                Facebook
              </a>
            )}
            {social.instagram && (
              <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-blue hover:underline text-sm">
                Instagram
              </a>
            )}
          </div>
        )}
      </div>

      {/* Galerie photos */}
      {photos.length > 0 && (
        <div className="card p-4 sm:p-6">
          <h3 className="font-semibold mb-4">Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {photos.map((url, i) => (
              <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                <img src={imgUrl(url, 400)} alt={`Photo ${i + 1}`} loading="lazy" decoding="async" className="rounded-xl object-cover w-full h-24 sm:h-32" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
