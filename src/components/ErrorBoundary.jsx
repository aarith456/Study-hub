import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="tutor tutor-error-boundary">
          <h2 className="tutor-page-title">Tutor</h2>
          <p style={{ color: 'var(--ink)', margin: '1rem 0' }}>
            Something went wrong loading the tutor.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            {this.state.error?.message}
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
