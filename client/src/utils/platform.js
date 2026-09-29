const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

export const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
export const isAndroid = /Android/i.test(ua);
export const isMobile = isIOS || isAndroid;
export const isStandalone = typeof window !== 'undefined' && (
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
);
