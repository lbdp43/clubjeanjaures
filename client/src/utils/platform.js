const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

export const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/i.test(ua);
export const isMobile = isIOS || isAndroid;
export const isStandalone = typeof window !== 'undefined' && (
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
);
// Sur iOS, seul Safari (ou un navigateur ≥ iOS 16.4) permet « Sur l'écran d'accueil » ; les vues intégrées (WhatsApp, Gmail…) non
export const isInAppBrowser = /FBAN|FBAV|Instagram|Line\/|WhatsApp|GSA\/|Snapchat|Twitter|LinkedIn|Messenger/i.test(ua);
export const isSamsungBrowser = /SamsungBrowser/i.test(ua);
export const isFirefoxAndroid = isAndroid && /Firefox/i.test(ua);
