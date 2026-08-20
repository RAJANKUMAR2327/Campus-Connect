import { useState, useRef, useCallback, useEffect } from 'react'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ] }

export function useWebRTC(socket, roomId, targetUserId) {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [connectionState, setConnectionState] = useState('new')
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  const peerConnection = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const screenTrackRef = useRef(null)

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          roomId, candidate: event.candidate, targetUserId })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0])
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState)
    }

    peerConnection.current = pc
    return pc
  }, [socket, roomId, targetUserId])

  const startLocalStream = useCallback(async (video = true, audio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio })
      setLocalStream(stream)
      if (localVideoRef.current) localVideoRef.current.srcObject = stream
      return stream
    } catch (err) {
      console.error('Media access error:', err)
      throw err
    }
  }, [])

  const startCall = useCallback(async (isInitiator) => {
    const stream = await startLocalStream()
    const pc = createPeerConnection()

    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    if (isInitiator) {
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('webrtc_offer', { roomId, offer, targetUserId })
    }
  }, [createPeerConnection, startLocalStream, socket, roomId, targetUserId])

  const handleOffer = useCallback(async (offer, fromUserId) => {
    const stream = localStream || await startLocalStream()
    const pc = peerConnection.current || createPeerConnection()

    if (!localStream) {
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socket.emit('webrtc_answer', { roomId, answer, targetUserId: fromUserId })
  }, [createPeerConnection, localStream, startLocalStream, socket, roomId])

  const handleAnswer = useCallback(async (answer) => {
    if (peerConnection.current) {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }, [])

  const handleIceCandidate = useCallback(async (candidate) => {
    if (peerConnection.current) {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error('ICE candidate error:', err)
      }
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (!localStream) return
    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      setIsMuted(!audioTrack.enabled)
      socket?.emit('call_media_toggle', { roomId, type: 'audio', enabled: audioTrack.enabled })
    }
  }, [localStream, socket, roomId])

  const toggleCamera = useCallback(() => {
    if (!localStream) return
    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled
      setIsCameraOff(!videoTrack.enabled)
      socket?.emit('call_media_toggle', { roomId, type: 'video', enabled: videoTrack.enabled })
    }
  }, [localStream, socket, roomId])

  const toggleScreenShare = useCallback(async () => {
    if (!peerConnection.current) return

    if (isScreenSharing) {
      // Stop screen share, revert to camera
      screenTrackRef.current?.stop()
      const videoTrack = localStream?.getVideoTracks()[0]
      const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
      if (sender && videoTrack) await sender.replaceTrack(videoTrack)
      setIsScreenSharing(false)
      socket?.emit('screen_share_stop', { roomId })
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        const screenTrack = screenStream.getVideoTracks()[0]
        screenTrackRef.current = screenTrack

        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video')
        if (sender) await sender.replaceTrack(screenTrack)

        screenTrack.onended = () => toggleScreenShare()
        setIsScreenSharing(true)
        socket?.emit('screen_share_start', { roomId })
      } catch (err) {
        console.error('Screen share error:', err)
      }
    }
  }, [isScreenSharing, localStream, socket, roomId])

  const endCall = useCallback(() => {
    localStream?.getTracks().forEach(track => track.stop())
    screenTrackRef.current?.stop()
    peerConnection.current?.close()
    peerConnection.current = null
    setLocalStream(null)
    setRemoteStream(null)
    socket?.emit('leave_call', { roomId })
  }, [localStream, socket, roomId])

  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(track => track.stop())
      peerConnection.current?.close()
    }
  }, [])

  return {
    localStream, remoteStream, connectionState,
    isMuted, isCameraOff, isScreenSharing,
    localVideoRef, remoteVideoRef,
    startCall, handleOffer, handleAnswer, handleIceCandidate,
    toggleMute, toggleCamera, toggleScreenShare, endCall }
}