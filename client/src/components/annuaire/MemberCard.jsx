import { useNavigate } from 'react-router-dom';
import { whatsappLink, mapsUrl } from '../../utils/helpers';

export default function MemberCard({ member }) {
  const navigate = useNavigate();

  const shortDesc = member.description
    ? member.description.length > 120
      ? member.description.slice(0, 120) + '...'
      : member.description
    : null;

  const email = member.user?.email || member.email;

  return (
    <div
      onClick={() => navigate(`/annuaire/${member.id}`)}
      className="card p-4 sm:p-5 hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Photo + Logo en haut */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-4">
        {member.photoUrl && (
          <img src={member.photoUrl} alt="" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover flex-shrink-0" />
        )}
        {member.logoUrl ? (
          <img src={member.logoUrl} alt={member.companyName} className="flex-1 min-w-0 max-w-[200px] sm:max-w-[260px] h-auto max-h-32 sm:max-h-40 rounded-2xl object-contain" />
        ) : (
          <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-2xl bg-blue-light flex items-center justify-center text-blue font-bold text-4xl sm:text-6xl flex-shrink-0">
            {member.companyName?.charAt(0) || '?'}
          </div>
        )}
      </div>

      {/* Nom + métier + ville */}
      <div className="text-center mb-3">
        <h3 className="font-semibold text-text-main text-base truncate">{member.companyName}</h3>
        <p className="text-sm text-text-muted truncate">{member.jobTitle}</p>
        {member.city && (
          <p className="text-xs text-text-muted mt-0.5 flex items-center justify-center gap-1">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            {member.city}
          </p>
        )}
      </div>

      {/* Description courte */}
      {shortDesc && (
        <p className="text-xs sm:text-sm text-text-muted mb-3 line-clamp-2">{shortDesc}</p>
      )}

      {/* Ce que je recherche / Ce que je peux apporter */}
      {(member.lookingFor || member.canOffer) && (
        <div className="space-y-2 mb-3 text-xs sm:text-sm">
          {member.lookingFor && (
            <div className="bg-blue-light/30 rounded-lg px-3 py-2">
              <span className="font-medium text-blue-dark">Recherche :</span>{' '}
              <span className="text-text-muted">{member.lookingFor.length > 80 ? member.lookingFor.slice(0, 80) + '...' : member.lookingFor}</span>
            </div>
          )}
          {member.canOffer && (
            <div className="bg-green-50 rounded-lg px-3 py-2">
              <span className="font-medium text-green-700">Apporte :</span>{' '}
              <span className="text-text-muted">{member.canOffer.length > 80 ? member.canOffer.slice(0, 80) + '...' : member.canOffer}</span>
            </div>
          )}
        </div>
      )}

      {/* Adresse cliquable */}
      {member.address && (
        <a
          href={mapsUrl(member.address)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-blue hover:underline mb-3"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{member.address}</span>
          <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      )}

      {/* Boutons de contact */}
      {(member.phone || email) && (
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
          {member.phone && (
            <a
              href={`tel:${member.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-blue text-white px-3 py-1.5 rounded-full hover:bg-blue-dark transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Appeler
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium border border-blue text-blue px-3 py-1.5 rounded-full hover:bg-blue-light transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              Email
            </a>
          )}
          {member.phone && (
            <a
              href={whatsappLink(member.phone)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium border border-green-500 text-green-600 px-3 py-1.5 rounded-full hover:bg-green-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          )}
          {member.website && (
            <a
              href={member.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium border border-gray-300 text-text-muted px-3 py-1.5 rounded-full hover:border-blue hover:text-blue transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
              Site web
            </a>
          )}
        </div>
      )}
    </div>
  );
}
