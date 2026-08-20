import { motion, AnimatePresence } from 'framer-motion'
import useCallStore from '../store/callStore'
import useSocketStore from '../store/socketStore'
import { Phone, PhoneOff, Video } from 'lucide-react'

export default function IncomingCallBanner() {
  const { incomingCall, clearIncomingCall, setActiveCall } = useCallStore()
  const { socket } = useSocketStore()

  if (!incomingCall) return null

  const handleAccept = () => {
    socket.emit('call_accept', { roomId: incomingCall.roomId, callerId: incomingCall.caller.id })
    setActiveCall({
      roomId: incomingCall.roomId,
      targetUserId: incomingCall.caller.id,
      targetName: incomingCall.caller.name,
      targetAvatar: incomingCall.caller.avatar,
      callType: incomingCall.callType,
      isInitiator: false })
    clearIncomingCall()
  }

  const handleReject = () => {
    socket.emit('call_reject', { roomId: incomingCall.roomId, callerId: incomingCall.caller.id })
    clearIncomingCall()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-green-400">
                {incomingCall.caller.avatar
                  ? <img src={incomingCall.caller.avatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{incomingCall.caller.name?.charAt(0)}</div>
                }
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Video size={10} className="text-white" />
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{incomingCall.caller.name}</p>
              <p className="text-xs text-gray-400">Incoming video call...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
              <PhoneOff size={15} /> Decline
            </button>
            <button onClick={handleAccept}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors">
              <Phone size={15} /> Accept
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}