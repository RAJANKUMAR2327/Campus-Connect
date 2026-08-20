import { Component } from 'react'

// FRONTEND RESILIENCE FIX: previously there was no error boundary anywhere
// in the app. A single unexpectedly-null populated field (e.g. a post's
// author, a ride passenger's user, a collab doc's collaborator — anything
// that used to go dangling after account deletion before the backend fix
// in authController.deleteAccount) would throw during render, and with no
// boundary to catch it, React unmounts the entire tree below the nearest
// one — which, with none present, meant the whole app went blank.
//
// This is wrapped around the routed page content in App.jsx (not the
// absolute top of main.jsx), so persistent chrome — nav, toasts, the
// incoming-call banner — survives a crash in one page, and the person can
// still navigate away rather than being stuck on a blank screen.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error, info?.componentStack)
  }

  handleTryAgain = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-4xl">⚠️</div>
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">Something went wrong on this page.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This has been logged. You can try again or head back to your dashboard.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={this.handleTryAgain}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => { window.location.href = '/dashboard' }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    )
  }
}
