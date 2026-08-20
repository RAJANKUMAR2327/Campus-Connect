import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api/axios'
import Layout from '../components/Layout'
import { Upload, FileCheck, ArrowLeft, Loader } from 'lucide-react'

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert']

export default function CertificateGenerator() {
  const navigate = useNavigate()
  const [skills, setSkills] = useState([])
  const [skillId, setSkillId] = useState('')
  const [proficiency, setProficiency] = useState('intermediate')
  const [file, setFile] = useState(null)
  const [loadingSkills, setLoadingSkills] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const { data } = await api.get('/skills')
        setSkills(data.skills || [])
      } catch {
        toast.error('Failed to load skills')
      } finally {
        setLoadingSkills(false)
      }
    }
    fetchSkills()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!skillId) return toast.error('Please select a skill')
    if (!file) return toast.error('Please attach your certificate')

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('skillId', skillId)
      formData.append('proficiency', proficiency)
      formData.append('certificate', file)

      await api.post('/skills/certificate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      toast.success('Certificate uploaded! Pending admin verification.')
      navigate('/skills')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
              <FileCheck size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Verify a Skill</h1>
              <p className="text-xs text-gray-400">Upload a certificate to earn a verified credential</p>
            </div>
          </div>

          {loadingSkills ? (
            <div className="flex justify-center py-8">
              <Loader size={24} className="animate-spin text-indigo-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Skill</label>
                <select
                  value={skillId}
                  onChange={e => setSkillId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a skill…</option>
                  {skills.map(s => (
                    <option key={s._id} value={s._id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Proficiency</label>
                <div className="grid grid-cols-4 gap-2">
                  {PROFICIENCY_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setProficiency(level)}
                      className={`py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                        proficiency === level
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Certificate file</label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl py-8 cursor-pointer hover:border-indigo-400 transition-colors">
                  <Upload size={22} className="text-gray-300" />
                  <span className="text-xs text-gray-400 text-center px-4">
                    {file ? file.name : 'Click to upload an image or PDF of your certificate'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white text-sm font-medium py-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Uploading…' : 'Submit for Verification'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}
