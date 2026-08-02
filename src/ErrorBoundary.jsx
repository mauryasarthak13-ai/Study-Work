import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    // also log to console for dev
    console.error('ErrorBoundary caught', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const { error, info } = this.state;
    return (
      <div style={{ padding: 24, fontFamily: 'Inter, sans-serif', background: '#0B1220', color: '#fff', minHeight: '100vh' }}>
        <h1 style={{ marginTop: 0, color: '#ff6b6b' }}>An error occurred</h1>
        <p style={{ color: '#cbd5e1' }}>The app encountered a runtime error. Please copy the information below and share it so I can fix it.</p>
        <div style={{ marginTop: 16, background: '#071024', padding: 12, borderRadius: 8, color: '#e2e8f0' }}>
          <strong>Error:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{String(error && (error.message || error))}</pre>
          {info && (
            <>
              <strong style={{ marginTop: 12, display: 'block' }}>Stack / Info:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{String(info.componentStack || info)}</pre>
            </>
          )}
        </div>
        <div style={{ marginTop: 18 }}>
          <button onClick={() => window.location.reload()} style={{ padding: '8px 12px', borderRadius: 8, background: '#4F8CFF', color: '#fff', border: 'none' }}>Reload</button>
        </div>
      </div>
    );
  }
}
