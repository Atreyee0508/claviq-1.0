import { useDeferredValue, useEffect, useState } from 'react'
import {
  createTask,
  fetchNotes,
  fetchSelfCare,
  fetchStats,
  fetchTasks,
  removeTask,
  updateNotes,
  updateSelfCare,
  updateTask,
} from './api'
import './App.css'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All', stat: 'total' },
  { value: 'active', label: 'Active', stat: 'pending' },
  { value: 'completed', label: 'Completed', stat: 'completed' },
]

const PRIORITY_RANK = { high: 1, medium: 2, low: 3 }

const COLLAGE_IMAGES = {
  mountain: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1300&q=85',
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=85',
  coast: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=85',
}

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
}

const DEFAULT_SELF_CARE = {
  water: false,
  sleep: false,
  breaks: false,
  healthy: false,
  joy: false,
}

const SELF_CARE_ITEMS = [
  { key: 'water', label: 'Drink enough water' },
  { key: 'sleep', label: 'Sleep well' },
  { key: 'breaks', label: 'Take little breaks' },
  { key: 'healthy', label: 'Eat something healthy' },
  { key: 'joy', label: 'Do something enjoyable' },
]

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: 'M5 12h13m-5-5 5 5-5 5',
    calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
    check: 'm5 12.5 4.2 4.2L19 7',
    close: 'm6 6 12 12M18 6 6 18',
    edit: 'm4 16.5-.8 3.3 3.3-.8L18 7.5 15.5 5 4 16.5ZM14.5 6l2.5 2.5',
    flag: 'M5 21V4m0 0c4-3 8 3 13 0v9c-5 3-9-3-13 0',
    menu: 'M4 7h16M4 12h16M4 17h16',
    plus: 'M12 5v14M5 12h14',
    refresh: 'M20 11a8 8 0 0 0-14.7-3L3 11m0 0V5m0 6h6M4 13a8 8 0 0 0 14.7 3L21 13m0 0v6m0-6h-6',
    search: 'm20 20-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
    star: 'm12 3 2.8 5.8 6.2.9-4.5 4.5 1 6.3-5.5-3-5.5 3 1-6.3L3.5 9.7l6.2-.9L12 3Z',
    trash: 'M5 7h14m-9 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14',
  }

  return (
    <svg
      aria-hidden="true"
      className="icon"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={paths[name]} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.6" />
    </svg>
  )
}

function PhotoCollage() {
  return (
    <section aria-label="Editorial photo collage" className="photo-collage">
      <figure className="collage-panel collage-main">
        <div className="collage-image-wrap">
          <img alt="Misty mountain range in black and white" loading="eager" src={COLLAGE_IMAGES.mountain} />
        </div>
        <figcaption>01 / THE LONG VIEW</figcaption>
        <span className="collage-number">02</span>
      </figure>
      <figure className="collage-panel collage-top">
        <div className="collage-image-wrap">
          <img alt="Dense forest canopy in black and white" loading="lazy" src={COLLAGE_IMAGES.forest} />
        </div>
        <figcaption>06 / STILLNESS</figcaption>
        <span className="collage-number">06</span>
      </figure>
      <figure className="collage-panel collage-bottom">
        <div className="collage-image-wrap">
          <img alt="Ocean horizon in black and white" loading="lazy" src={COLLAGE_IMAGES.coast} />
        </div>
        <figcaption>10 / OPEN SPACE</figcaption>
        <span className="collage-number">10</span>
      </figure>
      <span className="collage-caption">A VISUAL PAUSE<br />BETWEEN THINGS</span>
    </section>
  )
}

function TaskRow({ task, index, onToggle, onEdit, onDelete, pending }) {
  const overdue = task.dueDate && !task.completed && task.dueDate < getTodayIso()

  return (
    <article className={`task-row ${task.priority === 'high' ? 'is-high-priority' : ''} ${task.completed ? 'is-completed' : ''}`}>
      <span aria-hidden="true" className="task-index">{String(index + 1).padStart(2, '0')}</span>
      <button
        aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}
        aria-pressed={task.completed}
        className="editorial-checkbox"
        disabled={pending}
        onClick={() => onToggle(task)}
        type="button"
      >
        {task.completed && <Icon name="check" size={14} />}
      </button>
      <div className="task-row-copy">
        <div className="task-title-line">
          <h3>{task.title}</h3>
          <span className={`priority-label priority-${task.priority}`}>
            <span className="priority-bar" />
            {task.priority.toUpperCase()}
          </span>
        </div>
        {task.description && <p>{task.description}</p>}
        <span className="task-created">ADDED {formatCreatedAt(task.createdAt)}</span>
      </div>
      <div className={`task-due ${overdue ? 'is-overdue' : ''}`}>
        <span>DUE</span>
        <strong>{task.dueDate ? formatShortDate(task.dueDate) : 'OPEN'}</strong>
      </div>
      <div className="task-row-actions">
        <button aria-label={`Edit ${task.title}`} className="row-action" disabled={pending} onClick={() => onEdit(task)} type="button">
          <Icon name="edit" size={14} />
        </button>
        <button aria-label={`Delete ${task.title}`} className="row-action row-action-delete" disabled={pending} onClick={() => onDelete(task)} type="button">
          <Icon name="trash" size={14} />
        </button>
      </div>
    </article>
  )
}

function PrioritySection({ tasks, onEdit, onToggle }) {
  const priorities = [...tasks]
    .sort((first, second) => {
      const priorityDifference = PRIORITY_RANK[first.priority] - PRIORITY_RANK[second.priority]
      return priorityDifference || (first.dueDate || '9999').localeCompare(second.dueDate || '9999')
    })
    .slice(0, 3)

  return (
    <section className="editorial-side-section priorities-section">
      <div className="side-section-heading">
        <div className="section-id"><span>02</span><small>INDEX</small></div>
        <div><span className="eyebrow">NEXT UP</span><h2>TOP PRIORITIES</h2></div>
      </div>
      <div className="priority-list">
        {priorities.length > 0 ? priorities.map((task, index) => (
          <div className="priority-row" key={task.id}>
            <span className="priority-index">{String(index + 1).padStart(2, '0')}</span>
            <button
              aria-label={task.completed ? `Mark ${task.title} active` : `Complete ${task.title}`}
              aria-pressed={task.completed}
              className={`mini-editorial-checkbox ${task.completed ? 'is-checked' : ''}`}
              onClick={() => onToggle(task)}
              type="button"
            >
              {task.completed && <Icon name="check" size={11} />}
            </button>
            <button className="priority-row-copy" onClick={() => onEdit(task)} type="button">
              <strong>{task.title}</strong>
              <span>{task.priority.toUpperCase()} / {task.dueDate ? formatShortDate(task.dueDate) : 'NO DATE'}</span>
            </button>
          </div>
        )) : (
          <p className="side-empty">No active tasks yet. Your priority index will appear here.</p>
        )}
      </div>
    </section>
  )
}

function NotesSection({ draft, dirty, saving, status, onChange, onSave }) {
  return (
    <section className="editorial-side-section notes-section">
      <div className="side-section-heading">
        <div className="section-id"><span>06</span><small>INDEX</small></div>
        <div><span className="eyebrow">FIELD NOTES</span><h2>NOTES</h2></div>
      </div>
      <textarea
        aria-label="Notes"
        className="editorial-notes-input"
        maxLength="2000"
        onBlur={() => {
          if (dirty) onSave()
        }}
        onChange={(event) => onChange(event.target.value)}
        placeholder="A thought worth keeping..."
        value={draft}
      />
      <div className="notes-status-row">
        <span className={dirty ? 'is-unsaved' : ''}>{status}</span>
        <button disabled={!dirty || saving} onClick={onSave} type="button">{saving ? 'SAVING' : 'SAVE NOTE'}</button>
      </div>
    </section>
  )
}

function SelfCareSection({ values, pending, onToggle }) {
  const completedCount = SELF_CARE_ITEMS.filter((item) => values[item.key]).length

  return (
    <section className="editorial-side-section care-section">
      <div className="side-section-heading">
        <div className="section-id"><span>10</span><small>INDEX</small></div>
        <div><span className="eyebrow">MAINTENANCE</span><h2>SELF CARE</h2></div>
      </div>
      <div className="care-count"><strong>{String(completedCount).padStart(2, '0')}</strong><span>/ {SELF_CARE_ITEMS.length} COMPLETE</span></div>
      <div className="care-list">
        {SELF_CARE_ITEMS.map((item) => (
          <label className={`care-row ${values[item.key] ? 'is-done' : ''}`} key={item.key}>
            <input checked={Boolean(values[item.key])} disabled={pending === item.key} onChange={() => onToggle(item.key)} type="checkbox" />
            <span className="care-square">{values[item.key] && <Icon name="check" size={12} />}</span>
            <span>{item.label}</span>
          </label>
        ))}
      </div>
    </section>
  )
}

function TaskModal({ task, saving, error, onClose, onSubmit }) {
  const [form, setForm] = useState(() => (task ? taskToForm(task) : EMPTY_FORM))
  const [localError, setLocalError] = useState('')

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && !saving) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setLocalError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setLocalError('A title is required.')
      return
    }
    onSubmit(form)
  }

  return (
    <div
      aria-label="Task editor"
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose()
      }}
      role="presentation"
    >
      <section aria-modal="true" className="editorial-modal" role="dialog">
        <div className="modal-heading">
          <div><span className="eyebrow">{task ? 'EDIT ENTRY' : 'NEW ENTRY'}</span><h2>{task ? 'EDIT TASK' : 'ADD TASK'}</h2></div>
          <button aria-label="Close task editor" className="modal-close" disabled={saving} onClick={onClose} type="button"><Icon name="close" size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="editorial-field"><span>TITLE</span><input autoFocus maxLength="120" name="title" onChange={handleChange} placeholder="What needs doing?" type="text" value={form.title} /></label>
          <label className="editorial-field"><span>DESCRIPTION <em>OPTIONAL</em></span><textarea maxLength="1000" name="description" onChange={handleChange} placeholder="Add context or the next move..." rows="4" value={form.description} /></label>
          <div className="editorial-field-grid">
            <label className="editorial-field"><span>PRIORITY</span><select name="priority" onChange={handleChange} value={form.priority}><option value="low">LOW</option><option value="medium">MEDIUM</option><option value="high">HIGH</option></select></label>
            <label className="editorial-field"><span>DUE DATE <em>OPTIONAL</em></span><input name="dueDate" onChange={handleChange} type="date" value={form.dueDate} /></label>
          </div>
          {(localError || error) && <p className="form-error">{localError || error}</p>}
          <div className="modal-actions"><button className="modal-secondary" disabled={saving} onClick={onClose} type="button">CANCEL</button><button className="modal-primary" disabled={saving} type="submit">{saving ? 'SAVING...' : task ? 'SAVE CHANGES' : 'ADD TASK +'}</button></div>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [tasks, setTasks] = useState([])
  const [priorityTasks, setPriorityTasks] = useState([])
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [selectedDate, setSelectedDate] = useState(getTodayIso())
  const [notesDraft, setNotesDraft] = useState('')
  const [notesDirty, setNotesDirty] = useState(false)
  const [notesSaving, setNotesSaving] = useState(false)
  const [notesStatus, setNotesStatus] = useState('SAVED TO SQLITE')
  const [selfCare, setSelfCare] = useState(DEFAULT_SELF_CARE)
  const [selfCarePending, setSelfCarePending] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [pendingTaskId, setPendingTaskId] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    fetchTasks({ search: deferredSearch.trim(), signal: controller.signal, status: filter })
      .then((nextTasks) => {
        if (active) setTasks(nextTasks)
      })
      .catch((requestError) => {
        if (active && requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [deferredSearch, filter, refreshToken])

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    Promise.all([
      fetchStats({ signal: controller.signal }),
      fetchTasks({ signal: controller.signal, status: 'active' }),
      fetchNotes({ signal: controller.signal }),
      fetchSelfCare({ signal: controller.signal }),
    ])
      .then(([nextStats, nextPriorityTasks, nextNotes, nextSelfCare]) => {
        if (!active) return
        setStats(nextStats)
        setPriorityTasks(nextPriorityTasks)
        setNotesDraft(nextNotes.content)
        setNotesDirty(false)
        setNotesStatus('SAVED TO SQLITE')
        setSelfCare(nextSelfCare)
      })
      .catch((requestError) => {
        if (active && requestError.name !== 'AbortError') setError(requestError.message)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [refreshToken])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  async function reloadTaskData() {
    const [nextTasks, nextStats, nextPriorityTasks] = await Promise.all([
      fetchTasks({ search: deferredSearch.trim(), status: filter }),
      fetchStats(),
      fetchTasks({ status: 'active' }),
    ])

    setTasks(nextTasks)
    setStats(nextStats)
    setPriorityTasks(nextPriorityTasks)
  }

  function chooseFilter(nextFilter) {
    setLoading(true)
    setError('')
    setFilter(nextFilter)
  }

  function updateSearch(value) {
    setLoading(true)
    setError('')
    setSearch(value)
  }

  function openCreateForm() {
    setEditingTask(null)
    setFormError('')
    setIsFormOpen(true)
  }

  function openEditForm(task) {
    setEditingTask(task)
    setFormError('')
    setIsFormOpen(true)
  }

  function closeForm() {
    if (!saving) {
      setIsFormOpen(false)
      setEditingTask(null)
      setFormError('')
    }
  }

  async function handleSave(form) {
    setSaving(true)
    setFormError('')

    try {
      const payload = { ...form, dueDate: form.dueDate || null }
      if (editingTask) {
        await updateTask(editingTask.id, payload)
        setToast('TASK UPDATED')
      } else {
        await createTask(payload)
        setToast('TASK ADDED')
      }
      await reloadTaskData()
      setIsFormOpen(false)
      setEditingTask(null)
    } catch (requestError) {
      setFormError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(task) {
    setPendingTaskId(task.id)
    setError('')

    try {
      await updateTask(task.id, { completed: !task.completed })
      await reloadTaskData()
      setToast(task.completed ? 'TASK REOPENED' : 'TASK COMPLETE')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPendingTaskId(null)
    }
  }

  async function handleDelete(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return

    setPendingTaskId(task.id)
    setError('')

    try {
      await removeTask(task.id)
      await reloadTaskData()
      setToast('TASK DELETED')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setPendingTaskId(null)
    }
  }

  async function handleSaveNotes() {
    if (!notesDirty || notesSaving) return

    setNotesSaving(true)
    try {
      const savedNotes = await updateNotes(notesDraft)
      setNotesDraft(savedNotes.content)
      setNotesDirty(false)
      setNotesStatus('SAVED JUST NOW')
    } catch (requestError) {
      setError(requestError.message)
      setNotesStatus('SAVE FAILED')
    } finally {
      setNotesSaving(false)
    }
  }

  async function handleSelfCareToggle(field) {
    setSelfCarePending(field)

    try {
      const savedSelfCare = await updateSelfCare({ [field]: !selfCare[field] })
      setSelfCare(savedSelfCare)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSelfCarePending('')
    }
  }

  const total = stats?.total ?? 0
  const completed = stats?.completed ?? 0
  const pending = stats?.pending ?? 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="editorial-app">
      <aside aria-hidden="true" className="vertical-label">
        <span>TO-DO</span>
        <small>DAILY EDITION / 2025</small>
      </aside>

      <div className="page-shell">
        <header className="editorial-header">
          <div className="masthead-line">
            <span>THE DAILY EDITION</span>
            <span>VOL. 01 / NO. 04</span>
            <span className="masthead-rule" />
            <span>ISSN 020 060 010</span>
          </div>

          <div className="hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">A PERSONAL INDEX / {formatDayNumber(selectedDate)}</span>
              <h1>TO-DO<br /><span>EDITED.</span></h1>
              <p>Make space for what matters. A considered list for the day ahead, one deliberate line at a time.</p>
              <div className="hero-bottom-line">
                <span>SMALL STEPS / BIG PROGRESS</span>
                <Icon name="arrow" size={19} />
              </div>
            </div>

            <PhotoCollage />

            <div className="date-stamp">
              <span className="eyebrow">DATE SELECTOR</span>
              <strong>{formatFriendlyDate(selectedDate)}</strong>
              <label htmlFor="selected-date">CHANGE DAY</label>
              <input aria-label="Choose a date" id="selected-date" onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} />
            </div>
          </div>
        </header>

        <main className="content-grid">
          <section className="tasks-section editorial-frame">
            <div className="section-heading-row">
              <div className="section-heading-main">
                <span className="section-number">14</span>
                <div><span className="eyebrow">INDEX / 01</span><h2>YOUR TASKS</h2></div>
              </div>
              <span className="section-aside">THE WORK IN FRONT OF YOU<br />{String(total).padStart(2, '0')} ENTRIES</span>
            </div>

            <div className="task-summary-row">
              <div className="completion-figure"><strong>{String(completionRate).padStart(2, '0')}</strong><span>% COMPLETE</span></div>
              <div className="completion-copy"><span>PROGRESS REPORT</span><p>{completed} of {total} tasks finished. Keep the line moving.</p></div>
              <div className="summary-rule" />
            </div>

            <div className="task-toolbar">
              <label className="editorial-search">
                <Icon name="search" size={16} />
                <input aria-label="Search tasks" onChange={(event) => updateSearch(event.target.value)} placeholder="SEARCH THE LIST" type="search" value={search} />
                {search && <button aria-label="Clear search" onClick={() => updateSearch('')} type="button"><Icon name="close" size={13} /></button>}
              </label>
              <div aria-label="Task status filters" className="editorial-filters" role="group">
                {FILTER_OPTIONS.map((option) => <button className={filter === option.value ? 'is-selected' : ''} key={option.value} onClick={() => chooseFilter(option.value)} type="button">{option.label}<span>{stats ? stats[option.stat] : '-'}</span></button>)}
              </div>
              <button className="add-task-control" onClick={openCreateForm} type="button">ADD TASK <span>+</span></button>
            </div>

            {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => { setLoading(true); setError(''); setRefreshToken((token) => token + 1) }} type="button"><Icon name="refresh" size={14} /> RETRY</button></div>}

            {loading ? (
              <div aria-label="Loading tasks" className="editorial-task-list" role="status">{[1, 2, 3].map((item) => <div className="editorial-skeleton" key={item} />)}</div>
            ) : tasks.length > 0 ? (
              <div className="editorial-task-list">
                {tasks.map((task, index) => <TaskRow index={index} key={task.id} onDelete={handleDelete} onEdit={openEditForm} onToggle={handleToggle} pending={pendingTaskId === task.id} task={task} />)}
              </div>
            ) : (
              <div className="editorial-empty"><span>00</span><h3>{search ? 'NO MATCHES' : filter === 'completed' ? 'NOTHING FINISHED YET' : filter === 'active' ? 'THE LIST IS CLEAR' : 'THE PAGE IS OPEN'}</h3><p>{search ? 'Try a different search term.' : 'Add the first entry to begin the issue.'}</p>{!search && filter !== 'completed' && <button className="add-task-control" onClick={openCreateForm} type="button">ADD TASK <span>+</span></button>}</div>
            )}
          </section>

          <aside className="side-column">
            <PrioritySection onEdit={openEditForm} onToggle={handleToggle} tasks={priorityTasks} />
            <NotesSection
              draft={notesDraft}
              dirty={notesDirty}
              onChange={(value) => { setNotesDraft(value); setNotesDirty(true); setNotesStatus('UNSAVED CHANGES') }}
              onSave={handleSaveNotes}
              saving={notesSaving}
              status={notesStatus}
            />
            <SelfCareSection onToggle={handleSelfCareToggle} pending={selfCarePending} values={selfCare} />
          </aside>
        </main>

        <footer className="editorial-footer">
          <div className="footer-message"><span className="section-number">20</span><div><span className="eyebrow">FINAL NOTE</span><h2>KEEP MOVING<br /><em>FORWARD.</em></h2></div></div>
          <div className="footer-stats"><span><strong>{String(total).padStart(2, '0')}</strong><small>TOTAL</small></span><span><strong>{String(completed).padStart(2, '0')}</strong><small>DONE</small></span><span><strong>{String(pending).padStart(2, '0')}</strong><small>OPEN</small></span></div>
          <p>Progress is not a straight line.<br />It is a series of small decisions.</p>
        </footer>
      </div>

      {toast && <div className="toast" role="status"><Icon name="check" size={13} /> {toast}</div>}
      {isFormOpen && <TaskModal error={formError} key={editingTask?.id ?? 'new'} onClose={closeForm} onSubmit={handleSave} saving={saving} task={editingTask} />}
    </div>
  )
}

function taskToForm(task) {
  return { title: task.title, description: task.description || '', priority: task.priority, dueDate: task.dueDate || '' }
}

function formatFriendlyDate(value) {
  if (!value) return 'CHOOSE A DAY'
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', weekday: 'long' }).format(new Date(`${value}T00:00:00`)).toUpperCase()
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(new Date(`${value}T00:00:00`)).toUpperCase()
}

function formatDayNumber(value) {
  if (!value) return '00'
  return new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(new Date(`${value}T00:00:00`))
}

function formatCreatedAt(value) {
  if (!value) return 'RECENTLY'
  const date = new Date(`${value.replace(' ', 'T')}Z`)
  if (Number.isNaN(date.getTime())) return 'RECENTLY'
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short' }).format(date).toUpperCase()
}

function getTodayIso() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default App
