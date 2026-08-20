import { useState, useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import Layout from '../components/Layout'
import PageHeader from '../components/PageHeader'
import { useSection } from '../hooks/useSection'
import toast from 'react-hot-toast'
import { Search, Plus, X, Trash2, Loader, MapPin } from 'lucide-react'

// Vite bundles leaflet's default marker images with hashed paths, which breaks
// Leaflet's built-in icon lookup — this re-points it at the bundled URLs.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const CATEGORIES = [
  { value: 'academic', label: '🎓 Academic', color: '#6366f1' },
  { value: 'hostel', label: '🏠 Hostel', color: '#ec4899' },
  { value: 'canteen', label: '🍽️ Canteen', color: '#f59e0b' },
  { value: 'library', label: '📚 Library', color: '#8b5cf6' },
  { value: 'sports', label: '⚽ Sports', color: '#10b981' },
  { value: 'medical', label: '🏥 Medical', color: '#ef4444' },
  { value: 'admin', label: '🏛️ Admin', color: '#3b82f6' },
  { value: 'parking', label: '🅿️ Parking', color: '#64748b' },
  { value: 'other', label: '📍 Other', color: '#6b7280' },
]
const catMeta = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES.at(-1)

// Fallback center: Sitamarhi, Bihar. Adjust to your actual campus coordinates.
const DEFAULT_CENTER = [26.5942, 85.4908]

function ClickCapture({ onPick }) {
  useMapEvents({ click(e) { onPick(e.latlng) } })
  return null
}

function AddLocationModal({ pickedLatLng, onClose, onAdded }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('academic')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pickedLatLng) return toast.error('Click a spot on the map to place this location')
    setSaving(true)
    try {
      await api.post('/campus-locations', {
        name, category, description,
        latitude: pickedLatLng.lat, longitude: pickedLatLng.lng,
      })
      toast.success('Location added!')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000] px-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Add Campus Location</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          {pickedLatLng ? `Pinned at ${pickedLatLng.lat.toFixed(5)}, ${pickedLatLng.lng.toFixed(5)}` : 'Click anywhere on the map behind this dialog to place a pin'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Location name" required
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Short description (optional)"
            className="w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          <button type="submit" disabled={saving || !pickedLatLng}
            className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Location'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function CampusMap() {
  useSection('dashboard')
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const [placing, setPlacing] = useState(false)
  const [pickedLatLng, setPickedLatLng] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const fetchLocations = async () => {
    try {
      const { data } = await api.get('/campus-locations')
      setLocations(data.locations)
    } catch {
      toast.error('Failed to load campus locations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  const filtered = useMemo(() => locations.filter(l =>
    (!activeCategory || l.category === activeCategory) &&
    (!search.trim() || l.name.toLowerCase().includes(search.trim().toLowerCase()))
  ), [locations, activeCategory, search])

  const mapCenter = filtered.length > 0
    ? [filtered[0].latitude, filtered[0].longitude]
    : DEFAULT_CENTER

  const handleMapClick = (latlng) => {
    if (!placing) return
    setPickedLatLng(latlng)
    setShowAddModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this location?')) return
    try {
      await api.delete(`/campus-locations/${id}`)
      toast.success('Removed')
      fetchLocations()
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Campus Map"
        subtitle={`${locations.length} location${locations.length !== 1 ? 's' : ''} mapped`}
        action={isAdmin ? {
          label: placing ? 'Click map to place pin…' : 'Add Location',
          icon: placing ? MapPin : Plus,
          onClick: () => setPlacing(p => !p),
        } : undefined}
      />

      {showAddModal && (
        <AddLocationModal
          pickedLatLng={pickedLatLng}
          onClose={() => { setShowAddModal(false); setPlacing(false); setPickedLatLng(null) }}
          onAdded={fetchLocations}
        />
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search size={15} className="text-gray-400 shrink-0" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search locations..."
            className="flex-1 text-sm outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setActiveCategory('')}
            className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${!activeCategory ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
            All
          </button>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setActiveCategory(c.value)}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${activeCategory === c.value ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader size={24} className="animate-spin text-indigo-400" /></div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800" style={{ height: '520px' }}>
          <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {placing && <ClickCapture onPick={handleMapClick} />}
            {filtered.map(loc => (
              <Marker key={loc._id} position={[loc.latitude, loc.longitude]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold" style={{ color: catMeta(loc.category).color }}>
                      {catMeta(loc.category).label.split(' ')[0]} {loc.name}
                    </p>
                    {loc.description && <p className="text-xs text-gray-500 mt-1">{loc.description}</p>}
                    {isAdmin && (
                      <button onClick={() => handleDelete(loc._id)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:underline mt-2">
                        <Trash2 size={11} /> Remove
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </Layout>
  )
}
