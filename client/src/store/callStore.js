import { create } from 'zustand'

const useCallStore = create((set) => ({
  incomingCall: null, // { roomId, caller, callType }
  activeCall: null, // { roomId, targetUserId, targetName, targetAvatar, callType }

  setIncomingCall: (call) => set({ incomingCall: call }),
  clearIncomingCall: () => set({ incomingCall: null }),
  setActiveCall: (call) => set({ activeCall: call }),
  clearActiveCall: () => set({ activeCall: null }) }))

export default useCallStore