import { useEffect } from 'react'
import useSectionStore from '../store/sectionStore'

export const useSection = (section) => {
  const { setSection } = useSectionStore()
  useEffect(() => {
    setSection(section)
    return () => setSection('dashboard')
  }, [section])
}