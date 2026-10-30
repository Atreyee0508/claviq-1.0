import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'

const backendDirectory = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const configuredDataDirectory = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(backendDirectory, 'data')
const databasePath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(configuredDataDirectory, 'tasks.db')

fs.mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new Database(databasePath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TEXT,
    completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`)
db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    content TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS self_care (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    water INTEGER NOT NULL DEFAULT 0 CHECK (water IN (0, 1)),
    sleep INTEGER NOT NULL DEFAULT 0 CHECK (sleep IN (0, 1)),
    breaks INTEGER NOT NULL DEFAULT 0 CHECK (breaks IN (0, 1)),
    healthy INTEGER NOT NULL DEFAULT 0 CHECK (healthy IN (0, 1)),
    joy INTEGER NOT NULL DEFAULT 0 CHECK (joy IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO notes (id, content) VALUES (1, '');
  INSERT OR IGNORE INTO self_care (id) VALUES (1);
`)

function serializeTask(row) {
  if (!row) {
    return null
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function getTasks({ status = 'all', search = '' } = {}) {
  const conditions = []
  const parameters = []

  if (status === 'active' || status === 'completed') {
    conditions.push('completed = ?')
    parameters.push(status === 'completed' ? 1 : 0)
  }

  if (search) {
    const searchPattern = `%${search}%`
    conditions.push('(title LIKE ? OR description LIKE ?)')
    parameters.push(searchPattern, searchPattern)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const rows = db
    .prepare(`
      SELECT id, title, description, priority, due_date, completed, created_at, updated_at
      FROM tasks
      ${whereClause}
      ORDER BY completed ASC,
        CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        CASE WHEN due_date IS NULL THEN 1 ELSE 0 END,
        due_date ASC,
        created_at DESC
    `)
    .all(...parameters)

  return rows.map(serializeTask)
}

export function getTaskById(id) {
  const row = db
    .prepare(`
      SELECT id, title, description, priority, due_date, completed, created_at, updated_at
      FROM tasks
      WHERE id = ?
    `)
    .get(id)

  return serializeTask(row)
}

export function getStats() {
  const stats = db
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) AS pending
      FROM tasks
    `)
    .get()

  return {
    total: Number(stats.total),
    completed: Number(stats.completed),
    pending: Number(stats.pending),
  }
}

export function createTask({ title, description, priority, dueDate, completed = false }) {
  const result = db
    .prepare(`
      INSERT INTO tasks (title, description, priority, due_date, completed)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(title, description, priority, dueDate, completed ? 1 : 0)

  return getTaskById(result.lastInsertRowid)
}

export function updateTask(id, changes) {
  const columnMap = {
    title: 'title',
    description: 'description',
    priority: 'priority',
    dueDate: 'due_date',
    completed: 'completed',
  }
  const entries = Object.entries(changes).filter(([field]) => columnMap[field])
  const assignments = entries.map(([field]) => `${columnMap[field]} = ?`)
  const values = entries.map(([field, value]) => (field === 'completed' ? (value ? 1 : 0) : value))

  assignments.push("updated_at = datetime('now')")

  db.prepare(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = ?`).run(...values, id)

  return getTaskById(id)
}

export function deleteTask(id) {
  return db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0
}

export function getNotes() {
  const note = db
    .prepare('SELECT content, updated_at FROM notes WHERE id = 1')
    .get()

  return {
    content: note.content,
    updatedAt: note.updated_at,
  }
}

export function updateNotes(content) {
  db
    .prepare("UPDATE notes SET content = ?, updated_at = datetime('now') WHERE id = 1")
    .run(content)

  return getNotes()
}

export function getSelfCare() {
  const row = db
    .prepare(`
      SELECT water, sleep, breaks, healthy, joy, updated_at
      FROM self_care
      WHERE id = 1
    `)
    .get()

  return {
    water: Boolean(row.water),
    sleep: Boolean(row.sleep),
    breaks: Boolean(row.breaks),
    healthy: Boolean(row.healthy),
    joy: Boolean(row.joy),
    updatedAt: row.updated_at,
  }
}

export function updateSelfCare(changes) {
  const columnMap = {
    water: 'water',
    sleep: 'sleep',
    breaks: 'breaks',
    healthy: 'healthy',
    joy: 'joy',
  }
  const entries = Object.entries(changes).filter(([field]) => columnMap[field])
  const assignments = entries.map(([field]) => `${columnMap[field]} = ?`)
  const values = entries.map(([, value]) => (value ? 1 : 0))

  assignments.push("updated_at = datetime('now')")

  db.prepare(`UPDATE self_care SET ${assignments.join(', ')} WHERE id = 1`).run(...values)

  return getSelfCare()
}

export function closeDatabase() {
  db.close()
}
