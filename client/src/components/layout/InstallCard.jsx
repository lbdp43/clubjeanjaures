import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../utils/api';
import { isIOS, isAndroid, isStandalone, isInAppBrowser, isFirefoxAndroid } from '../../utils/platform';
import { canPromptInstall, promptInstall, onInstallAvailabilityChange, pushSupported, enablePush, getPushSubscription } from '../../utils/install';

const DISMISS_KEY = 'cjj-install-card-dismissed';

function readDismissed() {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

export default function InstallCard() {
  const { user } = useAuth();
  const [installable, setInstallable] = useState(canPromptInstall());
  const [installed, setInstalled] = useState(isStandalone);
  const [showHelp, setShowHelp] = useState(false);
  const [dismissed, setDismissed] = useState(readDismissed);
  const [pushState, setPushState] = useState('unknown'); // unknown | unsupported | server-off | off | on | denied | busy
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => onInstallAvailabilityChange(() => setInstallable(canPromptInstall())), []);
  useEffect(() => {
    const onInstalled = () => { setInstalled(true); setOpen(true); setMsg('Application installée !'); };
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
    if (!canPromptInstall()) { setShowHelp(v => !v); return; }
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
  // Android sans invite native (Firefox, ou Chrome pas encore prêt) : on montre la marche à suivre
  const needInstall = !installed && (installable || isIOS || isAndroid);
  const needPush = !!user && (pushState === 'off' || pushState === 'denied' || pushState === 'busy');
  if (dismissed || (!needInstall && !needPush && !msg)) return null;

  const title = needInstall ? "Installer l'application" : 'Activer les notifications';

  return (
    <div className="card-glass p-0 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors"
      >
        <span className="w-8 h-8 rounded-xl bg-white text-blue-dark flex items-center justify-center flex-shrink-0 font-display font-bold text-sm shadow">
          JJ
        </span>
        <span className="flex-1 min-w-0 text-sm font-semibold text-white truncate">{title}</span>
        <svg className={`w-5 h-5 text-white/70 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/15">
          <p className="text-sm text-white/80 mt-2">
            {needInstall
              ? "Ajoutez le Club sur votre écran d'accueil pour l'ouvrir en un tap, et recevez les rappels d'événements en notification."
              : "Recevez une notification pour les nouveaux événements et les rappels de participation."}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {needInstall && (
              <button onClick={handleInstall} className="inline-flex items-center gap-2 bg-white text-blue-dark px-4 py-2.5 rounded-full text-sm font-semibold shadow hover:bg-blue-light transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                {isIOS ? "Installer sur iPhone" : installable ? "Installer l'application" : "Comment installer"}
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
            <button onClick={dismiss} className="text-xs text-white/60 hover:text-white px-2 self-center">Ne plus afficher</button>
          </div>

          {pushState === 'denied' && (
            <p className="text-xs text-white/70 mt-2">Les notifications sont bloquées pour ce site dans les réglages du navigateur. Réautorisez-les puis revenez ici.</p>
          )}
          {msg && <p className="text-sm text-white mt-3">{msg}</p>}

          {showHelp && isIOS && (
            <div className="mt-3 bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white/90 space-y-2">
              {isInAppBrowser && (
                <p className="text-yellow-200 text-xs">Vous êtes dans le navigateur intégré d'une autre application : ouvrez d'abord ce lien dans Safari (menu ··· → « Ouvrir dans Safari »).</p>
              )}
              <p className="font-medium">Sur iPhone, l'installation se fait depuis Safari :</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Touchez le bouton <strong>Partager</strong> (le carré avec une flèche vers le haut, en bas de l'écran).</li>
                <li>Faites défiler et choisissez <strong>« Sur l'écran d'accueil »</strong>, puis <strong>Ajouter</strong>.</li>
                <li>Ouvrez l'app depuis sa nouvelle icône : le bouton « Activer les notifications » apparaîtra ici.</li>
              </ol>
              <p className="text-xs text-white/70">Les notifications sur iPhone nécessitent iOS 16.4 ou plus récent, et l'app ouverte depuis l'icône.</p>
            </div>
          )}
          {showHelp && isAndroid && !installable && (
            <div className="mt-3 bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white/90 space-y-2">
              {isInAppBrowser && (
                <p className="text-yellow-200 text-xs">Vous êtes dans le navigateur intégré d'une autre application : ouvrez d'abord ce lien dans Chrome (menu ⋮ → « Ouvrir dans Chrome »).</p>
              )}
              <p className="font-medium">Sur Android :</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Touchez le menu du navigateur (<strong>⋮</strong> en haut à droite{isFirefoxAndroid ? ', ou en bas' : ''}).</li>
                <li>Choisissez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.</li>
                <li>Confirmez : l'icône apparaît sur votre écran d'accueil.</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
