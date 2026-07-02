import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTutors, searchTutors, getTutorAverageRating } from '../api';
import { MagnifyingGlass, Book, CurrencyDollar, ArrowRight, ArrowClockwise, Star } from '@phosphor-icons/react';

function TutorCard({ tutor }) {
  const [rating, setRating] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    async function fetchRating() {
      try {
        const avg = await getTutorAverageRating(tutor.userId);
        if (active) {
          setRating(avg);
        }
      } catch (err) {
        // Fallback to 0
      }
    }
    fetchRating();
    return () => { active = false; };
  }, [tutor.userId]);

  return (
    <div 
      onClick={() => navigate(`/tutors/${tutor.userId}`)} 
      className="tutor-card"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <img 
              src={`https://picsum.photos/seed/tutor-${tutor.userId}/120/120`} 
              alt={tutor.tutorName}
              className="tutor-card-avatar"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="avatar-fallback" style={{
              display: 'none',
              width: '56px',
              height: '56px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: 'var(--bg-primary)'
            }}>
              {tutor.tutorName ? tutor.tutorName.charAt(0).toUpperCase() : 'T'}
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{tutor.tutorName}</h3>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Star size={13} weight="fill" style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                {rating > 0 && <span style={{ color: 'var(--text-muted)' }}>tutor</span>}
              </span>
            </div>
          </div>
          
          <ArrowRight size={16} className="tutor-card-arrow" />
        </div>

        <p style={{
          fontSize: '0.875rem',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginBottom: '1.25rem',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          minHeight: '4.2rem'
        }}>
          {tutor.description || 'No biography details provided.'}
        </p>

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
            <Book size={12} />
            <span>Subjects</span>
          </div>
          <div className="flex gap-1.5" style={{ flexWrap: 'wrap' }}>
            {tutor.subjects && tutor.subjects.length > 0 ? (
              tutor.subjects.map((sub, index) => (
                <span key={index} className="subject-tag">{sub}</span>
              ))
            ) : (
              <span className="subject-tag">General</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <div className="flex justify-between items-center">
          <div>
            <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Hourly Rate</span>
            <div className="flex items-center" style={{ color: 'var(--text-primary)', fontWeight: '850', marginTop: '0.1rem' }}>
              <CurrencyDollar size={16} style={{ color: 'var(--text-primary)' }} />
              <span style={{ fontSize: '1.25rem' }}>{tutor.pricing ? tutor.pricing.toFixed(2) : '0.00'}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '400', marginLeft: '1px' }}>/ hr</span>
            </div>
          </div>
          
          <span className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', pointerEvents: 'none' }}>
            View Profile
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TutorListScreen() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [allSubjects, setAllSubjects] = useState([]);

  const loadTutors = async (subject = '', query = '') => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (subject || query) {
        data = await searchTutors(subject, query);
      } else {
        data = await getTutors();
      }
      setTutors(data);

      if (!subject && !query) {
        const subs = new Set();
        data.forEach(t => {
          if (t.subjects) {
            t.subjects.forEach(s => subs.add(s));
          }
        });
        setAllSubjects(Array.from(subs));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch tutors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTutors(selectedSubject, searchQuery);
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedSubject('');
    loadTutors('', '');
  };

  return (
    <div className="tutor-list-container">
      <div className="mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ letterSpacing: '-0.03em' }}>Find Your Perfect Tutor</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Browse qualified educators and book online sessions instantly.</p>
        </div>
        
        <button 
          onClick={() => loadTutors(selectedSubject, searchQuery)} 
          className="btn btn-secondary flex items-center gap-2"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', marginBottom: '1rem' }}
          disabled={loading}
        >
          <ArrowClockwise size={14} className={loading ? 'animate-spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Sleek Capsule Search Bar */}
      <form onSubmit={handleSearchSubmit} className="search-capsule-bar">
        <MagnifyingGlass size={20} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          className="search-capsule-input"
          placeholder="Search tutors by name or keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="search-capsule-divider"></div>
        
        <select
          className="search-capsule-select"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {allSubjects.map((sub, idx) => (
            <option key={idx} value={sub}>{sub}</option>
          ))}
        </select>
        
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
          {(searchQuery || selectedSubject) && (
            <button 
              type="button" 
              onClick={handleReset} 
              className="btn btn-text" 
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              Clear
            </button>
          )}
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '9999px', padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
            Search
          </button>
        </div>
      </form>

      {/* Main Content Area */}
      {error && (
        <div className="alert alert-danger mb-4">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="spinner"></div>
      ) : tutors.length === 0 ? (
        <div className="card text-center" style={{ padding: '3.5rem 2rem' }}>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>No tutors found matching your criteria.</p>
          <button type="button" onClick={handleReset} className="btn btn-primary">Reset Filters</button>
        </div>
      ) : (
        <div className="grid-cards">
          {tutors.map((tutor) => (
            <TutorCard key={tutor.userId} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  );
}
