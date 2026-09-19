const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    // When running on Vite dev server (5173) or behind Docker Nginx (3000, 80, 443, or standard cloud domain)
    const port = window.location.port;
    if (port === '5173' || port === '3000' || port === '80' || port === '443' || port === '') {
      return '/api';
    }
    // For direct backend port access or alternative ports, connect to port 8080 on the same host
    return `${window.location.protocol}//${window.location.hostname}:8080/api`;
  }
  return 'http://localhost:8080/api';
};

const API_BASE = getApiBase();

export function getAuthToken() {
  return localStorage.getItem('syncpoll_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('syncpoll_token', token);
  } else {
    localStorage.removeItem('syncpoll_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  register: (username, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request('/auth/me'),

  // Polls
  createPoll: (pollData) =>
    request('/polls', {
      method: 'POST',
      body: JSON.stringify(pollData),
    }),
  getPoll: (idOrCode) => request(`/polls/${idOrCode}`),
  listPolls: () => request('/polls'),
  updatePollStatus: (id, updates) =>
    request(`/polls/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  deletePoll: (id) =>
    request(`/polls/${id}`, {
      method: 'DELETE',
    }),

  // Votes
  castVote: (pollId, voteData) =>
    request(`/polls/${pollId}/vote`, {
      method: 'POST',
      body: JSON.stringify(voteData),
    }),
  sendReaction: (pollId, emoji) =>
    request(`/polls/${pollId}/react`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),
};
