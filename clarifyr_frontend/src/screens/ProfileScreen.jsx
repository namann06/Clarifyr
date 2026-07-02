import React, { useState, useEffect } from 'react';
import { getCurrentUser, getTutorProfile, saveTutorProfile, getMySchedule } from '../api';
import { 
  UserCircle, 
  IdentificationCard, 
  PencilSimple, 
  FloppyDisk, 
  CurrencyDollar, 
  GraduationCap, 
  Clock, 
  CalendarBlank, 
  WarningCircle, 
  CheckCircle,
  Sparkle,
  TrendUp,
  User,
  UsersThree,
  ArrowCounterClockwise
} from '@phosphor-icons/react';

export default function ProfileScreen() {
  const currentUser = getCurrentUser();
  
  // Profile state
  const [tutorProfile, setTutorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form/UI toggle states
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  
  // Tutor form fields
  const [pricing, setPricing] = useState('');
  const [subjectsString, setSubjectsString] = useState('');
  const [availability, setAvailability] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Schedule/Stats state
  const [bookings, setBookings] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Load user data
  const loadData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    // Load Schedule
    try {
      const scheduleData = await getMySchedule();
      setBookings(scheduleData);
    } catch (err) {
      console.error("Failed to load schedule stats:", err);
    } finally {
      setStatsLoading(false);
    }

    // Load Tutor Profile if user role is TUTOR
    if (currentUser.role === 'TUTOR') {
      try {
        const profile = await getTutorProfile(currentUser.id);
        setTutorProfile(profile);
        setProfileExists(true);
        setIsEditing(false);
        
        // Populate fields
        setPricing(profile.pricing);
        setSubjectsString(profile.subjects ? profile.subjects.join(', ') : '');
        setAvailability(profile.availability || '');
        setDescription(profile.description || '');
      } catch (err) {
        // If it's a 404 or profile not found error, default to edit screen
        if (err.message && (
          err.message.toLowerCase().includes('not found') || 
          err.message.includes('500') || 
          err.message.includes('404')
        )) {
          setProfileExists(false);
          setIsEditing(true); // default to edit form if profile does not exist
        } else {
          setError(err.message || 'Failed to load tutor profile details.');
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const priceVal = parseFloat(pricing);
    if (isNaN(priceVal) || priceVal < 0) {
      setError('Hourly rate must be a valid non-negative number.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!subjectsString.trim()) {
      setError('At least one subject is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (!description.trim()) {
      setError('Biography description is required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');
    
    const subjects = subjectsString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
      
    const requestPayload = {
      userId: currentUser.id,
      subjects,
      description: description.trim(),
      pricing: priceVal,
      availability: availability.trim()
    };
    
    try {
      const updatedProfile = await saveTutorProfile(requestPayload);
      setTutorProfile(updatedProfile);
      setProfileExists(true);
      setIsEditing(false);
      setSuccessMsg(profileExists ? 'Your profile details have been updated successfully!' : 'Your professional tutor profile has been created successfully!');
      
      // Update form fields to match updated profile
      setPricing(updatedProfile.pricing);
      setSubjectsString(updatedProfile.subjects ? updatedProfile.subjects.join(', ') : '');
      setAvailability(updatedProfile.availability || '');
      setDescription(updatedProfile.description || '');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message || 'Failed to save tutor profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="card text-center" style={{ maxWidth: '500px', margin: '4rem auto', padding: '2.5rem' }}>
        <WarningCircle size={44} weight="bold" style={{ color: 'var(--color-danger)', marginBottom: '1rem' }} />
        <h2>Authentication Required</h2>
        <p>Please sign in to view your profile page.</p>
      </div>
    );
  }

  // Calculate statistics from bookings
  const calculateStats = () => {
    const totalSessions = bookings.length;
    const completedSessions = bookings.filter(b => b.status === 'COMPLETED').length;
    const confirmedSessions = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pendingSessions = bookings.filter(b => b.status === 'PENDING').length;
    const cancelledSessions = bookings.filter(b => b.status === 'CANCELLED').length;
    
    // Duration helper
    const getDurationHours = (b) => {
      const diffMs = new Date(b.endTime) - new Date(b.startTime);
      const hours = diffMs / 3600000;
      return isNaN(hours) ? 0 : hours;
    };

    const totalHours = bookings.reduce((sum, b) => {
      if (b.status === 'COMPLETED' || b.status === 'CONFIRMED') {
        return sum + getDurationHours(b);
      }
      return sum;
    }, 0);

    const totalFinance = bookings.reduce((sum, b) => {
      if (b.status === 'COMPLETED' || b.status === 'CONFIRMED') {
        return sum + (b.totalPrice || 0);
      }
      return sum;
    }, 0);

    const uniqueContacts = new Set(
      bookings
        .map(b => currentUser.role === 'TUTOR' ? b.studentName : b.tutorName)
        .filter(name => !!name)
    ).size;

    return {
      totalSessions,
      completedSessions,
      confirmedSessions,
      pendingSessions,
      cancelledSessions,
      totalHours: totalHours.toFixed(1),
      totalFinance: totalFinance.toFixed(2),
      uniqueContacts
    };
  };

  const stats = calculateStats();
  const initials = currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Banner / Header */}
      <div className="card" style={{ 
        padding: '2rem', 
        marginBottom: '2rem', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '2rem', 
        flexWrap: 'wrap',
        background: 'linear-gradient(135deg, rgba(41, 41, 41, 0.95) 0%, rgba(19, 19, 19, 0.8) 100%)',
        borderLeft: '4px solid var(--color-primary)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--border-radius-full)',
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.75rem',
          fontWeight: '800',
          color: '#ffffff',
          boxShadow: '0 0 20px rgba(250, 250, 250, 0.15)'
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2rem', margin: 0, background: 'none', webkitTextFillColor: 'initial', color: 'var(--text-primary)' }}>
            {currentUser.name}
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{currentUser.email}</span>
            <span style={{ color: 'var(--glass-border)' }}>|</span>
            <span className="badge badge-primary" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {currentUser.role}
            </span>
          </p>
        </div>
      </div>

      {/* Success/Error Alerts */}
      {successMsg && (
        <div className="alert alert-success">
          <CheckCircle size={18} weight="bold" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          <WarningCircle size={18} weight="bold" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.3fr) minmax(280px, 0.7fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Profile Forms / Display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Account Details Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <IdentificationCard size={20} style={{ color: 'var(--color-primary)' }} />
              Account Settings
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div>
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={currentUser.name} 
                  disabled 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
              
              <div>
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={currentUser.email} 
                  disabled 
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', marginBottom: 0 }}>
              To change your core account details, please contact system administration.
            </p>
          </div>

          {/* Tutor Professional Details Card */}
          {currentUser.role === 'TUTOR' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  <GraduationCap size={20} style={{ color: 'var(--color-secondary)' }} />
                  Teaching Profile
                </h3>
                
                {profileExists && !isEditing && (
                  <button 
                    onClick={() => {
                      setIsEditing(true);
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
                  >
                    <PencilSimple size={14} weight="bold" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {loading ? (
                <div className="spinner"></div>
              ) : isEditing ? (
                /* Form Edit State */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {!profileExists && (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-primary-glow)', borderRadius: 'var(--border-radius-md)', border: '1px solid rgba(250, 250, 250, 0.15)', marginBottom: '0.5rem' }}>
                      <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkle size={16} weight="fill" style={{ color: 'var(--color-primary)' }} />
                        Setup your professional profile to start listing on Clarifyr.
                      </p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CurrencyDollar size={14} /> Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        placeholder="e.g. 45.00"
                        value={pricing}
                        onChange={(e) => setPricing(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} /> Availability
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Weekdays 9 AM - 3 PM"
                        value={availability}
                        onChange={(e) => setAvailability(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Subjects (comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Mathematics, Calculus, Physics"
                      value={subjectsString}
                      onChange={(e) => setSubjectsString(e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Separate multiple subjects using a comma.
                    </span>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Biography Description</label>
                    <textarea
                      rows={5}
                      className="form-input"
                      placeholder="Share your teaching experience, methodology, and background..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      style={{ resize: 'vertical', minHeight: '120px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary"
                      style={{ flex: 1 }}
                    >
                      <FloppyDisk size={16} weight="bold" />
                      <span>{saving ? 'Saving...' : 'Save Profile Details'}</span>
                    </button>

                    {profileExists && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setError('');
                          setSuccessMsg('');
                        }}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                /* Read Only Display State */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                        Hourly Rate
                      </span>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', marginTop: '0.25rem' }}>
                        ${tutorProfile?.pricing?.toFixed(2) || '0.00'}/hr
                      </span>
                    </div>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>
                        Availability
                      </span>
                      <span style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                        {tutorProfile?.availability || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Subjects
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {tutorProfile?.subjects && tutorProfile.subjects.length > 0 ? (
                        tutorProfile.subjects.map((subj, idx) => (
                          <span key={idx} className="badge badge-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}>
                            {subj}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No subjects configured</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                      Biography & Experience
                    </span>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                      {tutorProfile?.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Analytics & Statistics */}
        <div style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <TrendUp size={20} style={{ color: 'var(--color-success)' }} />
              {currentUser.role === 'TUTOR' ? 'Teaching Analytics' : 'Learning Analytics'}
            </h3>

            {statsLoading ? (
              <div className="spinner" style={{ margin: '1rem auto' }}></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Metric 1 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-md)',
                  transition: 'all var(--transition-fast)',
                }}
                className="card-hover">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--color-primary-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}>
                    <CalendarBlank size={20} weight="bold" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Sessions</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.totalSessions}</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-md)',
                  transition: 'all var(--transition-fast)',
                }}
                className="card-hover">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-success)'
                  }}>
                    <Clock size={20} weight="bold" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {currentUser.role === 'TUTOR' ? 'Hours Taught' : 'Hours Learned'}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.totalHours} hrs</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-md)',
                  transition: 'all var(--transition-fast)',
                }}
                className="card-hover">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-secondary)'
                  }}>
                    {currentUser.role === 'TUTOR' ? <UsersThree size={20} weight="bold" /> : <User size={20} weight="bold" />}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {currentUser.role === 'TUTOR' ? 'Active Students' : 'Tutors Contacted'}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.uniqueContacts}</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--border-radius-md)',
                  transition: 'all var(--transition-fast)',
                }}
                className="card-hover">
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'rgba(245, 158, 11, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-warning)'
                  }}>
                    <CurrencyDollar size={20} weight="bold" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                      {currentUser.role === 'TUTOR' ? 'Total Earnings' : 'Total Investment'}
                    </span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>${stats.totalFinance}</span>
                  </div>
                </div>

                {/* Micro Details List */}
                <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Pending Requests</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-warning)' }}>{stats.pendingSessions}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Confirmed Upcomings</span>
                    <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>{stats.confirmedSessions}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Completed Lessons</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{stats.completedSessions}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Cancelled Sessions</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{stats.cancelledSessions}</span>
                  </div>
                </div>

                {/* Refresh Stats Button */}
                <button 
                  onClick={loadData}
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem', fontSize: '0.8rem' }}
                >
                  <ArrowCounterClockwise size={14} />
                  <span>Refresh Dashboard</span>
                </button>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
