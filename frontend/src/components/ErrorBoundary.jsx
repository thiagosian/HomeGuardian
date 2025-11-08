import { Component } from 'react'
import { Alert, AlertDescription } from './ui/alert'

/**
 * Error Boundary component to catch React rendering errors
 * Prevents entire app crash when a component fails
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // You could also log to an error reporting service here
    this.setState({
      error,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>
                <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                <p className="mb-4">
                  The application encountered an error. Please try refreshing the page.
                </p>
                {import.meta.env.DEV && this.state.error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium mb-2">
                      Error Details (Development Mode)
                    </summary>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-auto max-h-64">
                      {this.state.error.toString()}
                      {this.state.errorInfo && '\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                  >
                    Refresh Page
                  </button>
                  <button
                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    className="px-4 py-2 border border-input rounded hover:bg-accent"
                  >
                    Try Again
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
