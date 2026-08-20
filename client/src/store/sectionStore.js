import { create } from 'zustand'

const useSectionStore = create((set) => ({
  currentSection: 'dashboard',
  setSection: (section) => set({ currentSection: section }) }))

export default useSectionStore