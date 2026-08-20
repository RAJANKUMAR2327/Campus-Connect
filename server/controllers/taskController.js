import Task from '../models/Task.js'
import { sendServerError } from '../utils/errorResponse.js'

// ─── CREATE TASK ────────────────────────────────────────────────────
export const createTask = async (req, res) => {
  try {
    const { title, description, category, priority, dueDate } = req.body
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required.' })

    const task = await Task.create({
      user: req.user._id, title, description, category, priority,
      dueDate: dueDate || undefined,
    })
    res.status(201).json({ message: 'Task added!', task })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── GET TASKS ───────────────────────────────────────────────────────
export const getTasks = async (req, res) => {
  try {
    const { status, category } = req.query
    const filter = { user: req.user._id }
    if (status === 'active') filter.completed = false
    if (status === 'completed') filter.completed = true
    if (category) filter.category = category

    const tasks = await Task.find(filter).sort({ completed: 1, dueDate: 1, createdAt: -1 })
    res.json({ tasks })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── UPDATE TASK ─────────────────────────────────────────────────────
export const updateTask = async (req, res) => {
  try {
    const { title, description, category, priority, dueDate } = req.body
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(priority && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate || null }),
      },
      { new: true }
    )
    if (!task) return res.status(404).json({ message: 'Task not found.' })
    res.json({ message: 'Updated!', task })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── TOGGLE COMPLETE ──────────────────────────────────────────────────
export const toggleComplete = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id })
    if (!task) return res.status(404).json({ message: 'Task not found.' })

    task.completed = !task.completed
    task.completedAt = task.completed ? new Date() : undefined
    await task.save()

    res.json({ message: task.completed ? 'Marked complete!' : 'Marked incomplete.', task })
  } catch (err) {
    sendServerError(res, err)
  }
}

// ─── DELETE TASK ──────────────────────────────────────────────────────
export const deleteTask = async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Task removed.' })
  } catch (err) {
    sendServerError(res, err)
  }
}
