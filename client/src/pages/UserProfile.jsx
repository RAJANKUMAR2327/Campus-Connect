import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import Layout from '../components/Layout'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import { CardSkeleton } from '../components/Skeleton'
import {
  Mail, GraduationCap, BookOpen, UserPlus, UserMinus,
  UserX, Lock, ArrowLeft, MessageCircle,
} from 'lucide-react'

// NEW PAGE — previously there was no way to view any user's profile except
// your own. Route: /users/:userId (see App.jsx). Respects the viewer's and
// the target's privacy settings (profileVisibility) and blocking, all
// enforced server-side in followController.getPublicProfile — this page
// just reflects whatever the API allows.
export default function UserProfile() {
  useSection('dashboard')
  const { userId } = useParams()
  const navigate = useNavigate()

  const [state, setState] = useState('loading') // loading | ok | private | notfound
  const [profile, setProfile] = useState(null)
  const [limited, setLimited] = useState(null)
  const [followLoading, setFollowLoading] = useState(false)
  const [followers, setFollowers] = useState(null)
  const [following, setFollowing] = useState(null)
  const [activeTab, setActiveTab] = useState(null) // 'followers' | 'following'

  const fetchProfile = async () => {
    setState('loading')
    try {
      const { data } = await api.get(`/users/${userId}/profile`)
      setProfile(data.profile)
      setState('ok')
    } catch (err) {
      if (err.response?.status === 403) {
        setLimited(err.response.data.limited)
        setState('private')
      } else {
        setState('notfound')
      }
    }
  }

  useEffect(() => { fetchProfile() }, [userId])

  const toggleFollow = async () => {
    setFollowLoading(true)
    try {
      if (profile.isFollowing) {
        await api.delete(`/users/${userId}/follow`)
        toast.success(`Unfollowed ${profile.name}`)
      } else {
        await api.post(`/users/${userId}/follow`)
        toast.success(`Following ${profile.name}`)
      }
      fetchProfile()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setFollowLoading(false)
    }
  }

  const loadList = async (type) => {
    if (activeTab === type) { setActiveTab(null); return }
    setActiveTab(type)
    const setter = type === 'followers' ? setFollowers : setFollowing
    if ((type === 'followers' && followers) || (type === 'following' && following)) return
    try {
      const { data } = await api.get(`/users/${userId}/${type}`)
      setter(data[type])
    } catch {
      toast.error(`Failed to load ${type}`)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={15} /> Back
        </button>

        {state === 'loading' && <CardSkeleton />}

        {state === 'notfound' && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <UserX size={40} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">This user couldn't be found.</p>
          </div>
        )}

        {state === 'private' && (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400 mx-auto mb-3 overflow-hidden">
              {limited?.avatar ? <img src={limited.avatar} alt="" className="w-full h-full object-cover" /> : limited?.name?.charAt(0)}
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{limited?.name}</p>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5 mt-2">
              <Lock size={12} /> This profile is private.
            </p>
          </div>
        )}

        {state === 'ok' && profile && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-6 text-center border-b border-gray-100 dark:border-gray-800">
              <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 mx-auto mb-3 overflow-hidden">
                {profile.avatar ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" /> : profile.name?.charAt(0)}
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{profile.name}</h1>
              {profile.college && (
                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1.5">
                  <GraduationCap size={13} /> {profile.college}
                  {profile.branch && <> · <BookOpen size={13} /> {profile.branch}</>}
                  {profile.year && <> · Year {profile.year}</>}
                </p>
              )}
              {profile.email && (
                <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1.5">
                  <Mail size={13} /> {profile.email}
                </p>
              )}

              {!profile.isSelf && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={toggleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50
                      ${profile.isFollowing
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    {profile.isFollowing ? <UserMinus size={13} /> : <UserPlus size={13} />}
                    {profile.isFollowing ? 'Unfollow' : (profile.followsYou ? 'Follow back' : 'Follow')}
                  </button>
                  <Link
                    to={`/chat?user=${profile._id}`}
                    className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <MessageCircle size={13} /> Message
                  </Link>
                </div>
              )}
              {profile.followsYou && !profile.isSelf && (
                <p className="text-[11px] text-gray-400 mt-2">Follows you</p>
              )}
            </div>

            <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-800">
              <button
                onClick={() => loadList('followers')}
                className="py-3 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{profile.followerCount}</p>
                <p className="text-[11px] text-gray-400">Followers</p>
              </button>
              <button
                onClick={() => loadList('following')}
                className="py-3 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{profile.followingCount}</p>
                <p className="text-[11px] text-gray-400">Following</p>
              </button>
            </div>

            {activeTab && (
              <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-2">
                {(activeTab === 'followers' ? followers : following) === null ? (
                  <p className="text-xs text-gray-400 text-center py-4">Loading...</p>
                ) : (activeTab === 'followers' ? followers : following).length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    No {activeTab} yet.
                  </p>
                ) : (
                  (activeTab === 'followers' ? followers : following).map(u => (
                    <Link
                      key={u._id}
                      to={`/users/${u._id}`}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{u.name}</p>
                        <p className="text-[11px] text-gray-400">{u.branch} · Y{u.year}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
