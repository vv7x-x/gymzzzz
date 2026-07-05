import {
  BROWSER_USE_API_KEY,
  BROWSER_USE_PROFILE_ID,
  BROWSER_USE_WORKSPACE_ID,
  BROWSER_USE_PROXY_COUNTRY,
} from './config.js';

const BASE_URL = 'https://api.browser-use.com/api/v3';

class BrowserUseError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'BrowserUseError';
    this.status = status;
    this.body = body;
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'X-Browser-Use-API-Key': BROWSER_USE_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new BrowserUseError(`Browser Use API error: ${res.status}`, res.status, body);
  }
  return res.json();
}

export async function runTask(task, options = {}) {
  const session = await apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      task,
      model: options.model || 'claude-opus-4.7',
      profile_id: options.profile_id || BROWSER_USE_PROFILE_ID,
      workspace_id: options.workspace_id || BROWSER_USE_WORKSPACE_ID,
      proxy_country_code: options.proxy_country_code || BROWSER_USE_PROXY_COUNTRY,
      ...options.extraParams,
    }),
  });

  const sessionId = session.id;
  const pollInterval = options.pollInterval || 2000;
  const maxPolls = options.maxPolls || 7200;

  for (let i = 0; i < maxPolls; i++) {
    await new Promise(r => setTimeout(r, pollInterval));
    const result = await getSession(sessionId);
    if (result.status === 'completed' || result.status === 'finished') {
      return result;
    }
    if (result.status === 'failed') {
      throw new BrowserUseError(`Task failed: ${result.error || 'Unknown error'}`);
    }
  }

  throw new BrowserUseError('Task timed out after max polls');
}

export async function getSession(sessionId) {
  return apiFetch(`/sessions/${sessionId}`);
}

export async function createSession(task, options = {}) {
  return apiFetch('/sessions', {
    method: 'POST',
    body: JSON.stringify({
      task,
      model: options.model || 'claude-opus-4.7',
      profile_id: options.profile_id || BROWSER_USE_PROFILE_ID,
      workspace_id: options.workspace_id || BROWSER_USE_WORKSPACE_ID,
      proxy_country_code: options.proxy_country_code || BROWSER_USE_PROXY_COUNTRY,
      ...options.extraParams,
    }),
  });
}

export { BrowserUseError };
