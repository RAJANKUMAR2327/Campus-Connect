import { create } from 'zustand'

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  unreadMessages: 0,

  setSocket: (socket) => set({ socket }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addOnlineUser: (userId) => set(state => ({
    onlineUsers: [...new Set([...state.onlineUsers, userId])]
  })),

  removeOnlineUser: (userId) => set(state => ({
    onlineUsers: state.onlineUsers.filter(id => id !== userId)
  })),

  setUnreadMessages: (count) => set({ unreadMessages: count }),

  incrementUnread: () => set(state => ({
    unreadMessages: state.unreadMessages + 1
  })) }))

export default useSocketStore