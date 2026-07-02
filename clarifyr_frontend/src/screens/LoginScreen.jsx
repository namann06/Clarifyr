import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';
import { LockSimple, EnvelopeSimple, CircleNotch, WarningCircle, User } from '@phosphor-icons/react';

export default function LoginScreen() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT'); // 'STUDENT' or 'TUTOR'
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!email || !password) {
        setError('Please fill in all fields.');
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        navigate('/');
      } catch (err) {
        setError(err.message || 'Failed to authenticate. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!name.trim() || !email.trim() || !password) {
        setError('Please fill in all fields.');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      setLoading(true);
      try {
        // 1. Call registration endpoint
        await register(name.trim(), email.trim(), password, role);
        // 2. Immediately log in user
        await login(email.trim(), password);
        navigate('/');
      } catch (err) {
        setError(err.message || 'Registration failed. The email may already be in use.');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('STUDENT');
  };

  return (
    <div className="auth-wrapper flex items-center" style={{ justifyContent: 'center', minHeight: '75vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '390px' }}>
        <div className="text-center mb-4">
          <div className="login-icon-container" style={{
            display: 'inline-flex',
            padding: '0.875rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-glow)',
            color: 'var(--color-primary)',
            marginBottom: '1rem'
          }}>
            <LockSimple size={28} weight="bold" />
          </div>
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create an Account'}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {mode === 'login' ? 'Sign in to connect with tutors' : 'Join Clarifyr to schedule lessons'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <WarningCircle size={18} weight="bold" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <EnvelopeSimple size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <LockSimple size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Select Your Role</label>
              <div style={{
                display: 'flex',
                backgroundColor: 'rgba(8, 11, 17, 0.4)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setRole('STUDENT')}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: role === 'STUDENT' ? 'var(--color-primary)' : 'transparent',
                    color: role === 'STUDENT' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    boxShadow: role === 'STUDENT' ? 'var(--shadow-sm)' : 'none',
                    transform: 'none'
                  }}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('TUTOR')}
                  className="btn"
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: role === 'TUTOR' ? 'var(--color-primary)' : 'transparent',
                    color: role === 'TUTOR' ? 'var(--bg-primary)' : 'var(--text-secondary)',
                    boxShadow: role === 'TUTOR' ? 'var(--shadow-sm)' : 'none',
                    transform: 'none'
                  }}
                >
                  Tutor
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <CircleNotch className="spinner" style={{ margin: 0, width: '16px', height: '16px', borderWidth: '2px', animation: 'spin 0.8s linear infinite' }} />
                <span>{mode === 'login' ? 'Signing In...' : 'Registering...'}</span>
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <button 
            type="button" 
            onClick={toggleMode} 
            className="btn-text" 
            style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', cursor: 'pointer', background: 'none', border: 'none' }}
          >
            {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="text-center mt-4" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
          <p style={{ lineHeight: '1.5', margin: 0 }}>
            Demo Accounts:<br />
            Student: <code style={{ userSelect: 'all', fontSize: '0.7rem' }}>student@clarifyr.com</code> / <code>password123</code><br />
            Tutor: <code style={{ userSelect: 'all', fontSize: '0.7rem' }}>tutor@clarifyr.com</code> / <code>password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
