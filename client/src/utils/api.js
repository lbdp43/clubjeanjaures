const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  };

  // Ne pas mettre Content-Type si FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const res = await fetch(url, config);

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Erreur ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

const NO_RETRY_STATUSES = new Set([400, 401, 403, 404, 409, 422]);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Réessaie les échecs passagers (réseau qui se réveille, micro-coupure, serveur occupé)
export async function withRetry(fn, { attempts = 3, delay = 500 } = {}) {
  let wait = delay;
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (err) {
      const definitive = err?.status && NO_RETRY_STATUSES.has(err.status);
      if (definitive || i >= attempts - 1) throw err;
      await sleep(wait);
      wait *= 2;
    }
  }
}

export const api = {
  // Auth
  register: (email, password) => apiFetch('/auth/register', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  login: (email, password) => apiFetch('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password })
  }),
  sendMagicLink: (email) => apiFetch('/auth/magic-link', {
    method: 'POST', body: JSON.stringify({ email })
  }),
  verifyToken: (token) => apiFetch(`/auth/verify?token=${encodeURIComponent(token)}`),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getMe: () => apiFetch('/auth/me'),
  changePassword: (currentPassword, newPassword) => apiFetch('/auth/password', {
    method: 'PUT', body: JSON.stringify({ currentPassword, newPassword })
  }),
  completeOnboarding: (gdprConsent = false) => apiFetch('/auth/onboarding', {
    method: 'PUT', body: JSON.stringify({ gdprConsent })
  }),

  // Members
  getPublicMembers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.sector) qs.set('sector', params.sector);
    if (params.limit) qs.set('limit', params.limit);
    const str = qs.toString();
    return apiFetch(`/members/public${str ? `?${str}` : ''}`);
  },
  getMembers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.sector) qs.set('sector', params.sector);
    const str = qs.toString();
    return apiFetch(`/members${str ? `?${str}` : ''}`);
  },
  getMember: (id) => apiFetch(`/members/${id}`),
  updateMember: (id, data) => apiFetch(`/members/${id}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  uploadPhotos: (id, formData) => apiFetch(`/members/${id}/photos`, {
    method: 'POST', body: formData
  }),
  deletePhoto: (id, idx) => apiFetch(`/members/${id}/photos/${idx}`, { method: 'DELETE' }),
  deleteProfilePhoto: (id, type) => apiFetch(`/members/${id}/photo/${type}`, { method: 'DELETE' }),
  getSectors: () => apiFetch('/members/sectors'),

  // Events
  getEvents: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/events${qs ? `?${qs}` : ''}`);
  },
  getEvent: (id) => apiFetch(`/events/${id}`),
  createEvent: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  createEventsBatch: (events) => apiFetch('/events/batch', {
    method: 'POST', body: JSON.stringify({ events })
  }),
  updateEvent: (id, data) => apiFetch(`/events/${id}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  deleteEvent: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
  // status : 'going' (inscrit), 'declined' (pas dispo) ou null (retirer sa réponse)
  setRsvp: (eventId, status) => apiFetch(`/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ status }) }),
  getEventResponses: (eventId) => apiFetch(`/events/${eventId}/responses`),
  remindEvent: (eventId, userIds, message) => apiFetch(`/events/${eventId}/remind`, { method: 'POST', body: JSON.stringify({ userIds, message }) }),
  getEventRsvps: (eventId) => apiFetch(`/events/${eventId}/rsvps`),

  // Posts
  getPosts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/posts${qs ? `?${qs}` : ''}`);
  },
  createPost: (formData) => apiFetch('/posts', { method: 'POST', body: formData }),
  deletePost: (id) => apiFetch(`/posts/${id}`, { method: 'DELETE' }),
  addComment: (postId, content) => apiFetch(`/posts/${postId}/comments`, {
    method: 'POST', body: JSON.stringify({ content })
  }),
  deleteComment: (id) => apiFetch(`/posts/comments/${id}`, { method: 'DELETE' }),
  toggleLike: (postId) => apiFetch(`/posts/${postId}/like`, { method: 'POST' }),

  // Favorites
  getFavorites: () => apiFetch('/favorites'),
  addFavorite: (memberId) => apiFetch(`/favorites/${memberId}`, { method: 'POST' }),
  removeFavorite: (memberId) => apiFetch(`/favorites/${memberId}`, { method: 'DELETE' }),

  // Admin
  getDashboard: () => apiFetch('/admin/dashboard'),
  getAdminMembers: () => apiFetch('/admin/members'),
  updateRole: (id, role) => apiFetch(`/admin/members/${id}/role`, {
    method: 'PUT', body: JSON.stringify({ role })
  }),
  updateStatus: (id, status) => apiFetch(`/admin/members/${id}/status`, {
    method: 'PUT', body: JSON.stringify({ status })
  }),
  deleteMember: (id) => apiFetch(`/admin/members/${id}`, { method: 'DELETE' }),
  resetPassword: (id, password) => apiFetch(`/admin/members/${id}/password`, {
    method: 'PUT', body: JSON.stringify({ password })
  }),
  adminUpdateProfile: (id, data) => apiFetch(`/admin/members/${id}/profile`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  getPublicSettings: () => apiFetch('/settings/public'),
  getSettings: () => apiFetch('/admin/settings'),
  updateSettings: (data) => apiFetch('/admin/settings', {
    method: 'PUT', body: JSON.stringify(data)
  }),
  uploadClubLogo: (formData) => apiFetch('/admin/settings/logo', {
    method: 'POST', body: formData
  }),
  sendInvite: (email) => apiFetch('/admin/invite', {
    method: 'POST', body: JSON.stringify({ email })
  }),
  sendNotification: (subject, message) => apiFetch('/admin/notify', {
    method: 'POST', body: JSON.stringify({ subject, message })
  }),
  updateReminderPreferences: (optOut) => apiFetch('/auth/reminder-preferences', {
    method: 'PUT', body: JSON.stringify({ optOut })
  }),
  sendReminderTest: (email, daysBefore) => apiFetch('/admin/reminder-test', {
    method: 'POST', body: JSON.stringify({ email, daysBefore })
  }),
  sendCustomEmail: (data) => apiFetch('/admin/email-custom', {
    method: 'POST', body: JSON.stringify(data)
  }),
  mergeAccounts: (primaryId, mergeEmail) => apiFetch(`/admin/members/${primaryId}/merge`, {
    method: 'POST', body: JSON.stringify({ mergeEmail })
  }),
  manageSecondaryEmail: (id, action, email, newEmail) => apiFetch(`/admin/members/${id}/emails`, {
    method: 'PUT',
    body: JSON.stringify({ action, email, newEmail })
  }),

  // Notifications push
  getPushConfig: () => apiFetch('/push/config'),
  getPushStatus: () => apiFetch('/push/status'),
  pushSubscribe: (subscription) => apiFetch('/push/subscribe', {
    method: 'POST', body: JSON.stringify({ subscription })
  }),
  pushUnsubscribe: (endpoint) => apiFetch('/push/subscribe', {
    method: 'DELETE', body: JSON.stringify({ endpoint })
  }),
  pushTest: () => apiFetch('/push/test', { method: 'POST' }),

  // Admin — notifications push
  getAdminPushStats: () => apiFetch('/admin/push/stats'),
  adminPushSend: (data) => apiFetch('/admin/push/send', {
    method: 'POST', body: JSON.stringify(data)
  })
};
