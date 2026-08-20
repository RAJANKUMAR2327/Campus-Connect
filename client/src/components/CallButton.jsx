import { Video } from 'lucide-react'
import api from '../api/axios'
import useCallStore from '../store/callStore'
import useSocketStore from '../store/socketStore'
import toast from 'react-hot-toast'

export default function CallButton({ targetUserId, targetName, targetAvatar, type = 'one-on-one', className }) {
  const { setActiveCall } = useCallStore()
  const { socket, onlineUsers } = useSocketStore()

  const handleCall = async () => {
    if (!onlineUsers.includes(targetUserId)) {
      return toast.error(`${targetName} is currently offline`)
    }
    try {
      const { data } = await api.post('/calls/room', {
        type, participantIds: [targetUserId] })

      socket.emit('call_initiate', {
        roomId: data.roomId,
        targetUserIds: [targetUserId],
        callType: 'video' })

      setActiveCall({
        roomId: data.roomId,
        targetUserId, targetName, targetAvatar,
        callType: 'video', isInitiator: true })

      toast.success('Calling...')
    } catch { toast.error('Failed to start call') }
  }

  return (
    <button onClick={handleCall}
      className={className || "flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"}>
      <Video size={13} /> Video Call
    </button>
  )
}