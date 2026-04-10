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
    throw new Error(data.error || `Erreur ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  sendMagicLink: (email) => apiFetch('/auth/magic-link', {
    method: 'POST', body: JSON.stringify({ email })
  }),
  verifyToken: (token) => apiFetch(`/auth/verify?token=${token}`),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getMe: () => apiFetch('/auth/me'),
  completeOnboarding: () => apiFetch('/auth/onboarding', { method: 'PUT' }),

  // Members
  getPublicMembers: () => apiFetch('/members/public'),
  getMembers: (search) => apiFetch(`/members${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getMember: (id) => apiFetch(`/members/${id}`),
  updateMember: (id, data) => apiFetch(`/members/${id}`, {
    method: 'PUT', body: JSON.stringify(data)
  }),
  uploadPhotos: (id, formData) => apiFetch(`/members/${id}/photos`, {
    method: 'POST', body: formData
  }),
  deletePhoto: (id, idx) => apiFetch(`/members/${id}/photos/${idx}`, { method: 'DELETE' }),

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
  getSettings: () => apiFetch('/admin/settings'),
  updateSettings: (data) => apiFetch('/admin/settings', {
    method: 'PUT', body: JSON.stringify(data)
  }),
  uploadClubLogo: (formData) => apiFetch('/admin/settings/logo', {
    method: 'POST', body: formData
  }),
  sendNotification: (subject, content) => apiFetch('/admin/notify', {
    method: 'POST', body: JSON.stringify({ subject, content })
  }),
  sendInvite: (email) => apiFetch('/admin/invite', {
    method: 'POST', body: JSON.stringify({ email })
  })
};
