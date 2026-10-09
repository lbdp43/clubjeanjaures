import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { whatsappLink, mapsUrl, imgUrl, personName } from '../../utils/helpers';

function MemberCard({ member, compact = false }) {
  const navigate = useNavigate();
  const [shared, setShared] = useState(false);
  const email = member.user?.email || member.email;
  const profileUrl = `/annuaire/${member.id}`;

  const open = () => navigate(profileUrl);
  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  };

  const buildContactText = () => {
    const lines = [];
    if (personName(member)) lines.push(personName(member));
    if (member.companyName) lines.push(member.companyName);
    if (member.jobTitle) lines.push(member.jobTitle);
    if (member.city) lines.push(member.city);
    if (member.phone) lines.push(`Tel : ${member.phone}`);
    if (email) lines.push(`Email : ${email}`);
    if (member.website) lines.push(`Web : ${member.website}`);
    if (member.canOffer) lines.push(`Peut apporter : ${member.canOffer}`);
    if (member.lookingFor) lines.push(`Recherche : ${member.lookingFor}`);
    lines.push(`Profil : ${window.location.origin}${profileUrl}`);
    return lines.join('\n');
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const text = buildContactText();
    const title = `${member.companyName}${member.jobTitle ? ` — ${member.jobTitle}` : ''}`;
    if (navigator.share) {
      try { await navigator.share({ title, text }); } catch {}
      return;
    }
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={onKeyDown}
      aria-label={`Voir la fiche de ${member.companyName || 'ce membre'}`}
      className="card p-4 min-w-0 overflow-hidden hover:shadow-md hover:border-blue/30 transition-all cursor-pointer active:scale-[0.99]"
    >
      {/* En-tête : visuel + identité */}
      <div className="flex items-center gap-3.5">
        <Avatar member={member} size={compact ? 56 : 64} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-main text-base leading-tight truncate">{member.companyName}</h3>
          {personName(member) && <p className="text-sm text-text-main truncate mt-0.5">{personName(member)}</p>}
          {member.jobTitle && <p className="text-sm text-text-muted truncate mt-0.5">{member.jobTitle}</p>}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {member.sector && (
              <span className="text-[11px] font-medium bg-blue-light text-blue-dark px-2 py-0.5 rounded-full truncate max-w-[60%]">
                {member.sector}
              </span>
            )}
            {member.city && (
              <span className="text-xs text-text-muted inline-flex items-center gap-1 truncate">
                <PinIcon className="w-3 h-3 flex-shrink-0" />
                {member.city}
              </span>
            )}
          </div>
        </div>
        <ChevronIcon className="w-5 h-5 text-gray-300 flex-shrink-0" />
      </div>

      {!compact && (member.description || member.lookingFor || member.canOffer) && (
        <div className="mt-3 space-y-1.5 text-sm">
          {member.description && (
            <p className="text-text-muted line-clamp-2">{member.description}</p>
          )}
          {member.lookingFor && (
            <p className="text-xs truncate">
              <span className="font-medium text-blue-dark">Recherche :</span>{' '}
              <span className="text-text-muted">{member.lookingFor}</span>
            </p>
          )}
          {member.canOffer && (
            <p className="text-xs truncate">
              <span className="font-medium text-green-700">Apporte :</span>{' '}
              <span className="text-text-muted">{member.canOffer}</span>
            </p>
          )}
        </div>
      )}

      {/* Actions de contact */}
      {(member.phone || email || member.website) && (
        <div className="flex items-center flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {member.phone && (
            <a href={`tel:${member.phone}`} onClick={stop} className="contact-pill contact-pill-primary" aria-label="Appeler">
              <PhoneIcon className="w-4 h-4" />
              <span className="hidden xs:inline">Appeler</span>
            </a>
          )}
          {member.phone && (
            <a href={whatsappLink(member.phone)} target="_blank" rel="noopener noreferrer" onClick={stop} className="contact-pill text-green-600 border-green-200 hover:bg-green-50" aria-label="WhatsApp">
              <WhatsAppIcon className="w-4 h-4" />
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} onClick={stop} className="contact-pill" aria-label="Envoyer un email">
              <MailIcon className="w-4 h-4" />
            </a>
          )}
          {member.website && (
            <a href={member.website} target="_blank" rel="noopener noreferrer" onClick={stop} className="contact-pill" aria-label="Site web">
              <GlobeIcon className="w-4 h-4" />
            </a>
          )}
          {!compact && member.address && (
            <a href={mapsUrl(member.address)} target="_blank" rel="noopener noreferrer" onClick={stop} className="contact-pill" aria-label="Itinéraire">
              <PinIcon className="w-4 h-4" />
            </a>
          )}
          <button onClick={handleShare} className={`contact-pill ml-auto ${shared ? 'text-green-700 border-green-300 bg-green-50' : ''}`} aria-label="Partager la fiche">
            {shared ? <CheckIcon className="w-4 h-4" /> : <ShareIcon className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ member, size }) {
  const px = { width: size, height: size };
  if (member.logoUrl) {
    return (
      <div style={px} className="rounded-2xl bg-white border border-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center p-1">
        <img src={imgUrl(member.logoUrl, 200)} alt="" loading="lazy" decoding="async" className="max-w-full max-h-full object-contain" />
      </div>
    );
  }
  if (member.photoUrl) {
    return <img src={imgUrl(member.photoUrl, 200)} alt="" loading="lazy" decoding="async" style={px} className="rounded-2xl object-cover flex-shrink-0" />;
  }
  return (
    <div style={px} className="rounded-2xl bg-blue-light text-blue font-display font-bold text-2xl flex items-center justify-center flex-shrink-0">
      {member.companyName?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

const PinIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const ChevronIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);
const PhoneIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);
const MailIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);
const GlobeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3M3.6 9h16.8M3.6 15h16.8" />
  </svg>
);
const ShareIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);
const CheckIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const WhatsAppIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default memo(MemberCard);
