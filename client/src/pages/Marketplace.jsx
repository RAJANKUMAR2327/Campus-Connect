import { useSection } from '../hooks/useSection'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'
import { Plus, X, Heart} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import useAuthStore from '../store/authStore'

const categories = ['books', 'electronics', 'clothing', 'furniture', 'cycles', 'other']
const conditions = ['new', 'like-new', 'good', 'fair', 'poor']

function CreateListingModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', price: '',
    negotiable: false, category: 'other',
    condition: 'good', contact: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      await api.post('/listings', fd)
      toast.success('Listing created!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Create Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Title *" required
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <textarea placeholder="Description" rows={2}
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder="Price (₹) *" required min="0"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            <select className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
              {conditions.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input placeholder="Contact info"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={form.negotiable}
              onChange={e => setForm(f => ({ ...f, negotiable: e.target.checked }))}
              className="rounded" />
            Price is negotiable
          </label>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Listing'}
            </button>
          </div>
          {/* Listings grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>
        </form>
      </div>
    </div>
  )
}

export default function Marketplace() {
  useSection('marketplace')
  const { user } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState({ category: '', condition: '', sort: 'newest' })
  const queryClient = useQueryClient()

  // REACT-QUERY MIGRATION (FE-02 follow-up): see Feed.jsx/Notes.jsx/etc.
  // for the same pattern applied elsewhere.
  const queryKey = ['listings', filter.category, filter.condition, filter.sort]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter.category) params.append('category', filter.category)
      if (filter.condition) params.append('condition', filter.condition)
      if (filter.sort) params.append('sort', filter.sort)
      const { data } = await api.get(`/listings?${params}`)
      return data
    },
  })

  const listings = data?.listings ?? []
  const invalidateListings = () => queryClient.invalidateQueries({ queryKey: ['listings'] })

  // NOTE: interestedUsers isn't rendered anywhere in this UI today (no
  // count, no filled-heart-if-interested state) — the original code's
  // full fetchListings() refetch after every heart click had no visible
  // effect either, just network cost. This patches the cache directly
  // instead (mirrors listingController.toggleInterest's exact toggle
  // logic) — no needless refetch, and the cache stays accurate if
  // interest state/counts are ever surfaced in the UI later.
  const handleInterest = async (id) => {
    const previous = queryClient.getQueryData(queryKey)
    const listing = listings.find((l) => l._id === id)
    const alreadyInterested = listing?.interestedUsers?.includes(user._id)

    queryClient.setQueryData(queryKey, (old) => old && ({
      ...old,
      listings: old.listings.map((l) => {
        if (l._id !== id) return l
        const interestedUsers = alreadyInterested
          ? (l.interestedUsers || []).filter((uid) => uid !== user._id)
          : [...(l.interestedUsers || []), user._id]
        return { ...l, interestedUsers }
      }),
    }))

    try {
      const { data } = await api.patch(`/listings/${id}/interest`)
      toast.success(data.interested ? 'Added to interests!' : 'Removed from interests')
    } catch {
      queryClient.setQueryData(queryKey, previous)
      toast.error('Failed')
    }
  }

  const conditionColor = {
    'new': 'bg-green-50 text-green-600',
    'like-new': 'bg-teal-50 text-teal-600',
    'good': 'bg-blue-50 text-blue-600',
    'fair': 'bg-amber-50 text-amber-600',
    'poor': 'bg-red-50 text-red-600' }

  return (
    <Layout>
      {showModal && <CreateListingModal onClose={() => setShowModal(false)} onSuccess={invalidateListings} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="text-sm text-gray-500 mt-0.5">Buy & sell within campus</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus size={15} /> Sell Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex flex-wrap gap-3">
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          value={filter.category} onChange={e => setFilter(f => ({ ...f, category: e.target.value }))}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          value={filter.condition} onChange={e => setFilter(f => ({ ...f, condition: e.target.value }))}>
          <option value="">Any Condition</option>
          {conditions.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none"
          value={filter.sort} onChange={e => setFilter(f => ({ ...f, sort: e.target.value }))}>
          <option value="newest">Newest</option>
          <option value="price_low">Price: Low to High</option>
          <option value="price_high">Price: High to Low</option>
        </select>
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-44" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          type="marketplace"
          title="No listings yet"
          description="Sell your old books, electronics, or anything else to your fellow students."
          actionLabel="Post a Listing"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(listing => (
            <div key={listing._id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{listing.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-indigo-600">₹{listing.price}</span>
                    {listing.negotiable && (
                      <span className="text-[10px] text-gray-400">· negotiable</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleInterest(listing._id)}
                  className="text-gray-300 hover:text-red-500 transition-colors ml-2">
                  <Heart size={16} />
                </button>
              </div>

              {listing.description && (
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{listing.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                  {listing.category}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${conditionColor[listing.condition]}`}>
                  {listing.condition}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-[9px] font-bold text-indigo-600">
                    {listing.seller?.name?.charAt(0)}
                  </div>
                  <span className="text-[11px] text-gray-500">{listing.seller?.name}</span>
                </div>
                {listing.contact && (
                  <span className="text-[11px] text-indigo-600">📞 {listing.contact}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}