import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', flexDirection: 'column', gap: '16px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '64px' }}>🌌</div>
      <h1 style={{ fontSize: '32px', fontWeight: 800 }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>This page doesn't exist</p>
      <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </div>
  );
}
