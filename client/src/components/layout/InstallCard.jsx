import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { isIOS, isStandalone } from '../../utils/platform';
import { canPromptInstall, promptInstall, onInstallAvailabilityChange, pushSupported, enablePush, getPushSubscription } from '../../utils/install';

const DISMISS_KEY = 'cjj-install-card-dismissed';

function readDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

export default function InstallCard() {
  const { user } = useAuth();
  const [installable, setInstallable] = useState(canPromptInstall());
  const [installed, setInstalled] = useState(isStandalone);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [pushState, setPushState] = useState('unknown'); // unknown | unsupported | server-off | off | on | denied | busy
  const [msg, setMsg] = useState('');

  useEffect(() => onInstallAvailabilityChange(() => setInstallable(canPromptInstall())), []);
  useEffect(() => {
    const onInstalled = () => { setInstalled(true); setMsg('Application installée !'); };
    window.addEventListener('cjj:installed', onInstalled);
    return () => window.removeEventListener('cjj:installed', onInstalled);
  }, []);

  // État des notifications sur cet appareil
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (!pushSupported()) { setPushState('unsupported'); return; }
      try {
        const cfg = await api.getPushConfig();
        if (!cfg.enabled) { if (!cancelled) setPushState('server-off'); return; }
      } catch { if (!cancelled) setPushState('server-off'); return; }
      if (Notification.permission === 'denied') { if (!cancelled) setPushState('denied'); return; }
      const sub = await getPushSubscription().catch(() => null);
      if (!cancelled) setPushState(sub ? 'on' : 'off');
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleInstall = async () => {
    setMsg('');
    if (isIOS) { setShowIosHelp(v => !v); return; }
    const outcome = await promptInstall();
    if (outcome === 'accepted') setMsg("Installation en cours… l'icône arrive sur votre écran d'accueil.");
    else if (outcome === 'dismissed') setMsg('Installation annulée. Vous pourrez la relancer plus tard.');
  };

  const handleEnablePush = async () => {
    setMsg('');
    setPushState('busy');
    try {
      await enablePush();
      setPushState('on');
      setMsg('Notifications activées sur cet appareil.');
      api.pushTest().catch(() => {});
    } catch (err) {
      setPushState(Notification.permission === 'denied' ? 'denied' : 'off');
      setMsg(err.message || "Impossible d'activer les notifications.");
    }
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
  };

  // Rien à proposer : app installée ET notifications déjà actives (ou impossibles)
  const needInstall = !installed && (installable || isIOS);
  const needPush = !!user && (pushState === 'off' || pushState === 'denied' || pushState === 'busy');
  if (dismissed || (!needInstall && !needPush && !msg)) return null;

  return (
    <div className="card-glass p-4 sm:p-5 relative">
      <button onClick={dismiss} aria-label="Masquer" className="absolute top-2 right-2 w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center text-xl leading-none">&times;</button>
      <div className="flex items-start gap-3 pr-8">
        <div className="w-11 h-11 rounded-2xl bg-white text-blue-dark flex items-center justify-center flex-shrink-0 shadow font-display font-bold text-lg">
          JJ
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">
            {needInstall ? "Installer l'application" : 'Restez informé'}
          </h3>
          <p className="text-sm text-white/80 mt-0.5">
            {needInstall
              ? "Ajoutez le Club sur votre écran d'accueil pour l'ouvrir en un tap, et recevez les rappels d'événements en notification."
              : "Recevez une notification pour les nouveaux événements et les rappels de participation."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {needInstall && (
          <button onClick={handleInstall} className="inline-flex items-center gap-2 bg-white text-blue-dark px-4 py-2.5 rounded-full text-sm font-semibold shadow hover:bg-blue-light transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            {isIOS ? "Installer sur iPhone" : "Installer l'application"}
          </button>
        )}
        {needPush && (
          <button
            onClick={handleEnablePush}
            disabled={pushState === 'busy' || pushState === 'denied'}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              needInstall ? 'bg-white/15 text-white border border-white/30 hover:bg-white/25' : 'bg-white text-blue-dark shadow hover:bg-blue-light'
            } disabled:opacity-60`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {pushState === 'busy' ? 'Activation…' : pushState === 'denied' ? 'Notifications bloquées' : 'Activer les notifications'}
          </button>
        )}
      </div>

      {pushState === 'denied' && (
        <p className="text-xs text-white/70 mt-2">Les notifications sont bloquées pour ce site dans les réglages du navigateur. Réautorisez-les puis revenez ici.</p>
      )}
      {msg && <p className="text-sm text-white mt-3">{msg}</p>}

      {showIosHelp && (
        <div className="mt-4 bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white/90 space-y-2">
          <p className="font-medium">Sur iPhone, l'installation se fait depuis Safari :</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Ouvrez cette page dans <strong>Safari</strong> (pas depuis WhatsApp ou Gmail).</li>
            <li>Touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut, en bas de l'écran).</li>
            <li>Choisissez <strong>« Sur l'écran d'accueil »</strong> puis <strong>Ajouter</strong>.</li>
            <li>Ouvrez l'app depuis l'icône : vous pourrez alors activer les notifications ici.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
