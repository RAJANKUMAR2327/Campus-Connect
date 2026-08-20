import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import useCallStore from '../store/callStore'
import useSocketStore from '../store/socketStore'
import { useWebRTC } from '../hooks/useWebRTC'
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  Monitor, MonitorOff, Maximize2, Minimize2 } from 'lucide-react'

export default function VideoCallWindow() {
  const { activeCall, clearActiveCall } = useCallStore()
  const { socket } = useSocketStore()
  const [duration, setDuration] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [peerMuted, setPeerMuted] = useState(false)
  const [peerCameraOff, setPeerCameraOff] = useState(false)
  const timerRef = useRef()

  const webrtc = useWebRTC(socket, activeCall?.roomId, activeCall?.targetUserId)

  useEffect(() => {
    if (!activeCall || !socket || !webrtc) return

    socket.emit('join_call_room', { roomId: activeCall.roomId })

    if (activeCall.isInitiator) {
      webrtc.startCall(true)
    } else {
      webrtc.startCall(false)
    }

    const handleOffer = ({ offer, fromUserId }) => {
      if (fromUserId === activeCall.targetUserId) webrtc.handleOffer(offer, fromUserId)
    }
    const handleAnswer = ({ answer, fromUserId }) => {
      if (fromUserId === activeCall.targetUserId) webrtc.handleAnswer(answer)
    }
    const handleIce = ({ candidate, fromUserId }) => {
      if (fromUserId === activeCall.targetUserId) webrtc.handleIceCandidate(candidate)
    }
    const handlePeerMedia = ({ userId, type, enabled }) => {
      if (userId === activeCall.targetUserId) {
        if (type === 'audio') setPeerMuted(!enabled)
        if (type === 'video') setPeerCameraOff(!enabled)
      }
    }
    const handleUserLeft = ({ userId }) => {
      if (userId === activeCall.targetUserId) {
        clearActiveCall()
      }
    }

    socket.on('webrtc_offer', handleOffer)
    socket.on('webrtc_answer', handleAnswer)
    socket.on('webrtc_ice_candidate', handleIce)
    socket.on('peer_media_toggle', handlePeerMedia)
    socket.on('user_left_call', handleUserLeft)

    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)

    return () => {
      socket.off('webrtc_offer', handleOffer)
      socket.off('webrtc_answer', handleAnswer)
      socket.off('webrtc_ice_candidate', handleIce)
      socket.off('peer_media_toggle', handlePeerMedia)
      socket.off('user_left_call', handleUserLeft)
      clearInterval(timerRef.current)
    }
  }, [activeCall, socket])

  if (!activeCall || !webrtc) return null

  const handleEndCall = () => {
    webrtc.endCall()
    clearActiveCall()
  }

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (minimized) {
    return (
      <motion.div
        drag dragMomentum={false}
        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-[70] w-48 bg-gray-900 rounded-2xl shadow-2xl overflow-hidden cursor-move"
      >
        <video ref={webrtc.remoteVideoRef} autoPlay playsInline className="w-full h-32 object-cover bg-gray-800" />
        <div className="absolute top-2 right-2 flex gap-1">
          <button onClick={() => setMinimized(false)} className="p-1.5 bg-black/50 rounded-lg text-white hover:bg-black/70">
            <Maximize2 size={12} />
          </button>
        </div>
        <div className="p-2 flex items-center justify-between">
          <span className="text-xs text-white">{formatDuration(duration)}</span>
          <button onClick={handleEndCall} className="p-1.5 bg-red-500 rounded-lg text-white hover:bg-red-600">
            <PhoneOff size={12} />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gray-950 z-[70] flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {activeCall.targetAvatar
              ? <img src={activeCall.targetAvatar} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{activeCall.targetName?.charAt(0)}</div>
            }
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{activeCall.targetName}</p>
            <p className="text-xs text-gray-400">{webrtc.connectionState === 'connected' ? formatDuration(duration) : 'Connecting...'}</p>
          </div>
        </div>
        <button onClick={() => setMinimized(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
          <Minimize2 size={18} />
        </button>
      </div>

      {/* Video area */}
      <div className="flex-1 relative px-4 pb-4">
        {/* Remote video (main) */}
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-900 relative">
          <video ref={webrtc.remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {(peerCameraOff || !webrtc.remoteStream) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-24 h-24 rounded-full overflow-hidden">
                {activeCall.targetAvatar
                  ? <img src={activeCall.targetAvatar} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">{activeCall.targetName?.charAt(0)}</div>
                }
              </div>
            </div>
          )}
          {peerMuted && (
            <div className="absolute bottom-4 left-4 bg-black/50 rounded-full p-2">
              <MicOff size={14} className="text-white" />
            </div>
          )}

          {/* Local video (PiP) */}
          <div className="absolute bottom-4 right-4 w-32 h-44 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-800">
            <video ref={webrtc.localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {webrtc.isCameraOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff size={20} className="text-gray-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-6">
        <button onClick={webrtc.toggleMute}
          className={`p-4 rounded-full transition-colors ${webrtc.isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          {webrtc.isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button onClick={webrtc.toggleCamera}
          className={`p-4 rounded-full transition-colors ${webrtc.isCameraOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          {webrtc.isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>
        <button onClick={webrtc.toggleScreenShare}
          className={`p-4 rounded-full transition-colors ${webrtc.isScreenSharing ? 'bg-indigo-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}>
          {webrtc.isScreenSharing ? <MonitorOff size={20} /> : <Monitor size={20} />}
        </button>
        <button onClick={handleEndCall}
          className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
          <PhoneOff size={20} />
        </button>
      </div>
    </motion.div>
  )
}