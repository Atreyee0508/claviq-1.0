import cors from 'cors'
import express from 'express'
import {
  createTask,
  deleteTask,
  getStats,
  getNotes,
  getSelfCare,
  getTaskById,
  getTasks,
  updateNotes,
  updateSelfCare,
  updateTask,
} from './db.js'
import {
  parseTaskId,
  validateNotesInput,
  validateSelfCareInput,
  validateTaskInput,
} from './validation.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const host = process.env.HOST || '0.0.0.0'
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(null, false)
  },
}))
app.use(express.json({ limit: '50kb' }))

function sendValidationError(response, result, message = 'Invalid task data.') {
  return response.status(400).json({
    error: message,
    details: result.errors,
  })
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.get('/api/tasks', (request, response) => {
  const { search = '', status = 'all' } = request.query

  if (!['all', 'active', 'completed'].includes(status)) {
    return response.status(400).json({ error: 'Status must be all, active, or completed.' })
  }

  if (typeof search !== 'string' || search.length > 100) {
    return response.status(400).json({ error: 'Search must be 100 characters or fewer.' })
  }

  return response.json({ tasks: getTasks({ status, search: search.trim() }) })
})

app.get('/api/stats', (_request, response) => {
  response.json({ stats: getStats() })
})

app.get('/api/notes', (_request, response) => {
  response.json({ notes: getNotes() })
})

app.patch('/api/notes', (request, response) => {
  const result = validateNotesInput(request.body)

  if (!result.valid) {
    return sendValidationError(response, result, 'Invalid notes data.')
  }

  return response.json({ notes: updateNotes(result.value.content) })
})

app.get('/api/self-care', (_request, response) => {
  response.json({ selfCare: getSelfCare() })
})

app.patch('/api/self-care', (request, response) => {
  const result = validateSelfCareInput(request.body)

  if (!result.valid) {
    return sendValidationError(response, result, 'Invalid self-care data.')
  }

  if (Object.keys(result.value).length === 0) {
    return response.status(400).json({ error: 'At least one self-care field is required.' })
  }

  return response.json({ selfCare: updateSelfCare(result.value) })
})

app.post('/api/tasks', (request, response) => {
  const result = validateTaskInput(request.body)

  if (!result.valid) {
    return sendValidationError(response, result)
  }

  const task = createTask({
    title: result.value.title,
    description: result.value.description ?? '',
    priority: result.value.priority ?? 'medium',
    dueDate: result.value.dueDate ?? null,
    completed: result.value.completed ?? false,
  })

  return response.status(201).json({ task })
})

app.patch('/api/tasks/:id', (request, response) => {
  const id = parseTaskId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Task id must be a positive integer.' })
  }

  const existingTask = getTaskById(id)

  if (!existingTask) {
    return response.status(404).json({ error: 'Task not found.' })
  }

  const result = validateTaskInput(request.body, { partial: true })

  if (!result.valid) {
    return sendValidationError(response, result)
  }

  if (Object.keys(result.value).length === 0) {
    return response.status(400).json({ error: 'At least one task field is required.' })
  }

  return response.json({ task: updateTask(id, result.value) })
})

app.delete('/api/tasks/:id', (request, response) => {
  const id = parseTaskId(request.params.id)

  if (!id) {
    return response.status(400).json({ error: 'Task id must be a positive integer.' })
  }

  if (!deleteTask(id)) {
    return response.status(404).json({ error: 'Task not found.' })
  }

  return response.status(204).send()
})

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' })
})

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' })
  }

  console.error(error)
  return response.status(500).json({ error: 'An unexpected server error occurred.' })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, host, () => {
    console.log(`Taskflow API listening on http://${host}:${port}`)
  })
}

export default app
