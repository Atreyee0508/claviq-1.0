const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const API_URL = (configuredApiUrl || (import.meta.env.DEV ? '/api' : '')).replace(/\/+$/, '')

async function request(path, options = {}) {
  if (!API_URL) {
    throw new Error('VITE_API_URL is not configured for this production build.')
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(payload?.error || 'The server could not complete that request.')
  }

  return payload
}

export async function fetchTasks({ status, search, signal } = {}) {
  const params = new URLSearchParams()

  if (status && status !== 'all') {
    params.set('status', status)
  }

  if (search) {
    params.set('search', search)
  }

  const query = params.toString()
  const payload = await request(`/tasks${query ? `?${query}` : ''}`, { signal })

  return payload.tasks
}

export async function fetchStats({ signal } = {}) {
  const payload = await request('/stats', { signal })

  return payload.stats
}

export async function fetchNotes({ signal } = {}) {
  const payload = await request('/notes', { signal })

  return payload.notes
}

export async function updateNotes(content) {
  const payload = await request('/notes', {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })

  return payload.notes
}

export async function fetchSelfCare({ signal } = {}) {
  const payload = await request('/self-care', { signal })

  return payload.selfCare
}

export async function updateSelfCare(changes) {
  const payload = await request('/self-care', {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })

  return payload.selfCare
}

export async function createTask(task) {
  const payload = await request('/tasks', {
    method: 'POST',
    body: JSON.stringify(task),
  })

  return payload.task
}

export async function updateTask(id, changes) {
  const payload = await request(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })

  return payload.task
}

export async function removeTask(id) {
  await request(`/tasks/${id}`, { method: 'DELETE' })
}
