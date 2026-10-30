export const PRIORITIES = ['low', 'medium', 'high']
export const SELF_CARE_FIELDS = ['water', 'sleep', 'breaks', 'healthy', 'joy']

const allowedTaskFields = new Set([
  'title',
  'description',
  'priority',
  'dueDate',
  'completed',
])

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

export function validateTaskInput(payload, { partial = false } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      value: {},
      errors: { body: 'Request body must be a JSON object.' },
    }
  }

  const errors = {}
  const value = {}
  const fields = Object.keys(payload)
  const unsupportedFields = fields.filter((field) => !allowedTaskFields.has(field))

  if (unsupportedFields.length > 0) {
    errors.body = `Unsupported field${unsupportedFields.length > 1 ? 's' : ''}: ${unsupportedFields.join(', ')}.`
  }

  if (!partial || Object.hasOwn(payload, 'title')) {
    if (typeof payload.title !== 'string') {
      errors.title = 'Title must be a string.'
    } else if (payload.title.trim().length === 0) {
      errors.title = 'Title is required.'
    } else if (payload.title.trim().length > 120) {
      errors.title = 'Title must be 120 characters or fewer.'
    } else {
      value.title = payload.title.trim()
    }
  }

  if (!partial || Object.hasOwn(payload, 'description')) {
    if (payload.description === null || payload.description === undefined) {
      value.description = ''
    } else if (typeof payload.description !== 'string') {
      errors.description = 'Description must be a string.'
    } else if (payload.description.trim().length > 1000) {
      errors.description = 'Description must be 1000 characters or fewer.'
    } else {
      value.description = payload.description.trim()
    }
  }

  if (!partial || Object.hasOwn(payload, 'priority')) {
    const priority = payload.priority ?? 'medium'

    if (typeof priority !== 'string' || !PRIORITIES.includes(priority)) {
      errors.priority = 'Priority must be low, medium, or high.'
    } else {
      value.priority = priority
    }
  }

  if (!partial || Object.hasOwn(payload, 'dueDate')) {
    const dueDate = payload.dueDate === '' || payload.dueDate === undefined ? null : payload.dueDate

    if (dueDate !== null && !isValidDate(dueDate)) {
      errors.dueDate = 'Due date must be a valid date in YYYY-MM-DD format.'
    } else {
      value.dueDate = dueDate
    }
  }

  if (Object.hasOwn(payload, 'completed')) {
    if (typeof payload.completed !== 'boolean') {
      errors.completed = 'Completed must be a boolean.'
    } else {
      value.completed = payload.completed
    }
  }

  return { valid: Object.keys(errors).length === 0, value, errors }
}

export function parseTaskId(rawId) {
  const id = Number(rawId)

  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export function validateNotesInput(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      value: {},
      errors: { body: 'Request body must be a JSON object.' },
    }
  }

  const errors = {}
  const value = {}
  const unsupportedFields = Object.keys(payload).filter((field) => field !== 'content')

  if (unsupportedFields.length > 0) {
    errors.body = `Unsupported field${unsupportedFields.length > 1 ? 's' : ''}: ${unsupportedFields.join(', ')}.`
  }

  if (typeof payload.content !== 'string') {
    errors.content = 'Note content must be a string.'
  } else if (payload.content.length > 2000) {
    errors.content = 'Note content must be 2000 characters or fewer.'
  } else {
    value.content = payload.content
  }

  return { valid: Object.keys(errors).length === 0, value, errors }
}

export function validateSelfCareInput(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      valid: false,
      value: {},
      errors: { body: 'Request body must be a JSON object.' },
    }
  }

  const errors = {}
  const value = {}
  const fields = Object.keys(payload)
  const unsupportedFields = fields.filter((field) => !SELF_CARE_FIELDS.includes(field))

  if (unsupportedFields.length > 0) {
    errors.body = `Unsupported field${unsupportedFields.length > 1 ? 's' : ''}: ${unsupportedFields.join(', ')}.`
  }

  for (const field of SELF_CARE_FIELDS) {
    if (Object.hasOwn(payload, field)) {
      if (typeof payload[field] !== 'boolean') {
        errors[field] = `${field} must be a boolean.`
      } else {
        value[field] = payload[field]
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, value, errors }
}
