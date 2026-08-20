import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import {
  Search, X, FileText, MapPin,
  Calendar, ShoppingBag, Briefcase, Loader } from 'lucide-react'

const typeConfig = {
  note: { icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30', label: 'Note', path: '/notes' },
  lostfound: { icon: MapPin, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', label: 'Lost & Found', path: '/lost-found' },
  event: { icon: Calendar, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30', label: 'Event', path: '/events' },
  listing: { icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/30', label: 'Listing', path: '/marketplace' },
  placement: { icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', label: 'Placement', path: '/placement' } }

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef()
  const containerRef = useRef()
  const navigate = useNavigate()
  const debounceRef = useRef()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
        setResults(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      return
    }
    clearTimeout(debounceRef.current)
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`)
        setResults(data.results)
      } catch {
        setResults(null)
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [query])

  const handleResultClick = (path) => {
    navigate(path)
    setOpen(false)
    setQuery('')
    setResults(null)
  }

  const allResults = results
    ? [
        ...( results.notes || []).map(r => ({ ...r, _type: 'note' })),
        ...(results.lostFound || []).map(r => ({ ...r, _type: 'lostfound' })),
        ...(results.events || []).map(r => ({ ...r, _type: 'event' })),
        ...(results.listings || []).map(r => ({ ...r, _type: 'listing' })),
        ...(results.placements || []).map(r => ({ ...r, _type: 'placement' })),
      ]
    : []

  return (
    <>
      {/* Search trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 100) }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search...</span>
        <span className="hidden sm:inline text-xs bg-white dark:bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
          ⌘K
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { setOpen(false); setQuery(''); setResults(null) }}
          />

          {/* Search box */}
          <div
            ref={containerRef}
            className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              {loading
                ? <Loader size={18} className="text-indigo-500 animate-spin shrink-0" />
                : <Search size={18} className="text-gray-400 shrink-0" />
              }
              <input
                ref={inputRef}
                type="text"
                placeholder="Search notes, events, listings, placements..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 text-sm text-gray-900 dark:text-gray-100 bg-transparent outline-none placeholder-gray-400"
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setResults(null) }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {query.length < 2 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  Type at least 2 characters to search
                </div>
              ) : allResults.length === 0 && !loading ? (
                <div className="px-4 py-8 text-center">
                  <Search size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    No results for "<span className="font-medium">{query}</span>"
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {allResults.map((result, i) => {
                    const config = typeConfig[result._type]
                    const Icon = config.icon
                    const title = result.title
                    const sub = result.subject || result.company || result.category || result.type || ''

                    return (
                      <button
                        key={i}
                        onClick={() => handleResultClick(config.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                      >
                        <div className={`${config.bg} p-2 rounded-lg shrink-0`}>
                          <Icon size={15} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {title}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">
                            {config.label} {sub ? `· ${sub}` : ''}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-50 dark:border-gray-800 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-600">
              <span>↵ to navigate</span>
              <span>ESC to close</span>
              {allResults.length > 0 && (
                <span className="ml-auto">{allResults.length} results</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}