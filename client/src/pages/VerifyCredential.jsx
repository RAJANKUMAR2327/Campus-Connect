import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import { CheckCircle, Shield, Loader, AlertCircle } from 'lucide-react'

export default function VerifyCredential() {
  const { code } = useParams()
  const [credential, setCredential] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/skills/credentials/verify/${code}`)
        setCredential(data.credential)
      } catch { setError(true) }
      finally { setLoading(false) }
    }
    fetch()
  }, [code])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader size={32} className="animate-spin text-indigo-400" /></div>

  if (error || !credential) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Invalid Verification Code</h1>
          <p className="text-sm text-gray-500 mt-1">This credential could not be verified.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <p className="text-xs font-semibold text-green-600 mb-2">VERIFIED CREDENTIAL</p>
        <div className="text-5xl mb-3">{credential.skill?.icon}</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{credential.skill?.name}</h1>
        <p className="text-sm text-gray-500 mb-6 capitalize">{credential.proficiency} Level</p>

        <div className="border-t border-gray-100 pt-6 space-y-3 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Issued to</span>
            <span className="font-medium text-gray-900">{credential.user?.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">College</span>
            <span className="font-medium text-gray-900">{credential.user?.college}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Verification Method</span>
            <span className="font-medium text-gray-900 capitalize">{credential.verificationMethod.replace('-', ' ')}</span>
          </div>
          {credential.score && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Score</span>
              <span className="font-medium text-green-600">{credential.score}%</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Issued On</span>
            <span className="font-medium text-gray-900">{new Date(credential.issuedAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Shield size={12} /> Verified by CampusConnect · Code: {credential.verificationCode}
          </p>
        </div>
      </div>
    </div>
  )
}