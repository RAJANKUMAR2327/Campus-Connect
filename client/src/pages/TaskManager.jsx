import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import { Plus, X, Trash2, CheckSquare, Circle, Flag, Calendar } from 'lucide-react'

const CATEGORIES = [
  { value: 'academic', label: 'Academic', color: '#6366f1' },
  { value: 'personal', label: 'Personal', color: '#ec4899' },
  { value: 'project', label: 'Project', color: '#10b981' },
  { value: 'other', label: 'Other', color: '#6b7280' },
]
const PRIORITIES = [
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'low', label: 'Low', color: '#6b7280' },
]

function AddTaskModal({ onClose, onAdded }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('academic')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return toast.error('Give the task a title')
    setSaving(true)
    try {
      await api.post('/tasks', { title, description, category, priority, dueDate: dueDate || undefined })
      toast.success('Task added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you need to do?" required autoFocus
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Details (optional)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select value={priority} onChange={e => setPriority(e.target.value)}
              className="text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label} priority</option>)}
            </select>
          </div>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <button type="submit" disabled={saving}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Adding…' : 'Add Task'}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

function TaskRow({ task, onChanged }) {
  const cat = CATEGORIES.find(c => c.value === task.category) || CATEGORIES.at(-1)
  const pri = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1]
  const overdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date(new Date().toDateString())

  const toggle = async () => {
    try {
      await api.patch(`/tasks/${task._id}/toggle`)
      onChanged()
    } catch {
      toast.error('Failed to update task')
    }
  }

  const remove = async () => {
    try {
      await api.delete(`/tasks/${task._id}`)
      onChanged()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  return (
    <div className={`flex items-start gap-3 bg-white dark:bg-gray-900 rounded-xl border p-3.5 ${task.completed ? 'border-gray-100 dark:border-gray-800 opacity-60' : 'border-gray-100 dark:border-gray-800'}`}>
      <button onClick={toggle} className="mt-0.5 shrink-0 text-gray-300 hover:text-indigo-500 transition-colors">
        {task.completed ? <CheckSquare size={18} className="text-green-500" /> : <Circle size={18} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${task.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
          {task.title}
        </p>
        {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ color: cat.color, background: `${cat.color}15` }}>
            {cat.label}
          </span>
          <span className="text-[10px] font-medium flex items-center gap-0.5" style={{ color: pri.color }}>
            <Flag size={9} /> {pri.label}
          </span>
          {task.dueDate && (
            <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              <Calendar size={9} /> {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              {overdue && ' (overdue)'}
            </span>
          )}
        </div>
      </div>
      <button onClick={remove} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 size={14} /></button>
    </div>
  )
}

export default function TaskManager() {
  useSection('dashboard')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('active')
  const [showModal, setShowModal] = useState(false)

  const fetchTasks = async () => {
    try {
      const { data } = await api.get(`/tasks?status=${filter}`)
      setTasks(data.tasks)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [filter])

  const activeCount = tasks.filter(t => !t.completed).length

  return (
    <Layout>
      <AnimatePresence>
        {showModal && <AddTaskModal onClose={() => setShowModal(false)} onAdded={fetchTasks} />}
      </AnimatePresence>

      <PageHeader
        title="Tasks"
        subtitle={filter === 'active' ? `${activeCount} task${activeCount !== 1 ? 's' : ''} left` : 'Your to-do list'}
        action={{ label: 'Add Task', icon: Plus, onClick: () => setShowModal(true) }}
      />

      <div className="flex gap-2 mb-4">
        {[{ v: 'active', l: 'Active' }, { v: 'completed', l: 'Completed' }, { v: 'all', l: 'All' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${filter === f.v ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            {f.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare size={36} className="mx-auto text-gray-200 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400">
            {filter === 'completed' ? 'No completed tasks yet.' : 'Nothing here — add a task to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(t => <TaskRow key={t._id} task={t} onChanged={fetchTasks} />)}
        </div>
      )}
    </Layout>
  )
}
