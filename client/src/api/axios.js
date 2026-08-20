import axios from 'axios'
import toast from 'react-hot-toast'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // NEW: a deactivated account gets a clear reason instead of a silent
      // logout — the account isn't broken, it's paused, and logging back
      // in from here reactivates it (see authController.login).
      if (err.response?.data?.deactivated) {
        toast('Your account is deactivated. Log in again to reactivate it.', { icon: '⏸️' })
      }
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api