import { useState } from 'react';
import { isIOS, isAndroid, isMobile } from '../../utils/platform';
import Collapse from '../ui/Collapse';

const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const OutlookIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576a.806.806 0 01-.588.234h-8.652v-12.14h8.652c.23 0 .425.076.588.23A.774.774 0 0124 7.387zM13.727 20.794H1.455c-.4 0-.741-.14-1.023-.418A1.371 1.371 0 010 19.38V5.873c0-.398.144-.738.432-1.02a1.399 1.399 0 011.023-.417h12.272v16.358zM9.818 9.164a3.427 3.427 0 00-1.553-1.14 3.424 3.424 0 00-1.351-.268c-.944 0-1.753.345-2.427 1.035-.674.69-1.01 1.556-1.01 2.6 0 1.07.33 1.95.99 2.637.66.688 1.484 1.032 2.47 1.032.928 0 1.702-.318 2.322-.953.62-.636.93-1.45.93-2.444 0-.15-.012-.35-.035-.6H6.578v1.2h2.128c-.1.41-.335.74-.703.993a2.054 2.054 0 01-1.157.334c-.656 0-1.19-.22-1.603-.664-.413-.443-.62-1.016-.62-1.72 0-.67.215-1.227.645-1.67.43-.443.968-.665 1.614-.665.533 0 .98.162 1.34.488l1.596-.145z"/>
  </svg>
);
const CopyIcon = () => (
  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
  </svg>
);
const DownloadIcon = () => (
  <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
);

const rowClass = 'w-full inline-flex items-center gap-3 bg-white border border-gray-200 hover:border-blue px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors text-left';

function Row({ icon, title, subtitle, ...props }) {
  const Tag = props.href ? 'a' : 'button';
  return (
    <Tag className={rowClass} {...props}>
      {icon}
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
      </div>
    </Tag>
  );
}

export default function SubscribePanel({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(false);

  const host = window.location.host;
  const httpsUrl = `https://${host}/api/calendar/feed.ics`;
  const webcalUrl = `webcal://${host}/api/calendar/feed.ics`;
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`;
  const outlookUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(webcalUrl)}&name=${encodeURIComponent('Club Jean Jaurès')}`;

  const copy = async () => {
    try {
      if (navigator.clipboard) await navigator.clipboard.writeText(httpsUrl);
      else {
        const ta = document.createElement('textarea');
        ta.value = httpsUrl; document.body.appendChild(ta); ta.select();
        document.execCommand('copy'); ta.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  return (
    <div className="card p-3 sm:p-5 space-y-3 sm:space-y-4 slide-up">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-sm sm:text-base">Ajouter à mon agenda</h3>
        <button onClick={onClose} aria-label="Fermer" className="text-text-muted hover:text-text-main text-xl leading-none w-8 h-8 flex items-center justify-center">&times;</button>
      </div>
      <p className="text-xs sm:text-sm text-text-muted">
        En vous abonnant, tous les événements du club apparaissent dans votre agenda et se mettent à jour tout seuls (nouveaux événements, changements de lieu ou d'horaire).
      </p>

      <div className="flex flex-col gap-2">
        {/* iPhone : abonnement natif en un tap */}
        {isIOS && (
          <Row href={webcalUrl} icon={<CalendarIcon />} title="Calendrier iPhone" subtitle="S'abonner en un tap (recommandé)" />
        )}

        {/* Google Agenda */}
        {isMobile ? (
          <Row
            onClick={() => setShowGoogleHelp(v => !v)}
            icon={<GoogleIcon />}
            title="Google Agenda"
            subtitle={isAndroid ? "Comment s'abonner (recommandé)" : "Comment s'abonner"}
            aria-expanded={showGoogleHelp}
          />
        ) : (
          <Row href={googleUrl} target="_blank" rel="noopener noreferrer" icon={<GoogleIcon />} title="Google Agenda" subtitle="S'abonner automatiquement" />
        )}

        <Collapse open={showGoogleHelp}>
          <div className="bg-blue-light/60 rounded-xl p-3 sm:p-4 text-sm space-y-3 -mt-1">
            <p className="text-text-main">
              L'application Google Agenda du téléphone ne permet pas de s'abonner à un lien.
              Il faut le faire <strong>une seule fois depuis un ordinateur</strong> : l'agenda du club apparaîtra ensuite automatiquement sur votre téléphone.
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-text-main">
              <li>Copiez le lien ci-dessous et envoyez-le vous (email, WhatsApp…).</li>
              <li>Sur un ordinateur, ouvrez <span className="font-medium">calendar.google.com</span>.</li>
              <li>À gauche, à côté de « Autres agendas », cliquez sur <span className="font-medium">+</span> puis <span className="font-medium">À partir de l'URL</span>.</li>
              <li>Collez le lien et validez. C'est fait !</li>
            </ol>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
              <code className="text-xs text-text-muted flex-1 min-w-0 truncate">{httpsUrl}</code>
              <button onClick={copy} className="text-xs font-semibold text-blue whitespace-nowrap">
                {copied ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>
        </Collapse>

        {/* Outlook */}
        <Row href={outlookUrl} target="_blank" rel="noopener noreferrer" icon={<OutlookIcon />} title="Outlook" subtitle="S'abonner sur Outlook.com" />

        {/* Apple / autre app sur ordinateur */}
        {!isMobile && (
          <Row href={webcalUrl} icon={<CalendarIcon />} title="Apple Calendar / autre application" subtitle="Ouvre votre application agenda" />
        )}

        <Row
          onClick={copy}
          icon={<CopyIcon />}
          title={copied ? 'Lien copié !' : "Copier le lien d'abonnement"}
          subtitle="Pour coller dans n'importe quelle app agenda"
        />
        <Row href="/api/calendar/export" download icon={<DownloadIcon />} title="Télécharger le fichier .ics" subtitle="Import unique, sans mise à jour automatique" />
      </div>
    </div>
  );
}
