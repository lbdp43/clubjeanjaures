import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { whatsappLink, mapsUrl } from '../utils/helpers';

export default function MemberDetail() {
  const { id } = useParams();
  const { user, isMember } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    api.getMember(id).then(setMember).catch(() => {}).finally(() => setLoading(false));

    if (user) {
      api.getFavorites()
        .then(favs => setIsFav(favs.some(f => f.memberId === id)))
        .catch(() => {});
    }
  }, [id, user]);

  const toggleFav = async () => {
    try {
      if (isFav) {
        await api.removeFavorite(id);
        setIsFav(false);
      } else {
        await api.addFavorite(id);
        setIsFav(true);
      }
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!member) {
    return <p className="text-center text-text-muted py-12">Membre introuvable.</p>;
  }

  const photos = Array.isArray(member.photos) ? member.photos : [];
  const social = member.socialLinks || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6 fade-in">
      <Link to="/annuaire" className="text-blue text-sm hover:underline">&larr; Retour à l'annuaire</Link>

      <div className="card p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4 mb-6">
          {member.logoUrl ? (
            <img src={member.logoUrl} alt={member.companyName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-blue-light flex items-center justify-center text-blue font-bold text-xl sm:text-2xl flex-shrink-0">
              {member.companyName?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl sm:text-2xl text-blue-dark">{member.companyName}</h1>
            <p className="text-text-muted text-sm sm:text-base">{member.jobTitle}</p>
            {member.city && <p className="text-sm text-text-muted mt-1">{member.city}</p>}
          </div>
          {isMember && user?.id !== id && (
            <button onClick={toggleFav} className="text-2xl" title={isFav ? 'Retirer des favoris' : 'Ajouter en favori'}>
              {isFav ? '★' : '☆'}
            </button>
          )}
        </div>

        {/* Boutons de contact */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mb-6">
          {member.phone && (
            <a href={`tel:${member.phone}`} className="btn-primary text-sm py-2 px-4 text-center">
              Appeler
            </a>
          )}
          {member.user?.email && (
            <a href={`mailto:${member.user.email}`} className="btn-secondary text-sm py-2 px-4 text-center">
              Email
            </a>
          )}
          {member.phone && (
            <a href={whatsappLink(member.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 text-center">
              WhatsApp
            </a>
          )}
          {member.website && (
            <a href={member.website} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4 text-center">
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
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Photos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((url, i) => (
              <img key={i} src={url} alt="" className="rounded-xl object-cover w-full h-32" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
